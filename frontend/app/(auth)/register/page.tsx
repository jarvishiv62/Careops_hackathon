// frontend/app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    businessName: "",
    contactEmail: "",
    address: "",
    timezone: "UTC",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(formData);
      // Redirect to onboarding after successful registration
      router.push("/app/onboarding");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 card-gradient p-8 shadow-2xl">
        <div className="text-center">
          <h1 className="heading-primary mb-2">Create Account</h1>
          <p className="text-gray-300">Get started with VitalFlow</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-300">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input-field mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input-field mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="input-field mt-2"
            />
            <p className="mt-1 text-xs text-gray-400">
              At least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div className="border-t border-gray-700/50 pt-4">
            <h3 className="font-bold text-gray-100">Business Information</h3>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="input-field mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300">
              Business Email *
            </label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              className="input-field mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300">
              Address (Optional)
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="input-field mt-2"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300">
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="input-field mt-2"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-400">Already have an account? </span>
          <Link
            href="/login"
            className="text-gradient font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
