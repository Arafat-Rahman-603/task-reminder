"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { formatBytes } from "@/lib/formatBytes";

export interface ActiveUpload {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  title: string;
  category: string;
  notes?: string;
  expiryDate?: string;
  tags?: string[];
  progress: number; // 0 - 100
  bytesUploaded: number;
  totalBytes: number;
  speedFormatted?: string;
  estimatedRemainingSec?: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  createdDocument?: Record<string, unknown>;
  startedAt: number;
  completedAt?: number;
}

interface UploadContextType {
  uploads: ActiveUpload[];
  activeCount: number;
  hasActiveUploads: boolean;
  startDocumentUpload: (
    file: File,
    metadata?: {
      title?: string;
      category?: string;
      notes?: string;
      expiryDate?: string;
      tags?: string[];
    }
  ) => string;
  cancelUpload: (id: string) => void;
  dismissUpload: (id: string) => void;
  clearCompleted: () => void;
  retryUpload: (id: string) => void;
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const xhrMap = useRef<Map<string, XMLHttpRequest>>(new Map());

  const activeCount = uploads.filter(
    (u) => u.status === "uploading" || u.status === "processing"
  ).length;
  const hasActiveUploads = activeCount > 0;

  const [prevActive, setPrevActive] = useState(false);
  if (hasActiveUploads && !prevActive) {
    setPrevActive(true);
    setIsWidgetOpen(true);
  } else if (!hasActiveUploads && prevActive) {
    setPrevActive(false);
  }

  const executeUpload = useCallback((uploadItem: ActiveUpload) => {
    const { id, file, title, category, notes, expiryDate, tags } = uploadItem;
    const xhr = new XMLHttpRequest();
    xhrMap.current.set(id, xhr);

    const startTime = Date.now();

    xhr.upload.addEventListener("progress", (evt) => {
      if (evt.lengthComputable) {
        const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
        const elapsedSec = (Date.now() - startTime) / 1000;
        const bytesPerSec = elapsedSec > 0.3 ? evt.loaded / elapsedSec : 0;
        const speedFormatted = bytesPerSec > 0 ? `${formatBytes(bytesPerSec)}/s` : undefined;
        const remainingBytes = evt.total - evt.loaded;
        const remainingSec = bytesPerSec > 0 ? Math.ceil(remainingBytes / bytesPerSec) : undefined;

        setUploads((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  progress: percent,
                  bytesUploaded: evt.loaded,
                  totalBytes: evt.total,
                  speedFormatted,
                  estimatedRemainingSec: remainingSec,
                  status: percent >= 100 ? "processing" : "uploading",
                }
              : item
          )
        );
      }
    });

    xhr.addEventListener("load", () => {
      xhrMap.current.delete(id);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.document) {
            setUploads((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      progress: 100,
                      status: "completed",
                      createdDocument: res.document,
                      completedAt: Date.now(),
                    }
                  : item
              )
            );

            // Broadcast globally so Documents page updates instantaneously
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("manageo:document-uploaded", {
                  detail: { document: res.document },
                })
              );
            }
          } else {
            setUploads((prev) =>
              prev.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      status: "error",
                      error: res.error || "Upload failed on server.",
                    }
                  : item
              )
            );
          }
        } catch {
          setUploads((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: "error",
                    error: "Invalid server response.",
                  }
                : item
            )
          );
        }
      } else {
        let errMsg = "Upload failed";
        try {
          const parsed = JSON.parse(xhr.responseText);
          errMsg = parsed.error || errMsg;
        } catch {
          // ignore
        }
        setUploads((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "error",
                  error: errMsg,
                }
              : item
          )
        );
      }
    });

    xhr.addEventListener("error", () => {
      xhrMap.current.delete(id);
      setUploads((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "error",
                error: "Network connection lost during upload.",
              }
            : item
        )
      );
    });

    xhr.addEventListener("abort", () => {
      xhrMap.current.delete(id);
      setUploads((prev) => prev.filter((item) => item.id !== id));
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("category", category);
    if (notes) formData.append("notes", notes);
    if (expiryDate) formData.append("expiryDate", expiryDate);
    if (tags && tags.length > 0) formData.append("tags", tags.join(","));

    xhr.open("POST", "/api/documents/upload");
    xhr.send(formData);
  }, []);

  const startDocumentUpload = useCallback(
    (
      file: File,
      metadata?: {
        title?: string;
        category?: string;
        notes?: string;
        expiryDate?: string;
        tags?: string[];
      }
    ) => {
      const id = "upload_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const newUpload: ActiveUpload = {
        id,
        file,
        fileName: file.name,
        fileSize: file.size,
        fileSizeFormatted: formatBytes(file.size),
        title: metadata?.title?.trim() || file.name,
        category: metadata?.category || "General",
        notes: metadata?.notes,
        expiryDate: metadata?.expiryDate,
        tags: metadata?.tags,
        progress: 0,
        bytesUploaded: 0,
        totalBytes: file.size,
        status: "uploading",
        startedAt: Date.now(),
      };

      setUploads((prev) => [newUpload, ...prev]);
      executeUpload(newUpload);
      return id;
    },
    [executeUpload]
  );

  const cancelUpload = useCallback((id: string) => {
    const xhr = xhrMap.current.get(id);
    if (xhr) {
      xhr.abort();
    } else {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }
  }, []);

  const dismissUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === "uploading" || u.status === "processing"));
  }, []);

  const retryUpload = useCallback(
    (id: string) => {
      const target = uploads.find((u) => u.id === id);
      if (!target) return;
      const resetItem: ActiveUpload = {
        ...target,
        progress: 0,
        bytesUploaded: 0,
        status: "uploading",
        error: undefined,
        startedAt: Date.now(),
      };
      setUploads((prev) => prev.map((u) => (u.id === id ? resetItem : u)));
      executeUpload(resetItem);
    },
    [uploads, executeUpload]
  );

  return (
    <UploadContext.Provider
      value={{
        uploads,
        activeCount,
        hasActiveUploads,
        startDocumentUpload,
        cancelUpload,
        dismissUpload,
        clearCompleted,
        retryUpload,
        isWidgetOpen,
        setIsWidgetOpen,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
