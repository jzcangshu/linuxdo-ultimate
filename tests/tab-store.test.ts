import { describe, expect, it } from "vitest";
import { createSession } from "../src/core/session";
import { TopicTabStore } from "../src/tabs/tab-store";

describe("topic tab store", () => {
  it("opens and activates topics without duplicate tabs", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1), 50);
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    store.open({ topicId: "1", url: "/t/topic/1/5", title: "One" }, 3);
    expect(store.getTabs()).toHaveLength(1);
    expect(store.getActive()?.url).toBe("/t/topic/1/5");
  });

  it("looks up one tab without copying the complete tab list", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1), 50);
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);

    expect(store.get("topic-1")).toMatchObject({ topicId: "1", title: "One" });
    expect(store.get("missing")).toBeNull();
  });

  it("restores a valid active tab and emits changes", () => {
    const changes: string[] = [];
    const session = createSession("a", "/latest", 1);
    const store = new TopicTabStore(session, 50, (next) => changes.push(next.activeTabId ?? "none"));
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    const tabId = store.getActive()!.id;
    store.update(tabId, { scrollY: 240 }, 3);
    store.close(tabId, 4);
    expect(store.getTabs()).toHaveLength(0);
    expect(changes).toEqual(["topic-1", "topic-1", "none"]);
  });

  it("marks a tab suspended while preserving its reading position", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1), 50);
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    const tabId = store.getActive()!.id;
    store.update(tabId, { scrollY: 320 }, 3);
    store.suspend(tabId, 4);
    expect(store.getTabs()[0]).toMatchObject({ suspended: true, scrollY: 320 });
  });

  it("clears all tabs with one change notification", () => {
    let changes = 0;
    const store = new TopicTabStore(createSession("a", "/latest", 1), 50, () => { changes += 1; });
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    store.open({ topicId: "2", url: "/t/topic/2", title: "Two" }, 3);
    changes = 0;
    store.clear(4);
    expect(store.getTabs()).toEqual([]);
    expect(store.getActive()).toBeNull();
    expect(changes).toBe(1);
  });

  it("can close without an intermediate render while panes are being reconciled", () => {
    let changes = 0;
    const store = new TopicTabStore(createSession("a", "/latest", 1), 50, () => { changes += 1; });
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    changes = 0;

    store.close("topic-1", 3, false);

    expect(store.getTabs()).toHaveLength(0);
    expect(changes).toBe(0);
  });

  it("reorders tabs inside one reading pane without changing the other pane", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1), 50);
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    store.open({ topicId: "2", url: "/t/topic/2", title: "Two" }, 3);
    store.open({ topicId: "3", url: "/t/topic/3", title: "Three" }, 4);
    store.open({ topicId: "4", url: "/t/topic/4", title: "Four" }, 5);
    store.moveToSecondary("topic-3", 6);
    store.moveToSecondary("topic-4", 7);

    expect(store.reorderInPane("topic-2", "topic-1", "before", 8)).toBe(true);
    expect(store.getPrimaryTabs().map((tab) => tab.id)).toEqual(["topic-2", "topic-1"]);
    expect(store.getSecondaryTabs().map((tab) => tab.id)).toEqual(["topic-3", "topic-4"]);
    expect(store.reorderInPane("topic-4", "topic-3", "before", 9)).toBe(true);
    expect(store.getSecondaryTabs().map((tab) => tab.id)).toEqual(["topic-4", "topic-3"]);
  });
});
