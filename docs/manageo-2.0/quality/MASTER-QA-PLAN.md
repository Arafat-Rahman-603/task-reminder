# Manageo 2.0 - Master QA Plan

## Objective
To ensure Manageo 2.0 reaches a verified, release-ready state by executing a strict, evidence-based quality assurance loop across all features, integrations, and environments.

## Scope
The QA process is broken down into 8 structured phases. Each phase requires actual manual and automated testing, bug fixing, and re-testing until the acceptance criteria are met.

### Phase 1: Inventory & Initial Smoke Test
- **Goal:** Catalog all application pages, features, and settings. Ensure every route renders without crashing.
- **Tasks:**
  - Build `PAGE-AND-FEATURE-INVENTORY.md`
  - Verify zero 500 errors on load for all pages.
  - Review basic responsiveness.

### Phase 2: Functional Depth & UI Validation
- **Goal:** Validate core CRUD operations for all entities (Tasks, Routines, Notes, Ideas, Money, Vault).
- **Tasks:**
  - Test form submissions, validations, and edge cases.
  - Ensure correct state updates and optimistic UI changes.
  - Test complex nested functionality (e.g., repeating routines).

### Phase 3: Navigation, Layout & Accessibility
- **Goal:** Ensure flawless routing, responsive design across viewports, and baseline accessibility.
- **Tasks:**
  - Test all navigation links.
  - Validate mobile, tablet, and desktop layouts.
  - Check keyboard navigation and ARIA roles (baseline).

### Phase 4: Notifications & Email Flows
- **Goal:** Verify internal notifications and external email integrations.
- **Tasks:**
  - Trigger and verify app notifications (task reminders, invitations).
  - Validate email template rendering and delivery.

### Phase 5: Workspaces & Collaboration
- **Goal:** Validate tenant isolation and role-based access control (RBAC).
- **Tasks:**
  - Test Workspace switching.
  - Test invitations and role assignments (Admin, Member, Viewer).
  - Verify that private entities (Vault, Money) remain isolated from Workspaces.

### Phase 6: Admin, Subscriptions & Limits
- **Goal:** Verify platform administration and subscription limits.
- **Tasks:**
  - Test `/admin` dashboard.
  - Test subscription upgrade requests and approvals.
  - Validate usage limits (e.g., max tasks per plan).

### Phase 7: Cloudinary Asset Integration & Edge Cases
- **Goal:** Secure and test attachment uploads and privacy.
- **Tasks:**
  - Test unified `AttachmentUpload.tsx`.
  - Verify that Cloudinary assets are private and require signed URLs.
  - Test orphaned asset cleanup on record deletion.

### Phase 8: Security, Optimization & Final Review
- **Goal:** Final polish, SEO audit, security checks, and performance optimizations.
- **Tasks:**
  - Verify static metadata and SEO headers for marketing pages.
  - Run Core Web Vitals checks.
  - Ensure strict data sanitization and authorization boundaries.
