// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import type { TopicTabState } from "../src/core/types";
import { renderTabStrip, resolveTabCategoryColor } from "../src/tabs/tab-strip";

function addCategory(href: string, name: string, color: string): void {
  const sidebar = document.querySelector(".sidebar-wrapper") ?? document.body.appendChild(document.createElement("aside"));
  sidebar.classList.add("sidebar-wrapper");
  const link = document.createElement("a");
  link.href = href;
  const icon = document.createElement("span");
  icon.className = "sidebar-section-link-prefix icon";
  icon.style.color = color;
  link.append(icon, name);
  sidebar.append(link);
}

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

describe("topic tab category colors", () => {
  it("reads the matching live sidebar icon color", () => {
    addCategory("/c/startup/46", "扬帆起航", "rgb(255, 152, 56)");
    expect(resolveTabCategoryColor("帖子标题 - 扬帆起航 - LINUX DO")).toBe("rgb(255, 152, 56)");
  });

  it("prefers the longest matching subcategory and ignores missing categories", () => {
    addCategory("/c/welfare/36", "福利羊毛", "rgb(1, 2, 3)");
    addCategory("/c/welfare/welfare-lv1/60", "福利羊毛, Lv1", "rgb(4, 5, 6)");
    expect(resolveTabCategoryColor("帖子标题 - 福利羊毛 / 福利羊毛, Lv1 - LINUX DO")).toBe("rgb(4, 5, 6)");
    expect(resolveTabCategoryColor("无分类帖子 - LINUX DO")).toBeNull();
  });

  it("applies the resolved category color as a presentation-only CSS variable", () => {
    addCategory("/c/develop/4", "开发调优", "rgb(50, 195, 195)");
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

  it("keeps only the title and close action in each topic tab", () => {
    const root = document.createElement("div");
    renderTabStrip(root, [tab("一个较长的帖子标题")], "topic-1", {
      onActivate: vi.fn(), onClose: vi.fn(),
    });
    expect(root.querySelector(".ldu-tab-pin")).toBeNull();
    expect(root.querySelector(".ldu-tab-button")).not.toBeNull();
    expect(root.querySelector(".ldu-tab-close")).not.toBeNull();
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
});
