import { describe, expect, it } from "vitest";
import { createSession } from "../src/core/session";
import { TopicTabStore } from "../src/tabs/tab-store";

describe("topic tab store", () => {
  it("opens and activates topics without duplicate tabs", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1));
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    store.open({ topicId: "1", url: "/t/topic/1/5", title: "One" }, 3);
    expect(store.getTabs()).toHaveLength(1);
    expect(store.getActive()?.url).toBe("/t/topic/1/5");
  });

  it("restores a valid active tab and emits changes", () => {
    const changes: string[] = [];
    const session = createSession("a", "/latest", 1);
    const store = new TopicTabStore(session, (next) => changes.push(next.activeTabId ?? "none"));
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    const tabId = store.getActive()!.id;
    store.update(tabId, { scrollY: 240 }, 3);
    store.close(tabId, 4);
    expect(store.getTabs()).toHaveLength(0);
    expect(changes).toEqual(["topic-1", "topic-1", "none"]);
  });

  it("marks a tab suspended while preserving its reading position", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1));
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    const tabId = store.getActive()!.id;
    store.update(tabId, { scrollY: 320 }, 3);
    store.suspend(tabId, 4);
    expect(store.getTabs()[0]).toMatchObject({ suspended: true, scrollY: 320 });
  });

  it("clears all tabs with one change notification", () => {
    let changes = 0;
    const store = new TopicTabStore(createSession("a", "/latest", 1), () => { changes += 1; });
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    store.open({ topicId: "2", url: "/t/topic/2", title: "Two" }, 3);
    changes = 0;
    store.clear(4);
    expect(store.getTabs()).toEqual([]);
    expect(store.getActive()).toBeNull();
    expect(changes).toBe(1);
  });

  it("reorders tabs inside each reading pane without changing the other pane", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1));
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
    expect(store.getPrimaryTabs().map((tab) => tab.id)).toEqual(["topic-2", "topic-1"]);
    expect(store.getSecondaryActive()?.id).toBe("topic-4");
  });

  it("does not emit or persist an already satisfied tab order", () => {
    let changes = 0;
    const store = new TopicTabStore(createSession("a", "/latest", 1), () => { changes += 1; });
    store.open({ topicId: "1", url: "/t/topic/1", title: "One" }, 2);
    store.open({ topicId: "2", url: "/t/topic/2", title: "Two" }, 3);
    changes = 0;

    expect(store.reorderInPane("topic-1", "topic-2", "before", 4)).toBe(false);
    expect(changes).toBe(0);
  });

  it("never discards saved tabs to enforce an implementation limit", () => {
    const store = new TopicTabStore(createSession("a", "/latest", 1));
    for (let index = 1; index <= 75; index += 1) {
      store.open({ topicId: String(index), url: `/t/topic/${index}`, title: `Topic ${index}` }, index + 1);
    }
    expect(store.getTabs()).toHaveLength(75);
  });
});
