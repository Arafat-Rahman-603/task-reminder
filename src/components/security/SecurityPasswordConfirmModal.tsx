"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, X, Eye, EyeOff, Loader2, AlertCircle, Lock } from "lucide-react";
import { shouldAutoFocus } from "@/lib/device";

interface SecurityPasswordConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  placeholder?: string;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export function SecurityPasswordConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  placeholder = "Enter account password or App passcode...",
  confirmLabel = "Verify & Confirm",
  variant = "primary",
  onConfirm,
}: SecurityPasswordConfirmModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPassword("");
      setError("");
      setShowPassword(false);
    }
  }

  useEffect(() => {
    if (isOpen && shouldAutoFocus()) {
      const t = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

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

  const isDanger = variant === "danger";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password verification is required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await onConfirm(password);
      if (res.success) {
        setPassword("");
        onClose();
      } else {
        setError(res.error || "Incorrect password. Please try again.");
      }
    } catch (err: unknown) {
      const eObj = err as Error;
      setError(eObj.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-surface-container border-t sm:border border-surface-container-high shadow-2xl p-5 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-200 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 aspect-square ${
                isDanger
                  ? "bg-error/15 border-error/30 text-error"
                  : "bg-stitch-primary/15 border-stitch-primary/30 text-stitch-primary"
              }`}
            >
              <Shield className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-on-surface truncate">{title}</h3>
              <p className="text-xs text-on-surface-variant">Security verification required</p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4" autoComplete="off">
          <p className="text-xs text-on-surface-variant leading-relaxed">{description}</p>

          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-xs text-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-on-surface-variant">
              Verification Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                autoFocus={shouldAutoFocus()}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder={placeholder}
                disabled={loading}
                className={`w-full h-11 sm:h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-high border border-surface-container-highest text-base sm:text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:ring-2 disabled:opacity-50 ${
                  isDanger ? "focus:ring-error" : "focus:ring-stitch-primary"
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
              className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className={`flex items-center gap-1.5 px-5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isDanger
                  ? "bg-error text-on-error hover:opacity-90"
                  : "bg-stitch-primary text-on-primary hover:bg-primary-fixed-dim"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
