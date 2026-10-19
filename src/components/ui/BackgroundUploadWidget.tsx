"use client";

import React from "react";
import { useUpload, ActiveUpload } from "@/context/UploadContext";
import {
  UploadCloud,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/formatBytes";

function getFileIcon(file: File) {
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg)$/.test(name)) {
    return <ImageIcon className="w-4 h-4 text-sky-400" />;
  }
  if (type.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/.test(name)) {
    return <Film className="w-4 h-4 text-purple-400" />;
  }
  if (type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a)$/.test(name)) {
    return <Music className="w-4 h-4 text-emerald-400" />;
  }
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return <FileText className="w-4 h-4 text-rose-400" />;
  }
  if (type.startsWith("text/") || /\.(json|txt|md|csv|js|ts)$/.test(name)) {
    return <FileCode className="w-4 h-4 text-amber-400" />;
  }
  return <FileText className="w-4 h-4 text-stitch-primary" />;
}

export function BackgroundUploadWidget() {
  const {
    uploads,
    activeCount,
    hasActiveUploads,
    cancelUpload,
    dismissUpload,
    clearCompleted,
    retryUpload,
    isWidgetOpen,
    setIsWidgetOpen,
  } = useUpload();

  if (uploads.length === 0) return null;

  // Calculate overall average progress for active uploads
  const activeUploads = uploads.filter((u) => u.status === "uploading" || u.status === "processing");
  const overallProgress =
    activeUploads.length > 0
      ? Math.round(
          activeUploads.reduce((acc, curr) => acc + curr.progress, 0) / activeUploads.length
        )
      : 100;

  return (
    <div
      className="fixed right-4 z-40 max-w-[calc(100vw-2rem)] sm:max-w-md w-full sm:w-96 select-none animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
      style={{
        bottom: "calc(4.75rem + var(--safe-area-bottom, 0px))",
      }}
    >
      {/* ─── Collapsed Pill View ─── */}
      {!isWidgetOpen && (
        <div
          onClick={() => setIsWidgetOpen(true)}
          className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-high/95 backdrop-blur-2xl border border-surface-container-highest shadow-2xl cursor-pointer hover:bg-surface-container-highest transition-all group border-stitch-primary/30"
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
                hasActiveUploads
                  ? "bg-stitch-primary/20 text-stitch-primary border-stitch-primary/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              )}
            >
              {hasActiveUploads ? (
                <UploadCloud className="w-4 h-4 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate">
                {hasActiveUploads
                  ? `Uploading ${activeCount} file${activeCount > 1 ? "s" : ""} (${overallProgress}%)`
                  : "All uploads complete"}
              </p>
              <p className="text-[10px] text-on-surface-variant truncate">
                {hasActiveUploads
                  ? "Click to view background progress"
                  : `${uploads.length} item${uploads.length > 1 ? "s" : ""} saved to cloud`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasActiveUploads && (
              <span className="text-xs font-mono font-bold text-stitch-primary">
                {overallProgress}%
              </span>
            )}
            <button
              type="button"
              className="p-1 rounded-lg text-on-surface-variant group-hover:text-on-surface transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Expanded Drawer View ─── */}
      {isWidgetOpen && (
        <div className="rounded-2xl bg-surface-container-low/95 backdrop-blur-2xl border border-surface-container-high shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-container-high/60 border-b border-surface-container-high shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center border",
                  hasActiveUploads
                    ? "bg-stitch-primary/20 text-stitch-primary border-stitch-primary/40"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                )}
              >
                {hasActiveUploads ? (
                  <UploadCloud className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-bold font-headline text-on-surface">
                {hasActiveUploads
                  ? `Uploading Files (${activeCount} active)`
                  : "Completed Uploads"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {!hasActiveUploads && uploads.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="text-[11px] font-semibold text-on-surface-variant hover:text-on-surface px-2 py-0.5 rounded transition-colors"
                >
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsWidgetOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
                title="Minimize drawer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Upload Items List */}
          <div className="overflow-y-auto divide-y divide-surface-container-high/40 p-2 space-y-2">
            {uploads.map((upload) => (
              <UploadCard
                key={upload.id}
                upload={upload}
                onCancel={() => cancelUpload(upload.id)}
                onDismiss={() => dismissUpload(upload.id)}
                onRetry={() => retryUpload(upload.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UploadCard({
  upload,
  onCancel,
  onDismiss,
  onRetry,
}: {
  upload: ActiveUpload;
  onCancel: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}) {
  const isUploading = upload.status === "uploading";
  const isProcessing = upload.status === "processing";
  const isCompleted = upload.status === "completed";
  const isError = upload.status === "error";

  return (
    <div className="p-3 rounded-xl bg-surface-container/60 border border-surface-container-high/60 space-y-2 text-xs">
      {/* File Info Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 border border-surface-container-highest">
            {getFileIcon(upload.file)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-on-surface truncate leading-tight">
              {upload.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-on-surface-variant">
              <span>{upload.fileSizeFormatted}</span>
              <span>&bull;</span>
              <span className="capitalize">{upload.category}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-1">
          {isUploading && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
              title="Cancel Upload"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isError && (
            <button
              type="button"
              onClick={onRetry}
              className="p-1 rounded-lg text-amber-400 hover:text-white hover:bg-amber-500/20 transition-colors"
              title="Retry Upload"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {(isCompleted || isError) && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & Status */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-medium flex items-center gap-1.5">
            {isUploading && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-stitch-primary" />
                <span className="text-stitch-primary font-semibold">Uploading...</span>
              </>
            )}
            {isProcessing && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                <span className="text-purple-400 font-semibold">Encrypting &amp; storing...</span>
              </>
            )}
            {isCompleted && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Saved successfully!</span>
              </>
            )}
            {isError && (
              <>
                <AlertCircle className="w-3 h-3 text-error" />
                <span className="text-error font-semibold">Upload failed</span>
              </>
            )}
          </span>

          <span className="font-mono text-on-surface-variant">
            {isUploading && `${upload.progress}%`}
            {isProcessing && "100%"}
            {isCompleted && "100%"}
          </span>
        </div>

        {/* Progress bar line */}
        <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isUploading
                ? "bg-gradient-to-r from-sky-500 to-stitch-primary"
                : isProcessing
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse"
                : isCompleted
                ? "bg-emerald-500"
                : "bg-error"
            )}
            style={{ width: `${upload.progress}%` }}
          />
        </div>

        {/* Upload speed & transfer info */}
        {isUploading && (
          <div className="flex items-center justify-between text-[9px] text-on-surface-variant/80 font-mono pt-0.5">
            <span>
              {formatBytes(upload.bytesUploaded)} / {upload.fileSizeFormatted}
            </span>
            <span>
              {upload.speedFormatted && `${upload.speedFormatted}`}
              {upload.estimatedRemainingSec !== undefined && ` • ~${upload.estimatedRemainingSec}s left`}
            </span>
          </div>
        )}

        {isError && upload.error && (
          <p className="text-[10px] text-error font-medium leading-tight pt-0.5">
            {upload.error}
          </p>
        )}

        {isCompleted && upload.createdDocument && (
          <div className="pt-1 flex justify-end">
            <Link
              href="/dashboard/documents"
              className="text-[10px] text-stitch-primary hover:underline font-semibold flex items-center gap-1"
            >
              <span>View in Documents</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
