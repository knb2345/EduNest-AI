const jwt = require("jsonwebtoken")

const APPLICATION_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

function isProduction() {
  return process.env.NODE_ENV === "production"
}

function applicationCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    maxAge: APPLICATION_SESSION_MAX_AGE_MS,
    path: "/",
  }
}

function createApplicationToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required to create an application session")
  }

  return jwt.sign(
    {
      email: user.email,
      id: user._id,
      role: user.accountType,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  )
}

function setApplicationSessionCookie(res, token) {
  res.cookie("token", token, applicationCookieOptions())
}

function clearApplicationSessionCookie(res) {
  res.clearCookie("token", applicationCookieOptions())
}

module.exports = {
  APPLICATION_SESSION_MAX_AGE_MS,
  applicationCookieOptions,
  clearApplicationSessionCookie,
  createApplicationToken,
  setApplicationSessionCookie,
}
