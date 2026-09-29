"use client";

import { useState, useEffect, useRef } from "react";

// The startup loader is rendered on the server (SSR) so it appears
// immediately — before any CSS, JavaScript, or hydration.
// After the client hydrates and fires useEffect, we fade it out.
export default function StartupLoader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // React has hydrated — the app is ready. Start the fade-out.
    setPhase("fading");

    // Remove from DOM after the CSS transition completes (300ms).
    timerRef.current = setTimeout(() => setPhase("gone"), 320);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <>
      {/* Loader overlay — fixed, full-viewport, above everything */}
      <div
        role="status"
        aria-label="Loading Manageo"
        aria-live="polite"
        className={`startup-loader${phase === "fading" ? " startup-loader--fading" : ""}`}
      >
        {/* Logo */}
        <div className="startup-logo-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Manageo"
            className="startup-logo"
            width={120}
            height={40}
          />
        </div>

        {/* Spinner + label */}
        <div className="startup-spinner-wrap" aria-hidden="true">
          <span className="startup-spinner" />
        </div>
        <p className="startup-label">Loading&hellip;</p>
      </div>

      {/* Scoped styles — self-contained, no external deps */}
      <style>{`
        .startup-loader {
          position: fixed;
          inset: 0;
          z-index: 99999;
          /* Match the dark app shell — no flash of white */
          background-color: #09090b;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /* Respect notch / Dynamic Island / home indicator */
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
          padding-left: env(safe-area-inset-left, 0px);
          padding-right: env(safe-area-inset-right, 0px);
          /* Smooth fade-out */
          opacity: 1;
          transition: opacity 0.3s ease;
          /* Prevent any touch pass-through during load */
          pointer-events: auto;
          /* GPU-composited layer — keeps it cheap */
          will-change: opacity;
        }

        .startup-loader--fading {
          opacity: 0;
          pointer-events: none;
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
          height: 36px;
          width: auto;
          object-fit: contain;
          /* Logo is on a transparent PNG — it renders on the dark bg correctly */
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
    </>
  );
}
