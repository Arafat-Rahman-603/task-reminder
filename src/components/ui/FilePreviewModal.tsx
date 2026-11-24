"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileCode,
  Film,
  Music,
  Maximize2,
  Minimize2,
  Calendar,
  Tag,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";
import { stripUrlParams } from "@/lib/media-utils";

export interface PreviewableFile {
  title: string;
  url: string;
  fallbackUrl?: string;
  originalFilename?: string;
  mimeType?: string;
  resourceType?: string;
  sizeFormatted?: string;
  category?: string;
  createdAt?: string;
  notes?: string;
  tags?: string[];
}

export type DetectedPreviewType = "image" | "pdf" | "video" | "audio" | "text" | "other";

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export function detectPreviewFileType(file: PreviewableFile | null | undefined): DetectedPreviewType {
  if (!file) return "other";

  const extractQueryResourceType = (rawUrl?: string): string => {
    if (!rawUrl) return "";
    const qIndex = rawUrl.indexOf("?");
    if (qIndex === -1) return "";
    try {
      const params = new URLSearchParams(rawUrl.slice(qIndex + 1).split("#")[0]);
      return (params.get("resourceType") || "").toLowerCase();
    } catch {
      return "";
    }
  };

  const candidates = [
    stripUrlParams(file.originalFilename),
    stripUrlParams(file.fallbackUrl),
    stripUrlParams(file.url),
    stripUrlParams(file.title),
  ];

  const exts = candidates
    .map((c) => {
      const idx = c.lastIndexOf(".");
      return idx !== -1 ? c.slice(idx + 1).toLowerCase() : "";
    })
    .filter(Boolean);

  const mime = (file.mimeType || "").toLowerCase();
  const resType = (file.resourceType || extractQueryResourceType(file.url) || "").toLowerCase();

  if (mime === "application/pdf" || exts.includes("pdf")) {
    return "pdf";
  }

  if (
    resType === "image" ||
    mime.startsWith("image/") ||
    exts.some((ext) => ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif", "ico"].includes(ext))
  ) {
    return "image";
  }

  if (
    resType === "video" ||
    mime.startsWith("video/") ||
    exts.some((ext) => ["mp4", "webm", "mov", "mkv"].includes(ext))
  ) {
    return "video";
  }

  if (
    mime.startsWith("audio/") ||
    exts.some((ext) => ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext))
  ) {
    return "audio";
  }

  if (
    mime.startsWith("text/") ||
    exts.some((ext) =>
      ["txt", "md", "json", "csv", "log", "xml", "html", "js", "ts", "yml", "yaml"].includes(ext)
    )
  ) {
    return "text";
  }

  return "other";
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: PreviewableFile | null;
  files?: PreviewableFile[];
  initialIndex?: number;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
  files,
  initialIndex = 0,
}: FilePreviewModalProps) {
  const [galleryIndex, setGalleryIndex] = useState(initialIndex);
  const [zoomScale, setZoomScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [activeImgSrc, setActiveImgSrc] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const gallery = files && files.length > 0 ? files : file ? [file] : [];
  const safeIndex = gallery.length > 0 ? Math.min(Math.max(0, galleryIndex), gallery.length - 1) : 0;
  const activeFile = gallery[safeIndex] || file;

  // Render-phase reset when modal opens or file changes (avoids setState-in-effect warnings)
  const fileIdentity = `${isOpen}:${initialIndex}:${file?.url || ""}:${files?.length || 0}`;
  const [prevIdentity, setPrevIdentity] = useState(fileIdentity);
  if (fileIdentity !== prevIdentity) {
    setPrevIdentity(fileIdentity);
    setGalleryIndex(initialIndex);
    setZoomScale(1);
    setRotation(0);
    setImageLoaded(false);
    setImageError(false);
    setActiveImgSrc((files && files[initialIndex]?.url) || file?.url || "");
  }

  const activeUrlKey = activeFile?.url || "";
  const [prevActiveUrl, setPrevActiveUrl] = useState(activeUrlKey);
  if (activeUrlKey !== prevActiveUrl) {
    setPrevActiveUrl(activeUrlKey);
    setZoomScale(1);
    setRotation(0);
    setImageLoaded(false);
    setImageError(false);
    setActiveImgSrc(activeUrlKey);
  }

  const stepGallery = useCallback(
    (delta: number) => {
      if (gallery.length <= 1) return;
      setGalleryIndex((prev) => (prev + delta + gallery.length) % gallery.length);
    },
    [gallery.length]
  );

  const zoomIn = useCallback(() => {
    setZoomScale((curr) => {
      const next = ZOOM_LEVELS.find((z) => z > curr + 0.01);
      return next ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoomScale((curr) => {
      const prev = [...ZOOM_LEVELS].reverse().find((z) => z < curr - 0.01);
      return prev ?? ZOOM_LEVELS[0];
    });
  }, []);

  const fileType = React.useMemo(() => detectPreviewFileType(activeFile), [activeFile]);

  const handleClose = useCallback(() => {
    setIsFullscreen(false);
    onClose();
  }, [onClose]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!activeFile?.url || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(activeFile.url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = activeFile.originalFilename || activeFile.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(activeFile.fallbackUrl || activeFile.url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!activeFile?.url) return;
    const fullUrl = activeFile.url.startsWith("http")
      ? activeFile.url
      : window.location.origin + activeFile.url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft" && gallery.length > 1) {
        stepGallery(-1);
      } else if (e.key === "ArrowRight" && gallery.length > 1) {
        stepGallery(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, handleClose, gallery.length, stepGallery]);

  // Fetch text content if text file
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      if (ignore) return;
      if (isOpen && activeFile && fileType === "text") {
        setTextLoading(true);
        setTextContent(null);
        fetch(activeFile.url)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load text");
            return res.text();
          })
          .then((text) => {
            if (!ignore) setTextContent(text);
          })
          .catch(() => {
            if (!ignore) setTextContent("Unable to load text preview.");
          })
          .finally(() => {
            if (!ignore) setTextLoading(false);
          });
      } else {
        setTextContent(null);
        setTextLoading(false);
      }
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [isOpen, activeFile, fileType]);

  if (!isOpen || !activeFile) return null;

  const modalNode = (
    <div
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${activeFile.title}`}
      className={cn(
        "fixed inset-0 z-[120] flex items-center justify-center animate-in fade-in duration-200",
        isFullscreen ? "p-0 bg-black" : "p-2 sm:p-5 bg-black/80 backdrop-blur-md"
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex flex-col bg-stitch-surface overflow-hidden animate-in zoom-in-95 duration-200",
          isFullscreen
            ? "w-screen h-screen max-w-none rounded-none border-none shadow-none"
            : "w-full max-w-5xl h-[88dvh] rounded-2xl border border-outline-variant/60 shadow-2xl"
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-outline-variant/50 bg-surface-container-low/80 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stitch-primary/10 border border-stitch-primary/20 flex items-center justify-center text-stitch-primary shrink-0 aspect-square">
              {fileType === "image" ? (
                <ImageIcon className="w-4 h-4 shrink-0" />
              ) : fileType === "pdf" ? (
                <FileText className="w-4 h-4 shrink-0" />
              ) : fileType === "video" ? (
                <Film className="w-4 h-4 shrink-0" />
              ) : fileType === "audio" ? (
                <Music className="w-4 h-4 shrink-0" />
              ) : fileType === "text" ? (
                <FileCode className="w-4 h-4 shrink-0" />
              ) : (
                <FileText className="w-4 h-4 shrink-0" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                  {activeFile.title}
                </h3>
                {gallery.length > 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-mono text-[10px] shrink-0">
                    {safeIndex + 1} / {gallery.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-[11px] text-on-surface-variant">
                {activeFile.originalFilename && activeFile.originalFilename !== activeFile.title && (
                  <span className="font-mono truncate max-w-[120px] sm:max-w-[200px]">
                    {activeFile.originalFilename}
                  </span>
                )}
                {activeFile.sizeFormatted && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-[9px] sm:text-[10px]">
                    {activeFile.sizeFormatted}
                  </span>
                )}
                {activeFile.category && (
                  <span className="px-1.5 py-0.5 rounded bg-stitch-primary/15 text-stitch-primary text-[9px] sm:text-[10px] font-semibold">
                    {activeFile.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/50 shrink-0"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/50 shrink-0"
              title={copiedLink ? "Link Copied!" : "Copy Link"}
            >
              {copiedLink ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-stitch-primary/90 transition-colors shadow-sm disabled:opacity-60 shrink-0"
              title="Download File"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Download className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="hidden sm:inline">{isDownloading ? "Saving..." : "Download"}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 sm:p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors ml-0.5 shrink-0"
              title="Close Preview (Esc)"
              aria-label="Close Preview"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 bg-surface-container-lowest/95 relative overflow-hidden flex flex-col">
          {/* Gallery Prev / Next */}
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => stepGallery(-1)}
                aria-label="Previous attachment"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-stitch-surface/90 hover:bg-surface-container-high text-on-surface border border-outline-variant/60 shadow-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => stepGallery(1)}
                aria-label="Next attachment"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-stitch-surface/90 hover:bg-surface-container-high text-on-surface border border-outline-variant/60 shadow-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* IMAGE PREVIEW */}
          {fileType === "image" && (
            <div
              className="w-full h-full overflow-auto relative p-3 sm:p-5"
              onWheel={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  e.preventDefault();
                  if (e.deltaY < 0) zoomIn();
                  else zoomOut();
                }
              }}
            >
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Loader2 className="w-8 h-8 animate-spin text-stitch-primary" />
                </div>
              )}
              {imageError ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-6 space-y-3 bg-surface-container rounded-2xl border border-outline-variant/50 max-w-sm">
                    <AlertCircle className="w-10 h-10 text-error mx-auto opacity-80" />
                    <p className="text-xs text-on-surface-variant">Failed to load image preview.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setImageError(false);
                          setImageLoaded(false);
                          setActiveImgSrc(activeFile.url);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-variant transition-colors"
                      >
                        Retry
                      </button>
                      <a
                        href={activeFile.fallbackUrl || activeFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-stitch-primary hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Direct URL
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-full min-w-full flex">
                  <div className="m-auto flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImgSrc || activeFile.url}
                      alt={activeFile.title}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => {
                        if (activeFile.fallbackUrl && activeImgSrc !== activeFile.fallbackUrl) {
                          setActiveImgSrc(activeFile.fallbackUrl);
                          setImageLoaded(false);
                        } else {
                          setImageLoaded(true);
                          setImageError(true);
                        }
                      }}
                      onDoubleClick={() => setZoomScale((z) => (z > 1 ? 1 : 2))}
                      style={{
                        transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                      }}
                      className={cn(
                        "transition-transform duration-200 rounded-lg shadow-xl select-none",
                        zoomScale <= 1
                          ? "max-h-[calc(88dvh-10rem)] max-w-full object-contain cursor-zoom-in"
                          : "max-h-[calc(88dvh-10rem)] max-w-full object-contain cursor-zoom-out"
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Image Controls Toolbar */}
              {imageLoaded && !imageError && (
                <div className="sticky bottom-2 left-1/2 -translate-x-1/2 z-20 mx-auto w-fit flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stitch-surface/95 backdrop-blur-md border border-outline-variant/60 shadow-xl">
                  <button
                    type="button"
                    onClick={zoomOut}
                    aria-label="Zoom out"
                    title="Zoom Out"
                    className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-stitch-primary" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setRotation(0);
                    }}
                    title="Reset zoom and rotation"
                    className="px-2 py-0.5 rounded-full hover:bg-surface-container-high text-on-surface text-[11px] font-mono font-semibold transition-colors"
                  >
                    {Math.round(zoomScale * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={zoomIn}
                    aria-label="Zoom in"
                    title="Zoom In"
                    className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-stitch-primary" />
                  </button>
                  <span className="h-3.5 w-px bg-outline-variant/60 mx-0.5" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    aria-label="Rotate left"
                    title="Rotate Left 90°"
                    className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-on-surface-variant" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    aria-label="Rotate right"
                    title="Rotate Right 90°"
                    className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-on-surface-variant" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PDF PREVIEW */}
          {fileType === "pdf" && (
            <div className="w-full h-full flex flex-col p-3">
              <div className="w-full h-full rounded-xl overflow-hidden bg-white shadow-xl border border-outline-variant/40">
                <iframe
                  src={`${activeFile.url}#toolbar=1&navpanes=1`}
                  title={activeFile.title}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {fileType === "video" && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <video
                src={activeFile.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-xl shadow-2xl bg-black"
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* AUDIO PREVIEW */}
          {fileType === "audio" && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center p-8 bg-surface-container rounded-2xl border border-outline-variant/50 shadow-xl space-y-4 max-w-md w-full">
                <div className="w-16 h-16 rounded-2xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center">
                  <Music className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-on-surface">{activeFile.title}</h4>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">{activeFile.originalFilename}</p>
                </div>
                <audio src={activeFile.url} controls className="w-full mt-2" />
              </div>
            </div>
          )}

          {/* TEXT / CODE PREVIEW */}
          {fileType === "text" && (
            <div className="w-full h-full p-3">
              <div className="w-full h-full flex flex-col bg-surface-container rounded-xl border border-outline-variant/50 overflow-hidden shadow-xl">
                {textLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-stitch-primary" />
                  </div>
                ) : (
                  <pre className="flex-1 p-4 text-xs font-mono text-on-surface overflow-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed select-text">
                    {textContent || "No text content available."}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* OTHER / GENERIC BINARY FILE PREVIEW */}
          {fileType === "other" && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="flex flex-col items-center justify-center p-8 bg-surface-container rounded-2xl border border-outline-variant/50 shadow-2xl max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant border border-outline-variant/50">
                  <FileText className="w-8 h-8 text-stitch-primary" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface">{activeFile.title}</h4>
                  <p className="text-xs text-on-surface-variant font-mono mt-1 truncate max-w-xs">
                    {activeFile.originalFilename || activeFile.title}
                  </p>
                  {activeFile.sizeFormatted && (
                    <p className="text-xs text-stitch-primary font-semibold mt-1">
                      {activeFile.sizeFormatted}
                    </p>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  In-browser preview is not supported for this file format. You can download or open it with your operating system&apos;s default application.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={activeFile.fallbackUrl || activeFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5 border border-outline-variant/50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Browser</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 rounded-xl bg-stitch-primary hover:bg-stitch-primary/90 text-xs font-semibold text-on-primary transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Details */}
        {(activeFile.notes || (activeFile.tags && activeFile.tags.length > 0) || activeFile.createdAt) && (
          <div className="px-5 py-3 border-t border-outline-variant/50 bg-surface-container-low/80 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex-1 min-w-0 space-y-1">
              {activeFile.notes && (
                <p className="text-on-surface-variant line-clamp-1 italic">
                  &ldquo;{activeFile.notes}&rdquo;
                </p>
              )}
              {activeFile.tags && activeFile.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-on-surface-variant shrink-0" />
                  {activeFile.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {activeFile.createdAt && (
              <div className="flex items-center gap-1 text-[11px] text-on-surface-variant shrink-0">
                <Calendar className="w-3 h-3" />
                <span suppressHydrationWarning>Uploaded: {formatDate(activeFile.createdAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modalNode;
  }

  return createPortal(modalNode, document.body);
}
