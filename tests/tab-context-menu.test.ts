// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { TabContextMenu } from "../src/ui/tab-context-menu";

describe("tab context menu", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("renders Chrome-style groups and dispatches the selected action", () => {
    const onReload = vi.fn();
    const menu = new TabContextMenu({
      onMoveToSplit: vi.fn(), onOpenBrowserTab: vi.fn(), onReload,
      onCopyLink: vi.fn(), onBookmark: vi.fn(), onCloseOthers: vi.fn(),
    });
    menu.open("topic-1", 40, 50);
    const root = document.querySelector<HTMLElement>(".ldu-tab-context-menu")!;
    expect(root.getAttribute("role")).toBe("menu");
    expect([...root.querySelectorAll<HTMLElement>("[role=menuitem]")].map((item) => item.dataset.action)).toEqual([
      "split", "browser-tab", "reload", "copy", "bookmark", "close-others",
    ]);
    expect(root.querySelectorAll(".ldu-context-separator")).toHaveLength(3);
    expect(root.querySelectorAll(".ldu-context-item .ldu-symbol")).toHaveLength(6);
    expect(root.querySelectorAll(".ldu-context-item > .ldu-context-label")).toHaveLength(6);
    expect(root.textContent).toContain("向新的拆分视图中添加标签页");
    expect(root.textContent).toContain("在新的浏览器标签页中打开");
    root.querySelector<HTMLButtonElement>('[data-action="reload"]')!.click();
    expect(onReload).toHaveBeenCalledWith("topic-1");
    expect(document.querySelector(".ldu-tab-context-menu")).toBeNull();
  });

  it("closes for outside pointer input and Escape", () => {
    const callbacks = {
      onMoveToSplit: vi.fn(), onOpenBrowserTab: vi.fn(), onReload: vi.fn(),
      onCopyLink: vi.fn(), onBookmark: vi.fn(), onCloseOthers: vi.fn(),
    };
    const menu = new TabContextMenu(callbacks);
    menu.open("topic-1", 20, 20);
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(document.querySelector(".ldu-tab-context-menu")).toBeNull();
    menu.open("topic-1", 20, 20);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(document.querySelector(".ldu-tab-context-menu")).toBeNull();
  });

  it("clamps the menu to the viewport", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(300);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(240);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 260, bottom: 220, width: 260, height: 220, toJSON: () => ({}),
    });
    const menu = new TabContextMenu({
      onMoveToSplit: vi.fn(), onOpenBrowserTab: vi.fn(), onReload: vi.fn(),
      onCopyLink: vi.fn(), onBookmark: vi.fn(), onCloseOthers: vi.fn(),
    });
    menu.open("topic-1", 290, 230);
    const root = document.querySelector<HTMLElement>(".ldu-tab-context-menu")!;
    expect(root.style.left).toBe("32px");
    expect(root.style.top).toBe("12px");
  });
});
