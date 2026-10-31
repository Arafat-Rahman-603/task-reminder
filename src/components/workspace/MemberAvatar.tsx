"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface MemberAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  avatarPublicId?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  shape?: "circle" | "rounded";
}

export default function MemberAvatar({
  name,
  avatarUrl,
  image,
  avatarPublicId,
  size = "md",
  className = "",
  shape = "circle",
}: MemberAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Determine avatar src
  let src: string | null = null;
  if (avatarPublicId) {
    src = `/api/assets/${avatarPublicId}?resourceType=image`;
  } else if (avatarUrl && typeof avatarUrl === "string" && avatarUrl.trim()) {
    src = avatarUrl.trim();
  } else if (image && typeof image === "string" && image.trim()) {
    src = image.trim();
  }

  // Size mappings
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
  };

  const borderRadius = shape === "circle" ? "rounded-full" : "rounded-xl";

  const getInitials = (n?: string | null) => {
    if (!n || !n.trim()) return null;
    const parts = n.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-stitch-surface-container border border-white/10 shadow-inner select-none ${borderRadius} ${sizeClasses[size]} ${className}`}
      title={name || "Member Avatar"}
    >
      {src && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "Member avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <div className="flex items-center justify-center w-full h-full bg-stitch-primary/15 text-stitch-primary font-bold tracking-tight select-none">
          {initials}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-stitch-primary/10 text-stitch-primary">
          <User size={iconSizes[size]} strokeWidth={2.2} />
        </div>
      )}
    </div>
  );
}
