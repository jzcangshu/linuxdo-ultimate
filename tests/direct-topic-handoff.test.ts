import { describe, expect, it } from "vitest";
import {
  DIRECT_TOPIC_HANDOFF_TTL_MS,
  consumeDirectTopicHandoff,
  peekDirectTopicHandoff,
  saveDirectTopicHandoff,
} from "../src/discourse/direct-topic-handoff";

class TestStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe("direct topic handoff", () => {
  it("round-trips a recent direct topic exactly once", () => {
    const storage = new TestStorage();
    saveDirectTopicHandoff(storage, {
      listUrl: "https://linux.do/",
      topics: [
        { url: "https://linux.do/t/topic/123/4", title: "当前直接打开的帖子" },
        { url: "https://linux.do/t/topic/456", title: "随后点击的帖子" },
      ],
    }, 1_000);
    expect(peekDirectTopicHandoff(storage, 1_050, "https://linux.do/")?.topics).toHaveLength(2);
    expect(consumeDirectTopicHandoff(storage, 1_100, "https://linux.do/")).toEqual({
      listUrl: "https://linux.do/",
      topics: [
        { url: "https://linux.do/t/topic/123/4", title: "当前直接打开的帖子" },
        { url: "https://linux.do/t/topic/456", title: "随后点击的帖子" },
      ],
    });
    expect(consumeDirectTopicHandoff(storage, 1_200, "https://linux.do/")).toBeNull();
  });

  it("rejects expired, malformed, and cross-origin handoffs", () => {
    const expired = new TestStorage();
    saveDirectTopicHandoff(expired, { listUrl: "https://linux.do/", topics: [{ url: "https://linux.do/t/topic/1", title: "Expired" }] }, 1_000);
    expect(consumeDirectTopicHandoff(expired, 1_000 + DIRECT_TOPIC_HANDOFF_TTL_MS + 1, "https://linux.do/")).toBeNull();

    const crossOrigin = new TestStorage();
    saveDirectTopicHandoff(crossOrigin, { listUrl: "https://linux.do/", topics: [{ url: "https://example.com/t/topic/1", title: "Wrong host" }] }, 1_000);
    expect(consumeDirectTopicHandoff(crossOrigin, 1_100, "https://linux.do/")).toBeNull();

    const malformed = new TestStorage();
    malformed.setItem("linuxdo-ultimate:direct-topic-handoff", "not-json");
    expect(consumeDirectTopicHandoff(malformed, 1_100, "https://linux.do/")).toBeNull();
  });
});
