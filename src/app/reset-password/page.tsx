"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

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
      <form className="space-y-4" onSubmit={handleSubmit} method="POST">
        {error && (
          <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-md text-center">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            required
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
            className="text-center tracking-[0.5em] font-mono"
            maxLength={6}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="pr-16"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Must be at least 6 characters.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={loading || !otp || !newPassword || !confirmPassword}>
            {loading ? "Resetting..." : "Reset Password"}
          </Button>
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
