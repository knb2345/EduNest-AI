const { Issuer, generators } = require("openid-client")

const GOOGLE_ISSUER = "https://accounts.google.com"
const CALLBACK_PATH = "/api/v1/auth/google/callback"

let clientPromise
let clientKey

function readGoogleOidcConfiguration() {
  return {
    clientId: (process.env.GOOGLE_CLIENT_ID || "").trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    redirectUri: (process.env.GOOGLE_REDIRECT_URI || "").trim(),
    clientUrl: (process.env.CLIENT_URL || "http://localhost:3000").trim(),
  }
}

function validateAbsoluteUrl(value, label, { callback = false } = {}) {
  let parsed
  try {
    parsed = new URL(value)
  } catch (_error) {
    throw new Error(`${label} must be an absolute URL`)
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label} must use HTTP or HTTPS`)
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error(`${label} must use HTTPS outside local development`)
  }
  if (parsed.username || parsed.password || parsed.hash || parsed.search) {
    throw new Error(`${label} must not contain credentials, a query, or a fragment`)
  }
  if (callback && parsed.pathname !== CALLBACK_PATH) {
    throw new Error(`${label} must end with ${CALLBACK_PATH}`)
  }
  return parsed
}

function getGoogleOidcStatus() {
  const configuration = readGoogleOidcConfiguration()
  const supplied = [
    configuration.clientId,
    configuration.clientSecret,
    configuration.redirectUri,
  ]
  if (supplied.every((value) => !value)) {
    return { enabled: false, reason: "not_configured" }
  }
  if (supplied.some((value) => !value)) {
    return { enabled: false, reason: "incomplete_configuration" }
  }

  try {
    validateAbsoluteUrl(configuration.redirectUri, "GOOGLE_REDIRECT_URI", {
      callback: true,
    })
    const clientUrl = validateAbsoluteUrl(configuration.clientUrl, "CLIENT_URL")
    if (clientUrl.pathname !== "/" || clientUrl.origin !== configuration.clientUrl.replace(/\/$/, "")) {
      throw new Error("CLIENT_URL must contain only the frontend origin")
    }
  } catch (_error) {
    return { enabled: false, reason: "invalid_configuration" }
  }

  return { enabled: true }
}

async function getGoogleOidcClient() {
  const status = getGoogleOidcStatus()
  if (!status.enabled) {
    const error = new Error("Google OpenID Connect is not configured")
    error.code = "OIDC_NOT_CONFIGURED"
    throw error
  }

  const configuration = readGoogleOidcConfiguration()
  const nextClientKey = `${configuration.clientId}\u0000${configuration.redirectUri}`
  if (!clientPromise || clientKey !== nextClientKey) {
    clientKey = nextClientKey
    clientPromise = Issuer.discover(GOOGLE_ISSUER).then((issuer) => {
      if (issuer.issuer !== GOOGLE_ISSUER) {
        throw new Error("Unexpected Google OpenID Connect issuer")
      }
      return new issuer.Client({
        client_id: configuration.clientId,
        client_secret: configuration.clientSecret,
        redirect_uris: [configuration.redirectUri],
        response_types: ["code"],
      })
    })
  }
  return clientPromise
}

module.exports = {
  CALLBACK_PATH,
  GOOGLE_ISSUER,
  generators,
  getGoogleOidcClient,
  getGoogleOidcStatus,
  readGoogleOidcConfiguration,
  validateAbsoluteUrl,
}
