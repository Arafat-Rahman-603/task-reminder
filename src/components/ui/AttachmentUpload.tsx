"use client";

import React, { useRef, useState } from "react";
import { uploadFile } from "@/actions/cloudinary.actions";
import { Loader2, UploadCloud, X, FileText, Download, Plus, Image as ImageIcon } from "lucide-react";

export type Attachment = {
  url: string;
  publicId: string;
  resourceType?: string;
  originalFilename?: string;
};

interface AttachmentUploadProps {
  attachments?: Attachment[];
  multiple?: boolean;
  folder?: string;
  onChange: (attachments: Attachment[]) => void;
  label?: string;
  className?: string;
}

function AttachmentPreviewItem({
  att,
  onRemove,
  disabled
}: {
  att: Attachment;
  onRemove: () => void;
  disabled: boolean;
}) {
  const isImage = att.resourceType === "image" || att.url?.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
  
  // Try proxy first, then raw url, then fallback icon
  const primarySrc = att.publicId 
    ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` 
    : att.url;
    
  const [imgSrc, setImgSrc] = useState(primarySrc);
  const [loadFailed, setLoadFailed] = useState(false);

  const handleImgError = () => {
    if (imgSrc !== att.url && att.url) {
      setImgSrc(att.url);
    } else {
      setLoadFailed(true);
    }
  };

  return (
    <div className="relative group flex items-center justify-between gap-3 p-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all overflow-hidden h-16">
      {/* Thumbnail or File Icon */}
      <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center relative">
        {isImage && !loadFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={att.originalFilename || "Attachment"}
            onError={handleImgError}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-stitch-primary/80 flex items-center justify-center">
            {isImage ? <ImageIcon className="w-5 h-5 text-stitch-primary" /> : <FileText className="w-5 h-5 text-slate-300" />}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-medium text-slate-200 truncate" title={att.originalFilename || "Attachment"}>
          {att.originalFilename || "Attachment"}
        </p>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
          {att.resourceType || (isImage ? "image" : "document")}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={imgSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          title="Open / Download"
        >
          <Download className="w-3.5 h-3.5" />
        </a>
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
          title="Remove"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function AttachmentUpload({
  attachments = [],
  multiple = false,
  folder = "manageo/general",
  onChange,
  label = "Add files",
  className = ""
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const filesToUpload = multiple ? files : [files[0]];
    
    for (const f of filesToUpload) {
      if (f.size > 10 * 1024 * 1024) {
        setError("Files must be smaller than 10MB.");
        return;
      }
    }

    setError("");
    setIsUploading(true);

    const newAttachments: Attachment[] = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await uploadFile(formData, folder);
        
        if (res.success && res.url && res.publicId) {
          newAttachments.push({
            url: res.url,
            publicId: res.publicId,
            resourceType: res.resourceType,
            originalFilename: res.originalFilename || file.name,
          });
        } else {
          setError(res.error || "Failed to upload file.");
        }
      }

      if (newAttachments.length > 0) {
        onChange(multiple ? [...attachments, ...newAttachments] : newAttachments);
      }
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    onChange(newAttachments);
  };

  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        multiple={multiple}
        className="hidden"
      />

      {error && (
        <div className="text-xs text-red-300 font-medium bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      {/* Render Attachments List if present */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((att, idx) => (
            <AttachmentPreviewItem
              key={idx}
              att={att}
              onRemove={() => handleRemove(idx)}
              disabled={isUploading}
            />
          ))}
        </div>
      )}

      {/* Minimal upload trigger */}
      {attachments.length > 0 && multiple ? (
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed border-white/20 hover:border-stitch-primary/50 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stitch-primary" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-stitch-primary" />
                <span>{label}</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-500">Max 10MB</span>
        </div>
      ) : attachments.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center justify-center w-full h-20 p-3 rounded-xl border border-dashed border-white/15 hover:border-stitch-primary/40 bg-white/[0.02] hover:bg-white/[0.04] transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-stitch-primary" />
              <span className="text-xs font-medium text-slate-300">Uploading file...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-300 group-hover:text-stitch-primary transition-colors">
                <UploadCloud className="w-4 h-4 text-stitch-primary" />
                <span className="text-xs font-medium">{label}</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                Supports Images, PDF, Docs (Max 10MB)
              </span>
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
