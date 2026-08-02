// Import the required modules
const express = require("express")
const router = express.Router()

// Import the required controllers and middleware functions
const {
  login,
  signup,
  sendotp,
  changePassword,
} = require("../controllers/Auth")
const {
  resetPasswordToken,
  resetPassword,
} = require("../controllers/resetPassword")

const { auth } = require("../middleware/auth")
const {
  beginGoogleLogin,
  googleCallback,
  googleStatus,
} = require("../controllers/googleAuth")
const { clearApplicationSessionCookie } = require("../utils/authSession")

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// Route for user login
router.post("/login", login)

router.get("/google/status", googleStatus)
router.get("/google", beginGoogleLogin)
router.get("/google/callback", googleCallback)

router.post("/logout", (_req, res) => {
  clearApplicationSessionCookie(res)
  return res.status(200).json({ success: true, message: "Logged out" })
})

// Route for user signup
router.post("/signup", signup)

// Route for sending OTP to the user's email
router.post("/sendotp", sendotp)

// Route for Changing the password
router.post("/changepassword", auth, changePassword)

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

// Export the router for use in the main application
module.exports = router
