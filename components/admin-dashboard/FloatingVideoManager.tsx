"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  UploadCloud,
  Link as LinkIcon,
  Eye,
  CheckCircle2,
  Trash2,
  Save,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  X,
  Play,
  Sparkles,
  Smartphone,
  Laptop,
  AlertCircle,
  FileVideo,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/admin-dashboard/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import type { FloatingVideoConfig } from "@/server/services/floating-video";

const PRESET_VIDEOS = [
  { name: "Intro Video 1 (Local)", url: "/assets/video/intro1.mp4", size: "5.6 MB" },
  { name: "Intro Video 2 (Local)", url: "/assets/video/intro2.mp4", size: "5.6 MB" },
  { name: "Intro Video 3 (Local)", url: "/assets/video/intro3.mp4", size: "5.6 MB" },
  { name: "Cevonne Reel (CDN)", url: "https://cdn.cevonne.com/wf1/evergreen-backup-reel.mp4", size: "Cloud" },
];

export default function FloatingVideoManager() {
  const { authFetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [isEnabled, setIsEnabled] = useState(true);
  const [displayScope, setDisplayScope] = useState<"all" | "home">("all");
  const [sourceType, setSourceType] = useState<"upload" | "link">("link");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("Glow & Groom");
  const [showBadge, setShowBadge] = useState(true);
  const [badgeText, setBadgeText] = useState("LIVE");
  const [targetUrl, setTargetUrl] = useState("/collections");
  const [buttonLabel, setButtonLabel] = useState("Shop Now");

  // Simulator State
  const [simMuted, setSimMuted] = useState(true);
  const [simOpen, setSimOpen] = useState(true);
  const [simDevice, setSimDevice] = useState<"mobile" | "desktop">("mobile");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Fetch current config
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await (authFetch ? authFetch("/api/admin/floating-video") : fetch("/api/admin/floating-video"));
      if (res.ok) {
        const data = await res.json();
        if (data.video) {
          const v: FloatingVideoConfig = data.video;
          setIsEnabled(v.isEnabled ?? true);
          setDisplayScope(v.displayScope ?? "all");
          setSourceType(v.sourceType ?? "link");
          setVideoUrl(v.videoUrl ?? "/assets/video/intro1.mp4");
          setTitle(v.title ?? "Glow & Groom");
          setShowBadge(v.showBadge ?? true);
          setBadgeText(v.badgeText ?? "LIVE");
          setTargetUrl(v.targetUrl ?? "/collections");
          setButtonLabel(v.buttonLabel ?? "Shop Now");
        }
      }
    } catch (err) {
      console.error("Failed to load video config:", err);
      toast.error("Failed to load floating video settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConfig();
  }, []);

  // Save Config
  const handleSave = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please provide or upload a video URL.");
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<FloatingVideoConfig> = {
        isEnabled,
        displayScope,
        sourceType,
        videoUrl: videoUrl.trim(),
        title: title.trim() || "Featured Video",
        showBadge,
        badgeText: badgeText.trim() || "LIVE",
        targetUrl: targetUrl.trim(),
        buttonLabel: buttonLabel.trim() || "Shop Now",
      };

      const res = await (authFetch
        ? authFetch("/api/admin/floating-video", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        : fetch("/api/admin/floating-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }));

      if (res.ok) {
        toast.success("Floating video settings saved and published!");
        // Dispatch window event so any open storefront tabs/components can update
        window.dispatchEvent(new CustomEvent("floating-video:refresh"));
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to save floating video settings.");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Remove Video
  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove and disable the floating video?")) {
      return;
    }

    setSaving(true);
    try {
      const res = await (authFetch
        ? authFetch("/api/admin/floating-video", { method: "DELETE" })
        : fetch("/api/admin/floating-video", { method: "DELETE" }));

      if (res.ok) {
        setIsEnabled(false);
        setVideoUrl("");
        setUploadedFileName(null);
        toast.success("Floating video removed from storefront.");
        window.dispatchEvent(new CustomEvent("floating-video:refresh"));
      } else {
        toast.error("Failed to remove floating video.");
      }
    } catch {
      toast.error("An error occurred while removing video.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Video File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file (.mp4, .webm, .mov).");
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setUploadedFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "VIDEO");

      setUploadProgress(40);

      const res = await (authFetch
        ? authFetch("/api/uploads", {
            method: "POST",
            body: formData,
          })
        : fetch("/api/uploads", {
            method: "POST",
            body: formData,
          }));

      setUploadProgress(85);

      if (res.ok) {
        const data = await res.json();
        const finalUrl = data.url || data.publicUrl;
        setVideoUrl(finalUrl);
        setSourceType("upload");
        setUploadProgress(100);
        toast.success(`Video "${file.name}" uploaded successfully!`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to upload video.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Error uploading video file.");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb]">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          {/* Mobile Header Bar */}
          <div className="sticky top-0 z-20 grid grid-cols-[auto,1fr] items-center gap-2 border-b bg-white/80 px-3 py-2 backdrop-blur md:hidden">
            <SidebarTrigger className="-ml-1" />
            <span className="text-sm font-medium text-primary/80">Menu</span>
          </div>

          {/* Page Header */}
          <header className="border-b border-border/60 bg-white px-4 py-5 shadow-xs md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Floating Video Section
                  </h1>
                  <Badge
                    variant={isEnabled ? "default" : "secondary"}
                    className={
                      isEnabled
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-neutral-200 text-neutral-700"
                    }
                  >
                    {isEnabled ? "Storefront Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add, customize, and manage the floating picture-in-picture video widget for your storefront and home page.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchConfig}
                  disabled={loading || saving}
                  className="rounded-lg shadow-xs"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-lg shadow-xs"
                >
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" />
                    View Storefront
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={saving || !videoUrl}
                  className="rounded-lg shadow-xs"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Video
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm"
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save & Publish
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 space-y-6 px-4 pb-12 pt-6 md:px-8">
            {/* Top Quick Status Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-neutral-200/80 bg-white shadow-xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Visibility Status
                    </p>
                    <p className="text-xl font-bold mt-1 text-neutral-900">
                      {isEnabled ? "Live on Site" : "Hidden"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isEnabled ? "Visible to all visitors" : "Not displayed"}
                    </p>
                  </div>
                  <div
                    className={`rounded-xl p-3 ${
                      isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <Video className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200/80 bg-white shadow-xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Target Pages
                    </p>
                    <p className="text-xl font-bold mt-1 text-neutral-900">
                      {displayScope === "home" ? "Home Page Only" : "All Web Pages"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayScope === "home" ? "Only on landing page" : "Storewide floating PIP"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200/80 bg-white shadow-xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Video Source
                    </p>
                    <p className="text-xl font-bold mt-1 text-neutral-900 capitalize">
                      {sourceType === "upload" ? "Uploaded File" : "Direct Link"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[130px]">
                      {videoUrl ? videoUrl.split("/").pop() : "None selected"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    {sourceType === "upload" ? (
                      <UploadCloud className="h-5 w-5" />
                    ) : (
                      <LinkIcon className="h-5 w-5" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200/80 bg-white shadow-xs">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Overlay Badge
                    </p>
                    <p className="text-xl font-bold mt-1 text-neutral-900">
                      {showBadge ? badgeText || "LIVE" : "Hidden"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {showBadge ? "Red live indicator active" : "No badge shown"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                    <span className="flex h-3 w-3 rounded-full bg-rose-600 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form & Live Simulator Columns */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="space-y-6 lg:col-span-7">
                {/* 1. Visibility & Placement */}
                <Card className="border border-neutral-200/80 bg-white shadow-xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      1. Display & Visibility Controls
                    </CardTitle>
                    <CardDescription>
                      Control whether the floating video is visible on the site and where it should appear.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-semibold text-neutral-900">
                          Enable Floating Video
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Toggle on to show the floating video widget to visitors.
                        </p>
                      </div>
                      <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                        Display Placement
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDisplayScope("all")}
                          className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                            displayScope === "all"
                              ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                              : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                          }`}
                        >
                          <span className="text-sm font-bold">All Website Pages</span>
                          <span
                            className={`text-xs mt-1 ${
                              displayScope === "all" ? "text-neutral-300" : "text-muted-foreground"
                            }`}
                          >
                            Shows everywhere on storefront
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDisplayScope("home")}
                          className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                            displayScope === "home"
                              ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                              : "border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300"
                          }`}
                        >
                          <span className="text-sm font-bold">Home Page Only</span>
                          <span
                            className={`text-xs mt-1 ${
                              displayScope === "home" ? "text-neutral-300" : "text-muted-foreground"
                            }`}
                          >
                            Only displays on landing page
                          </span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Video Source (Upload vs Link) */}
                <Card className="border border-neutral-200/80 bg-white shadow-xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      2. Video Source (Upload File or Enter Link)
                    </CardTitle>
                    <CardDescription>
                      You can either upload a video from your computer or paste an external video link. Both methods work automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs
                      value={sourceType}
                      onValueChange={(val) => setSourceType(val as "upload" | "link")}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2 p-1 bg-neutral-100 rounded-xl">
                        <TabsTrigger
                          value="link"
                          className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:text-black shadow-none data-[state=active]:shadow-xs"
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          By Link / URL
                        </TabsTrigger>
                        <TabsTrigger
                          value="upload"
                          className="rounded-lg font-semibold data-[state=active]:bg-white data-[state=active]:text-black shadow-none data-[state=active]:shadow-xs"
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Upload Video File
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab 1: Video Link */}
                      <TabsContent value="link" className="pt-4 space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="video-url" className="text-xs font-semibold text-neutral-800">
                            Video Stream URL (MP4, WebM, or CDN)
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="video-url"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="https://example.com/video.mp4 or /assets/video/intro1.mp4"
                              className="rounded-lg"
                            />
                            {videoUrl && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  toast.success("Video URL set!");
                                }}
                                className="rounded-lg shrink-0"
                              >
                                Test
                              </Button>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Supports direct video links (MP4, WebM) or Cloudflare R2 / S3 URLs.
                          </p>
                        </div>

                        {/* Presets */}
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Quick Select Preset Videos
                          </Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PRESET_VIDEOS.map((preset) => (
                              <button
                                key={preset.url}
                                type="button"
                                onClick={() => {
                                  setVideoUrl(preset.url);
                                  setSourceType("link");
                                  toast.info(`Selected ${preset.name}`);
                                }}
                                className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-all ${
                                  videoUrl === preset.url
                                    ? "border-neutral-900 bg-neutral-900 text-white font-medium"
                                    : "border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/80 text-neutral-800"
                                }`}
                              >
                                <span className="truncate">{preset.name}</span>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] ml-2 ${
                                    videoUrl === preset.url ? "bg-neutral-800 text-neutral-200" : ""
                                  }`}
                                >
                                  {preset.size}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Tab 2: Upload Video File */}
                      <TabsContent value="upload" className="pt-4 space-y-4">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/mov"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                            uploading
                              ? "border-neutral-400 bg-neutral-50 pointer-events-none"
                              : "border-neutral-300 hover:border-neutral-900 hover:bg-neutral-50/70"
                          }`}
                        >
                          <div className="rounded-full bg-neutral-100 p-4 mb-3 text-neutral-700">
                            {uploading ? (
                              <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
                            ) : (
                              <FileVideo className="h-8 w-8 text-neutral-900" />
                            )}
                          </div>

                          <p className="text-sm font-bold text-neutral-900">
                            {uploading ? "Uploading video..." : "Click or drag video file here"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Supports MP4, WebM, MOV (Max 50MB)
                          </p>

                          {uploadProgress > 0 && (
                            <div className="w-full max-w-xs mt-4">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                                <div
                                  className="h-full bg-neutral-900 transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                {uploadProgress}% uploaded
                              </span>
                            </div>
                          )}
                        </div>

                        {uploadedFileName && videoUrl && (
                          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-emerald-900">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold truncate">{uploadedFileName}</p>
                                <p className="text-[10px] text-emerald-700 truncate">{videoUrl}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setVideoUrl("");
                                setUploadedFileName(null);
                              }}
                              className="text-emerald-800 hover:text-red-600 hover:bg-emerald-100/60"
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* 3. Title, Badge & Action CTA */}
                <Card className="border border-neutral-200/80 bg-white shadow-xs">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">
                      3. Badge, Title & Button Configuration
                    </CardTitle>
                    <CardDescription>
                      Customize the text label, live badge, and destination link for customers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Title */}
                      <div className="space-y-1.5">
                        <Label htmlFor="video-title" className="text-xs font-semibold text-neutral-800">
                          Video Title / Caption
                        </Label>
                        <Input
                          id="video-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Glow & Groom Essentials"
                          className="rounded-lg"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Shown at bottom of floating video overlay.
                        </p>
                      </div>

                      {/* Badge Text */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="badge-text" className="text-xs font-semibold text-neutral-800">
                            Badge Text
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor="badge-toggle" className="text-[11px] text-muted-foreground">
                              Show
                            </Label>
                            <Switch
                              id="badge-toggle"
                              checked={showBadge}
                              onCheckedChange={setShowBadge}
                            />
                          </div>
                        </div>
                        <Input
                          id="badge-text"
                          value={badgeText}
                          onChange={(e) => setBadgeText(e.target.value)}
                          placeholder="LIVE, HOT, NEW, 50% OFF"
                          disabled={!showBadge}
                          className="rounded-lg uppercase font-bold tracking-wider"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Red pill badge displayed in top corner.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Target Link */}
                      <div className="space-y-1.5">
                        <Label htmlFor="target-url" className="text-xs font-semibold text-neutral-800">
                          Target URL / Product Link
                        </Label>
                        <Input
                          id="target-url"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          placeholder="/collections or /product/slug"
                          className="rounded-lg"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Where user is directed when tapping &quot;Shop Now&quot;.
                        </p>
                      </div>

                      {/* Button Label */}
                      <div className="space-y-1.5">
                        <Label htmlFor="btn-label" className="text-xs font-semibold text-neutral-800">
                          Call-to-Action Label
                        </Label>
                        <Input
                          id="btn-label"
                          value={buttonLabel}
                          onChange={(e) => setButtonLabel(e.target.value)}
                          placeholder="Shop Now, View Offer"
                          className="rounded-lg"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Label on the interactive action button.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Live Interactive Storefront Simulator (5 cols) */}
              <div className="space-y-4 lg:col-span-5">
                <Card className="border border-neutral-200/80 bg-white shadow-xs overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-neutral-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Eye className="h-4 w-4 text-rose-600" />
                          Live Storefront Simulator
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Exact live preview matching reference image
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 rounded-lg border bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => setSimDevice("mobile")}
                          className={`rounded p-1 text-xs transition-colors ${
                            simDevice === "mobile"
                              ? "bg-neutral-900 text-white"
                              : "text-neutral-500 hover:text-black"
                          }`}
                          title="Mobile Preview"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimDevice("desktop")}
                          className={`rounded p-1 text-xs transition-colors ${
                            simDevice === "desktop"
                              ? "bg-neutral-900 text-white"
                              : "text-neutral-500 hover:text-black"
                          }`}
                          title="Desktop View"
                        >
                          <Laptop className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 flex flex-col items-center justify-center bg-neutral-100/70">
                    {/* Phone Frame Simulator */}
                    <div className="relative w-full max-w-[320px] rounded-[36px] border-[6px] border-neutral-800 bg-white shadow-2xl overflow-hidden aspect-[9/18]">
                      {/* Phone Speaker Notch */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-28 bg-neutral-800 rounded-full z-30" />

                      {/* Mock Storefront Background Content */}
                      <div className="relative h-full w-full overflow-y-auto bg-[#faf6f3] pt-8 pb-16 [scrollbar-width:none]">
                        {/* Mock Search Bar */}
                        <div className="px-3 pt-2">
                          <div className="flex items-center gap-2 rounded-full border border-purple-200 bg-white px-3 py-1.5 shadow-xs">
                            <span className="text-neutral-400 text-xs">🔍</span>
                            <span className="text-xs text-neutral-500">laptops, lipstick...</span>
                          </div>
                        </div>

                        {/* Mock Category Bar */}
                        <div className="flex gap-2 px-3 pt-3 overflow-x-hidden text-[10px] font-semibold text-neutral-600">
                          <span className="rounded-full bg-purple-100 text-purple-900 px-2 py-0.5">Home</span>
                          <span className="px-2 py-0.5 text-neutral-500">Beauty</span>
                          <span className="px-2 py-0.5 text-neutral-500">Appliances</span>
                        </div>

                        {/* Festive Banner Mock */}
                        <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 p-3 shadow-xs">
                          <p className="text-[11px] font-bold text-purple-950">Festive celebrations</p>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {["Diya", "Essentials", "Glow", "Decor"].map((item, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <div className="h-8 w-8 rounded-lg bg-white/80 shadow-xs flex items-center justify-center text-[10px]">
                                  ✨
                                </div>
                                <span className="text-[8px] mt-1 text-neutral-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Product Grid Mock */}
                        <div className="grid grid-cols-2 gap-2 p-3">
                          {[
                            { name: "BSFA Adjustable Akhand Deep", price: "₹698", off: "80% OFF" },
                            { name: "Ein Sof Akhand Jyoti Diya", price: "₹849", off: "61% OFF" },
                            { name: "Cevonne Dewy Glow Serum", price: "₹1,299", off: "40% OFF" },
                            { name: "Satin Velvet Lip Cream", price: "₹899", off: "25% OFF" },
                          ].map((prod, i) => (
                            <div key={i} className="rounded-xl border border-neutral-100 bg-white p-2 shadow-xs">
                              <div className="h-20 w-full rounded-lg bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                                Product {i + 1}
                              </div>
                              <p className="text-[10px] font-bold text-neutral-900 truncate mt-1.5">
                                {prod.name}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-bold text-neutral-900">{prod.price}</span>
                                <span className="text-[9px] font-bold text-emerald-600">{prod.off}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* THE FLOATING VIDEO SECTION (Exactly as in Reference Image) */}
                        {isEnabled && videoUrl && simOpen && (
                          <div className="absolute bottom-16 right-2.5 z-40">
                            <div className="relative flex h-40 w-28 flex-col justify-between overflow-hidden rounded-2xl border border-white/50 bg-black shadow-2xl">
                              {/* Video Element */}
                              <video
                                src={videoUrl}
                                autoPlay
                                loop
                                muted={simMuted}
                                playsInline
                                className="absolute inset-0 h-full w-full object-cover"
                              />

                              {/* Top Bar: LIVE badge & Close */}
                              <div className="relative z-10 flex w-full items-center justify-between p-1.5">
                                {showBadge ? (
                                  <div className="flex items-center gap-1 rounded-full bg-rose-600/95 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow-sm">
                                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    <span>{badgeText || "LIVE"}</span>
                                  </div>
                                ) : (
                                  <div />
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSimOpen(false);
                                  }}
                                  className="flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90"
                                  title="Close"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>

                              {/* Sound Toggle */}
                              <div className="relative z-10 flex items-center justify-end px-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSimMuted(!simMuted)}
                                  className="flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                                  title={simMuted ? "Unmute" : "Mute"}
                                >
                                  {simMuted ? (
                                    <VolumeX className="h-2.5 w-2.5" />
                                  ) : (
                                    <Volume2 className="h-2.5 w-2.5 text-amber-400" />
                                  )}
                                </button>
                              </div>

                              {/* Bottom Gradient with Title */}
                              <div className="relative z-10 w-full bg-gradient-to-t from-black via-black/60 to-transparent p-2 pt-4">
                                <p className="truncate text-[10px] font-semibold text-white drop-shadow-sm">
                                  {title || "Featured Video"}
                                </p>
                                {buttonLabel && (
                                  <p className="text-[8px] font-medium text-amber-300 flex items-center gap-0.5">
                                    <span>{buttonLabel}</span>
                                    <span>→</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reopen simulator pill if closed */}
                        {!simOpen && isEnabled && (
                          <button
                            type="button"
                            onClick={() => setSimOpen(true)}
                            className="absolute bottom-16 right-2 z-40 rounded-full bg-rose-600 px-2 py-1 text-[9px] font-bold text-white shadow-md flex items-center gap-1"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            <span>{badgeText || "LIVE"}</span>
                          </button>
                        )}

                        {/* Mock Mobile Bottom Nav */}
                        <div className="absolute bottom-0 left-0 right-0 z-30 flex h-12 w-full items-center justify-around border-t border-neutral-200 bg-white/95 px-2">
                          <span className="text-[10px] font-bold text-neutral-900">🏠 Home</span>
                          <span className="text-[10px] text-neutral-500">🔍 Search</span>
                          <span className="text-[10px] text-neutral-500">🛍️ Cart</span>
                          <span className="text-[10px] text-neutral-500">👤 Account</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex w-full items-center justify-between text-xs text-neutral-600">
                      <span>Simulator Controls:</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSimOpen(true);
                          setSimMuted(true);
                        }}
                        className="h-7 text-xs"
                      >
                        Reset Simulator
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
