"use client";

import React, { useRef, useState } from "react";
import { uploadFile } from "@/actions/cloudinary.actions";
import { Loader2, UploadCloud, X, FileText, Download } from "lucide-react";

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

export function AttachmentUpload({
  attachments = [],
  multiple = false,
  folder = "manageo/general",
  onChange,
  label = "Upload File",
  className = ""
}: AttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // We take the first one if multiple is false
    const filesToUpload = multiple ? files : [files[0]];
    
    // Check sizes
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

  const handleRemove = async (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    onChange(newAttachments);
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        multiple={multiple}
        className="hidden"
      />

      {error && <div className="text-xs text-error font-medium bg-error/10 p-2 rounded-lg">{error}</div>}

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attachments.map((att, idx) => {
            const isImage = att.resourceType === "image" || att.url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i);
            
            return (
              <div key={idx} className="relative group overflow-hidden rounded-xl border border-surface-container-high bg-surface-container/30 aspect-video flex items-center justify-center p-2">
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'image'}` : att.url} 
                    alt={att.originalFilename || "Attachment"} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <FileText className="w-10 h-10 text-on-surface-variant mb-2" />
                    <span className="text-xs text-on-surface truncate w-full max-w-[150px]">
                      {att.originalFilename || "Document"}
                    </span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                  {!isImage && (
                    <a
                      href={att.publicId ? `/api/assets/${att.publicId}?resourceType=${att.resourceType || 'auto'}` : att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-surface text-on-surface rounded-lg hover:bg-surface-variant transition-colors"
                      title="Download/View"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleRemove(idx)}
                    className="p-2 bg-error text-error-foreground rounded-lg hover:bg-error/90 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(!attachments.length || multiple) && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center justify-center w-full min-h-[100px] p-6 border-2 border-dashed border-surface-container-high rounded-xl bg-surface-container/20 hover:bg-surface-container/50 hover:border-stitch-primary/50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-stitch-primary mb-2" />
          ) : (
            <UploadCloud className="w-6 h-6 text-on-surface-variant group-hover:text-stitch-primary mb-2 transition-colors" />
          )}
          <span className="text-sm font-medium text-on-surface">
            {isUploading ? "Uploading..." : label}
          </span>
          {!isUploading && (
            <span className="text-xs text-on-surface-variant mt-1">
              Supports Images, PDF, Docs (Max 10MB)
            </span>
          )}
        </button>
      )}
    </div>
  );
}
