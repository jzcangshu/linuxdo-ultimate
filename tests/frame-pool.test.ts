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
      data: { type: "ldu:frame-state", tabId: "topic-1", url: "http://localhost:3000/t/topic/1/22" },
    });
    Object.defineProperty(event, "source", { value: frame.contentWindow });
    pool.handleMessage(event);
    expect(onMessage).toHaveBeenCalledOnce();
    const originalSrc = frame.src;
    const reused = pool.activate(tab("1", "/t/topic/1/22"), 2);
    expect(reused).toBe(frame);
    expect(reused.src).toBe(originalSrc);
  });

  it("leaves topic reading-position restoration to Discourse", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate({ ...tab("1", "/t/topic/1/22"), postNumber: 22 }, 1);
    const scrollTo = vi.spyOn(frame.contentWindow!, "scrollTo").mockImplementation(() => {});

    frame.dispatchEvent(new Event("load"));
    pool.activate(tab("2"), 2);
    pool.activate({ ...tab("1", "/t/topic/1/22"), postNumber: 22 }, 3);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("removes the least recently used frame and reports the suspended tab", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const suspended: string[] = [];
    const pool = new TopicFramePool(host, 1, vi.fn(), (id) => suspended.push(id));
    pool.activate(tab("1"), 1);

    pool.activate(tab("2"), 2);

    expect(suspended).toEqual(["topic-1"]);
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

  it("resends configuration when the same iframe loads a new document", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const postMessage = vi.spyOn(frame.contentWindow!, "postMessage");

    frame.dispatchEvent(new Event("load"));
    postMessage.mockClear();
    frame.dispatchEvent(new Event("load"));

    expect(postMessage).toHaveBeenCalledWith(
      { type: "ldu:preview-config", enabled: false, clickMode: "double" },
      location.origin,
    );
    expect(postMessage).toHaveBeenCalledWith(
      {
        type: "ldu:page-tools-config",
        ownerOnlyEnabled: false,
        cleanModeEnabled: false,
        lowEndOptimizationEnabled: false,
      },
      location.origin,
    );
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

  it("queues a command until its frame has loaded and delivers it once", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const postMessage = vi.spyOn(frame.contentWindow!, "postMessage");
    postMessage.mockClear();

    pool.sendCommand("topic-1", { type: "ldu:bookmark", topicId: "1" });
    expect(postMessage).not.toHaveBeenCalledWith({ type: "ldu:bookmark", topicId: "1" }, location.origin);
    frame.dispatchEvent(new Event("load"));
    expect(postMessage).toHaveBeenCalledWith({ type: "ldu:bookmark", topicId: "1" }, location.origin);
    frame.dispatchEvent(new Event("load"));
    expect(postMessage.mock.calls.filter(([message]) => (message as { type?: string }).type === "ldu:bookmark")).toHaveLength(1);
  });

  it("can transfer a live frame between pools without duplicating it", () => {
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    const first = new TopicFramePool(firstHost, 2, vi.fn(), vi.fn());
    const second = new TopicFramePool(secondHost, 2, vi.fn(), vi.fn());
    const frame = first.activate(tab("1", "/t/topic/1/6"), 1);
    const latestState = new MessageEvent("message", {
      data: { type: "ldu:frame-state", tabId: "topic-1", url: new URL("/t/topic/1/18", location.href).href },
    });
    Object.defineProperty(latestState, "source", { value: frame.contentWindow });
    first.handleMessage(latestState);
    const transfer = first.detach("topic-1");
    expect(transfer?.iframe).toBe(frame);
    expect(firstHost.querySelector("iframe")).toBeNull();
    const current = tab("1", "/t/topic/1/18");
    expect(second.adopt(current, transfer!, 2)).toBe(frame);
    expect(secondHost.querySelectorAll("iframe")).toHaveLength(1);
    expect(new URL(frame.src).pathname).toBe("/t/topic/1/18");
  });

  it("resends configuration when a transferred frame loads again", () => {
    const firstHost = document.createElement("div");
    const secondHost = document.createElement("div");
    document.body.append(firstHost, secondHost);
    const first = new TopicFramePool(firstHost, 2, vi.fn(), vi.fn());
    const second = new TopicFramePool(secondHost, 2, vi.fn(), vi.fn());
    const frame = first.activate(tab("1"), 1);
    frame.dispatchEvent(new Event("load"));
    const transfer = first.detach("topic-1");
    const adopted = second.adopt(tab("1"), transfer!, 2);
    const postMessage = vi.spyOn(adopted.contentWindow!, "postMessage");

    adopted.dispatchEvent(new Event("load"));

    expect(postMessage).toHaveBeenCalledWith(
      { type: "ldu:page-tools-config", ownerOnlyEnabled: false, cleanModeEnabled: false, lowEndOptimizationEnabled: false },
      location.origin,
    );
  });

  it("does not rewrite accessibility state when activating the current frame", () => {
    const host = document.createElement("div");
    const pool = new TopicFramePool(host, 2, vi.fn(), vi.fn());
    const frame = pool.activate(tab("1"), 1);
    const setAttribute = vi.spyOn(frame, "setAttribute");
    const tabIndex = frame.tabIndex;

    pool.activate(tab("1"), 2);

    expect(setAttribute).not.toHaveBeenCalled();
    expect(frame.tabIndex).toBe(tabIndex);
  });

  it("prepares a background frame without changing the active frame", () => {
    const host = document.createElement("div");
    const pool = new TopicFramePool(host, 3, vi.fn(), vi.fn());
    const active = pool.activate(tab("1"), 1);

    const background = pool.prepare(tab("2"), 2);

    expect(active.getAttribute("aria-hidden")).toBe("false");
    expect(active.tabIndex).toBe(0);
    expect(background.getAttribute("aria-hidden")).toBe("true");
    expect(background.tabIndex).toBe(-1);
  });

  it("soft-freezes hidden live frames and resumes the original iframe without reloading", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 3, vi.fn(), vi.fn());
    const first = pool.activate(tab("1"), 1);
    const firstSrc = first.src;
    const firstPostMessage = vi.spyOn(first.contentWindow!, "postMessage");
    first.dispatchEvent(new Event("load"));
    firstPostMessage.mockClear();

    const second = pool.activate(tab("2"), 2);
    const secondSrc = second.src;
    const secondPostMessage = vi.spyOn(second.contentWindow!, "postMessage");
    expect(firstPostMessage).toHaveBeenCalledWith(
      { type: "ldu:frame-lifecycle", active: false },
      location.origin,
    );

    second.dispatchEvent(new Event("load"));
    firstPostMessage.mockClear();
    secondPostMessage.mockClear();
    const restored = pool.activate(tab("1"), 3);

    expect(restored).toBe(first);
    expect(first.src).toBe(firstSrc);
    expect(second.src).toBe(secondSrc);
    expect(host.querySelectorAll("iframe")).toHaveLength(2);
    expect(firstPostMessage).toHaveBeenCalledWith(
      { type: "ldu:frame-lifecycle", active: true },
      location.origin,
    );
    expect(secondPostMessage).toHaveBeenCalledWith(
      { type: "ldu:frame-lifecycle", active: false },
      location.origin,
    );
  });

  it("resends the desired frozen state when a background frame reports ready", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const pool = new TopicFramePool(host, 3, vi.fn(), vi.fn());
    pool.activate(tab("1"), 1);
    const background = pool.prepare(tab("2"), 2);
    const postMessage = vi.spyOn(background.contentWindow!, "postMessage");
    postMessage.mockClear();
    const event = new MessageEvent("message", {
      data: { type: "ldu:frame-ready", tabId: "topic-2", url: "http://localhost:3000/t/topic/2" },
    });
    Object.defineProperty(event, "source", { value: background.contentWindow });

    pool.handleMessage(event);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "ldu:frame-lifecycle", active: false },
      location.origin,
    );
  });

});
