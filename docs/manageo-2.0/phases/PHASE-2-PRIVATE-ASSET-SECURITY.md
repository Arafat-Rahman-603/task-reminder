# PHASE 2 — Private Asset Security

**Status:** COMPLETED

## Objective
Audit Cloudinary and existing asset delivery to ensure sensitive assets are protected.

## Scope and Exclusions
Includes uploads and delivery for Vault, Transactions, Accounts, attachments, invoices.
Excludes truly public marketing assets.

## Tasks
- [x] Identify upload and delivery paths for attachments.
- [x] Determine whether current assets are publicly retrievable.
- [x] Implement access-controlled upload (`type: 'authenticated'`).
- [x] Implement authenticated delivery (signed URLs via API route).
- [x] Authenticate users and verify resource ownership before serving sensitive assets.
- [x] Prevent unauthorized access through guessed public IDs.
- [x] Create a safe, idempotent asset migration utility (dry-run mode, inventory, rollback).
- [x] Add tests for authorized and unauthorized asset access.

## Acceptance Criteria
- [x] Signed URL generation requires session auth.
- [x] Attachments UI uses the signed route instead of raw URLs.
- [x] Unauthorized users cannot access raw assets.
