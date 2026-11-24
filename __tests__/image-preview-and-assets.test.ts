import {
  stripUrlParams,
  normalizeAssetResourceType,
  isImageAsset,
  buildAssetProxyUrl,
  resolveUserAvatarUrl,
} from "@/lib/media-utils";
import { detectPreviewFileType } from "@/components/ui/FilePreviewModal";

describe("Media Utilities & File Preview Type Detection", () => {
  it("strips query params and hash fragments cleanly", () => {
    expect(stripUrlParams("/api/assets/folder/photo.png?resourceType=image#top")).toBe(
      "/api/assets/folder/photo.png"
    );
    expect(stripUrlParams("https://res.cloudinary.com/demo/doc.pdf?t=123")).toBe(
      "https://res.cloudinary.com/demo/doc.pdf"
    );
    expect(stripUrlParams(null)).toBe("");
  });

  it("normalizes 'auto' and infers Cloudinary delivery resource types", () => {
    expect(normalizeAssetResourceType("auto", "avatar.webp")).toBe("image");
    expect(normalizeAssetResourceType("auto", "report.pdf")).toBe("image");
    expect(normalizeAssetResourceType("auto", "meeting.mp4")).toBe("video");
    expect(normalizeAssetResourceType("auto", "notes.docx")).toBe("raw");
    expect(normalizeAssetResourceType(undefined, undefined, "application/pdf")).toBe("image");
    expect(normalizeAssetResourceType(undefined, undefined, "text/csv")).toBe("raw");
  });

  it("identifies image assets vs PDFs correctly", () => {
    expect(isImageAsset({ originalFilename: "receipt.jpg?v=2" })).toBe(true);
    expect(isImageAsset({ mimeType: "image/png" })).toBe(true);
    expect(isImageAsset({ resourceType: "image", mimeType: "application/pdf", originalFilename: "invoice.pdf" })).toBe(true);
    expect(isImageAsset({ mimeType: "application/pdf", originalFilename: "invoice.pdf" })).toBe(false);
    expect(isImageAsset({ originalFilename: "contract.docx" })).toBe(false);
  });

  it("builds encoded proxy URLs with explicit resourceType and falls back when publicId is absent", () => {
    expect(
      buildAssetProxyUrl("manageo/tasks/file name.png", "https://fallback.example/a.png", {
        resourceType: "auto",
      })
    ).toBe("/api/assets/manageo/tasks/file%20name.png?resourceType=image");

    expect(buildAssetProxyUrl(null, "https://fallback.example/a.png")).toBe(
      "https://fallback.example/a.png"
    );
  });

  it("prioritizes avatarPublicId proxy over stale unauthenticated avatarUrl", () => {
    expect(
      resolveUserAvatarUrl({
        avatarPublicId: "avatars/user-1",
        avatarUrl: "https://res.cloudinary.com/demo/image/authenticated/s--bad--/avatars/user-1.png",
      })
    ).toBe("/api/assets/avatars/user-1?resourceType=image");

    expect(
      resolveUserAvatarUrl({
        avatarUrl: "https://lh3.googleusercontent.com/a/photo",
      })
    ).toBe("https://lh3.googleusercontent.com/a/photo");

    expect(resolveUserAvatarUrl(null)).toBeNull();
  });

  it("detects preview file types across signed URLs with query strings", () => {
    expect(
      detectPreviewFileType({
        title: "Banner",
        url: "/api/assets/manageo/banner.png?resourceType=image",
      })
    ).toBe("image");

    expect(
      detectPreviewFileType({
        title: "Invoice",
        url: "https://res.cloudinary.com/demo/image/authenticated/v1/invoice.pdf?token=abc",
        mimeType: "application/pdf",
      })
    ).toBe("pdf");

    expect(
      detectPreviewFileType({
        title: "Demo",
        url: "/api/assets/demo.mp4?resourceType=video",
      })
    ).toBe("video");

    expect(
      detectPreviewFileType({
        title: "Voice Note",
        url: "/api/assets/voice.mp3",
      })
    ).toBe("audio");
  });
});
