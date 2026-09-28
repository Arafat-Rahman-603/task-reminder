"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    // TODO: Connect to actual /api/auth/reset-password when implemented
    setTimeout(() => {
      setLoading(false);
      router.push("/login");
    }, 1000);
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter your verification code and new password">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-md text-center">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Verification Code</label>
          <input
            type="text"
            required
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm transition-colors text-center tracking-[0.5em] font-mono"
            maxLength={6}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm transition-colors"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Must be at least 6 characters.</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Confirm New Password</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm transition-colors"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !otp || !newPassword || !confirmPassword}
            className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 transition-colors"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Return to login
        </Link>
      </p>
    </AuthLayout>
  );
}
