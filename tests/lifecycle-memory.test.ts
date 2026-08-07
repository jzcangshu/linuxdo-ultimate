// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListFrameController } from "../src/tabs/list-frame";
import { TopicFramePool } from "../src/tabs/frame-pool";
import { LayoutController } from "../src/ui/layout-controller";

describe("split runtime lifecycle", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.className = "";
    vi.restoreAllMocks();
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
});
