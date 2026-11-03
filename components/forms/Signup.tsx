"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link, useNavigate } from "@/lib/router";
import axios from "axios";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { loadGoogleScript, triggerGoogleSignIn } from "@/lib/googleAuth";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const SIGNUP_CAMPAIGN_IMAGE =
  "https://cdn.cevonne.com/assets/images/ChatGPT%20Image%20Aug%2010%2C%202026%2C%2012_05_13%20PM.png";

export default function Signup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    void loadGoogleScript();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/users/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (data?.otpRequired) {
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        toast.success(data?.message || "OTP sent to your email.");
        return;
      }

      toast.success("Account created successfully!");
      login?.(data.user, data.token);
      navigate("/account");
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Signup failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    await triggerGoogleSignIn(
      async ({ accessToken, credential }) => {
        try {
          const { data } = await api.post("/users/google", { accessToken, credential });
          toast.success(data?.message || "Account connected with Google!");
          login?.(data.user, data.token);
          navigate("/account");
        } catch (err: any) {
          const message =
            err.response?.data?.message ||
            err.message ||
            "Google sign-up failed. Please try again.";
          toast.error(message);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        toast.error(error);
      }
    );
  };

  return (
    <div className="auth-page min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] pt-16 md:pt-20 bg-[#faf8f5] text-[#181614] lg:grid lg:grid-cols-2">
      {/* Left side: Editorial Brand Campaign Image */}
      <aside className="relative hidden lg:block overflow-hidden bg-[#b9885b] min-h-[calc(100dvh-5rem)]">
        <Image
          src={SIGNUP_CAMPAIGN_IMAGE}
          alt="Cevonne beauty and perfume collection"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white space-y-2">
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-rose-200">
            Cevonne Privé
          </span>
          <h2 className="font-serif text-3xl font-light tracking-wide text-white drop-shadow-sm">
            Step into timeless beauty.
          </h2>
          <p className="text-xs text-white/80 max-w-sm tracking-wide leading-relaxed">
            Create an account to track orders, save bespoke shades, and receive exclusive VIP launches.
          </p>
        </div>
      </aside>

      {/* Right side: Focused Form Container */}
      <div className="flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] items-center justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-20">
        <div className={cn("w-full max-w-[420px] mx-auto", className)} {...props}>
          <header className="mb-7">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c897f] block mb-2">
              Join Cevonne
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-neutral-900">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              Join Cevonne to save favourites, track orders, and check out faster.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="name" className="block text-xs font-medium tracking-wide text-neutral-700 mb-1.5">
                Full name <span className="text-rose-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Priya Kapoor"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="h-12 rounded-xl border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium tracking-wide text-neutral-700 mb-1.5">
                Email address <span className="text-rose-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
                className="h-12 rounded-xl border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium tracking-wide text-neutral-700 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="h-12 rounded-xl border-neutral-300 bg-white px-4 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-800 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium tracking-wide text-neutral-700 mb-1.5">
                Confirm password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className="h-12 rounded-xl border-neutral-300 bg-white px-4 pr-12 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-800 transition"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 px-6 text-sm font-medium tracking-wide text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60 shadow-xs"
            >
              {isLoading ? "Creating account…" : "Create Account"}
            </button>

            <div className="pt-1.5">
              <div className="mb-3.5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-neutral-200" />
                <span className="text-[11px] font-medium tracking-wider text-neutral-400 uppercase">
                  OR
                </span>
                <span className="h-px flex-1 bg-neutral-200" />
              </div>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignUp}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 shadow-2xs disabled:opacity-50"
              >
                <GoogleMark />
                Sign up with Google
              </button>
            </div>

            <div className="space-y-2 pt-3 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-rose-700 transition"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-neutral-400 leading-normal">
                By creating an account, you agree to Cevonne&apos;s{" "}
                <Link href="/terms" className="underline hover:text-neutral-700">Terms</Link> and{" "}
                <Link href="/privacy-policy" className="underline hover:text-neutral-700">Privacy Policy</Link>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.31 2.98-7.36Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.75-5.58-4.11H3.08v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.42 13.93A6.02 6.02 0 0 1 6.11 12c0-.67.11-1.32.31-1.93V7.48H3.08A10 10 0 0 0 2 12c0 1.61.39 3.13 1.08 4.52l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.92 5.48l3.34 2.59C7.2 7.71 9.4 5.96 12 5.96Z" />
    </svg>
  );
}
