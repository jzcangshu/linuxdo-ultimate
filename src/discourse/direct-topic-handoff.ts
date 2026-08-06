export const DIRECT_TOPIC_HANDOFF_TTL_MS = 15_000;
const DIRECT_TOPIC_HANDOFF_KEY = "linuxdo-ultimate:direct-topic-handoff";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface DirectTopicHandoffTopic {
  url: string;
  title: string;
}

export interface DirectTopicHandoff {
  schemaVersion: 2;
  listUrl: string;
  topics: DirectTopicHandoffTopic[];
  createdAt: number;
}

export function saveDirectTopicHandoff(
  storage: StorageLike,
  handoff: Pick<DirectTopicHandoff, "listUrl" | "topics">,
  now: number,
): boolean {
  try {
    storage.setItem(DIRECT_TOPIC_HANDOFF_KEY, JSON.stringify({
      schemaVersion: 2,
      listUrl: handoff.listUrl,
      topics: handoff.topics,
      createdAt: now,
    } satisfies DirectTopicHandoff));
    return true;
  } catch {
    // A storage failure falls back to the forum's native topic page.
    return false;
  }
}

export function consumeDirectTopicHandoff(
  storage: StorageLike,
  now: number,
  baseUrl: string,
): Pick<DirectTopicHandoff, "listUrl" | "topics"> | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(DIRECT_TOPIC_HANDOFF_KEY);
    storage.removeItem(DIRECT_TOPIC_HANDOFF_KEY);
  } catch {
    return null;
  }
  return parseDirectTopicHandoff(raw, now, baseUrl);
}

export function peekDirectTopicHandoff(
  storage: StorageLike,
  now: number,
  baseUrl: string,
): Pick<DirectTopicHandoff, "listUrl" | "topics"> | null {
  let raw: string | null = null;
  try {
    raw = storage.getItem(DIRECT_TOPIC_HANDOFF_KEY);
  } catch {
    return null;
  }
  return parseDirectTopicHandoff(raw, now, baseUrl);
}

function parseDirectTopicHandoff(
  raw: string | null,
  now: number,
  baseUrl: string,
): Pick<DirectTopicHandoff, "listUrl" | "topics"> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<DirectTopicHandoff>;
    if (value.schemaVersion !== 2
      || typeof value.listUrl !== "string"
      || !Array.isArray(value.topics)
      || value.topics.length === 0
      || value.topics.length > 50
      || typeof value.createdAt !== "number"
      || now < value.createdAt
      || now - value.createdAt > DIRECT_TOPIC_HANDOFF_TTL_MS) return null;
    const base = new URL(baseUrl);
    const listUrl = new URL(value.listUrl, base);
    if (listUrl.origin !== base.origin || !isListPath(listUrl.pathname)) return null;
    const topics = value.topics.map((topic) => {
      if (!topic || typeof topic.url !== "string" || typeof topic.title !== "string") return null;
      const url = new URL(topic.url, base);
      if (url.origin !== base.origin || !/^\/(?:t|n)\/[^/]+\/\d+(?:\/\d+)?\/?$/.test(url.pathname)) return null;
      return { url: url.href, title: topic.title.trim() || "帖子" };
    });
    if (topics.some((topic) => topic === null)) return null;
    return { listUrl: listUrl.href, topics: topics as DirectTopicHandoffTopic[] };
  } catch {
    return null;
  }
}

function isListPath(pathname: string): boolean {
  return pathname === "/"
    || ["/latest", "/new", "/unseen", "/hot", "/top", "/read", "/posted", "/bookmarks", "/categories", "/tags", "/search"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
    || pathname.startsWith("/c/")
    || pathname.startsWith("/tag/");
}
