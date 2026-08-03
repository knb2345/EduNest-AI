const path = require("path")

// Keep backend configuration in server/.env for local development. Azure App
// Service injects the same values as process environment variables.
require("dotenv").config({ path: path.join(__dirname, ".env") })

const cookieParser = require("cookie-parser")
const cors = require("cors")
const express = require("express")
const fileUpload = require("express-fileupload")

const aiRoutes = require("./routes/aiTutor")
const contactUsRoute = require("./routes/Contact")
const courseRoutes = require("./routes/Course")
const paymentRoutes = require("./routes/Payments")
const profileRoutes = require("./routes/profile")
const recommendationRoutes = require("./routes/recommendations")
const userRoutes = require("./routes/user")
const { cloudinaryConnect } = require("./config/cloudinary")
const database = require("./config/database")

const PORT = process.env.PORT || 4000
const IS_PRODUCTION = process.env.NODE_ENV === "production"
const CLIENT_URL = (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "")
const REACT_BUILD_PATH = path.resolve(__dirname, "../build")

const app = express()

// Azure terminates HTTPS before forwarding to Express. Trust exactly the first
// proxy hop so req.secure and secure-cookie behavior reflect the public request.
app.set("trust proxy", IS_PRODUCTION ? 1 : false)

app.use(express.json({ limit: "1mb" }))
app.use(cookieParser())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === CLIENT_URL) return callback(null, true)
      return callback(new Error("Origin is not allowed by CORS"))
    },
    credentials: true,
  })
)
app.use(
  fileUpload({
    useTempFiles: false,
    limits: {
      fileSize: Number.parseInt(
        process.env.AI_MAX_UPLOAD_BYTES || `${10 * 1024 * 1024}`,
        10
      ),
    },
    abortOnLimit: true,
  })
)

app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    service: "edunest-ai",
    status: "ok",
  })
})

// API routes must stay ahead of both the JSON API 404 and React fallback.
app.use("/api/v1/auth", userRoutes)
app.use("/api/v1/profile", profileRoutes)
app.use("/api/v1/course", courseRoutes)
app.use("/api/v1/payment", paymentRoutes)
app.use("/api/v1/reach", contactUsRoute)
app.use("/api/v1/ai", aiRoutes)
app.use("/api/v1/recommendations", recommendationRoutes)

app.use("/api", (_req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  })
})

if (IS_PRODUCTION) {
  app.use(express.static(REACT_BUILD_PATH))
  app.get("*", (_req, res) => res.sendFile(path.join(REACT_BUILD_PATH, "index.html")))
} else {
  app.get("/", (_req, res) => {
    return res.json({
      success: true,
      message: "Your server is up and running ...",
    })
  })
}

app.use((error, req, res, _next) => {
  const isApiRequest = req.path === "/api" || req.path.startsWith("/api/")
  if (isApiRequest) {
    return res.status(500).json({
      success: false,
      message: "Request could not be processed",
    })
  }
  return res.status(500).send("Request could not be processed")
})

async function startServer() {
  await database.connect()
  cloudinaryConnect()

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`App is listening on port ${server.address().port}`)
      resolve(server)
    })
    server.once("error", reject)
  })
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`Application startup failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  app,
  startServer,
}
