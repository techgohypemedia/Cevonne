"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Link } from "@/lib/router";
import { API_BASE } from "@/lib/api";
import { Input } from "@/components/ui/input";

const FORGOT_PASSWORD_CAMPAIGN_IMAGE =
  "https://cdn.cevonne.com/assets/images/ChatGPT%20Image%20Aug%2010%2C%202026%2C%2012_20_49%20PM.png";
const FALLBACK_CAMPAIGN_IMAGE = "/assets/banners/the_campaign.jpg";

export default function ForgotPassword() {
  const [campaignImg, setCampaignImg] = useState(FORGOT_PASSWORD_CAMPAIGN_IMAGE);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to request a password reset.");
      }

      toast.success(payload?.message || "Password reset link sent to your email.");
    } catch (error: any) {
      toast.error(error?.message || "Unable to request a password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] pt-16 md:pt-20 bg-[#faf8f5] text-[#181614] lg:grid lg:grid-cols-2">
      <aside className="relative hidden lg:block overflow-hidden bg-[#bc8d68] min-h-[calc(100dvh-5rem)]">
        <Image
          src={campaignImg}
          alt="Cevonne beauty collection"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center"
          onError={() => setCampaignImg(FALLBACK_CAMPAIGN_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
        <div className="absolute bottom-10 left-10 right-10 text-white space-y-2">
          <span className="inline-block text-[11px] font-semibold tracking-[0.25em] uppercase text-rose-200">
            Account Recovery
          </span>
          <h2 className="font-serif text-3xl font-light tracking-wide text-white drop-shadow-sm">
            We will help you regain access.
          </h2>
          <p className="text-xs text-white/80 max-w-sm tracking-wide leading-relaxed">
            Enter your registered email and we will send you secure reset instructions.
          </p>
        </div>
      </aside>

      <div className="flex min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] items-center justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-[420px] mx-auto">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>

          <header className="mb-8">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9c897f] block mb-2">
              Forgot Password
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-neutral-900">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
              Enter your email address to receive password reset instructions.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium tracking-wide text-neutral-700 mb-1.5">
                Email address <span className="text-rose-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="h-12 rounded-xl border-neutral-300 bg-white px-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 px-6 text-sm font-medium tracking-wide text-white transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60 shadow-xs"
            >
              {isLoading ? "Sending link…" : "Send Reset Link"}
            </button>

            <p className="pt-4 text-center text-sm text-neutral-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-neutral-900 underline underline-offset-4 hover:text-rose-700 transition"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
