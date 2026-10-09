<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Application Status & Routes

## Public Routes
- / (Landing Page)
- /features (Features Overview)
- /pricing (Pricing Info)
- /security (Security Overview)
- /about (About Us)
- /faq (Frequently Asked Questions)

## Legal Pages
- /terms (Terms of Service)
- /privacy (Privacy Policy)
- /cookies (Cookie Policy)
- /financial-disclaimer (Financial Disclaimer)
- /acceptable-use (Acceptable Use Policy)
- /contact (Contact Form)

## Auth & Support Pages
- /login
- /register
- /forgot-password
- /reset-password
- /verify-email (If configured)

## Cookie Behavior
- Only essential cookies (NextAuth authentication, session state) are used.
- No analytics or tracking cookies are currently implemented.

## SEO Structure
- Marketing pages use static metadata headers for SEO.
- A sitemap/robots.txt can be served dynamically if needed.

## Manual Review Needed
- Legal pages (Terms, Privacy, Cookies, Disclaimer, Acceptable Use) are templates based on common practices. They REQUIRE review by legal counsel before public launch.
- Pricing page currently displays a placeholder 'Free' early access message.

## Architecture & Implementation Notes

### Attachment System
- **Unified Upload Component**: Manageo uses a unified `AttachmentUpload.tsx` component across all models (Tasks, Notes, Ideas, Transactions, Custom Sections, Vault) for Cloudinary image and document uploads.
- **Data Structure**: Attachments are stored as arrays of objects: `[{ url, publicId, resourceType, originalFilename }]`.
- **Backend Cleanup**: Whenever records are updated (with attachments removed) or deleted, server actions invoke `deleteAttachments` (and `deleteImage` for legacy fields) to persist Cloudinary storage synchronization and prevent orphaned files.

### Security / Vault Module
- The Vault module supports both a global Vault password and isolated Custom Passwords for specific items. 
- Encryption logic utilizes AES-256-GCM. 
- Custom Passwords can be reset via email OTP if forgotten.
- Ensure any modifications to Vault schemas or auth logic preserve strict data ownership and lock-out mechanisms.

## Phase 1 Implementation Notes

- **Workspace and WorkspaceMembership models** have been introduced to support team collaboration.
- **Migration Strategy:** The application uses a hybrid/dual-write strategy for Phase 1. All newly provisioned and migrated collaborative records contain BOTH \userId\ (legacy ownership) and \workspaceId\ (new tenant isolation).
- **Personal Workspace Invariant:** Every user is guaranteed a "personal" Workspace. Registration automatically provisions one.
- **Strict User Privacy:** Financial schemas (Transaction, Account, etc.) and VaultItem are strictly excluded from workspace scoping. They remain rigidly bound to userId.
- **Authorization Utility:** src/lib/workspace.ts exports erifyWorkspaceAccess which acts as the mandatory server-side gatekeeper for all Workspace-scoped operations.

## Phase 1.1 Documentation

**TaskHistory & RoutineHistory Ownership Model:**
- Both \TaskHistory\ and \RoutineHistory\ represent immutable logs of user actions.
- They are strictly owned by \userId\ indicating *who* performed the action.
- In a later phase, to allow authorized team users to view shared activity history, these models will be queried via their parent entity (\	askId\ or \outineId\). When a team member queries \TaskHistory\ for a task in a shared workspace, the server will first verify their \iewer\ access to the \workspaceId\ of the parent \Task\, and then return all history records for that \	askId\ regardless of the \userId\ on the history record.

## Phase 2 Implementation Notes

### Cloudinary Asset Privacy
- **Authenticated Uploads:** All uploads (AttachmentUpload) set 	ype: "authenticated" by default to ensure assets are private in Cloudinary.
- **Signed URL Delivery:** The frontend does not use raw Cloudinary URLs directly. Instead, it routes them through the /api/assets/[...publicId] endpoint which authenticates the user and generates a short-lived (1 hour) signed URL.

### Team Workspaces & Invitations
- **Tenancy Switcher:** The WorkspaceSwitcher modifies a server-side ctiveWorkspaceId cookie. All data fetches must utilize getActiveWorkspaceInfo() to determine the current tenant context.
- **Invitations:** Team admins can generate WorkspaceInvitation documents which contain a secure token hash. Users accepting this token via the /invite/[token] route are granted a WorkspaceMembership to that workspace.


## Phase 5 Implementation Notes
- Workflows and notifications use the central \Notification\ model with enum types for events.
- Team activities emit notifications targeted at specific users based on their context.

## Phase 6 Implementation Notes
- Subscriptions and platform admin UI added.
- Admin UI lives at \/admin\ and requires \isPlatformAdmin\ flag on User model.
- Upgrades are manually requested and approved via \/api/upgrade-request\ and \/admin\.

## Phase 7 Implementation Notes
- Transaction-linked invoices added.
- Immutable sequence numbers generated via the \Counter\ model.
- Public verification payload available at \/api/invoices/verify/[token]\.

