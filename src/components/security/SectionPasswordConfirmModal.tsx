"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, X, Eye, EyeOff, Loader2, AlertCircle, Shield } from "lucide-react";

interface SectionPasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName: string;
  isLocking: boolean; // true = locking, false = unlocking
  onConfirm: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export function SectionPasswordConfirmModal({
  isOpen,
  onClose,
  sectionName,
  isLocking,
  onConfirm,
}: SectionPasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError("");
      setShowPassword(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your section security password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await onConfirm(password);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || "Incorrect password. Please try again.");
      }
    } catch (err: unknown) { const error = err as Error;
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-surface-container border border-surface-container-high shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-stitch-primary/15 border border-stitch-primary/30 flex items-center justify-center text-stitch-primary shrink-0 aspect-square">
              <Shield className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {isLocking ? "Confirm Section Lock" : "Confirm Section Unlock"}
              </h3>
              <p className="text-xs text-on-surface-variant">Security verification required</p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Enter your Section Security Password to {isLocking ? "lock" : "unlock"}{" "}
            <strong className="text-on-surface font-semibold">&ldquo;{sectionName}&rdquo;</strong>.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-xs text-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-on-surface-variant">
              Section Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Enter password..."
                disabled={loading}
                className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-high border border-surface-container-highest text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-stitch-primary disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-container-high">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-stitch-primary text-on-primary text-xs font-semibold hover:bg-primary-fixed-dim transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLocking ? "Lock Section" : "Unlock Section"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
