# Manageo 2.0 Master Plan

## Objective and Architectural Constraints
Evolve Manageo into a complete Individual + Team Management SaaS with subscription plans, collaborative tasks, team routines, transaction-linked invoices, platform administration, and an improved landing page.
Constraints:
* Reuse the current Next.js, TypeScript, MongoDB/Mongoose, NextAuth, FCM, SSE, in-app notifications, Cloudinary, and scheduler architecture where appropriate.
* Preserve existing user data and current Individual functionality.
* Do not replace the existing application with a new architecture or introduce microservices without a demonstrated need.
* Security and workspace isolation are paramount. Private financial data must remain strictly user-scoped.

## Roadmap
1. [Phase 1: Foundation Stabilization](phases/PHASE-1-FOUNDATION-STABILIZATION.md)
2. [Phase 2: Private Asset Security](phases/PHASE-2-PRIVATE-ASSET-SECURITY.md)
3. [Phase 3: Workspace UX and Invitations](phases/PHASE-3-WORKSPACE-UX-AND-INVITATIONS.md)
4. [Phase 4: Team Collaboration](phases/PHASE-4-TEAM-COLLABORATION.md)
5. [Phase 5: Workflows and Notifications](phases/PHASE-5-WORKFLOWS-AND-NOTIFICATIONS.md)
6. [Phase 6: Subscriptions and Platform Admin](phases/PHASE-6-SUBSCRIPTIONS-AND-PLATFORM-ADMIN.md)
7. [Phase 7: Invoices](phases/PHASE-7-INVOICES.md)
8. [Phase 8: Landing Page and Final Hardening](phases/PHASE-8-LANDING-PAGE-AND-FINAL-HARDENING.md)

## Current Status
**Current Phase:** Phase 1 (Evaluating existing implementation)
**Current Task:** Audit every collaborative write path and ensure dual-write and Personal Workspace fallback are safe.

## Completion Criteria for Each Phase
Refer to individual phase files for their specific completion criteria. A phase is only considered complete when all its criteria are satisfied, tested, and verifiable.

## Known Blockers and Important Security Requirements
* Do not expose private financial records, Vault data, secrets, push tokens, or environment values.
* Preserve strict userId ownership for private entities.
* Validate all tenant operations against workspaceId on the server.

