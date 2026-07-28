# Repository Audit — EduNest (edtech_babbar)

Date: 2026-07-28

Summary
- Purpose: map current frontend, Redux, API client, Express, MongoDB, auth, payments, email, upload, and config flows; run lightweight safe checks; list risks and recommended next steps.

Commands run (confirmed)
- `node -v` → v22.18.0
- `npm -v` → 11.12.1

Confirmed file locations (key areas)
- Frontend entry: [src/App.jsx](src/App.jsx#L1-L200)
- Frontend auth storage & calls: [src/services/operations/authAPI.js](src/services/operations/authAPI.js#L1-L220)
- Frontend API endpoints config: [src/services/apis.js](src/services/apis.js#L1-L200)
- Redux auth state: [src/slices/authSlice.js](src/slices/authSlice.js#L1-L80)
- Server entry and middleware ordering: [server/index.js](server/index.js#L1-L200)
- JWT creation & login: [server/controllers/Auth.js](server/controllers/Auth.js#L1-L220)
- JWT verification + role middleware: [server/middleware/auth.js](server/middleware/auth.js#L1-L200)
- Payment capture/verify + enrollment: [server/controllers/payments.js](server/controllers/payments.js#L1-L300)
- Razorpay config: [server/config/razorpay.js](server/config/razorpay.js#L1-L200)
- Cloudinary config: [server/config/cloudinary.js](server/config/cloudinary.js#L1-L80)
- Mail sender: [server/utils/mailSender.js](server/utils/mailSender.js#L1-L200)
- DB config: [server/config/database.js](server/config/database.js#L1-L120)
- Routes that enforce auth/roles: [server/routes/*.js](server/routes/Course.js#L1-L200) and [server/routes/Payments.js](server/routes/Payments.js#L1-L80)

Authentication / token flow (mapped)
- Token creation: `jwt.sign(...)` in [server/controllers/Auth.js](server/controllers/Auth.js#L140-L160).
- Token returned: login response includes JSON `{ token, user }` and server sets a cookie via `res.cookie("token", token, options)` (see same file).
- Token persisted server-side: `user.token` is set on the User document.
- Token verification: `server/middleware/auth.js` reads token from `req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "")` then calls `jwt.verify(token, process.env.JWT_SECRET)` and attaches `req.user`.
- Frontend storage: after successful login, the client stores the token in `localStorage` ([src/services/operations/authAPI.js](src/services/operations/authAPI.js#L100-L120)) and `authSlice` initializes `token` from `localStorage` ([src/slices/authSlice.js](src/slices/authSlice.js#L1-L20)).
- Frontend usage: many API calls add an `Authorization: Bearer ${token}` header (examples: [src/services/operations/courseDetailsAPI.js](src/services/operations/courseDetailsAPI.js#L1-L320), [src/services/operations/profileAPI.js](src/services/operations/profileAPI.js#L1-L120), [src/services/operations/studentFeaturesAPI.js](src/services/operations/studentFeaturesAPI.js#L1-L160)).

Findings and risks (highest importance first)
- Insecure token lifecycle and duplication: server sets an HttpOnly cookie but also returns JWT in JSON and stores it in the DB; frontend persists token in `localStorage`. Persisting reusable auth credentials in `localStorage` makes the app vulnerable to XSS-based token theft (project docs explicitly disallow this).
- Authentication middleware bug: `req.header("Authorization").replace("Bearer ", "")` is called without null-checking — if `Authorization` header is missing, this will throw and may crash request handling. See [server/middleware/auth.js](server/middleware/auth.js#L1-L40).
- CORS configuration: `cors({ origin: '*', credentials: true })` in [server/index.js](server/index.js#L1-L60) is incorrect/insecure — `credentials: true` with `origin: '*'` is invalid and opens risk surface; should use explicit allowed origin(s) and vary by environment.
- Hard-coded payment keys: [server/config/razorpay.js](server/config/razorpay.js#L1-L40) contains hard-coded test keys, not environment-backed secrets. This is an insecure placeholder and must be replaced by env variables and secure storage.
- CSRF exposure: The app uses cookies and also Authorization headers; but there is no CSRF protection detected. If switching to cookie-based sessions, CSRF protection (tokens or SameSite/Double-Submit) is required.
- Cookie attributes: login cookie uses `httpOnly: true` but no `secure` or `sameSite` attributes. In production `Secure` and `SameSite` must be set, and environment-based cookie config applied.
- Email and payment code call external services directly: mail sender and Razorpay are invoked in controllers; tests must mock these providers (project docs require deterministic tests that don't call real services).
- Duplicate/dependency inconsistencies: root and server package.json have overlapping dependencies and version differences (e.g., `jsonwebtoken` in both). `bcrypt` and `bcryptjs` both appear in server deps — remove duplication.

Duplicate / dead / tutorial-placeholder items
- Hard-coded `RAZORPAY_KEY` / `RAZORPAY_SECRET` in [server/config/razorpay.js](server/config/razorpay.js#L1-L40).
- Presence of both `bcrypt` and `bcryptjs` in `server/package.json`.
- Returning the token in JSON and also setting a cookie plus saving token in DB — redundant and risky unless used for token revocation (no revocation implementation found).

Missing environment variables (identified by name only)
- JWT_SECRET
- MONGODB_URL
- CLOUD_NAME
- API_KEY
- API_SECRET
- FOLDER_NAME
- RAZORPAY_KEY
- RAZORPAY_SECRET
- MAIL_HOST
- MAIL_USER
- MAIL_PASS
- REACT_APP_BASE_URL
- PORT (optional override)

Safe seams / recommended sequence to implement secure sessions, OIDC, AI service, retrieval and evaluation
1. Fix critical bugs and secure basics (safe, small changes)
   - Patch `server/middleware/auth.js` to safely extract the Authorization header (null-check) and centralize extraction into a single helper.
   - Replace `cors({ origin: '*', credentials: true })` with environment-driven allowed origins and `credentials` only for trusted origins.
   - Remove hard-coded Razorpay keys and read them from env; mark current keys as test-only in code comments until replaced.

2. Migrate frontend off `localStorage` for auth tokens (session hardening)
   - Stop writing JWT into `localStorage`; switch client to rely on secure, httpOnly cookies for session tokens and only store ephemeral profile UI state in redux.
   - Update API client to stop adding `Authorization` header for cookie-based sessions (or use rotating short-lived access tokens fetched from a refresh endpoint).
   - Add logout endpoint that clears server-side token and cookie and invalidate server `user.token` if DB token is used for revocation.

3. CSRF & cookie policy
   - If using cookies for auth, add CSRF protection (double-submit token, CSRF cookie + header, or SameSite strict/lax combined with origin checks).
   - Set `Secure`, `SameSite=Strict`/`Lax` appropriately and use environment-specific cookie options.

4. OIDC & external identity
   - Implement Google OpenID Connect Authorization Code flow with PKCE behind the backend (docs already require this). Keep provider credentials in env and store only server-side session linking.

5. Payments & email
   - Move to env-backed Razorpay keys and add server-side validation/hardening for payment webhooks, idempotency, and audit logging. Ensure HMAC verifies using env secret (already done in payments.verifyPayment but key must be env-backed).
   - Add local dev/test mocks for mail and payment providers and ensure tests mock external calls.

6. AI & retrieval service seams
   - Create a separate authenticated service (Python or Node) behind a signed backend-to-backend API (service account token). Do not grant the LLM direct DB access.
   - Add a retrieval pipeline with chunking, deterministic embedding mocks for tests, and provenance metadata for evidence (source ids/offsets). Store configuration and evaluation harness in `docs/` and a test dataset.

Developer commands to run locally (recommended)
- Install (root): `npm install`
- Install server deps (server folder): `cd server && npm install`
- Run client dev: `npm start`
- Run server dev: `npm run server` (root script runs `cd server && npm run dev`)
- Build client: `npm run build`

Notes / Next actions
- I ran lightweight checks (`node -v`, `npm -v`) and did code inspection only — I did not run `npm install` or build to avoid network/download noise and side effects. I can run installs/builds on request and report exact outputs.
- I recommend prioritizing the middleware bug, CORS config, removal of localStorage token persistence, and replacing hard-coded payment keys before any OIDC or AI work.

Runtime note (important)
- This repository contains a `.nvmrc` at the root specifying Node version `v16.18.0`.
- The install/build actions I ran during the audit executed under Node `v22.18.0` (the active runtime on this machine). Because the Node major/minor version differs from `.nvmrc`, the install/build results recorded in `docs/BUILD_STATUS.md` are provisional and may not reflect the expected baseline for development. Re-run the install/build under the `.nvmrc` Node version (`v16.18.0`) to confirm reproducible results before treating them as definitive.


Detailed enumeration
- JWT creation:
   - `server/controllers/Auth.js` — `jwt.sign(...)` signs login tokens and sets cookie and JSON response. See [server/controllers/Auth.js](server/controllers/Auth.js#L140-L160).
- JWT return/storage/cookie:
   - Cookie set: `res.cookie("token", token, options)` in [server/controllers/Auth.js](server/controllers/Auth.js#L156).
   - Token included in JSON body of login response in same file.
   - Token saved to `user.token` on the User document in `server/controllers/Auth.js`.
- JWT verification:
   - `server/middleware/auth.js` reads token from `req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "")` and calls `jwt.verify(token, process.env.JWT_SECRET)`. See [server/middleware/auth.js](server/middleware/auth.js#L1-L40).
- Frontend `localStorage` auth usage:
   - `src/services/operations/authAPI.js` — `localStorage.setItem("token", JSON.stringify(response.data.token))` at login and `localStorage.removeItem("token")` at logout. See [src/services/operations/authAPI.js](src/services/operations/authAPI.js#L100-L120).
   - `src/slices/authSlice.js` initializes token from `localStorage`. See [src/slices/authSlice.js](src/slices/authSlice.js#L1-L20).
   - `src/App.jsx` reads `localStorage.getItem("token")` on startup to call `getUserDetails`. See [src/App.jsx](src/App.jsx#L40-L48).
- Authorization header usage (frontend):
   - Multiple API clients include `Authorization: Bearer ${token}` in headers; examples: [src/services/operations/courseDetailsAPI.js](src/services/operations/courseDetailsAPI.js#L88-L96), [src/services/operations/profileAPI.js](src/services/operations/profileAPI.js#L18-L28), [src/services/operations/studentFeaturesAPI.js](src/services/operations/studentFeaturesAPI.js#L56-L64).
- Cookie & CORS configuration:
   - `server/index.js` applies `cookieParser()` and `cors({ origin: "*", credentials: true })`. See [server/index.js](server/index.js#L20-L40).
- CSRF:
   - No CSRF protection middleware detected. If cookies are relied on for auth, add CSRF controls.
- Role middleware and route protection (where applied):
   - `server/routes/Course.js` applies `auth`, `isInstructor`, `isStudent`, and `isAdmin` on course-related routes. See [server/routes/Course.js](server/routes/Course.js#L48-L80).
   - `server/routes/Payments.js` enforces `auth` and `isStudent` for payment routes. See [server/routes/Payments.js](server/routes/Payments.js#L1-L20).
   - `server/routes/profile.js` applies `auth` on profile update/get/delete routes. See [server/routes/profile.js](server/routes/profile.js#L1-L40).
- Account ownership / enrollment checks:
   - Payment enrollment checks whether `course.studentsEnroled.includes(uid)` to avoid double enrollment in [server/controllers/payments.js](server/controllers/payments.js#L20-L60).
   - Many controllers use `req.user.id` or `req.user.email` (from verified JWT) and then fetch DB records for role/ownership checks in middleware and controllers (examples in `server/middleware/auth.js`, `server/controllers/Course.js`, `server/controllers/profile.js`).
- Payment verification:
   - HMAC signature verification uses `process.env.RAZORPAY_SECRET` in [server/controllers/payments.js](server/controllers/payments.js#L80-L100).
- Email sending:
   - `server/utils/mailSender.js` uses `process.env.MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` with `nodemailer`. See [server/utils/mailSender.js](server/utils/mailSender.js#L1-L80).
- Cloudinary / uploads:
   - `server/config/cloudinary.js` reads `CLOUD_NAME`, `API_KEY`, `API_SECRET`. File uploads handled by `express-fileupload` in `server/index.js` and `cloudinary` in controllers such as `server/controllers/Course.js` and `server/controllers/Subsection.js`.
- Package managers / runtimes / scripts / test frameworks / build commands / linting
   - Runtime: Node.js v22.18.0 (confirmed).
   - Package manager: npm 11.12.1 (confirmed).
   - Root `package.json` scripts: `start`, `build`, `test`, `eject`, `server`, `dev`. See [package.json](package.json#L1-L60).
   - Server `package.json` scripts: `start`, `dev` (`nodemon index.js`). See [server/package.json](server/package.json#L1-L40).
   - Test framework: client uses `react-scripts test` (Jest + react-scripts); no server test framework currently present.
   - Linting / type checking: no workspace-level ESLint or TypeScript config identified. `eslintConfig` in root `package.json` extends `react-app`.
   - Docker configuration: no Dockerfile or docker-compose detected in repository.

