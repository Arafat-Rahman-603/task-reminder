"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PreviewableFile {
  title: string;
  url: string;
  originalFilename?: string;
  mimeType?: string;
  resourceType?: string;
  sizeFormatted?: string;
  category?: string;
  createdAt?: string;
  notes?: string;
  tags?: string[];
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: PreviewableFile | null;
}

export function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  const [zoom, setZoom] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!file?.url || isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = file.originalFilename || file.title || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(file.url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyLink = () => {
    if (!file?.url) return;
    const fullUrl = file.url.startsWith("http") ? file.url : window.location.origin + file.url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Determine file type
  const fileType = React.useMemo(() => {
    if (!file) return "other";
    const name = file.originalFilename || file.title || file.url;
    const ext = name.split(".").pop()?.toLowerCase();
    const mime = (file.mimeType || "").toLowerCase();
    const resType = (file.resourceType || "").toLowerCase();

    if (
      resType === "image" ||
      mime.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif"].includes(ext || "")
    ) {
      return "image";
    }
    if (mime === "application/pdf" || ext === "pdf") {
      return "pdf";
    }
    if (
      resType === "video" ||
      mime.startsWith("video/") ||
      ["mp4", "webm", "ogg", "mov", "mkv"].includes(ext || "")
    ) {
      return "video";
    }
    if (
      mime.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "m4a", "flac"].includes(ext || "")
    ) {
      return "audio";
    }
    if (
      mime.startsWith("text/") ||
      ["txt", "md", "json", "csv", "log", "xml", "html", "js", "ts", "yml", "yaml"].includes(ext || "")
    ) {
      return "text";
    }
    return "other";
  }, [file]);

  // Fetch text content if text file
  useEffect(() => {
    if (isOpen && file && fileType === "text") {
      setTextLoading(true);
      setTextContent(null);
      fetch(file.url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load text");
          return res.text();
        })
        .then((text) => setTextContent(text))
        .catch(() => setTextContent("Unable to load text preview."))
        .finally(() => setTextLoading(false));
    } else {
      setTextContent(null);
      setTextLoading(false);
    }
    setImageLoaded(false);
    setImageError(false);
    setZoom(false);
  }, [isOpen, file, fileType]);

  if (!isOpen || !file) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200",
        isFullscreen ? "p-0 bg-black" : "p-2 sm:p-5 bg-black/85 backdrop-blur-md"
      )}
    >
      <div
        className={cn(
          "relative flex flex-col bg-surface-container overflow-hidden animate-in zoom-in-95 duration-200",
          isFullscreen
            ? "w-screen h-screen max-w-none rounded-none border-none shadow-none"
            : "w-full max-w-5xl h-[88vh] rounded-2xl border border-surface-container-high shadow-2xl"
        )}
      >
        {/* ─── Modal Header ─── */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-surface-container-high bg-surface-container-high/40 shrink-0">
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
              <h3 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                {file.title}
              </h3>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-[11px] text-on-surface-variant">
                {file.originalFilename && file.originalFilename !== file.title && (
                  <span className="font-mono truncate max-w-[120px] sm:max-w-[200px]">
                    {file.originalFilename}
                  </span>
                )}
                {file.sizeFormatted && (
                  <span className="px-1.5 py-0.5 rounded bg-surface-container-highest font-mono text-[9px] sm:text-[10px]">
                    {file.sizeFormatted}
                  </span>
                )}
                {file.category && (
                  <span className="px-1.5 py-0.5 rounded bg-stitch-primary/15 text-stitch-primary text-[9px] sm:text-[10px] font-semibold">
                    {file.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Fullscreen / Maximize Modal */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-surface-container-highest shrink-0"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors border border-surface-container-highest shrink-0"
              title={copiedLink ? "Link Copied!" : "Copy Link"}
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Open Original in New Tab */}
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-stitch-primary transition-colors border border-surface-container-highest shrink-0"
              title="Open Original in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Direct Download */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors shadow-sm disabled:opacity-60 shrink-0"
              title="Download File"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              ) : (
                <Download className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="hidden sm:inline">{isDownloading ? "Saving..." : "Download"}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={() => {
                setIsFullscreen(false);
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors ml-0.5 shrink-0"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ─── Modal Main Preview Area ─── */}
        <div className="flex-1 bg-black/60 relative overflow-auto flex items-center justify-center p-3">
          {/* IMAGE PREVIEW */}
          {fileType === "image" && (
            <div className="w-full h-full flex items-center justify-center overflow-auto relative">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-stitch-primary" />
                </div>
              )}
              {imageError ? (
                <div className="text-center p-6 space-y-2">
                  <AlertCircle className="w-10 h-10 text-error mx-auto opacity-70" />
                  <p className="text-xs text-on-surface-variant">Failed to load image preview.</p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-stitch-primary hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Direct URL
                  </a>
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.url}
                    alt={file.title}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageLoaded(true);
                      setImageError(true);
                    }}
                    className={cn(
                      "transition-all duration-300 rounded-lg shadow-lg select-none",
                      zoom ? "max-w-none cursor-zoom-out" : "max-h-full max-w-full object-contain cursor-zoom-in"
                    )}
                    onClick={() => setZoom(!zoom)}
                  />
                  {imageLoaded && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high/90 backdrop-blur-md border border-surface-container-highest shadow-xl">
                      <button
                        type="button"
                        onClick={() => setZoom(!zoom)}
                        className="px-2 py-0.5 rounded-full hover:bg-white/10 text-on-surface flex items-center gap-1.5 text-[11px] font-medium transition-colors"
                      >
                        {zoom ? <ZoomOut className="w-3.5 h-3.5 text-stitch-primary" /> : <ZoomIn className="w-3.5 h-3.5 text-stitch-primary" />}
                        <span>{zoom ? "Fit Screen" : "100% Zoom"}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PDF PREVIEW */}
          {fileType === "pdf" && (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden bg-white shadow-xl relative">
              <iframe
                src={`${file.url}#toolbar=1&navpanes=1`}
                title={file.title}
                className="w-full h-full border-0 rounded-xl"
              />
            </div>
          )}

          {/* VIDEO PREVIEW */}
          {fileType === "video" && (
            <div className="w-full h-full flex items-center justify-center">
              <video
                src={file.url}
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
            <div className="flex flex-col items-center justify-center p-8 bg-surface-container rounded-2xl border border-surface-container-high shadow-xl space-y-4 max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-stitch-primary/15 text-stitch-primary flex items-center justify-center">
                <Music className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-bold text-on-surface">{file.title}</h4>
                <p className="text-xs text-on-surface-variant font-mono mt-0.5">{file.originalFilename}</p>
              </div>
              <audio src={file.url} controls className="w-full mt-2" />
            </div>
          )}

          {/* TEXT / CODE PREVIEW */}
          {fileType === "text" && (
            <div className="w-full h-full flex flex-col bg-surface-container rounded-xl border border-surface-container-high overflow-hidden shadow-xl">
              {textLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-stitch-primary" />
                </div>
              ) : (
                <pre className="flex-1 p-4 text-xs font-mono text-on-surface overflow-auto whitespace-pre-wrap leading-relaxed select-text">
                  {textContent || "No text content available."}
                </pre>
              )}
            </div>
          )}

          {/* OTHER / GENERIC BINARY FILE PREVIEW */}
          {fileType === "other" && (
            <div className="flex flex-col items-center justify-center p-8 bg-surface-container rounded-2xl border border-surface-container-high shadow-2xl max-w-md w-full text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant border border-surface-container-highest">
                <FileText className="w-8 h-8 text-stitch-primary" />
              </div>
              <div>
                <h4 className="text-base font-bold text-on-surface">{file.title}</h4>
                <p className="text-xs text-on-surface-variant font-mono mt-1 truncate max-w-xs">
                  {file.originalFilename || file.title}
                </p>
                {file.sizeFormatted && (
                  <p className="text-xs text-stitch-primary font-semibold mt-1">
                    {file.sizeFormatted}
                  </p>
                )}
              </div>
              <p className="text-xs text-on-surface-variant/80 max-w-sm">
                In-browser preview is not supported for this file format. You can download or open it with your operating system&apos;s default application.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors flex items-center gap-1.5 border border-surface-container-highest"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Browser</span>
                </a>
                <a
                  href={file.url}
                  download={file.originalFilename || file.title}
                  className="px-4 py-2 rounded-xl bg-stitch-primary hover:bg-primary-fixed-dim text-xs font-semibold text-on-primary transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* ─── Modal Footer Details ─── */}
        {(file.notes || (file.tags && file.tags.length > 0) || file.createdAt) && (
          <div className="px-5 py-3 border-t border-surface-container-high bg-surface-container-high/40 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex-1 min-w-0 space-y-1">
              {file.notes && (
                <p className="text-on-surface-variant line-clamp-1 italic">
                  &ldquo;{file.notes}&rdquo;
                </p>
              )}
              {file.tags && file.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-on-surface-variant shrink-0" />
                  {file.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant text-[10px]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {file.createdAt && (
              <div className="flex items-center gap-1 text-[11px] text-on-surface-variant shrink-0">
                <Calendar className="w-3 h-3" />
                <span>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
