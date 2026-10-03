"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "@/lib/router";
import {
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Play,
  Pause,
  ExternalLink,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import type { FloatingVideoConfig } from "@/server/services/floating-video";

export default function FloatingVideoWidget() {
  const location = useLocation();
  const [config, setConfig] = useState<FloatingVideoConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch floating video config
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/floating-video");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.video) {
          setConfig(data.video);
        }
      } catch (err) {
        console.warn("Could not load floating video:", err);
      }
    };

    void fetchConfig();

    // Listen for custom event in case admin updates preview or saves
    const handleRefresh = () => {
      void fetchConfig();
    };
    window.addEventListener("floating-video:refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("floating-video:refresh", handleRefresh);
    };
  }, []);

  // Determine if video should show based on displayScope & pathname
  const currentPath = location.pathname;
  const shouldDisplayOnPage = useCallback(() => {
    if (!config || !config.isEnabled || !config.videoUrl) return false;
    // Don't show in admin routes or auth pages
    if (currentPath.startsWith("/dashboard") || currentPath.startsWith("/admin")) return false;
    if (currentPath === "/login" || currentPath === "/signup" || currentPath === "/checkout") return false;

    if (config.displayScope === "home") {
      return currentPath === "/" || currentPath === "";
    }
    return true;
  }, [config, currentPath]);

  // Handle video progress update
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.currentTarget;
    if (target.duration) {
      setProgress((target.currentTime / target.duration) * 100);
    }
  };

  // Toggle Mute
  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMuted((prev) => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !isMuted;
    }
  };

  // Toggle Play / Pause in expanded modal
  const togglePlayModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!modalVideoRef.current) return;
    if (modalVideoRef.current.paused) {
      modalVideoRef.current.play();
      setIsPlaying(true);
    } else {
      modalVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Open expanded view
  const handleCardClick = () => {
    setIsExpanded(true);
    setIsMuted(false); // Unmute on explicit user interaction
  };

  // Synchronize playback between small PIP and modal
  useEffect(() => {
    if (isExpanded) {
      if (videoRef.current && modalVideoRef.current) {
        modalVideoRef.current.currentTime = videoRef.current.currentTime;
        modalVideoRef.current.muted = isMuted;
        modalVideoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (modalVideoRef.current && videoRef.current) {
        videoRef.current.currentTime = modalVideoRef.current.currentTime;
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isExpanded, isMuted]);

  if (!config || !shouldDisplayOnPage() || isDismissed) {
    // If dismissed, show a small discreet reopen pill so user isn't permanently locked out
    if (isDismissed && config && shouldDisplayOnPage() && config.isEnabled) {
      return (
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-1.5 rounded-full border border-black/10 bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-white md:bottom-6 md:right-6"
          title="Open video"
          aria-label="Reopen floating video"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
          </span>
          <span className="uppercase text-[11px] font-bold text-rose-600">
            {config.badgeText || "Live"}
          </span>
          <span className="max-w-[80px] truncate text-[11px] font-medium text-neutral-600">
            {config.title}
          </span>
        </button>
      );
    }
    return null;
  }

  return (
    <>
      {/* Floating Picture-in-Picture Card (Matching Reference Image) */}
      <div
        className="fixed bottom-20 right-3.5 z-40 group cursor-pointer transition-all duration-300 md:bottom-6 md:right-6 animate-in fade-in slide-in-from-bottom-6"
        style={{ perspective: 1000 }}
      >
        <div
          onClick={handleCardClick}
          className="relative flex h-48 w-32 flex-col justify-between overflow-hidden rounded-2xl border border-white/40 bg-neutral-900 shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_20px_35px_-5px_rgba(0,0,0,0.35)] sm:h-52 sm:w-36 md:h-56 md:w-36"
        >
          {/* Main Video Stream */}
          <video
            ref={videoRef}
            src={config.videoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Top Bar: Badge & Action Buttons */}
          <div className="relative z-10 flex w-full items-center justify-between p-2">
            {/* LIVE Badge */}
            {config.showBadge ? (
              <div className="flex items-center gap-1 rounded-full bg-rose-600/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <span>{config.badgeText || "LIVE"}</span>
              </div>
            ) : (
              <div />
            )}

            {/* Close Button (✕) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white/90 backdrop-blur-md transition-colors hover:bg-black/80 hover:text-white"
              title="Close video"
              aria-label="Close floating video"
            >
              <X className="h-3 w-3 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Sound Toggle on Hover / Touch */}
          <div className="relative z-10 flex items-center justify-end px-2 opacity-90 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
              title={isMuted ? "Unmute sound" : "Mute sound"}
              aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            >
              {isMuted ? (
                <VolumeX className="h-3 w-3 stroke-[2]" />
              ) : (
                <Volume2 className="h-3 w-3 stroke-[2] text-amber-400" />
              )}
            </button>
          </div>

          {/* Bottom Title Bar with Gradient Overlay */}
          <div className="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-2.5 pt-6 px-2.5">
            <p className="truncate text-xs font-semibold text-white drop-shadow-sm">
              {config.title || "Featured Video"}
            </p>
            {config.buttonLabel && (
              <p className="flex items-center gap-1 text-[10px] font-medium text-amber-300 drop-shadow-sm">
                <span>{config.buttonLabel}</span>
                <span className="text-[10px]">→</span>
              </p>
            )}
          </div>

          {/* Progress Line */}
          <div className="absolute bottom-0 left-0 right-0 z-20 h-0.5 bg-white/20">
            <div
              className="h-full bg-rose-500 transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Modal View (When tapped / clicked) */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all animate-in fade-in"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative flex h-[85vh] max-h-[640px] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-white/20 bg-neutral-950 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Video Element */}
            <div className="relative h-full w-full bg-black" onClick={togglePlayModal}>
              <video
                ref={modalVideoRef}
                src={config.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="h-full w-full object-cover"
              />

              {/* Pause / Play central ripple indicator */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white shadow-xl">
                    <Play className="h-8 w-8 translate-x-0.5 fill-white text-white" />
                  </div>
                </div>
              )}

              {/* Top Controls Header */}
              <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
                <div className="flex items-center gap-2">
                  {config.showBadge && (
                    <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      {config.badgeText || "LIVE"}
                    </span>
                  )}
                  <span className="max-w-[170px] truncate text-sm font-semibold text-white drop-shadow">
                    {config.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-amber-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/70"
                    title="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Bottom Interactive Drawer / CTA */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-12 text-white">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-white drop-shadow">
                      {config.title}
                    </h3>
                    <p className="text-xs text-neutral-300">
                      Explore featured picks and special highlights.
                    </p>
                  </div>

                  {/* Target Action Button */}
                  {config.targetUrl && (
                    <a
                      href={config.targetUrl}
                      onClick={() => setIsExpanded(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{config.buttonLabel || "Shop Now"}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {/* Scrub Bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-rose-500 transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
