# PHASE 1 — Foundation Stabilization

**Status:** COMPLETED

## Objective
Audit and stabilize the existing Phase 1 implementation.

## Scope and Exclusions
Includes collaborative models: Tasks, Notes, NoteGroup, Ideas, Routines, CustomSection, CustomRecord.
Excludes private financial data and Vault models.

## Tasks
- [x] Verify Workspace and WorkspaceMembership schemas.
- [x] Verify actual MongoDB indexes for workspace scoping.
- [x] Verify unique Personal Workspace provisioning handles concurrency safely.
- [x] Audit every collaborative write path (document saves, query updates, upserts, background jobs, bulk writes).
- [x] Ensure missing workspace provisioning causes safe recovery or explicit failure.
- [x] Preserve legacy `userId` compatibility during the transition.
- [x] Validate migration coverage, idempotency, orphan detection, and integrity reporting.
- [x] Run/Add authorization, concurrency, migration, and regression tests.
- [x] Document verified migration and rollback procedure.

## Expected Files to Change
* Models and controllers for collaborative entities.
* `src/lib/workspace.ts`
* Migration scripts.

## Migration Procedure
1. Define the migration logic in an API route (e.g., `/api/migrate-workspaces`).
2. The script first iterates over all users and ensures they have a `Workspace` of type `personal` and a corresponding `WorkspaceMembership` where they are the `owner`.
3. It then queries all collaborative records (`Task`, `Note`, `Idea`, `Routine`, `CustomSection`, etc.) where `workspaceId` is missing (`$exists: false`).
4. For each legacy record, it looks up the user's personal workspace and uses `.updateOne()` to strictly append the `workspaceId` field without triggering strict Mongoose validations on the rest of the legacy document.
5. This script is fully idempotent. Re-running it will skip already migrated documents.

## Rollback Procedure
Since we are using dual-write and preserving the `userId` field, rolling back is simply reverting the application code. Legacy paths will still rely on `userId`. No data needs to be deleted unless explicitly desired (e.g., dropping the `workspaceId` index).

## Security and Data-Integrity Requirements
* Do not alter the ownership of private financial or Vault data.
* Personal Workspace provisioning must be safe to retry.

## Tests Required
* Legacy individual tests.
* Workspace-scoped write tests.
* Concurrent provisioning tests.

## Acceptance Criteria
- [x] Existing Individual functionality remains intact.
- [x] Personal Workspace provisioning is safe to retry.
- [x] Required indexes exist or have a verified safe migration procedure.
- [x] Every relevant collaborative write path has an explicit, tested workspace ownership strategy.
- [x] Legacy regression tests pass.
- [x] Migration and rollback risks are documented honestly.
