"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Registration failed");
        setLoading(false);
      } else {
        router.push("/login");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Sign up to get started">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-md text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm transition-colors"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <label className="block text-sm font-medium text-foreground">Confirm Password</label>
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
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
