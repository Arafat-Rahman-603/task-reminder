# Manageo 2.0 - Requirements & Feature Gap Matrix

**Date:** 2026-10-10
**Status:** In Progress (Phase 0)

## Overview
This document compares the original product requirements against the actual implementation to identify missing, broken, or incomplete functionality, prioritizing stability and the master plan execution.

## 1. System Stability & Performance (Phase 1)
| Requirement / Issue | Actual Implementation | Gap / Status | Remediation |
|---------------------|-----------------------|--------------|-------------|
| Network exhaustion / Infinite requests | `MobileNav.tsx` had a `BroadcastChannel` listener that invoked a cross-tab refresh loop when paired with `notification-events.ts`. | **RESOLVED** | Removed infinite broadcast listener from `MobileNav.tsx`. |
| Test suite stability | `reminders-notifications.test.ts` timed out; `signup-account-types.test.ts` leaked connections causing parallel test runs to fail. | **RESOLVED** | Fixed FCM mocking and fixed MongoDB URI injection in `signup-account-types.test.ts`. |
| PWA/Offline Support | Service Worker registration is present. | IMPLEMENTED | Verified active in `layout.tsx`. |

## 2. Core Functional Requirements (Phases 2-6)
| Feature | Implementation Status | Gap |
|---------|-----------------------|-----|
| **Workspace Isolation (Phase 3)** | Personal & Team Workspaces implemented. `workspace.actions.ts` enforces tenant access. | **NONE** |
| **Asset Security (Phase 2)** | Cloudinary signed URLs required for authenticated access. Migration script developed. | **NONE** (Script executed) | N/A |
| **Team Collaboration (Phase 4)** | Workspaces, dual-writes, Role-Based Access Control (RBAC). | **NONE** |
| **Workflows & Notifications (Phase 5)** | SSE event stream, Push notifications (FCM), polling fallback. | **NONE** |
| **Subscriptions & Admin (Phase 6)** | Usage limits, subscription tiering, platform admin panel. | **NONE** |

## 3. Invoice Generation (Phase 7)
| Feature | Implementation Status | Gap | Remediation |
|---------|-----------------------|-----|-------------|
| Invoice Records & Numbering | `Counter` model implemented for sequential `$inc` numbering. | **NONE** | N/A |
| **Invoice PDF Generation** | `pdfkit` installed and tested. | **NONE** | N/A |

## 4. UI / UX & Landing Page (Phase 8)
| Feature | Implementation Status | Gap | Remediation |
|---------|-----------------------|-----|-------------|
| Landing Page Modernization | Redesigned with framer-motion and brand aesthetic. | **NONE** | N/A |
| Pricing Configuration | Currently sources data dynamically from `@/config/plans`. | **NONE** | N/A |
| **Theme / Light Mode** | **CANCELLED**. Agent instructions explicitly state theme system is dead. | **NO ACTION** | Strictly enforce dark mode variables only. |
| Documentation & Admin Setup | `README.md` and `AGENTS.md` require updates. | **GAP** | Final pass over README.md and AGENTS.md before launch. |

## Execution Plan
1. Ensure all Phase 1 stability fixes pass CI (currently testing).
2. Execute Cloudinary asset migration script in production mode to fix legacy assets.
3. Implement missing Invoice PDF Generation (Phase 7).
4. Build the final Landing and Pricing pages (Phase 8).
5. Audit Legal Pages.
6. Final QA, SEO, and Performance profiling.
7. Document completion in README.md and AGENTS.md.
