// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TopicTabState } from "../src/core/types";
import { FrameBudget, TopicFramePool } from "../src/tabs/frame-pool";

function tab(topicId: string, url = `/t/topic/${topicId}`): TopicTabState {
  return {
    id: `topic-${topicId}`,
    topicId,
    url,
    title: `Topic ${topicId}`,
    scrollY: 0,
    suspended: false,
    lastActiveAt: 0,
  };
}

describe("topic frame pool", () => {
  beforeEach(() => {
    window.__LDU_TEST_MODE__ = true;
  });
  it("reuses a frame and navigates it for an explicit target change", () => {
    const host = document.createElement("div");
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const reused = pool.activate(tab("1", "/t/topic/1/8"), 2);
    expect(reused).toBe(frame);
    expect(new URL(reused.src).pathname).toBe("/t/topic/1/8");
  });

  it("does not reload when the embedded page reports another post in the same topic", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const event = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-state", tabId: "topic-1", url: "http://localhost:3000/t/topic/1/22", scrollY: 900 },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });
    pool.handleMessage(event);
    expect(onMessage).toHaveBeenCalledOnce();
    const originalSrc = frame.src;
    const reused = pool.activate(tab("1", "/t/topic/1/22"), 2);
    expect(reused).toBe(frame);
    expect(reused.src).toBe(originalSrc);
  });

  it("removes the least recently used frame before notifying suspension", () => {
    const host = document.createElement("div");
    const suspended: Array<{ id: string; connected: boolean }> = [];
    const pool = new TopicFramePool(host, 1, vi.fn(), (id, frame) => {
      suspended.push({ id, connected: frame.isConnected });
    });
    pool.activate(tab("1"), 1);
    pool.activate(tab("2"), 2);
    expect(suspended).toEqual([{ id: "topic-1", connected: false }]);
    expect(host.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("suspends the least recently used inactive frame", () => {
    const host = document.createElement("div");
    const suspended: string[] = [];
    const pool = new TopicFramePool(host, 2, vi.fn(), (id) => suspended.push(id));
    pool.activate(tab("1"), 1);
    pool.activate(tab("2"), 2);
    pool.activate(tab("3"), 3);
    expect(suspended).toEqual(["topic-1"]);
  });

  it("accepts preview requests only from the matching managed frame", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const event = new MessageEvent("message", {
      origin: location.origin,
      data: {
        type: "ldu:preview-open",
        tabId: "topic-1",
        url: "https://example.com/page",
        anchorRect: { left: 10, bottom: 30 },
      },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });
    pool.handleMessage(event);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ldu:preview-open" }), frame);
  });

  it("resends the current preview configuration when a managed frame reports ready", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const postMessage = vi.spyOn(frame.contentWindow!, "postMessage");
    pool.setPreviewConfig({ enabled: true, clickMode: "single" });
    postMessage.mockClear();
    const event = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-ready", tabId: "topic-1", url: "http://localhost:3000/t/topic/1" },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });

    pool.handleMessage(event);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "ldu:preview-config", tabId: "topic-1", enabled: true, clickMode: "single" },
      location.origin,
    );
  });

  it("accepts internal topic requests from the matching managed frame", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const event = new MessageEvent("message", {
      origin: location.origin,
      data: {
        type: "ldu:topic-open",
        tabId: "topic-1",
        url: "http://localhost:3000/t/another/2",
        title: "Another topic",
      },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });
    pool.handleMessage(event);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ldu:topic-open" }), frame);
  });

  it("rejects same-origin notices that do not come from the managed frame", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const trusted = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-interaction", tabId: "topic-1" },
    });
    Object.defineProperty(trusted, "source", { value: frame.contentWindow });
    pool.handleMessage(trusted);

    const wrappedSource = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-interaction", tabId: "topic-1" },
    });
    Object.defineProperty(wrappedSource, "source", { value: window });
    pool.handleMessage(wrappedSource);

    const wrongTab = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-interaction", tabId: "topic-2" },
    });
    pool.handleMessage(wrongTab);

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ldu:frame-interaction" }), frame);
  });

  it("rejects a matching frame message from a foreign origin", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const event = new MessageEvent("message", {
      origin: "https://attacker.example",
      data: { type: "ldu:frame-state", tabId: "topic-1", scrollY: 1 },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });

    pool.handleMessage(event);

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("supports a live-frame limit of ten", () => {
    const host = document.createElement("div");
    const suspended: string[] = [];
    const pool = new TopicFramePool(host, 1, vi.fn(), (id) => suspended.push(id));
    pool.setMaxLiveFrames(10);
    for (let id = 1; id <= 10; id += 1) pool.activate(tab(String(id)), id);
    expect(host.querySelectorAll("iframe")).toHaveLength(10);
    expect(suspended).toEqual([]);
    pool.activate(tab("11"), 11);
    expect(host.querySelectorAll("iframe")).toHaveLength(10);
    expect(suspended).toEqual(["topic-1"]);
  });

  it("shares one live-frame budget across both reading panes", () => {
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    const suspended: string[] = [];
    const budget = new FrameBudget(3);
    const first = new TopicFramePool(firstHost, 3, vi.fn(), (id) => suspended.push(id), budget);
    const second = new TopicFramePool(secondHost, 3, vi.fn(), (id) => suspended.push(id), budget);
    first.activate(tab("1"), 1);
    first.activate(tab("2"), 2);
    second.activate(tab("3"), 3);
    second.activate(tab("4"), 4);

    expect(budget.count()).toBe(3);
    expect(firstHost.querySelectorAll("iframe")).toHaveLength(1);
    expect(secondHost.querySelectorAll("iframe")).toHaveLength(2);
    expect(suspended).toEqual(["topic-1"]);

    budget.setLimit(2);
    expect(budget.count()).toBe(2);
    expect(suspended).toEqual(["topic-1", "topic-3"]);
  });

  it("queues a command until its frame has loaded and delivers it once", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const postMessage = vi.spyOn(frame.contentWindow!, "postMessage");
    postMessage.mockClear();

    pool.sendCommand("topic-1", { type: "ldu:bookmark", topicId: "1" });
    expect(postMessage).not.toHaveBeenCalledWith({ type: "ldu:bookmark", topicId: "1", tabId: "topic-1" }, location.origin);
    frame.dispatchEvent(new Event("load"));
    const ready = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-ready", tabId: "topic-1", url: new URL("/t/topic/1", location.href).href },
    });
    Object.defineProperty(ready, "source", { value: frame.contentWindow });
    pool.handleMessage(ready);
    expect(postMessage).toHaveBeenCalledWith({ type: "ldu:bookmark", topicId: "1", tabId: "topic-1" }, location.origin);
    frame.dispatchEvent(new Event("load"));
    pool.handleMessage(ready);
    expect(postMessage.mock.calls.filter(([message]) => (message as { type?: string }).type === "ldu:bookmark")).toHaveLength(1);
  });

  it("can transfer a live frame between pools without duplicating it", () => {
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    const first = new TopicFramePool(firstHost, 2, vi.fn(), vi.fn());
    const second = new TopicFramePool(secondHost, 2, vi.fn(), vi.fn());
    const frame = first.activate(tab("1", "/t/topic/1/6"), 1);
    const latestState = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-state", tabId: "topic-1", url: new URL("/t/topic/1/18", location.href).href },
    });
    Object.defineProperty(latestState, "source", { value: frame.contentWindow });
    first.handleMessage(latestState);
    const transfer = first.detach("topic-1");
    expect(transfer?.iframe).toBe(frame);
    expect(firstHost.querySelector("iframe")).toBeNull();
    const current = { ...tab("1", "/t/topic/1/18"), scrollY: 2200 };
    expect(second.adopt(current, transfer!, 2)).toBe(frame);
    expect(secondHost.querySelectorAll("iframe")).toHaveLength(1);
    expect(new URL(frame.src).pathname).toBe("/t/topic/1/6");
  });

  it("keeps a transferred loaded frame ready for commands without waiting for another load", () => {
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    document.body.append(firstHost, secondHost);
    const first = new TopicFramePool(firstHost, 2, () => true, vi.fn());
    const second = new TopicFramePool(secondHost, 2, () => true, vi.fn());
    const frame = first.activate(tab("1"), 1);
    const ready = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-ready", tabId: "topic-1", url: new URL("/t/topic/1", location.href).href },
    });
    Object.defineProperty(ready, "source", { value: frame.contentWindow });
    first.handleMessage(ready);
    const transfer = first.detach("topic-1")!;
    second.adopt(tab("1"), transfer, 2);
    const postMessage = vi.spyOn(frame.contentWindow!, "postMessage");
    postMessage.mockClear();

    second.sendCommand("topic-1", { type: "ldu:bookmark", topicId: "1" });

    expect(postMessage).toHaveBeenCalledWith(
      { type: "ldu:bookmark", topicId: "1", tabId: "topic-1" },
      location.origin,
    );
  });

  it("ignores a frame state that reports a different topic", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn(() => true);
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const event = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-state", tabId: "topic-1", url: new URL("/t/topic/2", location.href).href },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });

    pool.handleMessage(event);

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("restores the captured scroll position after a transferred frame reloads", () => {
    vi.useFakeTimers();
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    document.body.append(firstHost, secondHost);
    const first = new TopicFramePool(firstHost, 2, vi.fn(), vi.fn());
    const second = new TopicFramePool(secondHost, 2, vi.fn(), vi.fn());
    const frame = first.activate(tab("1"), 1);
    const transfer = first.detach("topic-1")!;

    second.adopt({ ...tab("1", "/t/topic/1/18"), scrollY: 2200 }, transfer, 2);
    const scrollTo = vi.spyOn(frame.contentWindow!, "scrollTo").mockImplementation(() => {});
    frame.dispatchEvent(new Event("load"));
    const ready = new MessageEvent("message", {
      origin: location.origin,
      data: { type: "ldu:frame-ready", tabId: "topic-1", url: new URL("/t/topic/1/18", location.href).href },
    });
    Object.defineProperty(ready, "source", { value: frame.contentWindow });
    second.handleMessage(ready);

    expect(scrollTo).toHaveBeenCalledWith({ top: 2200, behavior: "instant" });
    vi.useRealTimers();
  });
});
