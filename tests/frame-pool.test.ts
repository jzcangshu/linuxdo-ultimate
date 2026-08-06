// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { TopicTabState } from "../src/core/types";
import { TopicFramePool } from "../src/tabs/frame-pool";

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
      data: { type: "ldu:frame-ready", tabId: "topic-1", url: "http://localhost:3000/t/topic/1" },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });

    pool.handleMessage(event);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "ldu:preview-config", enabled: true, clickMode: "single" },
      location.origin,
    );
  });

  it("accepts internal topic requests from the matching managed frame", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const event = new MessageEvent("message", {
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

  it("accepts interaction notices only from the matching managed frame", () => {
    const host = document.createElement("div");
    const onMessage = vi.fn();
    const pool = new TopicFramePool(host, 2, onMessage, vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const trusted = new MessageEvent("message", {
      data: { type: "ldu:frame-interaction", tabId: "topic-1" },
    });
    Object.defineProperty(trusted, "source", { value: frame.contentWindow });
    pool.handleMessage(trusted);

    const untrusted = new MessageEvent("message", {
      data: { type: "ldu:frame-interaction", tabId: "topic-1" },
    });
    Object.defineProperty(untrusted, "source", { value: window });
    pool.handleMessage(untrusted);

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ldu:frame-interaction" }), frame);
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
});
