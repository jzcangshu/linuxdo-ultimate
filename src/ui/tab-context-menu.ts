import { createIcon, type IconName } from "./icons";

export interface TabContextMenuCallbacks {
  onMoveToSplit: (tabId: string) => void;
  onOpenBrowserTab: (tabId: string) => void;
  onReload: (tabId: string) => void;
  onCopyLink: (tabId: string) => void;
  onBookmark: (tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
}

type Action = keyof TabContextMenuCallbacks;

const GROUPS: Array<Array<{ action: Action; key: string; label: string; icon: IconName; shortcut?: string }>> = [
  [
    { action: "onMoveToSplit", key: "split", label: "向新的拆分视图中添加标签页", icon: "split" },
    { action: "onOpenBrowserTab", key: "browser-tab", label: "在新的浏览器标签页中打开", icon: "external" },
  ],
  [
    { action: "onReload", key: "reload", label: "重新加载当前帖子", icon: "refresh" },
    { action: "onCopyLink", key: "copy", label: "复制链接", icon: "copy" },
  ],
  [{ action: "onBookmark", key: "bookmark", label: "添加到书签", icon: "bookmark" }],
  [{ action: "onCloseOthers", key: "close-others", label: "关闭其他标签页", icon: "close-others" }],
];

export class TabContextMenu {
  private root: HTMLElement | null = null;
  private readonly onOutsidePointer = (event: Event) => {
    if (!this.root?.contains(event.target as Node)) this.close();
  };
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") this.close();
  };

  constructor(private readonly callbacks: TabContextMenuCallbacks) {}

  open(tabId: string, clientX: number, clientY: number, splitDisabled = false): void {
    this.close();
    const root = document.createElement("div");
    root.className = "ldu-tab-context-menu";
    root.setAttribute("role", "menu");
    root.setAttribute("aria-label", "标签页管理菜单");
    for (const [groupIndex, group] of GROUPS.entries()) {
      if (groupIndex > 0) {
        const separator = document.createElement("div");
        separator.className = "ldu-context-separator";
        separator.setAttribute("role", "separator");
        root.append(separator);
      }
      for (const item of group) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ldu-context-item";
        button.dataset.action = item.key;
        button.setAttribute("role", "menuitem");
        if (item.key === "split" && splitDisabled) button.disabled = true;
        button.append(createIcon(document, item.icon));
        const label = document.createElement("span");
        label.className = "ldu-context-label";
        label.textContent = item.label;
        button.append(label);
        if (item.shortcut) {
          const shortcut = document.createElement("span");
          shortcut.className = "ldu-context-shortcut";
          shortcut.textContent = item.shortcut;
          button.append(shortcut);
        }
        button.addEventListener("click", () => {
          this.close();
          this.callbacks[item.action](tabId);
        });
        root.append(button);
      }
    }
    document.body.append(root);
    this.root = root;
    const rect = root.getBoundingClientRect();
    const margin = 8;
    root.style.left = `${Math.max(margin, Math.min(clientX, window.innerWidth - rect.width - margin))}px`;
    root.style.top = `${Math.max(margin, Math.min(clientY, window.innerHeight - rect.height - margin))}px`;
    document.addEventListener("pointerdown", this.onOutsidePointer, true);
    document.addEventListener("keydown", this.onKeyDown, true);
    root.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
  }

  close(): void {
    document.removeEventListener("pointerdown", this.onOutsidePointer, true);
    document.removeEventListener("keydown", this.onKeyDown, true);
    this.root?.remove();
    this.root = null;
  }

  destroy(): void { this.close(); }
}
