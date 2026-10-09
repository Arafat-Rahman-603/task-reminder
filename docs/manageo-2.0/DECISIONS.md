# Decisions

## Workspace Isolation Strategy
**Decision:** Collaborative data models (Task, Note, Idea, Routine, CustomSection) will use a hybrid dual-write strategy during Phase 1 migration. They will store both `userId` and `workspaceId`. Financial and Vault data remain strictly `userId`.
**Rationale:** Prevents breaking existing legacy queries while moving towards tenant-based isolation.

## Cloudinary Security
**Decision:** Upload attachments with `type: "authenticated"` and deliver them via signed URLs using a Next.js API route (`/api/assets/[...publicId]`).
**Rationale:** Ensures private files are not accessible to the public internet without authentication, maintaining security for sensitive documents.
