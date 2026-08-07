// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TopicTabState } from "../src/core/types";
import { renderTabStrip, resolveTabCategoryColor } from "../src/tabs/tab-strip";

function tab(title: string): TopicTabState {
  return {
    id: "topic-1",
    topicId: "1",
    url: "/t/topic/1",
    title,
    scrollY: 0,
    suspended: false,
    lastActiveAt: 1,
  };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("topic tab category colors", () => {
  it("uses the fixed primary-category color without waiting for the sidebar", () => {
    expect(resolveTabCategoryColor("帖子标题 - 扬帆起航 - LINUX DO")).toBe("rgb(255, 152, 56)");
  });

  it("prefers the fixed primary category for nested category titles", () => {
    expect(resolveTabCategoryColor("帖子标题 - 福利羊毛 / 福利羊毛, Lv1 - LINUX DO")).toBe("rgb(228, 87, 53)");
    expect(resolveTabCategoryColor("帖子标题 - 搞七捻三, Lv1 - LINUX DO")).toBe("rgb(58, 181, 74)");
    expect(resolveTabCategoryColor("无分类帖子 - LINUX DO")).toBeNull();
  });

  it("does not scan or compute colors from the live sidebar", () => {
    const getComputedStyle = vi.spyOn(window, "getComputedStyle");
    document.body.innerHTML = '<aside class="sidebar-wrapper"><a href="/c/develop/4"><span class="sidebar-section-link-prefix icon" style="color: red"></span>开发调优</a></aside>';

    expect(resolveTabCategoryColor("帖子标题 - 开发调优 - LINUX DO")).toBe("rgb(50, 195, 195)");
    expect(getComputedStyle).not.toHaveBeenCalled();
  });

  it("applies the resolved category color as a presentation-only CSS variable", () => {
    const root = document.createElement("div");
    renderTabStrip(root, [tab("测试帖子 - 开发调优 - LINUX DO")], "topic-1", {
      onActivate: vi.fn(), onClose: vi.fn(),
    });
    expect(root.querySelector<HTMLElement>(".ldu-tab-item")?.style.getPropertyValue("--ldu-tab-category-color")).toBe("rgb(50, 195, 195)");
  });

  it("can disable category color presentation without discarding cached category data", () => {
    const root = document.createElement("div");
    renderTabStrip(root, [{ ...tab("刚打开的帖子"), categoryName: "扬帆起航", categoryColor: "#ff9838" }], "topic-1", {
      onActivate: vi.fn(), onClose: vi.fn(),
    }, { colorizeTabs: false });
    expect(root.classList.contains("is-category-colors-enabled")).toBe(false);
    expect(root.querySelector<HTMLElement>(".ldu-tab-item")?.style.getPropertyValue("--ldu-tab-category-color"))
      .toBe("#ff9838");
  });

  it("uses the color persisted with the topic before consulting the sidebar", () => {
    const root = document.createElement("div");
    renderTabStrip(root, [{ ...tab("刚打开的帖子"), categoryName: "扬帆起航", categoryColor: "#ff9838" }], "topic-1", {
      onActivate: vi.fn(), onClose: vi.fn(),
    });
    expect(root.querySelector<HTMLElement>(".ldu-tab-item")?.style.getPropertyValue("--ldu-tab-category-color"))
      .toBe("#ff9838");
  });

  it("marks only the current tab as active regardless of title length", () => {
    const root = document.createElement("div");
    renderTabStrip(root, [tab("短"), { ...tab("很长很长很长很长很长的帖子标题"), id: "topic-2", topicId: "2" }], "topic-2", {
      onActivate: vi.fn(), onClose: vi.fn(),
    });
    const items = root.querySelectorAll(".ldu-tab-item");
    expect(items[0]?.classList.contains("is-active")).toBe(false);
    expect(items[1]?.classList.contains("is-active")).toBe(true);
  });

  it("updates existing tab nodes in place and uses the latest callbacks", () => {
    const root = document.createElement("div");
    const firstActivate = vi.fn();
    renderTabStrip(root, [
      tab("旧标题"),
      { ...tab("第二帖"), id: "topic-2", topicId: "2" },
    ], "topic-1", { onActivate: firstActivate, onClose: vi.fn() });
    const firstItem = root.querySelector<HTMLElement>('[data-tab-id="topic-1"]')!;
    const firstButton = firstItem.querySelector<HTMLButtonElement>(".ldu-tab-button")!;
    const secondItem = root.querySelector<HTMLElement>('[data-tab-id="topic-2"]')!;
    const latestActivate = vi.fn();

    renderTabStrip(root, [
      { ...tab("第二帖更新"), id: "topic-2", topicId: "2" },
      { ...tab("新标题"), categoryColor: "#123456" },
    ], "topic-2", { onActivate: latestActivate, onClose: vi.fn() });

    expect(root.children[0]).toBe(secondItem);
    expect(root.children[1]).toBe(firstItem);
    expect(firstItem.querySelector(".ldu-tab-button")).toBe(firstButton);
    expect(firstButton.textContent).toBe("新标题");
    expect(firstItem.classList.contains("is-active")).toBe(false);
    expect(firstItem.style.getPropertyValue("--ldu-tab-category-color")).toBe("#123456");
    firstButton.click();
    expect(firstActivate).not.toHaveBeenCalled();
    expect(latestActivate).toHaveBeenCalledWith("topic-1");
  });

  it("keeps only the title and close action in each topic tab", () => {
    const root = document.createElement("div");
    renderTabStrip(root, [tab("一个较长的帖子标题")], "topic-1", {
      onActivate: vi.fn(), onClose: vi.fn(),
    });
    expect(root.querySelector(".ldu-tab-pin")).toBeNull();
    expect(root.querySelector(".ldu-tab-button")).not.toBeNull();
    expect(root.querySelector(".ldu-tab-close")).not.toBeNull();
    expect(root.querySelector(".ldu-tab-close .ldu-symbol-close")).not.toBeNull();
  });

  it("opens the custom menu on right click without activating the tab", () => {
    const root = document.createElement("div");
    const onActivate = vi.fn();
    const onContextMenu = vi.fn();
    renderTabStrip(root, [tab("帖子")], "topic-1", {
      onActivate, onClose: vi.fn(), onContextMenu,
    });
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 80, clientY: 90 });
    root.querySelector(".ldu-tab-item")!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(onContextMenu).toHaveBeenCalledWith("topic-1", 80, 90);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("commits one reorder only when a dragged tab is dropped", () => {
    const root = document.createElement("div");
    const onReorder = vi.fn();
    renderTabStrip(root, [
      tab("One"),
      { ...tab("Two"), id: "topic-2", topicId: "2" },
      { ...tab("Three"), id: "topic-3", topicId: "3" },
    ], "topic-1", { onActivate: vi.fn(), onClose: vi.fn(), onReorder });
    const items = [...root.querySelectorAll<HTMLElement>(".ldu-tab-item")];
    items.forEach((item, index) => vi.spyOn(item, "getBoundingClientRect").mockReturnValue({
      x: index * 104, y: 0, left: index * 104, top: 0, right: index * 104 + 100,
      bottom: 38, width: 100, height: 38, toJSON: () => ({}),
    }));

    items[0]!.dispatchEvent(new Event("dragstart", { bubbles: true, cancelable: true }));
    items[1]!.dispatchEvent(new MouseEvent("dragover", { bubbles: true, cancelable: true, clientX: 190 }));
    items[1]!.dispatchEvent(new MouseEvent("dragover", { bubbles: true, cancelable: true, clientX: 190 }));
    expect(onReorder).not.toHaveBeenCalled();
    items[1]!.dispatchEvent(new Event("drop", { bubbles: true, cancelable: true }));
    expect(onReorder).toHaveBeenCalledOnce();
    expect(onReorder).toHaveBeenCalledWith("topic-1", "topic-2", "after");
  });

  it("moves neighboring tabs aside during drag without committing early", () => {
    const root = document.createElement("div");
    const onReorder = vi.fn();
    renderTabStrip(root, [
      tab("One"),
      { ...tab("Two"), id: "topic-2", topicId: "2" },
      { ...tab("Three"), id: "topic-3", topicId: "3" },
    ], "topic-1", { onActivate: vi.fn(), onClose: vi.fn(), onReorder });
    const items = [...root.querySelectorAll<HTMLElement>(".ldu-tab-item")];
    items.forEach((item, index) => vi.spyOn(item, "getBoundingClientRect").mockReturnValue({
      x: index * 104, y: 0, left: index * 104, top: 0, right: index * 104 + 100,
      bottom: 38, width: 100, height: 38, toJSON: () => ({}),
    }));

    items[0]!.dispatchEvent(new MouseEvent("dragstart", { bubbles: true, cancelable: true, clientX: 50 }));
    root.dispatchEvent(new MouseEvent("dragover", { bubbles: true, cancelable: true, clientX: 310 }));

    expect(items[1]!.style.transform).toBe("translate3d(-104px, 0, 0)");
    expect(items[2]!.style.transform).toBe("translate3d(-104px, 0, 0)");
    expect(onReorder).not.toHaveBeenCalled();

    root.dispatchEvent(new MouseEvent("drop", { bubbles: true, cancelable: true, clientX: 310 }));
    expect(onReorder).toHaveBeenCalledWith("topic-1", "topic-3", "after");
  });
});
