const assert = require("assert")
const fs = require("fs")
const path = require("path")

const mongoose = require("mongoose")
const { MongoMemoryServer } = require("mongodb-memory-server")

const trackedVariables = [
  "CLIENT_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "JWT_SECRET",
  "MONGODB_URL",
  "NODE_ENV",
  "PORT",
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

async function closeServer(server) {
  if (!server) return
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

async function run() {
  const buildPath = path.resolve(__dirname, "../build")
  assert.ok(fs.existsSync(path.join(buildPath, "index.html")), "React build is required")

  process.env.NODE_ENV = "production"
  process.env.PORT = "0"
  process.env.CLIENT_URL = "https://edunest-smoke.azurewebsites.net"
  process.env.JWT_SECRET = "production-smoke-secret"
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
  delete process.env.GOOGLE_REDIRECT_URI

  let mongod
  let server
  try {
    mongod = await MongoMemoryServer.create()
    process.env.MONGODB_URL = mongod.getUri()

    const { app, startServer } = require("./index")
    const database = require("./config/database")
    const User = require("./models/User")

    assert.strictEqual(app.get("trust proxy"), 1)
    server = await startServer()
    const baseUrl = `http://127.0.0.1:${server.address().port}`

    const healthResponse = await fetch(`${baseUrl}/api/health`)
    assert.strictEqual(healthResponse.status, 200)
    assert.match(healthResponse.headers.get("content-type") || "", /application\/json/)
    const health = await healthResponse.json()
    assert.deepStrictEqual(health, {
      success: true,
      service: "edunest-ai",
      status: "ok",
    })
    const serializedHealth = JSON.stringify(health)
    assert.ok(!serializedHealth.includes(process.env.MONGODB_URL))
    assert.ok(!serializedHealth.includes(process.env.JWT_SECRET))

    const reactRouteResponse = await fetch(`${baseUrl}/dashboard/my-profile`)
    assert.strictEqual(reactRouteResponse.status, 200)
    assert.match(reactRouteResponse.headers.get("content-type") || "", /text\/html/)
    assert.match(await reactRouteResponse.text(), /<div id="root"><\/div>/)

    const missingApiResponse = await fetch(`${baseUrl}/api/v1/unknown-route`)
    assert.strictEqual(missingApiResponse.status, 404)
    assert.match(missingApiResponse.headers.get("content-type") || "", /application\/json/)
    assert.deepStrictEqual(await missingApiResponse.json(), {
      success: false,
      message: "API route not found",
    })

    const oidcResponse = await fetch(`${baseUrl}/api/v1/auth/google/status`)
    assert.strictEqual(oidcResponse.status, 200)
    assert.deepStrictEqual(await oidcResponse.json(), {
      success: true,
      enabled: false,
      reason: "not_configured",
    })

    const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
      method: "POST",
    })
    assert.strictEqual(logoutResponse.status, 200)
    const logoutCookie = logoutResponse.headers.get("set-cookie") || ""
    assert.match(logoutCookie, /^token=;/)
    assert.match(logoutCookie, /HttpOnly/i)
    assert.match(logoutCookie, /Secure/i)
    assert.match(logoutCookie, /SameSite=Lax/i)
    assert.doesNotMatch(logoutCookie, /Max-Age=86400/i)

    const javascript = fs
      .readdirSync(path.join(buildPath, "static/js"))
      .filter((name) => name.endsWith(".js"))
      .map((name) => fs.readFileSync(path.join(buildPath, "static/js", name), "utf8"))
      .join("\n")
    assert.ok(javascript.includes("/api/v1"))
    assert.ok(!javascript.includes("http://localhost:4000/api/v1"))

    assert.strictEqual(await User.countDocuments({}), 0)

    await closeServer(server)
    server = null
    await mongoose.disconnect()
    delete process.env.MONGODB_URL
    await assert.rejects(database.connect(), /MONGODB_URL is required in production/)

    console.log("Production health response safety: verified")
    console.log("React static serving and direct-route fallback: verified")
    console.log("Unknown API JSON 404: verified")
    console.log("OAuth-disabled production startup: verified")
    console.log("Azure trust proxy and production logout cookie: verified")
    console.log("Production same-origin API bundle: verified")
    console.log("Production demo auto-seeding disabled: verified")
    console.log("Missing production MONGODB_URL failure: verified")
  } finally {
    await closeServer(server).catch(() => undefined)
    await mongoose.disconnect().catch(() => undefined)
    if (mongod) await mongod.stop()
    restoreEnvironment()
  }
}

run().catch((error) => {
  console.error("Production smoke verification failed:", error.message)
  process.exit(1)
})
