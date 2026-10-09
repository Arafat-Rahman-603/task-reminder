# Manageo 2.0 Staging Deployment Checklist

This document details the checklist and testing procedures for deploying Manageo 2.0 to the staging environment. This is a critical step prior to production rollout, ensuring that isolated environment configurations, database setups, and Cloudinary security policies act correctly in a realistic deployment.

## 1. Prerequisites and Environment Setup

### 1.1 Infrastructure Verification
- [ ] Ensure Staging Database is isolated (e.g. `cluster-staging.mongodb.net`).
- [ ] Ensure Staging Cloudinary Environment is an isolated cloud name (e.g. `manageo-staging`), preventing accidental overlap or contamination with the production Cloudinary space.
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
- [ ] Complete the Cloudinary assets migration using the protected Admin API.
  - Action: Execute `POST /api/migrate-assets` with an admin account.
- [ ] Upload an image attachment to a task or note.
- [ ] Verify the image was uploaded with `type: "authenticated"`.
- [ ] Attempt to access the raw Cloudinary URL without a signature. Ensure Cloudinary responds with `HTTP 401 Unauthorized`.
- [ ] Inspect the UI for previously uploaded public assets in all contexts:
  - User profile avatars (`avatarUrl` vs `avatarPublicId`)
  - Transaction receipts (`receiptUrl` vs `receiptPublicId`)
  - Vault Item attachments and legacy images (`imageUrl` vs `imageId`)
  - Custom Record attachments stored in the dynamic `data` Map.
- [ ] Ensure that ALL of these UI components now render the assets through the `/api/assets/[...publicId]` authenticated endpoint rather than directly using a stale raw URL.

## 4. Test Results (Update 2026-10-09)
- **Local / Staging Dry-Run Audit:** All frontend models (`User`, `Transaction`, `VaultItem`, `CustomRecord`, `Task`, `Note`, `Idea`) were audited for raw URL usage. UI components were successfully transitioned to utilize the signed-URL delivery via `publicId` fallbacks.
- **Migration API Fixes:** The `api/migrate-assets` route now correctly traverses nested arrays within `CustomRecord` data Maps, User `avatarPublicId`, and VaultItem `imageId`. 
- **Build & Tests:** The codebase was verified. All 27 tests pass (including edge-cases in `migrate-assets.test.ts`), and `next build` executed successfully without errors.

## 4. Rollback Instructions

If staging verification fails critically:
1. Revert to the previous application deployment version.
2. If database schema conflicts occurred, restore the pre-deployment database backup.
3. Mark `docs/manageo-2.0/STAGING-DEPLOYMENT-CHECKLIST.md` as FAILED and document the precise error logs.

## 5. Distinction: Staging vs Production

- **Staging** uses isolated Cloudinary and MongoDB resources. Dummy data generated here must never impact production.
- **Production** migration of Cloudinary assets (`POST /api/migrate-assets`) is a one-way security operation. It must ONLY be run after staging passes this entire checklist.
