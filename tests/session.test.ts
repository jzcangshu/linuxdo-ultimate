import { describe, expect, it } from "vitest";
import {
  closeTopicTab,
  createSession,
  normalizeSession,
  upsertTopicTab,
} from "../src/core/session";

describe("session state", () => {
  it("recovers from corrupt or future state", () => {
    const fallback = createSession("session-a", "https://linux.do/latest", 100);

    expect(normalizeSession(null, fallback)).toEqual(fallback);
    expect(normalizeSession({ schemaVersion: 99 }, fallback)).toEqual(fallback);
  });

  it("keeps restored tabs while migrating legacy pane widths", () => {
    const fallback = createSession("session-a", "https://linux.do/latest", 100);
    const legacy = upsertTopicTab(fallback, {
      topicId: "2309449",
      url: "https://linux.do/t/topic/2309449",
      title: "阅读修复",
    }, 101) as unknown as Record<string, unknown>;
    legacy.paneSizes = { sidebar: 216, list: 500 };

    const restored = normalizeSession(legacy, fallback);
    expect(restored.tabs).toHaveLength(1);
    expect(restored.paneSizes).toEqual({ sidebar: 216, listRatio: 0.35 });
  });

  it("deduplicates a topic and updates its target post", () => {
    const initial = createSession("session-a", "https://linux.do/latest", 100);
    const first = upsertTopicTab(initial, {
      topicId: "2309449",
      url: "https://linux.do/t/topic/2309449/1",
      title: "阅读修复",
    }, 101);
    const second = upsertTopicTab(first, {
      topicId: "2309449",
      url: "https://linux.do/t/topic/2309449/41",
      title: "阅读修复（续）",
    }, 102);

    expect(second.tabs).toHaveLength(1);
    expect(second.tabs[0]?.url).toBe("https://linux.do/t/topic/2309449/41");
    expect(second.activeTabId).toBe(second.tabs[0]?.id);
  });

  it("persists a validated category presentation when the frame is released", () => {
    const initial = createSession("session-a", "https://linux.do/latest", 100);
    const colored = upsertTopicTab(initial, {
      topicId: "46",
      url: "https://linux.do/t/topic/46",
      title: "新帖子",
      categoryName: "扬帆起航",
      categoryColor: "#ff9838",
    }, 101);
    const restored = normalizeSession(structuredClone(colored), initial);
    expect(restored.tabs[0]).toMatchObject({ categoryName: "扬帆起航", categoryColor: "#ff9838" });
  });

  it("bounds restored tabs and keeps the active tab valid", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    for (let index = 1; index <= 60; index += 1) {
      state = upsertTopicTab(state, {
        topicId: String(index),
        url: `https://linux.do/t/topic/${index}`,
        title: `Topic ${index}`,
      }, 100 + index);
    }

    const restored = normalizeSession(state, createSession("fallback", "/", 999));
    expect(restored.tabs).toHaveLength(50);
    expect(restored.tabs.at(-1)?.topicId).toBe("60");
    expect(restored.tabs.some((tab) => tab.id === restored.activeTabId)).toBe(true);
  });

  it("selects an adjacent tab after closing the active tab", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    state = upsertTopicTab(state, { topicId: "1", url: "/t/topic/1", title: "One" }, 101);
    state = upsertTopicTab(state, { topicId: "2", url: "/t/topic/2", title: "Two" }, 102);

    const closed = closeTopicTab(state, state.activeTabId!, 103);
    expect(closed.tabs).toHaveLength(1);
    expect(closed.activeTabId).toBe(closed.tabs[0]?.id);
  });
});
