"use client";

import React, { useRef, useState } from "react";
import { uploadImage, deleteImage } from "@/actions/cloudinary.actions";
import { Loader2, UploadCloud, X, RefreshCw, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  currentImageUrl?: string;
  currentPublicId?: string;
  folder?: string;
  onUploadSuccess: (url: string, publicId: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  variant?: "default" | "compact" | "icon";
  showPreview?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  currentPublicId,
  folder = "manageo/general",
  onUploadSuccess,
  onRemove,
  label = "Upload Image",
  className = "",
  variant = "default",
  showPreview = true
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      const res = await uploadImage(base64Image, folder);
      
      if (res.success && res.url && res.publicId) {
        onUploadSuccess(res.url, res.publicId);
      } else {
        setError(res.error || "Failed to upload image.");
      }
      setIsUploading(false);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {error && <div className="text-xs text-error font-medium bg-error/10 p-2 rounded-lg">{error}</div>}

      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-8 h-8 rounded-full bg-surface-container-high/80 border border-surface-variant flex items-center justify-center text-on-surface hover:bg-surface-variant hover:text-stitch-primary transition-all shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={label}
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-stitch-primary" /> : <UploadCloud className="w-4 h-4" />}
        </button>
      ) : currentImageUrl ? (
        <div className={`flex items-center gap-4 ${variant === 'compact' ? 'flex-row' : ''}`}>
          {showPreview && (
            <div className={`relative group shrink-0 overflow-hidden rounded-full border-2 border-surface-container-high bg-surface-container/30 ${variant === 'compact' ? 'w-10 h-10' : 'w-16 h-16'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={currentImageUrl} 
                alt="Uploaded attachment" 
                className="w-full h-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-surface/70 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-stitch-primary" />
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-center gap-1.5 bg-surface-container-high border border-surface-variant text-on-surface font-medium rounded-lg hover:bg-surface-variant hover:border-stitch-primary/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${variant === 'compact' ? 'h-7 px-2 text-[11px]' : 'h-8 px-3 text-xs'}`}
              >
                <RefreshCw className={`${variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-on-surface-variant`} /> Change
              </button>
              {onRemove && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleRemove}
                  className={`flex items-center justify-center gap-1.5 bg-error/10 text-error border border-error/20 font-medium rounded-lg hover:bg-error/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${variant === 'compact' ? 'h-7 px-2 text-[11px]' : 'h-8 px-3 text-xs'}`}
                >
                  <X className={`${variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} /> Remove
                </button>
              )}
            </div>
            {variant !== 'compact' && <span className="text-[10px] text-on-surface-variant">JPG, PNG under 5MB</span>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`flex items-center justify-center gap-2 w-full sm:w-auto border border-surface-container-high rounded-xl bg-surface-container/20 hover:bg-surface-container-high/60 transition-all group disabled:opacity-60 disabled:cursor-not-allowed ${variant === 'compact' ? 'h-8 px-3' : 'h-10 px-4'}`}
        >
          {isUploading ? (
            <Loader2 className={`${variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin text-stitch-primary`} />
          ) : (
            <UploadCloud className={`${variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-on-surface-variant group-hover:text-stitch-primary transition-colors`} />
          )}
          <span className={`${variant === 'compact' ? 'text-xs' : 'text-sm'} font-medium text-on-surface`}>
            {isUploading ? "Uploading..." : label}
          </span>
        </button>
      )}
    </div>
  );
}
