import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoVariant = "header" | "mobile-header" | "sidebar" | "auth" | "footer" | "icon";

export interface LogoSizeConfig {
  width: number;
  height: number;
  className: string;
  src: string;
}

/**
 * Standardized Manageo Branding Tokens
 * Ratio for full logo: 602px × 124px (aspect-ratio: ~4.855)
 * Ratio for brand icon: 134px × 135px (aspect-ratio: 1 / 1)
 */
export const LOGO_VARIANTS: Record<LogoVariant, LogoSizeConfig> = {
  header: {
    width: 155,
    height: 32,
    className: "w-[136px] h-[28px] sm:w-[155px] sm:h-[32px]",
    src: "/logo.png?v=2",
  },
  "mobile-header": {
    width: 136,
    height: 28,
    className: "w-[136px] h-[28px]",
    src: "/logo.png?v=2",
  },
  sidebar: {
    width: 150,
    height: 31,
    className: "w-[150px] h-[31px]",
    src: "/logo.png?v=2",
  },
  auth: {
    width: 175,
    height: 36,
    className: "w-[160px] h-[33px] sm:w-[175px] sm:h-[36px]",
    src: "/logo.png?v=2",
  },
  footer: {
    width: 140,
    height: 29,
    className: "w-[140px] h-[29px]",
    src: "/logo.png?v=2",
  },
  icon: {
    width: 32,
    height: 32,
    className: "w-8 h-8",
    src: "/logo-icon.png?v=2",
  },
};

export interface LogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  variant?: LogoVariant;
  href?: string;
  priority?: boolean;
  linkClassName?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}

export function Logo({
  variant = "header",
  href,
  priority = false,
  linkClassName,
  className,
  style,
  alt = "Manageo",
  onClick,
  ...props
}: LogoProps) {
  const config = LOGO_VARIANTS[variant] || LOGO_VARIANTS.header;
  const isIcon = variant === "icon";

  const imgElement = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={config.src}
      alt={alt}
      width={config.width}
      height={config.height}
      loading={priority ? "eager" : props.loading || "lazy"}
      decoding="async"
      style={{
        aspectRatio: isIcon ? "1 / 1" : "602 / 124",
        ...style,
      }}
      className={cn(
        "object-contain shrink-0 select-none block",
        config.className,
        className
      )}
      {...props}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "inline-flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stitch-primary rounded-lg",
          linkClassName
        )}
      >
        {imgElement}
      </Link>
    );
  }

  return imgElement;
}
