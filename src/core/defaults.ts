import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 2,
  enabled: true,
  layoutPreference: "auto",
  tabsEnabled: true,
  restoreSession: false,
  hidePosters: true,
  colorizeTabs: true,
  previewEnabled: false,
  creditEnabled: true,
  previewClickMode: "double",
  maxLiveFrames: 3,
  paneSizes: { sidebar: 216, listRatio: 0.35 },
};

export const SESSION_SCHEMA_VERSION = 1 as const;
export const SETTINGS_KEY = "linuxdo-ultimate:settings";
export const SESSION_KEY_PREFIX = "linuxdo-ultimate:session:";
export const SESSION_ID_KEY = "linuxdo-ultimate:session-id";
export const SESSION_OWNER_KEY_PREFIX = "linuxdo-ultimate:session-owner:";
export const SESSION_INDEX_KEY = "linuxdo-ultimate:session-index";
export const LATEST_SESSION_KEY = "linuxdo-ultimate:latest-session";
export const LATEST_SESSION_CANDIDATE_KEY = "linuxdo-ultimate:latest-session-candidate";

export function normalizeSettings(value: unknown): Settings {
  if (!value || typeof value !== "object") return structuredClone(DEFAULT_SETTINGS);
  const source = value as Partial<Settings>;
  const isCurrentSchema = source.schemaVersion === DEFAULT_SETTINGS.schemaVersion;
  const paneSizes = source.paneSizes && typeof source.paneSizes === "object"
    ? source.paneSizes as Partial<Settings["paneSizes"]> & { list?: unknown }
    : {};
  return {
    ...DEFAULT_SETTINGS,
    enabled: true,
    layoutPreference: source.layoutPreference === "two" || source.layoutPreference === "three" ? source.layoutPreference : "auto",
    tabsEnabled: source.tabsEnabled !== false,
    restoreSession: isCurrentSchema && source.restoreSession === true,
    hidePosters: source.hidePosters !== false,
    colorizeTabs: source.colorizeTabs !== false,
    previewEnabled: source.previewEnabled === true,
    creditEnabled: source.creditEnabled !== false,
    previewClickMode: source.previewClickMode === "single" ? "single" : "double",
    maxLiveFrames: clampSetting(source.maxLiveFrames, 1, 10, DEFAULT_SETTINGS.maxLiveFrames),
    paneSizes: {
      sidebar: clampSetting(paneSizes.sidebar, 160, 360, DEFAULT_SETTINGS.paneSizes.sidebar),
      listRatio: clampRatio(paneSizes.listRatio, DEFAULT_SETTINGS.paneSizes.listRatio),
    },
  };
}

function clampSetting(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(max, Math.max(min, value)))
    : fallback;
}

function clampRatio(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(0.7, Math.max(0.3, value))
    : fallback;
}
