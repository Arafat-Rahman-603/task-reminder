import { formatBytes } from "@/lib/formatBytes";
import { PLAN_LIMITS } from "@/config/plans";
import { SYSTEM_MODULES } from "@/config/modules";
import Document from "@/models/Document";

describe("Documents & 5 GB Cloud Storage Module", () => {
  describe("Plan Storage Limits", () => {
    it("allocates exactly 100 MB to the Free / Starter plan", () => {
      expect(PLAN_LIMITS.free.maxStorageBytes).toBe(100 * 1024 * 1024);
      expect(PLAN_LIMITS.free.featureLabels).toContain("100 MB Cloud Storage");
    });

    it("allocates exactly 5 GB to the Professional (Pro) plan", () => {
      expect(PLAN_LIMITS.pro.maxStorageBytes).toBe(5 * 1024 * 1024 * 1024);
      expect(PLAN_LIMITS.pro.featureLabels).toContain("5 GB Cloud Document & Asset Storage");
    });

    it("allocates exactly 50 GB to the Enterprise plan", () => {
      expect(PLAN_LIMITS.enterprise.maxStorageBytes).toBe(50 * 1024 * 1024 * 1024);
    });
  });

  describe("FormatBytes Helper", () => {
    it("formats 0 bytes as 0 B", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("formats kilobytes correctly", () => {
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(2048)).toBe("2 KB");
    });

    it("formats megabytes correctly", () => {
      expect(formatBytes(100 * 1024 * 1024)).toBe("100 MB");
      expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });

    it("formats gigabytes correctly", () => {
      expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe("5 GB");
      expect(formatBytes(50 * 1024 * 1024 * 1024)).toBe("50 GB");
    });
  });

  describe("System Module Configuration", () => {
    it("has documents module enabled and marked as implemented", () => {
      const docMod = SYSTEM_MODULES.documents;
      expect(docMod).toBeDefined();
      expect(docMod.implemented).toBe(true);
      expect(docMod.defaultEnabled).toBe(true);
      expect(docMod.route).toBe("/dashboard/documents");
      expect(docMod.label).toBe("Documents");
    });
  });

  describe("Document Model Definition", () => {
    it("exports Document model with schema definition", () => {
      expect(Document).toBeDefined();
      expect(Document.schema.path("userId")).toBeDefined();
      expect(Document.schema.path("title")).toBeDefined();
      expect(Document.schema.path("fileUrl")).toBeDefined();
      expect(Document.schema.path("sizeBytes")).toBeDefined();
      expect(Document.schema.path("category")).toBeDefined();
      expect(Document.schema.path("publicId")).toBeDefined();
    });
  });

  describe("Storage Quota Calculation Logic", () => {
    it("calculates percentage correctly for Pro plan", () => {
      const proMax = PLAN_LIMITS.pro.maxStorageBytes; // 5 GB
      const usedBytes = 2.5 * 1024 * 1024 * 1024; // 2.5 GB
      const percentUsed = Math.min(100, Math.round((usedBytes / proMax) * 1000) / 10);
      expect(percentUsed).toBe(50);
    });

    it("detects when a file upload would exceed the quota", () => {
      const starterMax = PLAN_LIMITS.free.maxStorageBytes; // 100 MB
      const currentUsed = 95 * 1024 * 1024; // 95 MB
      const newFileSize = 10 * 1024 * 1024; // 10 MB file
      const wouldExceed = currentUsed + newFileSize > starterMax;
      expect(wouldExceed).toBe(true);
    });
  });
});
