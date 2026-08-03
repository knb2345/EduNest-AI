# EduNest AI deployment to Microsoft Azure

This is a deployment runbook, not a record of a completed deployment. No Azure resources, application settings, provider credentials, or GitHub deployment workflow are created by this repository change.

## Production architecture

Use one Linux Azure App Service web application for the Node.js/Express process. Express serves the compiled React files from `build/` and owns all routes under `/api/v1`; the browser and API therefore share one public origin. Azure terminates public HTTPS and forwards the request to Express, which trusts one proxy hop. A persistent MongoDB-compatible service stores all application records, including users, course structure, progress, extracted PDF chunks, and quiz drafts. Cloudinary remains the persistent store for uploaded course images and videos.

```text
Browser -- HTTPS --> Azure App Service (Express + React build)
                           |-- /api/v1/* --> Express routes
                           |-- /api/health --> safe health response
                           `-- other routes --> React index.html
                                      |
                                      +--> MongoDB-compatible database
                                      +--> Google OpenID Connect
                                      +--> OpenAI (optional)
                                      +--> Razorpay (optional)
                                      +--> Cloudinary (persistent media)
                                      `--> SMTP email provider (optional)
```

## Recommended Azure resource names

- Resource group: `rg-edunest-prod`
- App Service plan: `asp-edunest-prod`
- Web app: `app-edunest-prod-<unique-suffix>`
- Application Insights: `appi-edunest-prod`
- Log Analytics workspace: `log-edunest-prod`
- MongoDB-compatible database account/cluster: `mongo-edunest-prod-<unique-suffix>`
- Database name: `edunest`

Azure web app names and some database account names are globally unique, so retain the prefix and add a short organization or region suffix.

## Azure web application setup

1. Create `rg-edunest-prod` in the intended production region.
2. Create a Linux App Service plan and a Web App using the Code publishing model.
3. Select Node.js 22 LTS. Confirm it is still listed for the selected region with `az webapp list-runtimes --os linux`; App Service runtime availability is platform-managed.
4. Enable HTTPS Only. Use the default `azurewebsites.net` hostname initially or bind a custom domain and managed certificate before configuring provider callbacks.
5. Enable Always On when the selected App Service tier supports it.
6. Enable Application Insights and App Service application logging with a bounded retention period.
7. Set Health check path to `/api/health`.
8. Set the startup command to `node server/index.js`.

The application listens on the `PORT` supplied by App Service and falls back to `4000` locally. Do not hard-code an Azure port.

Microsoft’s current Node.js App Service guidance explains runtime selection, startup commands, and the commands for listing supported stacks: [Configure a Node.js app in Azure App Service](https://learn.microsoft.com/azure/app-service/configure-language-nodejs).

## Supported Node runtime

This repository selects Node.js `22.18.0` locally and declares `>=22.13.0 <23` in both package files. Node 22 is required because the installed PDF parser dependency requires Node 22.13 or newer. Configure App Service with the `NODE|22-lts` Linux runtime rather than pinning an Azure patch version; Azure applies runtime security updates.

Before any future runtime upgrade, run every command in the verification section, especially PDF upload/Tutor ingestion and the normal React production build.

## Database requirements and compatibility notes

`MONGODB_URL` remains the only database-vendor interface in the application. Use a durable MongoDB-compatible deployment that supports the repository’s Mongoose 7 operations and indexes. Suitable choices include a managed MongoDB service reachable from Azure or Azure Cosmos DB for MongoDB after validating feature and command compatibility for the chosen offering. Microsoft documents both the MongoDB connection-string interface and Mongoose usage: [Azure Cosmos DB for MongoDB](https://learn.microsoft.com/azure/cosmos-db/mongodb/) and [Connect a Mongoose application](https://learn.microsoft.com/azure/cosmos-db/mongodb/connect-using-mongoose).

Operational requirements:

- Use TLS and a dedicated least-privilege application database user.
- Permit network access from the App Service using the database provider’s supported firewall/private-network configuration.
- Put the complete connection URI only in the `MONGODB_URL` App Service setting (or a Key Vault reference).
- Include the database name in the URI when required by the provider.
- Test transactions, retryable writes, TLS parameters, and special connection-string options against the selected provider before production data is loaded.
- Configure backups, retention, restore testing, alerts, and capacity limits with the database provider.

Startup fails before the HTTP listener opens when `MONGODB_URL` is absent or cannot be selected within the bounded timeout. The URI is never printed. `mongodb-memory-server` is only a development/test dependency path used by the explicit demo and verification scripts; production startup never seeds demo users.

## Application settings

Configure these in App Service **Settings > Environment variables**. Mark deployment-slot settings where a future staging slot must have separate values. Use secret values from a managed secret store or Azure Key Vault references when available.

| Setting | Production value or guidance |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Do not add manually; App Service injects it |
| `MONGODB_URL` | Persistent MongoDB-compatible TLS connection URI |
| `JWT_SECRET` | Long cryptographically random value; rotate through a planned session invalidation |
| `CLIENT_URL` | `https://<app-name>.azurewebsites.net` or the final custom origin, without a trailing slash |
| `GOOGLE_CLIENT_ID` | Google Web application client ID; omit with the other two Google settings to disable Google login |
| `GOOGLE_CLIENT_SECRET` | Google Web application client secret |
| `GOOGLE_REDIRECT_URI` | `https://<app-name>.azurewebsites.net/api/v1/auth/google/callback` |
| `OPENAI_API_KEY` | Optional server-only API key |
| `RAZORPAY_KEY` | Optional Razorpay key ID |
| `RAZORPAY_SECRET` | Optional Razorpay secret |
| `MAIL_HOST` | SMTP hostname |
| `MAIL_USER` | SMTP username |
| `MAIL_PASS` | SMTP password or provider credential |
| `CLOUD_NAME` | Cloudinary cloud name |
| `API_KEY` | Cloudinary API key |
| `API_SECRET` | Cloudinary API secret |
| `FOLDER_NAME` | Production Cloudinary folder, for example `edunest-prod` |
| `AI_MAX_UPLOAD_BYTES` | Optional; defaults to `10485760` (10 MiB) |
| `AI_TOP_K` | Optional; defaults to `5` |
| `AI_SEMANTIC_THRESHOLD` | Optional; defaults to `0.2` |
| `AI_LEX_THRESHOLD` | Optional; defaults to `0.1` |
| `EMBEDDING_MODEL` | Optional OpenAI embedding model override |
| `LLM_MODEL` | Optional OpenAI chat model override |

Do not define `REACT_APP_BASE_URL` for the production build. The production client compiles to same-origin `/api/v1`. Local development still defaults to `http://localhost:4000/api/v1`, and Axios retains `withCredentials: true` for the HttpOnly Google application session.

## Build and startup commands

Run from the repository root:

```bash
npm run install:all && npm run build:production
```

This performs lockfile-based `npm ci` installs for the React root and `server/`, then creates the standard React production build in `build/`.

The exact production startup command is:

```bash
node server/index.js
```

Do not use `nodemon` in App Service.

## GitHub deployment setup (later)

Deployment automation is intentionally not added yet. When ready:

1. In App Service **Deployment Center**, select GitHub and the intended repository and branch.
2. Prefer GitHub-to-Azure OpenID Connect with a federated credential and least-privilege access over a long-lived publish profile.
3. Let the generated workflow check out the repository and select Node `22.x`.
4. Replace non-deterministic install/build steps with `npm run install:all && npm run build:production`.
5. Run `npm run auth:verify`, `npm run recommendation:verify`, and `npm run production:verify` before deployment.
6. Package the repository root with `build/` and the production backend dependencies available to the deployed app. If the workflow deploys source and relies on remote build instead, explicitly make the remote build install `server/package-lock.json` dependencies as well as root dependencies.
7. Deploy with `azure/webapps-deploy` to the exact App Service name and keep the startup command configured in App Service.
8. Protect the production environment in GitHub and require review before production deployments.

Microsoft documents Deployment Center and both federated-identity and publish-profile workflows here: [Deploy to Azure App Service by using GitHub Actions](https://learn.microsoft.com/azure/app-service/deploy-github-actions).

## Google production callback configuration

Create or update a Google OAuth client of type **Web application**. Add the exact authorized redirect URI:

```text
https://<app-name>.azurewebsites.net/api/v1/auth/google/callback
```

Set the same value in `GOOGLE_REDIRECT_URI`, and set `CLIENT_URL` to only the matching application origin. If a custom domain becomes canonical, add its callback in Google first, update both App Service values together, restart, verify, and only then remove an obsolete callback. Google rejects a redirect URI that does not exactly match an authorized value: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

With all three Google settings absent, `/api/v1/auth/google/status` safely reports the provider disabled. Partial or invalid Google configuration also remains disabled; it does not block application startup.

## OpenAI, Razorpay, Cloudinary, and email configuration

- **OpenAI:** Store `OPENAI_API_KEY` server-side. Validate the configured embedding/chat model names in a non-production environment. Without the key, lexical Tutor retrieval, source preview, abstention, and deterministic short-answer quiz generation continue to work.
- **Razorpay:** Configure the key ID and secret as a matched production pair. Verify webhook/payment environment choices and run a low-value end-to-end transaction using the provider’s recommended production validation process before opening enrollment.
- **Cloudinary:** Configure `CLOUD_NAME`, `API_KEY`, `API_SECRET`, and `FOLDER_NAME`. Course thumbnails, profile images, and lecture videos stream to Cloudinary and stored database records retain provider URLs; they do not depend on App Service disk persistence.
- **Email:** Configure `MAIL_HOST`, `MAIL_USER`, and `MAIL_PASS` for the selected SMTP provider. Verify sender authorization, SPF/DKIM/DMARC, OTP delivery, password reset, and payment notifications without logging secrets or message tokens.

## File persistence

Express keeps incoming multipart content in memory (`useTempFiles: false`). PDF bytes are parsed directly, hashed, and discarded after the request; no uploaded PDF or temporary PDF is retained on the web server. Extracted page/chunk text, document hash/name, page number, and optional embeddings persist as `DocChunk` records in the database. Course/profile images and lecture videos stream from request memory to Cloudinary, and only their durable Cloudinary URLs are stored in MongoDB. A defensive uploader path deletes a temporary file in `finally` if a future upload configuration supplies one.

The bundled React assets are deployment artifacts and may live on the App Service content filesystem; they are replaceable and are not user-generated persistent data.

## First deployment verification

After the first deployment, do not treat a successful portal status as full verification. Check:

1. `GET https://<app-name>.azurewebsites.net/api/health` returns only `success`, `service`, and `status` fields.
2. `/`, `/about`, `/login`, and a nested React route return the SPA over HTTPS when navigated to directly.
3. `/api/v1/unknown-route` returns a JSON 404 rather than `index.html`.
4. Browser network requests target `/api/v1` on the same hostname and include credentials.
5. Local login, authenticated profile restore, and logout work; logout expires the Secure, HttpOnly, SameSite=Lax session cookie.
6. Google status is disabled when intentionally unconfigured, or complete one real Google login after the exact production callback is registered.
7. Create/read a non-demo database record, restart the web app, and confirm it persists.
8. Upload a small course thumbnail/video and verify the stored URL is Cloudinary-backed and survives restart/redeployment.
9. Upload a PDF, confirm the `DocChunk` count, restart, then verify Tutor retrieval still uses the persisted chunks.
10. Exercise recommendation, Tutor source-preview/abstention, quiz draft/publish/student-safe payload/scoring, email, and payment paths appropriate to the configured providers.

## Logs and troubleshooting

- Use **Log stream**, Application Insights traces, and deployment logs. Application logs intentionally omit connection strings and credentials.
- If startup fails with `MONGODB_URL is required in production`, add the setting and restart. For the bounded database timeout error, verify DNS, TLS parameters, firewall/private networking, database availability, and credentials without pasting the URI into logs or tickets.
- If the site returns an application error, confirm Node 22 LTS, the startup command, and that both root and server dependencies plus `build/index.html` exist in the deployment artifact.
- If a React deep link is JSON or 404, confirm it does not begin with `/api` and that the build exists. API routes deliberately never use the SPA fallback.
- For CORS failures, make `CLIENT_URL` exactly equal to the browser origin. Same-origin production requests should need no cross-origin exception.
- For Google `redirect_uri_mismatch`, compare the public callback, Google Authorized redirect URI, and `GOOGLE_REDIRECT_URI` character-for-character.
- For upload failures, verify request size, Cloudinary settings/folder permissions, and App Service outbound connectivity. Do not switch permanent media to the App Service filesystem.

## Redeployment

Run the regression/build suite on the intended commit, deploy through the protected GitHub environment, watch deployment and startup logs, then repeat health, deep-link, API-404, login/logout, and one database-backed check. App Service deployments replace application code and the React build; MongoDB data and Cloudinary media remain outside the web app and must not be cleared during redeployments. Use a deployment slot for higher-risk changes when the App Service tier supports it.

## Cost monitoring

Create Azure Cost Management budgets and alerts for `rg-edunest-prod`. Monitor App Service plan utilization, Application Insights ingestion/retention, outbound bandwidth, database compute/storage/backup costs, and any private networking charges. Also configure independent budgets or usage alerts for MongoDB, OpenAI, Cloudinary, Razorpay, and the email provider. Revisit sizing after observing real load; do not infer capacity from the demo.

## Deleting the resource group

Deleting `rg-edunest-prod` deletes every Azure resource in that group and is irreversible for resources without an external backup. Before deletion, export required application/database data, confirm database and Cloudinary retention obligations, preserve any logs required for audit, remove provider callbacks/credentials, and verify the exact resource-group name. Then delete `rg-edunest-prod` in the Azure portal or with an explicitly reviewed Azure CLI command. External MongoDB, Cloudinary, Google, OpenAI, Razorpay, email, and GitHub resources are not necessarily deleted with the Azure resource group and must be handled separately.
