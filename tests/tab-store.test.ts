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
});
