# Manageo 2.0 — Staging Infrastructure Setup & Operator Guide

> **Current Environment Status:** `BLOCKED BY INFRASTRUCTURE`  
> **Target Release:** Manageo 2.0 (Phase 1–7 Stabilization)  
> **Security Classification:** Strict Isolation Required. Live production assets on Cloudinary account `exgn3nrd` and production databases must remain completely untouched.

---

## 1. Overview & Architectural Isolation Principle

Manageo 2.0 introduces multi-tenant workspaces, strict privacy boundaries for financial and vault records, authenticated private asset proxying, and automated notifications. Before deploying to production, all features must be verified on a dedicated, completely isolated Staging environment.

### Core Isolation Invariants
1. **Zero Contamination with Production Cloudinary (`exgn3nrd`)**:
   - The Cloudinary product environment `exgn3nrd` is currently used by live Axiomixs services (`https://manageo.axiomixs.com`).
   - `exgn3nrd` is hardcoded as prohibited in the migration safety guard (`verifyStagingEnvironment()`).
   - Setting `APPROVED_STAGING_CLOUD_NAME=exgn3nrd` is strictly forbidden.
2. **Dedicated Staging Database**:
   - The Staging instance must connect to an isolated Staging MongoDB database with distinct credentials.
   - URIs containing `prod` or pointing to production clusters will be rejected by application and test safety checks.
3. **Fail-Closed Security Guard**:
   - The asset migration endpoint (`POST /api/migrate-assets`) requires Platform Admin authorization (`isPlatformAdmin: true`), an explicit operation mode (`sample` with bounded allowlist or `all`), explicit mutation confirmation (`confirmMutation: true`), and exact matching between `CLOUDINARY_CLOUD_NAME` and `APPROVED_STAGING_CLOUD_NAME`.
   - If any configuration is missing, mismatched, or targeting production, the endpoint immediately returns `403 Forbidden`.

---

## 2. Infrastructure Requirements

### 2.1 Dedicated Staging Cloudinary Environment
* **Account Structure Note**: Cloudinary Free-tier plans **do not support multiple product environments** (sub-accounts) under a single account.
  - Operators **must not assume** multi-environment capabilities on a single free account.
  - If using Cloudinary Free tier: Register a **completely separate Cloudinary account** dedicated exclusively to staging (e.g., `manageo-staging-dev`).
  - If using Cloudinary Enterprise/Advanced: Provision an isolated Product Environment named `manageo-staging`.
* **Required Cloudinary Credentials**:
  - `CLOUDINARY_CLOUD_NAME`: The dedicated staging cloud name.
  - `CLOUDINARY_API_KEY`: Staging API key.
  - `CLOUDINARY_API_SECRET`: Staging API secret.
* **Staging Approval Variable**:
  - `APPROVED_STAGING_CLOUD_NAME`: Must be set in the Staging environment to exactly match `CLOUDINARY_CLOUD_NAME`.

### 2.2 Dedicated Staging MongoDB Database
* **Cluster Isolation**:
  - Provision a dedicated MongoDB database instance (e.g. MongoDB Atlas M0/M10 cluster: `cluster-staging.xxxx.mongodb.net/manageo-staging`).
  - Do not use a separate database name within the production cluster; use a dedicated staging cluster to guarantee network, resource, and privilege isolation.
* **Credentials & User Permissions**:
  - Dedicated MongoDB database user with `readWrite` permissions scoped strictly to the `manageo-staging` database.
  - The database user must not possess cluster-wide administration roles.
* **Network Access**:
  - In MongoDB Atlas, configure the Network Access IP Access List to allow only the static egress IP addresses of the staging deployment server.
* **Driver & Server Compatibility**:
  - The application uses Mongoose 9.10.2 and MongoDB Driver 7.6.0. Server versions 6.0+, 7.0+, 8.0+, or 9.0+ are supported.

### 2.3 Staging Application Deployment Host
* **Domain / Subdomain**:
  - E.g., `https://staging.manageo.axiomixs.com`.
  - SSL/TLS certificate configured (e.g., via Cloudflare or Let's Encrypt).
* **Compute Environment**:
  - Node.js runtime: v20.x or v22.x LTS (compatible with v24).
  - Standalone process managed by PM2, Docker, or Kubernetes, completely segregated from production processes.

### 2.4 External Authentication & Service Configurations
* **NextAuth & Cookie Domain**:
  - `NEXTAUTH_URL`: Must be set to `https://staging.manageo.axiomixs.com`.
  - `NEXT_PUBLIC_APP_URL`: Must be set to `https://staging.manageo.axiomixs.com`.
  - Cookies will be automatically scoped to the staging host.
* **Google OAuth (Sign In with Google)**:
  - In the Google Cloud Console (APIs & Services > Credentials):
    - Add to **Authorized JavaScript origins**: `https://staging.manageo.axiomixs.com`
    - Add to **Authorized redirect URIs**: `https://staging.manageo.axiomixs.com/api/auth/callback/google`
  - Recommended: Create a separate Staging OAuth 2.0 Client ID and Secret to avoid reusing production credentials.
* **Email Delivery (Resend)**:
  - Configure `RESEND_API_KEY` with a staging-approved key.
  - Set `RESEND_SENDER_EMAIL` to a verified staging address (e.g. `staging@axiomixs.com` or `notifications@manageo.axiomixs.com`).
  - Set `RESEND_SENDER_NAME` to `Manageo Staging`.
* **Push Notifications (Firebase / OneSignal)**:
  - Staging Firebase project credentials (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`).
  - Prevents accidental push broadcasts to production mobile/PWA subscribers.

---

## 3. Environment Variable Specification

The following table specifies the environment configuration for the Staging deployment:

| Variable | Staging Requirement | Production (Live) | Notes / Safety Check |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `production` | `production` | Builds optimized Next.js assets |
| `NEXT_PUBLIC_APP_URL` | `https://staging.manageo.axiomixs.com` | `https://manageo.axiomixs.com` | Base URL for invite links and QR codes |
| `NEXTAUTH_URL` | `https://staging.manageo.axiomixs.com` | `https://manageo.axiomixs.com` | NextAuth callback base URL |
| `NEXTAUTH_SECRET` | Unique 32+ character random secret | Production secret | Generate via `openssl rand -base64 32` |
| `MONGODB_URI` | `mongodb+srv://.../manageo-staging` | Production MongoDB URI | Must never target production cluster |
| `CLOUDINARY_CLOUD_NAME` | `manageo-staging` (or separate account name) | `exgn3nrd` | **Never set to `exgn3nrd`** |
| `CLOUDINARY_API_KEY` | Staging account API key | Production API key | Distinct staging credentials |
| `CLOUDINARY_API_SECRET` | Staging account API secret | Production API secret | Never logged or printed |
| `APPROVED_STAGING_CLOUD_NAME` | **Must exactly match `CLOUDINARY_CLOUD_NAME`** | *(Unset)* | Required by migration safety guard |
| `CRON_SECRET` | Unique 32+ character random secret | Production secret | Secures `/api/notifications/cron` |
| `GOOGLE_CLIENT_ID` | Staging Google OAuth Client ID | Production Client ID | Optional if testing credentials only |
| `GOOGLE_CLIENT_SECRET` | Staging Google OAuth Client Secret | Production Client Secret | Optional if testing credentials only |
| `RESEND_API_KEY` | Staging Resend API key | Production key | Used for password reset and invites |
| `RESEND_SENDER_EMAIL` | `staging@axiomixs.com` | `axiomixs@gmail.com` | Sender address |
| `RESEND_SENDER_NAME` | `Manageo Staging` | `AXIOMIXS` | Sender display name |

---

## 4. Operator Step-by-Step Workflow

### Stage 1: Configure Environment Variables Securely
1. On the staging server, create the environment file `.env.production` (or inject variables via your hosting provider's secret manager):
   ```bash
   # Generate secrets securely
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   CRON_SECRET=$(openssl rand -hex 24)
   ```
2. Populate all variables according to Section 3.
3. Verify that `CLOUDINARY_CLOUD_NAME` is NOT `exgn3nrd` and that `APPROVED_STAGING_CLOUD_NAME` is identical to `CLOUDINARY_CLOUD_NAME`.

---

### Stage 2: Deploy the Tested Codebase
1. Check out the release commit on the staging deployment host:
   ```bash
   git clone <repo_url> manageo-staging
   cd manageo-staging
   ```
2. Install production dependencies:
   ```bash
   npm ci
   ```
3. Run local pre-flight checks:
   ```bash
   npx tsc --noEmit
   npm test
   ```
4. Build the Next.js application:
   ```bash
   npm run build
   ```
5. Start the application service:
   ```bash
   npm start
   # or via PM2:
   pm2 start npm --name "manageo-staging" -- start
   ```

---

### Stage 3: Database Initialization & Health Verification
1. **Health Check**:
   ```bash
   curl -i https://staging.manageo.axiomixs.com/api/notifications/health
   ```
   *Expected response:* HTTP 200 with `{ "status": "ok" }`.
2. **Provision Staging Platform Admin**:
   - Register the staging administrator account via the web UI at `https://staging.manageo.axiomixs.com/register`.
   - Connect to the Staging MongoDB database via `mongosh` and grant the Platform Admin role:
     ```javascript
     use manageo-staging;
     db.users.updateOne(
       { email: "admin@staging.manageo.com" },
       { $set: { isPlatformAdmin: true } }
     );
     ```
3. **Obtain Admin Session Token**:
   - Log in via the browser or API to acquire the `next-auth.session-token` cookie.

---

### Stage 4: Read-Only Cloudinary Inventory Scan
Before executing any asset operations, perform a read-only scan to inventory all asset references across all database models (`Task`, `Note`, `Idea`, `CustomRecord`, `VaultItem`, `Transaction`, `User`, `Invoice`).

* **Request**:
  ```bash
  curl -s -X GET https://staging.manageo.axiomixs.com/api/migrate-assets \
    -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>"
  ```
* **Expected Response Schema**:
  ```json
  {
    "success": true,
    "readOnly": true,
    "dryRun": true,
    "totalDbAssets": 5,
    "publicIds": [
      "tasks/attachment_123",
      "vault/doc_456",
      "transactions/receipt_789"
    ],
    "message": "Database inventory scan completed. Found 5 unique asset references across all models."
  }
  ```
* **Safety Invariant**: GET is strictly read-only. It scans database records and performs zero mutations on MongoDB or Cloudinary.

---

### Stage 5: Bounded Sample Migration

Select an allowlist of 1 to 5 public IDs from the inventory scan.

#### Step 5A: Sample Dry-Run (Safe Inspection)
The dry-run inspects each asset on Cloudinary across `image`, `video`, and `raw` resource types, reporting whether each asset is already secured, needs migration, or is missing.

* **Request**:
  ```bash
  curl -s -X POST https://staging.manageo.axiomixs.com/api/migrate-assets \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>" \
    -d '{
      "mode": "sample",
      "publicIds": [
        "tasks/attachment_123",
        "vault/doc_456"
      ],
      "dryRun": true
    }'
  ```
* **Expected Response Schema**:
  ```json
  {
    "success": true,
    "mode": "sample",
    "dryRun": true,
    "totalRequested": 2,
    "totalMigrated": 0,
    "totalAlreadySecured": 0,
    "totalWouldMigrate": 2,
    "totalFailed": 0,
    "results": [
      "Processing 2 asset(s) in mode: 'sample' (dryRun: true).",
      "[DRY RUN] Would migrate: tasks/attachment_123 (resource_type: image)",
      "[DRY RUN] Would migrate: vault/doc_456 (resource_type: raw)"
    ]
  }
  ```

#### Step 5B: Sample Mutation Execution
Once the dry-run output is confirmed safe, execute the sample migration with explicit mutation intent:

* **Request**:
  ```bash
  curl -s -X POST https://staging.manageo.axiomixs.com/api/migrate-assets \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>" \
    -d '{
      "mode": "sample",
      "publicIds": [
        "tasks/attachment_123",
        "vault/doc_456"
      ],
      "dryRun": false,
      "confirmMutation": true
    }'
  ```
* **Expected Response Schema**:
  ```json
  {
    "success": true,
    "mode": "sample",
    "dryRun": false,
    "totalRequested": 2,
    "totalMigrated": 2,
    "totalAlreadySecured": 0,
    "totalFailed": 0,
    "results": [
      "Processing 2 asset(s) in mode: 'sample' (dryRun: false).",
      "Migrated: tasks/attachment_123 (resource_type: image)",
      "Migrated: vault/doc_456 (resource_type: raw)"
    ]
  }
  ```

---

### Stage 6: Verify Delivery, Security, and Integrity

Perform the following 4-point verification on the migrated sample assets:

1. **Authenticated Delivery via Proxy**:
   - Access the asset through the authenticated proxy:
     ```bash
     curl -i -X GET "https://staging.manageo.axiomixs.com/api/assets/tasks/attachment_123" \
       -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>"
     ```
   - **Verification**: The server responds with `307 Temporary Redirect` to a Cloudinary signed URL containing an authorization signature (`s--...--`). The signed URL loads successfully in a browser.
2. **Denial of Unauthorized Access (Direct Cloudinary URL)**:
   - Attempt to access the raw Cloudinary delivery URL directly without a signature:
     ```bash
     curl -i "https://res.cloudinary.com/<CLOUDINARY_CLOUD_NAME>/image/authenticated/tasks/attachment_123"
     ```
   - **Verification**: Cloudinary responds with `HTTP 401 Unauthorized`.
3. **Denial of Unauthenticated Proxy Access**:
   - Request the proxy endpoint without a session cookie:
     ```bash
     curl -i "https://staging.manageo.axiomixs.com/api/assets/tasks/attachment_123"
     ```
   - **Verification**: Responds with `HTTP 401 Unauthorized` or `HTTP 403 Forbidden`.
4. **Database Reference Integrity**:
   - Inspect the corresponding record in Staging MongoDB (`Task.findById(...)`).
   - **Verification**: The `publicId` remains identical (`tasks/attachment_123`). The rename operation changes only the Cloudinary storage delivery type (`type: "upload"` to `type: "authenticated"`), preserving references across all application queries.

---

### Stage 7: Full Staging Migration (Only After Sample Passes)

Once the sample passes all Stage 6 checks, execute the full migration for remaining staging assets:

* **Request**:
  ```bash
  curl -s -X POST https://staging.manageo.axiomixs.com/api/migrate-assets \
    -H "Content-Type: application/json" \
    -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>" \
    -d '{
      "mode": "all",
      "dryRun": false,
      "confirmMutation": true,
      "confirmAll": true
    }'
  ```
* **Safety Invariant**: Omitting `confirmAll: true` will fail with `400 Bad Request`.

---

### Stage 8: Failure Handling & Safe Rollback Procedure

If unexpected errors occur during migration (e.g., rate limits, network interruptions, or asset access failures):

1. **Safe Retry Capability**:
   - The migration logic is fully idempotent. Assets already converted to `type: "authenticated"` are reported as `already_secured` and skipped without redundant API calls.
2. **Rollback Individual Assets (if necessary)**:
   - To revert a migrated asset back to public upload mode on Cloudinary, an administrator can use the Cloudinary Admin API:
     ```bash
     curl -X POST "https://api.cloudinary.com/v1_1/<CLOUDINARY_CLOUD_NAME>/resources/image/authenticated/tasks%2Fattachment_123" \
       -u "<API_KEY>:<API_SECRET>" \
       -d "to_type=upload"
     ```
3. **Emergency Application Rollback**:
   - Revert application traffic to the previous deployment build.
   - Database schemas do not require rollback since `publicId` strings are preserved unchanged throughout migration.

---

## 5. Prerequisites Checklist & Remaining Manual Actions

The codebase is verified and ready. The following external infrastructure tasks must be completed before staging deployment:

- [ ] **Action 1 (Operator)**: Register a dedicated Staging Cloudinary account or provision an isolated Product Environment.
- [ ] **Action 2 (Operator)**: Provision an isolated Staging MongoDB Atlas database cluster with network IP whitelisting.
- [ ] **Action 3 (Operator)**: Configure staging environment variables on the staging host, ensuring `APPROVED_STAGING_CLOUD_NAME` matches the new staging cloud name.
- [ ] **Action 4 (Operator)**: Deploy the tested build and provision the staging Platform Admin account.
- [ ] **Action 5 (Operator)**: Run the Stage 4 inventory scan and Stage 5 sample migration.
- [ ] **Action 6 (Operator)**: Execute the 4-point security and delivery verification on migrated sample assets.

Until Actions 1 through 6 are completed on live external staging resources, the deployment status remains:

**VERDICT: `BLOCKED BY INFRASTRUCTURE`**
