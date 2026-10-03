import fs from "node:fs/promises";
import path from "node:path";
import { getPrisma } from "../db/prismaClient";

export interface FloatingVideoConfig {
  id: string;
  title: string;
  badgeText: string;
  showBadge: boolean;
  videoUrl: string;
  sourceType: "upload" | "link";
  targetUrl: string;
  buttonLabel: string;
  isEnabled: boolean;
  displayScope: "all" | "home";
  updatedAt: string;
}

export const DEFAULT_FLOATING_VIDEO: FloatingVideoConfig = {
  id: "default-floating-video",
  title: "Glow & Groom",
  badgeText: "LIVE",
  showBadge: true,
  videoUrl: "/assets/video/intro1.mp4",
  sourceType: "link",
  targetUrl: "/collections",
  buttonLabel: "Shop Now",
  isEnabled: true,
  displayScope: "all",
  updatedAt: new Date().toISOString(),
};

const DATA_FILE_PATH = path.join(process.cwd(), "data", "floating-video.json");

let cachedConfig: FloatingVideoConfig | null = null;
let lastReadTime = 0;
const CACHE_TTL_MS = 2000;

// Helper to read from JSON file
async function readConfigFile(): Promise<FloatingVideoConfig> {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      id: parsed.id || DEFAULT_FLOATING_VIDEO.id,
      title: parsed.title ?? DEFAULT_FLOATING_VIDEO.title,
      badgeText: parsed.badgeText ?? DEFAULT_FLOATING_VIDEO.badgeText,
      showBadge: parsed.showBadge !== undefined ? Boolean(parsed.showBadge) : DEFAULT_FLOATING_VIDEO.showBadge,
      videoUrl: parsed.videoUrl || DEFAULT_FLOATING_VIDEO.videoUrl,
      sourceType: parsed.sourceType === "upload" ? "upload" : "link",
      targetUrl: parsed.targetUrl ?? DEFAULT_FLOATING_VIDEO.targetUrl,
      buttonLabel: parsed.buttonLabel ?? DEFAULT_FLOATING_VIDEO.buttonLabel,
      isEnabled: parsed.isEnabled !== undefined ? Boolean(parsed.isEnabled) : DEFAULT_FLOATING_VIDEO.isEnabled,
      displayScope: parsed.displayScope === "home" ? "home" : "all",
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    // If file doesn't exist, create it with default
    try {
      await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify(DEFAULT_FLOATING_VIDEO, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not initialize floating-video.json:", e);
    }
    return { ...DEFAULT_FLOATING_VIDEO };
  }
}

// Helper to write to JSON file
async function writeConfigFile(config: FloatingVideoConfig): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write floating-video.json:", error);
  }
}

// Database sync helper
let tableChecked = false;
async function ensureDbTable(): Promise<void> {
  if (tableChecked) return;
  try {
    const prisma = await getPrisma();
    if (!prisma) return;
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS cevonne_floating_video (
        id TEXT PRIMARY KEY,
        title TEXT,
        badge_text TEXT,
        show_badge BOOLEAN,
        video_url TEXT,
        source_type TEXT,
        target_url TEXT,
        button_label TEXT,
        is_enabled BOOLEAN,
        display_scope TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    tableChecked = true;
  } catch {
    // DB might be offline or permissions restricted, fallback to JSON
  }
}

export async function getFloatingVideoConfig(): Promise<FloatingVideoConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastReadTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // First try DB if available
  try {
    await ensureDbTable();
    const prisma = await getPrisma();
    if (prisma) {
      const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, title, badge_text, show_badge, video_url, source_type, target_url, button_label, is_enabled, display_scope, updated_at
        FROM cevonne_floating_video
        ORDER BY updated_at DESC
        LIMIT 1;
      `);
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        const config: FloatingVideoConfig = {
          id: row.id || "default-floating-video",
          title: row.title ?? DEFAULT_FLOATING_VIDEO.title,
          badgeText: row.badge_text ?? DEFAULT_FLOATING_VIDEO.badgeText,
          showBadge: row.show_badge !== null ? Boolean(row.show_badge) : true,
          videoUrl: row.video_url || DEFAULT_FLOATING_VIDEO.videoUrl,
          sourceType: row.source_type === "upload" ? "upload" : "link",
          targetUrl: row.target_url ?? "",
          buttonLabel: row.button_label ?? "Shop Now",
          isEnabled: row.is_enabled !== null ? Boolean(row.is_enabled) : true,
          displayScope: row.display_scope === "home" ? "home" : "all",
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
        };
        cachedConfig = config;
        lastReadTime = now;
        // Keep JSON file in sync
        void writeConfigFile(config);
        return config;
      }
    }
  } catch {
    // Ignore DB error, fall back to file
  }

  const fileConfig = await readConfigFile();
  cachedConfig = fileConfig;
  lastReadTime = now;
  return fileConfig;
}

export async function updateFloatingVideoConfig(
  updates: Partial<FloatingVideoConfig>
): Promise<FloatingVideoConfig> {
  const current = await getFloatingVideoConfig();
  const updated: FloatingVideoConfig = {
    ...current,
    ...updates,
    id: current.id || "default-floating-video",
    updatedAt: new Date().toISOString(),
  };

  cachedConfig = updated;
  lastReadTime = Date.now();

  // Write to JSON file
  await writeConfigFile(updated);

  // Sync to database
  try {
    await ensureDbTable();
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO cevonne_floating_video (id, title, badge_text, show_badge, video_url, source_type, target_url, button_label, is_enabled, display_scope, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          badge_text = EXCLUDED.badge_text,
          show_badge = EXCLUDED.show_badge,
          video_url = EXCLUDED.video_url,
          source_type = EXCLUDED.source_type,
          target_url = EXCLUDED.target_url,
          button_label = EXCLUDED.button_label,
          is_enabled = EXCLUDED.is_enabled,
          display_scope = EXCLUDED.display_scope,
          updated_at = NOW();
      `,
        updated.id,
        updated.title,
        updated.badgeText,
        updated.showBadge,
        updated.videoUrl,
        updated.sourceType,
        updated.targetUrl,
        updated.buttonLabel,
        updated.isEnabled,
        updated.displayScope
      );
    }
  } catch (error) {
    console.warn("Could not sync floating video to DB:", error);
  }

  return updated;
}

export async function deleteFloatingVideoConfig(): Promise<FloatingVideoConfig> {
  const emptyConfig: FloatingVideoConfig = {
    ...DEFAULT_FLOATING_VIDEO,
    videoUrl: "",
    isEnabled: false,
    updatedAt: new Date().toISOString(),
  };

  cachedConfig = emptyConfig;
  lastReadTime = Date.now();

  await writeConfigFile(emptyConfig);

  try {
    await ensureDbTable();
    const prisma = await getPrisma();
    if (prisma) {
      await prisma.$executeRawUnsafe(`DELETE FROM cevonne_floating_video WHERE id = $1;`, emptyConfig.id);
    }
  } catch (error) {
    console.warn("Could not delete floating video from DB:", error);
  }

  return emptyConfig;
}
