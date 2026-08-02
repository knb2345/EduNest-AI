const Profile = require("../models/Profile")
const User = require("../models/User")
const {
  generators,
  getGoogleOidcClient,
  getGoogleOidcStatus,
  readGoogleOidcConfiguration,
} = require("../config/googleOidc")
const {
  createApplicationToken,
  setApplicationSessionCookie,
} = require("../utils/authSession")

const OIDC_COOKIE_MAX_AGE_MS = 10 * 60 * 1000

function temporaryCookieNames() {
  const prefix = process.env.NODE_ENV === "production" ? "__Host-" : ""
  return {
    state: `${prefix}edunest_oidc_state`,
    nonce: `${prefix}edunest_oidc_nonce`,
    verifier: `${prefix}edunest_oidc_pkce`,
  }
}

function temporaryCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OIDC_COOKIE_MAX_AGE_MS,
    path: process.env.NODE_ENV === "production" ? "/" : "/api/v1/auth/google",
  }
}

function clearTemporaryCookies(res) {
  const names = temporaryCookieNames()
  const options = temporaryCookieOptions()
  for (const name of Object.values(names)) {
    res.clearCookie(name, options)
  }
}

function clientCallbackUrl(errorCode) {
  const { clientUrl } = readGoogleOidcConfiguration()
  const url = new URL("/auth/google/callback", clientUrl)
  if (errorCode) url.searchParams.set("error", errorCode)
  return url.toString()
}

function callbackParameters(req) {
  const allowed = ["code", "state", "iss", "scope", "authuser", "prompt", "error", "error_description"]
  return Object.fromEntries(
    allowed
      .filter((key) => typeof req.query[key] === "string")
      .map((key) => [key, req.query[key]])
  )
}

function nameParts(claims) {
  if (claims.given_name || claims.family_name) {
    return {
      firstName: claims.given_name || "Google",
      lastName: claims.family_name || "User",
    }
  }
  const pieces = String(claims.name || "Google User").trim().split(/\s+/)
  return {
    firstName: pieces.shift() || "Google",
    lastName: pieces.join(" ") || "User",
  }
}

async function findOrCreateGoogleUser(claims) {
  const subject = String(claims.sub || "")
  const email = String(claims.email || "").trim().toLowerCase()
  if (!subject || !email || claims.email_verified !== true) {
    const error = new Error("Google did not return a verified email identity")
    error.code = "UNVERIFIED_EMAIL"
    throw error
  }

  const linkedUser = await User.findOne({
    authProvider: "google",
    providerSubject: subject,
  }).populate("additionalDetails")
  if (linkedUser) return linkedUser

  const emailAccount = await User.findOne({ email })
  if (emailAccount) {
    const error = new Error("An account already uses this email")
    error.code = "ACCOUNT_CONFLICT"
    throw error
  }

  const profile = await Profile.create({
    gender: null,
    dateOfBirth: null,
    about: null,
    contactNumber: null,
  })

  try {
    const names = nameParts(claims)
    return await User.create({
      ...names,
      email,
      emailVerified: true,
      authProvider: "google",
      providerSubject: subject,
      accountType: "Student",
      approved: true,
      additionalDetails: profile._id,
      image: typeof claims.picture === "string" ? claims.picture : "",
    })
  } catch (error) {
    await Profile.findByIdAndDelete(profile._id).catch(() => undefined)
    if (error && error.code === 11000) {
      const concurrentUser = await User.findOne({
        authProvider: "google",
        providerSubject: subject,
      }).populate("additionalDetails")
      if (concurrentUser) return concurrentUser
      const conflict = new Error("An account already uses this email")
      conflict.code = "ACCOUNT_CONFLICT"
      throw conflict
    }
    throw error
  }
}

exports.googleStatus = (_req, res) => {
  const status = getGoogleOidcStatus()
  return res.status(200).json({ success: true, ...status })
}

exports.beginGoogleLogin = async (_req, res) => {
  if (!getGoogleOidcStatus().enabled) {
    return res.status(503).json({
      success: false,
      message: "Google sign-in is not configured for this environment.",
    })
  }

  try {
    const client = await getGoogleOidcClient()
    const { redirectUri } = readGoogleOidcConfiguration()
    const state = generators.state()
    const nonce = generators.nonce()
    const verifier = generators.codeVerifier()
    const challenge = generators.codeChallenge(verifier)
    const names = temporaryCookieNames()
    const options = temporaryCookieOptions()

    res.cookie(names.state, state, options)
    res.cookie(names.nonce, nonce, options)
    res.cookie(names.verifier, verifier, options)

    const authorizationUrl = client.authorizationUrl({
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256",
    })
    return res.redirect(302, authorizationUrl)
  } catch (_error) {
    clearTemporaryCookies(res)
    return res.status(502).json({
      success: false,
      message: "Google sign-in could not be started. Please try again.",
    })
  }
}

exports.googleCallback = async (req, res) => {
  const names = temporaryCookieNames()
  const state = req.cookies[names.state]
  const nonce = req.cookies[names.nonce]
  const verifier = req.cookies[names.verifier]
  clearTemporaryCookies(res)

  try {
    if (!getGoogleOidcStatus().enabled) {
      return res.redirect(303, clientCallbackUrl("not_configured"))
    }
    if (!state || !nonce || !verifier) {
      return res.redirect(303, clientCallbackUrl("invalid_request"))
    }

    const parameters = callbackParameters(req)
    if (parameters.error) {
      return res.redirect(303, clientCallbackUrl("provider_error"))
    }

    const client = await getGoogleOidcClient()
    const { redirectUri } = readGoogleOidcConfiguration()
    const tokenSet = await client.callback(redirectUri, parameters, {
      state,
      nonce,
      code_verifier: verifier,
      response_type: "code",
    })
    const claims = tokenSet.claims()
    const user = await findOrCreateGoogleUser(claims)
    const applicationToken = createApplicationToken(user)
    setApplicationSessionCookie(res, applicationToken)
    return res.redirect(303, clientCallbackUrl())
  } catch (error) {
    const errorCode =
      error.code === "ACCOUNT_CONFLICT"
        ? "account_conflict"
        : error.code === "UNVERIFIED_EMAIL"
          ? "unverified_email"
          : "authentication_failed"
    return res.redirect(303, clientCallbackUrl(errorCode))
  }
}

exports.findOrCreateGoogleUser = findOrCreateGoogleUser
exports.temporaryCookieNames = temporaryCookieNames
exports.temporaryCookieOptions = temporaryCookieOptions
