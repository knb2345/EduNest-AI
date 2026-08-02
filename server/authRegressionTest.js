const assert = require("assert")
const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")

const User = require("./models/User")
const {
  CALLBACK_PATH,
  getGoogleOidcStatus,
  validateAbsoluteUrl,
} = require("./config/googleOidc")
const {
  applicationCookieOptions,
  createApplicationToken,
} = require("./utils/authSession")
const {
  temporaryCookieNames,
  temporaryCookieOptions,
} = require("./controllers/googleAuth")

const trackedVariables = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "CLIENT_URL",
  "JWT_SECRET",
  "NODE_ENV",
]
const originalEnvironment = Object.fromEntries(
  trackedVariables.map((name) => [name, process.env[name]])
)

function restoreEnvironment() {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
}

function configureValidOidc() {
  process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com"
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret"
  process.env.GOOGLE_REDIRECT_URI = `http://localhost:4000${CALLBACK_PATH}`
  process.env.CLIENT_URL = "http://localhost:3000"
}

try {
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
  delete process.env.GOOGLE_REDIRECT_URI
  process.env.CLIENT_URL = "http://localhost:3000"
  assert.deepStrictEqual(getGoogleOidcStatus(), {
    enabled: false,
    reason: "not_configured",
  })

  process.env.GOOGLE_CLIENT_ID = "partial-client"
  assert.strictEqual(getGoogleOidcStatus().reason, "incomplete_configuration")

  configureValidOidc()
  assert.deepStrictEqual(getGoogleOidcStatus(), { enabled: true })
  assert.strictEqual(
    validateAbsoluteUrl(process.env.GOOGLE_REDIRECT_URI, "redirect", {
      callback: true,
    }).pathname,
    CALLBACK_PATH
  )

  process.env.GOOGLE_REDIRECT_URI = "http://localhost:4000/wrong-callback"
  assert.strictEqual(getGoogleOidcStatus().reason, "invalid_configuration")
  configureValidOidc()

  const profileId = new mongoose.Types.ObjectId()
  const googleUser = new User({
    firstName: "Google",
    lastName: "Student",
    email: "student@example.com",
    emailVerified: true,
    authProvider: "google",
    providerSubject: "google-subject",
    accountType: "Student",
    additionalDetails: profileId,
  })
  assert.strictEqual(googleUser.validateSync(), undefined)

  const invalidGoogleUser = new User({
    firstName: "Google",
    lastName: "Student",
    email: "missing-subject@example.com",
    authProvider: "google",
    accountType: "Student",
    additionalDetails: profileId,
  })
  assert.ok(invalidGoogleUser.validateSync().errors.providerSubject)

  const localWithoutPassword = new User({
    firstName: "Local",
    lastName: "Student",
    email: "local@example.com",
    authProvider: "local",
    accountType: "Student",
    additionalDetails: profileId,
  })
  assert.ok(localWithoutPassword.validateSync().errors.password)

  process.env.JWT_SECRET = "auth-regression-test-secret"
  const token = createApplicationToken(googleUser)
  const decoded = jwt.verify(token, process.env.JWT_SECRET)
  assert.strictEqual(decoded.role, "Student")
  assert.strictEqual(decoded.email, "student@example.com")
  assert.ok(decoded.exp > decoded.iat)

  process.env.NODE_ENV = "development"
  assert.strictEqual(applicationCookieOptions().httpOnly, true)
  assert.strictEqual(applicationCookieOptions().secure, false)
  assert.strictEqual(temporaryCookieOptions().sameSite, "lax")
  assert.strictEqual(temporaryCookieOptions().path, "/api/v1/auth/google")
  assert.ok(!temporaryCookieNames().state.startsWith("__Host-"))

  process.env.NODE_ENV = "production"
  assert.strictEqual(applicationCookieOptions().secure, true)
  assert.strictEqual(temporaryCookieOptions().path, "/")
  assert.ok(temporaryCookieNames().state.startsWith("__Host-"))

  console.log("OAuth-disabled configuration: verified")
  console.log("Google OIDC redirect configuration: verified")
  console.log("Local and Google user-model validation: verified")
  console.log("EduNest JWT claims and secure cookie policy: verified")
} finally {
  restoreEnvironment()
}
