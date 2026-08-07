// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListFrameController } from "../src/tabs/list-frame";
import { TopicFramePool } from "../src/tabs/frame-pool";
import { LayoutController } from "../src/ui/layout-controller";
import { installListFrameBridge, installTopicFrameBridge } from "../src/frame-runtime";
import { startLinuxDoApp } from "../src/app";
import {
  DEFAULT_SETTINGS,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  SETTINGS_KEY,
} from "../src/core/defaults";

describe("split runtime lifecycle", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.className = "";
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.__linuxDoUltimateAppStarted = false;
  });

  it("destroys and recreates the list frame without retaining detached nodes", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const controller = new ListFrameController(container, "session-1", vi.fn());
    const first = controller.mount("https://linux.do/latest");
    controller.destroy();
    expect(container.querySelectorAll("iframe")).toHaveLength(0);
    const second = controller.mount("https://linux.do/latest");
    expect(second).not.toBe(first);
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
  });

  it("installs only the lightweight role styles when an embedded page loads", () => {
    const cleanupList = installListFrameBridge(window, document, "session-1");
    expect(document.getElementById("linuxdo-ultimate-list-frame-styles")?.textContent?.length).toBeLessThan(2_000);
    expect(document.getElementById("linuxdo-ultimate-styles")).toBeNull();
    cleanupList();
    document.getElementById("linuxdo-ultimate-list-frame-styles")?.remove();
    document.documentElement.removeAttribute("data-ldu-embedded-list");

    const cleanupTopic = installTopicFrameBridge(window, document, "topic-1");
    expect(document.getElementById("linuxdo-ultimate-topic-frame-styles")?.textContent?.length).toBeLessThan(4_000);
    expect(document.getElementById("linuxdo-ultimate-styles")).toBeNull();
    cleanupTopic();
    document.getElementById("linuxdo-ultimate-topic-frame-styles")?.remove();
    document.documentElement.removeAttribute("data-ldu-embedded-topic");
  });

  it("clears topic frames and shell listeners on teardown", () => {
    document.body.innerHTML = '<div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>';
    const layout = new LayoutController({ preference: "two", paneSizes: { sidebar: 216, listRatio: 0.35 }, hidePosters: true });
    expect(layout.mount()).toBe(true);
    layout.setOpen(true);
    const content = layout.getContentElement()!;
    const pool = new TopicFramePool(content, 3, vi.fn(), vi.fn());
    pool.activate({ id: "topic-1", topicId: "1", url: "https://linux.do/t/a/1", title: "A", scrollY: 0, suspended: false, lastActiveAt: 1 }, 1);
    pool.destroy();
    expect(content.querySelectorAll("iframe")).toHaveLength(0);
    layout.destroy();
    expect(document.querySelector("#ldu-layout-shell")).toBeNull();
    expect(document.body.classList.contains("ldu-layout-active")).toBe(false);
  });

  it("reclaims expired sessions while open and stops maintenance after pagehide", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-07T00:00:00Z"));
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([]);
    vi.stubGlobal("MutationObserver", class {
      observe(): void {}
      disconnect(): void {}
    });
    document.body.innerHTML = `
      <header class="d-header"><div class="contents"><ul class="d-header-icons"></ul></div></header>
      <div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>
    `;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      ...DEFAULT_SETTINGS,
      tabsEnabled: false,
      previewEnabled: false,
      creditEnabled: false,
    }));
    startLinuxDoApp();
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const firstId = "expired-while-open";
    localStorage.setItem(`${SESSION_KEY_PREFIX}${firstId}`, JSON.stringify({ sessionId: firstId }));
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify([{ sessionId: firstId, updatedAt: 1 }]));
    vi.advanceTimersByTime(30 * 60_000);
    expect(localStorage.getItem(`${SESSION_KEY_PREFIX}${firstId}`)).toBeNull();

    const pagehide = new Event("pagehide") as PageTransitionEvent;
    Object.defineProperty(pagehide, "persisted", { value: false });
    window.dispatchEvent(pagehide);
    const secondId = "expired-after-pagehide";
    localStorage.setItem(`${SESSION_KEY_PREFIX}${secondId}`, JSON.stringify({ sessionId: secondId }));
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify([{ sessionId: secondId, updatedAt: 1 }]));
    vi.advanceTimersByTime(30 * 60_000);
    expect(localStorage.getItem(`${SESSION_KEY_PREFIX}${secondId}`)).not.toBeNull();
  });
});
