# Manageo 2.0 Staging Deployment Checklist

This document details the checklist and testing procedures for deploying Manageo 2.0 to the staging environment. This is a critical step prior to production rollout, ensuring that isolated environment configurations, database setups, and Cloudinary security policies act correctly in a realistic deployment.

## 1. Prerequisites and Environment Setup

### 1.1 Infrastructure Verification
- [ ] Review detailed infrastructure requirements in [STAGING-INFRASTRUCTURE-SETUP.md](./STAGING-INFRASTRUCTURE-SETUP.md).
- [ ] Ensure Staging Database is isolated (e.g. `cluster-staging.mongodb.net/manageo-staging`).
- [ ] Ensure Staging Cloudinary Environment is an isolated cloud name (e.g. `manageo-staging`), preventing accidental overlap or contamination with the production Cloudinary space (`exgn3nrd`).
- [ ] (Optional) Staging Redis URL configured for rate-limiting, if applicable.

### 1.2 Required Environment Variables
Ensure the following variables are populated in the staging environment before build/start:
- `NEXT_PUBLIC_APP_URL`
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `APPROVED_STAGING_CLOUD_NAME` (Must exactly match `CLOUDINARY_CLOUD_NAME`; never `exgn3nrd`)

### 1.3 Database Preparation
- [ ] Verify database indexes using the Mongoose models (especially unique indexes on Users, and partial indexes on Tenancy-scoped collections).

## 2. Build and Verification Commands

Run these locally or in the staging CI/CD pipeline to verify codebase integrity before deploying:
- [ ] **Type-checking**: `npm run type-check` (or `npx tsc --noEmit`)
- [ ] **Linting**: `npm run lint`
- [ ] **Testing**: `npm test`
- [ ] **Build**: `npm run build`

## 3. Post-Deployment Smoke Tests (Staging Environment)

Once the application is up in staging, execute these functional tests:

### 3.1 Authentication & Registration
- [ ] Register a new user account.
- [ ] Verify automatic Personal Workspace creation during signup.
- [ ] Logout and Login successfully with the new credentials.

### 3.2 Tenancy & Workspaces
- [ ] Create a new Team Workspace.
- [ ] Generate an invite link.
- [ ] In an incognito window, sign up via the invite link.
- [ ] Verify both users are members of the Workspace.
- [ ] Switch contexts using the Workspace Switcher; verify that tasks/notes fetched belong exclusively to the active workspace.
- [ ] Revoke membership and ensure the kicked user loses access.

### 3.3 Privacy & Personal Models
- [ ] (Money) Create a financial Account and Transaction. Ensure these records do not leak into the Team Workspace context.
- [ ] (Vault) Create an encrypted Vault item. Switch workspaces and confirm Vault items remain restricted to the personal user.

### 3.4 Invoices & Verification
- [ ] Generate an invoice from a financial transaction.
- [ ] Request the invoice PDF and ensure a valid PDF is delivered securely via Cloudinary's signed URLs.
- [ ] Verify idempotency: requesting the PDF again does not create a duplicate on Cloudinary.
- [ ] Access the QR public verification URL. Verify it shows the public, minimized payload without requiring authentication.

### 3.5 Cloudinary Private-Asset Verification
- [ ] Complete the Cloudinary assets sample migration using the protected Admin API.
  - **Endpoint**: `POST /api/migrate-assets`
  - **Authorization**: Requires Platform Admin session (`isPlatformAdmin: true`). Unauthenticated requests return `401`, non-admin returns `403`.
  - **Environment Safety Gate**: Requires `CLOUDINARY_CLOUD_NAME` to match the approved staging target (`manageo-staging` or containing `staging`). Requests targeting demo or production environments return `403`.
  - **Route Parameters (`POST /api/migrate-assets`)**:
    - `mode` (string, required): Explicit operation mode. Must be `"sample"` for bounded sample migration or `"all"` for full migration. Never silently falls back to migrating all assets.
    - `publicIds` (string[], required when `mode: "sample"`): Bounded allowlist of asset public IDs (`1` to `50` items). Every ID is strictly validated against the actual Staging database inventory (`Task`, `Note`, `Idea`, `CustomRecord`, `VaultItem`, `Transaction`, `User`, `Invoice`). If any ID is missing from the database, the request fails with `400 Bad Request` and returns `invalidIds`.
    - `dryRun` (boolean, optional, defaults to `true`): Safe simulation. Verifies Cloudinary asset presence and reports what would be migrated without mutating Cloudinary.
    - `confirmMutation` (boolean, required when `dryRun: false`): Explicit mutation intent. Prevents accidental execution. If `dryRun: false` is submitted without `confirmMutation: true`, the request fails with `400 Bad Request`.
    - `confirmAll` (boolean, required when `mode: "all"`): Explicit full migration confirmation.
  
  - **Step 1: Inventory Scan (Read-Only)**
    ```bash
    curl -X GET https://staging.manageo.axiomixs.com/api/migrate-assets \
      -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>"
    ```

  - **Step 2: Sample Migration Dry-Run (Safe Inspection)**
    ```bash
    curl -X POST https://staging.manageo.axiomixs.com/api/migrate-assets \
      -H "Content-Type: application/json" \
      -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>" \
      -d '{
        "mode": "sample",
        "publicIds": [
          "sample_task_attachment_id",
          "sample_vault_image_id"
        ],
        "dryRun": true
      }'
    ```

  - **Step 3: Sample Migration Execution (Bounded Mutation)**
    ```bash
    curl -X POST https://staging.manageo.axiomixs.com/api/migrate-assets \
      -H "Content-Type: application/json" \
      -H "Cookie: next-auth.session-token=<STAGING_ADMIN_SESSION_TOKEN>" \
      -d '{
        "mode": "sample",
        "publicIds": [
          "sample_task_attachment_id",
          "sample_vault_image_id"
        ],
        "dryRun": false,
        "confirmMutation": true
      }'
    ```
- [ ] Upload an image attachment to a task or note.
- [ ] Verify the image was uploaded with `type: "authenticated"`.
- [ ] Attempt to access the raw Cloudinary URL without a signature. Ensure Cloudinary responds with `HTTP 401 Unauthorized`.
- [ ] Inspect the UI for previously uploaded public assets in all contexts:
  - User profile avatars (`avatarUrl` vs `avatarPublicId`)
  - Transaction receipts (`receiptUrl` vs `receiptPublicId`)
  - Vault Item attachments and legacy images (`imageUrl` vs `imageId`)
  - Custom Record attachments stored in the dynamic `data` Map.
- [ ] Ensure that ALL of these UI components now render the assets through the `/api/assets/[...publicId]` authenticated endpoint rather than directly using a stale raw URL.

## 4. Test Results & Overall Staging Verdict

- **Overall Verdict**: **BLOCKED BY INFRASTRUCTURE**
  - *Reason*: Live testing on staging infrastructure cannot proceed until dedicated Staging MongoDB and Cloudinary (`manageo-staging`) clusters are fully provisioned and accessible.
- **Automated Test Results (2026-10-10)**:
  - `__tests__/migrate-assets.test.ts`: **22/22 PASSED**
    - Platform admin authorization enforcement (401 / 403)
    - Wrong-environment rejection (demo / production / unconfigured cloud names rejected with 403)
    - Explicit production account `exgn3nrd` rejection (403)
    - Configured cloud name vs explicit `APPROVED_STAGING_CLOUD_NAME` mismatch rejection (403)
    - Bounded sample allowlist validation (missing mode, empty list, > 50 items, invalid types, and non-existent DB IDs rejected with 400)
    - Dry-run immutability (verifies `cloudinary.uploader.rename` is NEVER called when `dryRun: true` or omitted)
    - Explicit mutation intent requirement (`dryRun: false` without `confirmMutation: true` rejected with 400)
    - Cloudinary error categorization (distinguishes 401 Auth errors, 429 Rate limits, ETIMEDOUT Network errors from genuine 404 missing assets)
    - Partial migration failure handling and safe retries / idempotency
    - Multi-resource type support (`image`, `video`, `raw`)
    - Read-only inventory GET scan
  - `__tests__/assets-proxy.test.ts`: **PASSED** (Signed URL delivery via authenticated proxy)
  - `__tests__/invoice-pdf.test.ts`: **PASSED** (Invoice PDF generation and signed URL delivery)

## 5. Rollback Instructions

If staging verification fails critically:
1. Revert to the previous application deployment version.
2. If database schema conflicts occurred, restore the pre-deployment database backup.
3. Mark `docs/manageo-2.0/STAGING-DEPLOYMENT-CHECKLIST.md` as FAILED and document the precise error logs.

## 6. Distinction: Staging vs Production

- **Staging** uses isolated Cloudinary and MongoDB resources. Dummy data generated here must never impact production.
- **Production** migration of Cloudinary assets (`POST /api/migrate-assets`) is a one-way security operation. It must ONLY be run after staging passes this entire checklist.

