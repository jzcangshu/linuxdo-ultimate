import { DEFAULT_SETTINGS, SESSION_SCHEMA_VERSION } from "./defaults";
import type { PaneSizes, SessionState, TopicTabState } from "./types";
import { normalizeCategoryColor } from "../discourse/category";

const MAX_TABS = 50;

function normalizePaneSizes(value: unknown, fallback: PaneSizes): PaneSizes {
  if (!value || typeof value !== "object") return { ...fallback };
  const candidate = value as Partial<PaneSizes> & { list?: unknown };
  return {
    sidebar: clampNumber(candidate.sidebar, 160, 360, fallback.sidebar),
    listRatio: clampRatio(candidate.listRatio, fallback.listRatio),
  };
}

function clampRatio(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(0.7, Math.max(0.3, value))
    : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(max, Math.max(min, value)))
    : fallback;
}

function normalizeTab(value: unknown): TopicTabState | null {
  if (!value || typeof value !== "object") return null;
  const tab = value as Partial<TopicTabState>;
  if (typeof tab.id !== "string" || typeof tab.topicId !== "string" || typeof tab.url !== "string") return null;
  return {
    id: tab.id,
    topicId: tab.topicId,
    url: tab.url,
    title: typeof tab.title === "string" && tab.title.trim() ? tab.title : `主题 ${tab.topicId}`,
    ...(typeof tab.categoryName === "string" && tab.categoryName.trim() && normalizeCategoryColor(tab.categoryColor)
      ? { categoryName: tab.categoryName.trim(), categoryColor: normalizeCategoryColor(tab.categoryColor)! }
      : {}),
    ...(typeof tab.postNumber === "number" && Number.isFinite(tab.postNumber)
      ? { postNumber: Math.max(1, Math.floor(tab.postNumber)) }
      : {}),
    scrollY: clampNumber(tab.scrollY, 0, 10_000_000, 0),
    suspended: tab.suspended === true,
    lastActiveAt: clampNumber(tab.lastActiveAt, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

export function createSession(sessionId: string, listUrl: string, now: number): SessionState {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    sessionId,
    listUrl,
    listScrollY: 0,
    layoutMode: "native",
    paneSizes: { ...DEFAULT_SETTINGS.paneSizes },
    dualPaneSizes: { ...DEFAULT_SETTINGS.dualPaneSizes },
    tabs: [],
    activeTabId: null,
    secondaryTabIds: [],
    secondaryActiveTabId: null,
    updatedAt: now,
  };
}

export function normalizeSession(value: unknown, fallback: SessionState): SessionState {
  if (!value || typeof value !== "object") return fallback;
  const source = value as Partial<SessionState>;
  if (source.schemaVersion !== SESSION_SCHEMA_VERSION || typeof source.sessionId !== "string") return fallback;
  const tabs = Array.isArray(source.tabs)
    ? source.tabs.map(normalizeTab).filter((tab): tab is TopicTabState => tab !== null)
    : [];
  const uniqueTabs = Array.from(new Map(tabs.map((tab) => [tab.topicId, tab])).values())
    .sort((a, b) => a.lastActiveAt - b.lastActiveAt)
    .slice(-MAX_TABS);
  const validTabIds = new Set(uniqueTabs.map((tab) => tab.id));
  const secondaryTabIds = Array.isArray(source.secondaryTabIds)
    ? [...new Set(source.secondaryTabIds.filter((id): id is string => typeof id === "string" && validTabIds.has(id)))]
    : [];
  const secondaryIds = new Set(secondaryTabIds);
  const primaryTabs = uniqueTabs.filter((tab) => !secondaryIds.has(tab.id));
  const activeTabId = primaryTabs.some((tab) => tab.id === source.activeTabId)
    ? source.activeTabId!
    : primaryTabs.at(-1)?.id ?? null;
  const secondaryActiveTabId = secondaryTabIds.includes(source.secondaryActiveTabId ?? "")
    ? source.secondaryActiveTabId!
    : secondaryTabIds.at(-1) ?? null;
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    sessionId: source.sessionId,
    listUrl: typeof source.listUrl === "string" && source.listUrl ? source.listUrl : fallback.listUrl,
    listScrollY: clampNumber(source.listScrollY, 0, 10_000_000, 0),
    layoutMode: source.layoutMode === "two" || source.layoutMode === "three" ? source.layoutMode : "native",
    paneSizes: normalizePaneSizes(source.paneSizes, fallback.paneSizes),
    dualPaneSizes: normalizePaneSizes(source.dualPaneSizes, fallback.dualPaneSizes),
    tabs: uniqueTabs,
    activeTabId,
    secondaryTabIds,
    secondaryActiveTabId,
    updatedAt: clampNumber(source.updatedAt, 0, Number.MAX_SAFE_INTEGER, fallback.updatedAt),
  };
}

export function upsertTopicTab(
  session: SessionState,
  input: Pick<TopicTabState, "topicId" | "url" | "title"> & Partial<Pick<TopicTabState, "postNumber" | "categoryName" | "categoryColor">>,
  now: number,
): SessionState {
  const existing = session.tabs.find((tab) => tab.topicId === input.topicId);
  const nextTab: TopicTabState = existing
    ? { ...existing, ...input, suspended: false, lastActiveAt: now }
    : {
        id: `topic-${input.topicId}`,
        topicId: input.topicId,
        url: input.url,
        title: input.title || `主题 ${input.topicId}`,
        ...(input.postNumber ? { postNumber: input.postNumber } : {}),
        ...(input.categoryName && input.categoryColor
          ? { categoryName: input.categoryName, categoryColor: input.categoryColor }
          : {}),
        scrollY: 0,
        suspended: false,
        lastActiveAt: now,
      };
  const tabs = [...session.tabs.filter((tab) => tab.topicId !== input.topicId), nextTab]
    .sort((a, b) => a.lastActiveAt - b.lastActiveAt)
    .slice(-MAX_TABS);
  const staysSecondary = session.secondaryTabIds.includes(nextTab.id);
  return {
    ...session,
    tabs,
    activeTabId: staysSecondary ? session.activeTabId : nextTab.id,
    secondaryActiveTabId: staysSecondary ? nextTab.id : session.secondaryActiveTabId,
    updatedAt: now,
  };
}

export function closeTopicTab(session: SessionState, tabId: string, now: number): SessionState {
  const index = session.tabs.findIndex((tab) => tab.id === tabId);
  if (index < 0) return session;
  const tabs = session.tabs.filter((tab) => tab.id !== tabId);
  const secondaryTabIds = session.secondaryTabIds.filter((id) => id !== tabId);
  const secondaryIds = new Set(secondaryTabIds);
  const primaryTabs = tabs.filter((tab) => !secondaryIds.has(tab.id));
  const nextActive = session.activeTabId === tabId
    ? primaryTabs[Math.min(index, primaryTabs.length - 1)]?.id ?? primaryTabs.at(-1)?.id ?? null
    : session.activeTabId;
  const nextSecondaryActive = session.secondaryActiveTabId === tabId
    ? secondaryTabIds.at(-1) ?? null
    : session.secondaryActiveTabId;
  return {
    ...session,
    tabs,
    activeTabId: nextActive,
    secondaryTabIds,
    secondaryActiveTabId: nextSecondaryActive,
    updatedAt: now,
  };
}
