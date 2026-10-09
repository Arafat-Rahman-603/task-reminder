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
}

export function ImageUpload({
  currentImageUrl,
  currentPublicId,
  folder = "manageo/general",
  onUploadSuccess,
  onRemove,
  label = "Upload Image",
  className = ""
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

      {currentImageUrl ? (
        <div className="relative group overflow-hidden rounded-2xl border border-surface-container-high bg-surface-container/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={currentImageUrl} 
            alt="Uploaded attachment" 
            className="w-full h-auto max-h-[300px] object-contain bg-surface-container-low"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface text-on-surface text-sm font-medium rounded-lg hover:bg-surface-variant transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Replace
            </button>
            {onRemove && (
              <button
                type="button"
                disabled={isUploading}
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-error text-error-foreground text-sm font-medium rounded-lg hover:bg-error/90 transition-colors"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            )}
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-surface/70 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-6 h-6 animate-spin text-stitch-primary" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex flex-col items-center justify-center w-full min-h-[120px] p-6 border-2 border-dashed border-surface-container-high rounded-2xl bg-surface-container/20 hover:bg-surface-container/50 hover:border-stitch-primary/50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-stitch-primary mb-2" />
          ) : (
            <UploadCloud className="w-8 h-8 text-on-surface-variant group-hover:text-stitch-primary mb-2 transition-colors" />
          )}
          <span className="text-sm font-medium text-on-surface">
            {isUploading ? "Uploading..." : label}
          </span>
          {!isUploading && (
            <span className="text-xs text-on-surface-variant mt-1">
              Supports JPG, PNG (Max 5MB)
            </span>
          )}
        </button>
      )}
    </div>
  );
}
