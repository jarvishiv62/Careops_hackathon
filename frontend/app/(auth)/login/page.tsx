// frontend/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("careops_remember_email");
    const savedPassword = localStorage.getItem("careops_remember_password");
    const savedRemember =
      localStorage.getItem("careops_remember_me") === "true";

    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setPassword(savedPassword || "");
      setRememberMe(savedRemember);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);

      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem("careops_remember_email", email);
        localStorage.setItem("careops_remember_password", password);
        localStorage.setItem("careops_remember_me", "true");
      } else {
        // Clear saved credentials
        localStorage.removeItem("careops_remember_email");
        localStorage.removeItem("careops_remember_password");
        localStorage.removeItem("careops_remember_me");
      }

      // Redirect to dashboard after successful login
      router.push("/app/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 card-gradient p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="heading-primary mb-2">VitalFlow</h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-gray-300"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-2"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field mt-2"
            />
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-gray-300"
            >
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-400">Don't have an account? </span>
          <Link
            href="/register"
            className="text-gradient font-bold hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
