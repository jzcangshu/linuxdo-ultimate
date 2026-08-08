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
    expect(restored.dualPaneSizes).toEqual({ sidebar: 216, listRatio: 0.35 });
    expect(restored.secondaryTabIds).toEqual([]);
    expect(restored.secondaryActiveTabId).toBeNull();
  });

  it("normalizes secondary panel ownership without duplicating or losing tabs", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    state = upsertTopicTab(state, { topicId: "1", url: "/t/topic/1", title: "One" }, 101);
    state = upsertTopicTab(state, { topicId: "2", url: "/t/topic/2", title: "Two" }, 102);
    const restored = normalizeSession({
      ...state,
      secondaryTabIds: ["topic-1", "topic-1", "missing"],
      secondaryActiveTabId: "missing",
      activeTabId: "topic-1",
    }, createSession("fallback", "/", 999));

    expect(restored.secondaryTabIds).toEqual(["topic-1"]);
    expect(restored.secondaryActiveTabId).toBe("topic-1");
    expect(restored.activeTabId).toBe("topic-2");
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

  it("drops legacy dynamically acquired category colors", () => {
    const initial = createSession("session-a", "https://linux.do/latest", 100);
    const legacy = {
      ...initial,
      tabs: [{
        id: "topic-46", topicId: "46", url: "https://linux.do/t/topic/46", title: "新帖子",
        categoryName: "扬帆起航", categoryColor: "#ff9838", scrollY: 0, suspended: false, lastActiveAt: 101,
      }],
      activeTabId: "topic-46",
    };
    const restored = normalizeSession(legacy, initial);
    expect(restored.tabs[0]).not.toHaveProperty("categoryName");
    expect(restored.tabs[0]).not.toHaveProperty("categoryColor");
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

  it("keeps a manual tab order across a reload", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    for (const topicId of ["1", "2", "3"]) {
      state = upsertTopicTab(state, {
        topicId,
        url: `https://linux.do/t/topic/${topicId}`,
        title: `Topic ${topicId}`,
      }, 100 + Number(topicId));
    }
    const reordered = { ...state, tabs: [state.tabs[2]!, state.tabs[0]!, state.tabs[1]!] };

    const restored = normalizeSession(structuredClone(reordered), createSession("fallback", "/", 999));

    expect(restored.tabs.map((tab) => tab.topicId)).toEqual(["3", "1", "2"]);
  });

  it("drops the least recently active tab when the manual order overflows", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    for (let index = 1; index <= 50; index += 1) {
      state = upsertTopicTab(state, {
        topicId: String(index),
        url: `https://linux.do/t/topic/${index}`,
        title: `Topic ${index}`,
      }, 100 + index);
    }
    // Make the first tab the stalest while keeping it at the front of the order.
    state = { ...state, tabs: state.tabs.map((tab) => tab.topicId === "1" ? { ...tab, lastActiveAt: 1 } : tab) };

    const overflowed = upsertTopicTab(state, {
      topicId: "51",
      url: "https://linux.do/t/topic/51",
      title: "Topic 51",
    }, 200);

    expect(overflowed.tabs).toHaveLength(50);
    expect(overflowed.tabs.some((tab) => tab.topicId === "1")).toBe(false);
    expect(overflowed.tabs.at(-1)?.topicId).toBe("51");
    expect(overflowed.tabs.map((tab) => tab.topicId).slice(0, 3)).toEqual(["2", "3", "4"]);
  });

  it("selects an adjacent tab after closing the active tab", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    state = upsertTopicTab(state, { topicId: "1", url: "/t/topic/1", title: "One" }, 101);
    state = upsertTopicTab(state, { topicId: "2", url: "/t/topic/2", title: "Two" }, 102);

    const closed = closeTopicTab(state, state.activeTabId!, 103);
    expect(closed.tabs).toHaveLength(1);
    expect(closed.activeTabId).toBe(closed.tabs[0]?.id);
  });

  it("repairs the secondary active tab when a moved tab is closed", () => {
    let state = createSession("session-a", "https://linux.do/latest", 100);
    state = upsertTopicTab(state, { topicId: "1", url: "/t/topic/1", title: "One" }, 101);
    state = upsertTopicTab(state, { topicId: "2", url: "/t/topic/2", title: "Two" }, 102);
    state = { ...state, secondaryTabIds: ["topic-1"], secondaryActiveTabId: "topic-1" };

    const closed = closeTopicTab(state, "topic-1", 103);
    expect(closed.secondaryTabIds).toEqual([]);
    expect(closed.secondaryActiveTabId).toBeNull();
    expect(closed.activeTabId).toBe("topic-2");
  });
});
