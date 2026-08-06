export type RouteKind = "topic" | "list" | "search" | "user" | "chat" | "other";

export interface TopicInfo {
  url: URL;
  topicId: string;
  postNumber?: number;
}

const LIST_PATHS = new Set([
  "/", "/latest", "/new", "/unseen", "/hot", "/top", "/read", "/posted", "/bookmarks", "/categories", "/tags",
]);

function isAllowedHost(hostname: string): boolean {
  if (hostname === "linux.do" || hostname.endsWith(".linux.do")) return true;
  const testWindow = (globalThis as { window?: { __LDU_TEST_MODE__?: boolean } }).window;
  return testWindow?.__LDU_TEST_MODE__ === true && (hostname === "localhost" || hostname === "127.0.0.1");
}

export function getTopicInfo(rawUrl: string, baseUrl = "https://linux.do/"): TopicInfo | null {
  let url: URL;
  try {
    url = new URL(rawUrl, baseUrl);
  } catch {
    return null;
  }
  if (!isAllowedHost(url.hostname)) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) => part === "t" || part === "n");
  if (marker < 0) return null;
  const idIndex = parts.findIndex((part, index) => index > marker && /^\d+$/.test(part));
  if (idIndex < 0) return null;
  const postNumber = parts[idIndex + 1] && /^\d+$/.test(parts[idIndex + 1]!)
    ? Number(parts[idIndex + 1])
    : undefined;
  return { url, topicId: parts[idIndex]!, ...(postNumber ? { postNumber } : {}) };
}

export function classifyRoute(rawUrl: string, baseUrl = "https://linux.do/"): RouteKind {
  let url: URL;
  try {
    url = new URL(rawUrl, baseUrl);
  } catch {
    return "other";
  }
  if (getTopicInfo(url.href)) return "topic";
  if (url.pathname === "/chat" || url.pathname.startsWith("/chat/")) return "chat";
  if (url.pathname === "/search" || url.pathname.startsWith("/search/")) return "search";
  if (url.pathname.startsWith("/u/")) return "user";
  if (LIST_PATHS.has(url.pathname) || url.pathname.startsWith("/c/") || url.pathname.startsWith("/tag/")) return "list";
  return "other";
}

export function isSplitRoute(rawUrl: string, baseUrl = "https://linux.do/"): boolean {
  const route = classifyRoute(rawUrl, baseUrl);
  return route === "list" || route === "search";
}

export function isSupportedTopicTarget(targetUrl: string, currentUrl: string): boolean {
  const target = getTopicInfo(targetUrl, currentUrl);
  const current = getTopicInfo(currentUrl, currentUrl);
  return Boolean(target && (!current || target.topicId !== current.topicId));
}
