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
  if (hostname === "linux.do") return true;
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
  if (url.hostname === "linux.do" && url.protocol !== "https:") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if ((parts[0] !== "t" && parts[0] !== "n") || parts.length < 2) return null;
  const topicIndex = /^\d+$/.test(parts[1] ?? "") ? 1 : 2;
  const topicId = parts[topicIndex];
  const postPart = parts[topicIndex + 1];
  if (!topicId || !/^\d+$/.test(topicId) || parts.length > topicIndex + 2) return null;
  if (postPart !== undefined && !/^\d+$/.test(postPart)) return null;
  const postNumber = postPart ? Number(postPart) : undefined;
  return { url, topicId, ...(postNumber ? { postNumber } : {}) };
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

const NON_PAGE_PATH = /^\/(?:uploads|secure-media-uploads|user_avatar|letter_avatar_proxy|clicks)(?:\/|$)/;
const FILE_PATH = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|pdf|zip|rar|7z|tar|gz|bz2|xz|dmg|exe|msi|apk|deb|rpm|iso|mp4|mkv|avi|mov|webm|mp3|flac|wav|docx?|xlsx?|pptx?)(?:$|\/)/i;

export function isNavigableForumPage(targetUrl: string, currentUrl: string): boolean {
  let target: URL;
  let current: URL;
  try {
    target = new URL(targetUrl, currentUrl);
    current = new URL(currentUrl);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(target.protocol) || target.origin !== current.origin || getTopicInfo(target.href, current.href)) return false;
  if (target.pathname === current.pathname && target.search === current.search && target.hash) return false;
  return !NON_PAGE_PATH.test(target.pathname) && !FILE_PATH.test(target.pathname);
}
