"use client";

import { useState, useEffect } from "react";

export default function StartupLoader() {
  const [mounted, setMounted] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // React hydrated cleanly on client — fade out immediately
    const fadeTimer = setTimeout(() => {
      setMounted(true);
    }, 0);
    const goneTimer = setTimeout(() => {
      setGone(true);
    }, 320);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-label="Loading Manageo"
      aria-live="polite"
      className={`startup-loader${mounted ? " startup-loader--fading" : ""}`}
    >
      {/* Logo */}
      <div className="startup-logo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png?v=2"
          alt="Manageo"
          className="startup-logo"
          width={155}
          height={32}
          style={{ aspectRatio: "602 / 124" }}
        />
      </div>

      {/* Spinner + label */}
      <div className="startup-spinner-wrap" aria-hidden="true">
        <span className="startup-spinner" />
      </div>
      <p className="startup-label">Loading&hellip;</p>

      {/* Scoped styles — self-contained, no external deps */}
      <style>{`
        .startup-loader {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background-color: #09090b;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-top: var(--safe-area-top, env(safe-area-inset-top, 0px));
          padding-bottom: var(--safe-area-bottom, env(safe-area-inset-bottom, 0px));
          padding-left: var(--safe-area-left, env(safe-area-inset-left, 0px));
          padding-right: var(--safe-area-right, env(safe-area-inset-right, 0px));
          opacity: 1;
          transition: opacity 0.3s ease;
          pointer-events: auto;
          will-change: opacity;
          animation: startup-css-fallback 0.35s ease 0.9s forwards;
        }

        .startup-loader--fading {
          opacity: 0 !important;
          pointer-events: none !important;
        }

        @keyframes startup-css-fallback {
          to {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
        }

        /* ─── Logo ─── */
        .startup-logo-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          animation: startup-logo-in 0.35s ease-out both;
        }

        .startup-logo {
          width: 155px;
          height: 32px;
          aspect-ratio: 602 / 124;
          object-fit: contain;
          display: block;
        }

        /* ─── Spinner ─── */
        .startup-spinner-wrap {
          margin-bottom: 14px;
        }

        .startup-spinner {
          display: block;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid rgba(125, 211, 252, 0.12);
          border-top-color: #7dd3fc;
          animation: startup-spin 0.7s linear infinite;
        }

        /* ─── Label ─── */
        .startup-label {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.02em;
          color: #4a6070;
          margin: 0;
          font-family: system-ui, -apple-system, sans-serif;
        }

        /* ─── Keyframes ─── */
        @keyframes startup-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes startup-logo-in {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* ─── Reduced motion ─── */
        @media (prefers-reduced-motion: reduce) {
          .startup-loader {
            transition: none;
          }
          .startup-spinner {
            animation: none;
            border-top-color: #7dd3fc;
            opacity: 0.6;
          }
          .startup-logo-wrap {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
