import type { TopicTabState } from "../core/types";
import { setIcon } from "../ui/icons";

export interface TabStripCallbacks {
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onContextMenu?: (tabId: string, clientX: number, clientY: number) => void;
  onReorder?: (tabId: string, targetTabId: string, position: "before" | "after") => void;
}

export interface TabStripOptions {
  colorizeTabs?: boolean;
}

interface CategoryColorEntry { name: string; color: string }
interface CategoryColorCache { rootClass: string; linkCount: number; entries: CategoryColorEntry[] }
const categoryColorCache = new WeakMap<Document, CategoryColorCache>();

function getCategoryColors(root: Document): CategoryColorEntry[] {
  const selector = '.sidebar-wrapper a[href^="/c/"], .sidebar-wrapper a[href*="linux.do/c/"]';
  const links = [...root.querySelectorAll<HTMLAnchorElement>(selector)];
  const rootClass = root.documentElement.className;
  const cached = categoryColorCache.get(root);
  if (cached && cached.rootClass === rootClass && cached.linkCount === links.length) return cached.entries;
  const entries = links.flatMap((link) => {
    const name = link.textContent?.trim() ?? "";
    const icon = link.querySelector<HTMLElement>(".sidebar-section-link-prefix.icon, .sidebar-section-link-prefix, .sidebar-section-link-icon");
    const color = icon ? root.defaultView?.getComputedStyle(icon).color.trim() ?? "" : "";
    return name && color && color !== "transparent" && color !== "rgba(0, 0, 0, 0)" ? [{ name, color }] : [];
  }).sort((a, b) => b.name.length - a.name.length);
  categoryColorCache.set(root, { rootClass, linkCount: links.length, entries });
  return entries;
}

export function resolveTabCategoryColor(title: string, root: Document = document): string | null {
  const titleWithoutSite = title.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i, "");
  const matches = getCategoryColors(root)
    .filter(({ name }) => {
      return name && (
        titleWithoutSite.endsWith(` - ${name}`)
        || titleWithoutSite.includes(` - ${name} / `)
        || titleWithoutSite.endsWith(` / ${name}`)
      );
    })
    .sort((a, b) => b.name.length - a.name.length);
  return matches[0]?.color ?? null;
}

export function renderTabStrip(
  root: HTMLElement,
  tabs: TopicTabState[],
  activeTabId: string | null,
  callbacks: TabStripCallbacks,
  options: TabStripOptions = {},
): void {
  root.replaceChildren();
  root.classList.toggle("is-category-colors-enabled", options.colorizeTabs !== false);
  let draggedTabId: string | null = null;
  let dropTarget: { tabId: string; position: "before" | "after" } | null = null;
  const clearDragState = () => {
    root.querySelectorAll<HTMLElement>(".is-dragging, .is-drop-before, .is-drop-after").forEach((item) => {
      item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
      item.setAttribute("aria-grabbed", "false");
    });
    draggedTabId = null;
    dropTarget = null;
  };
  root.ondragstart = (event) => {
    if (!callbacks.onReorder || !(event.target instanceof Element) || event.target.closest(".ldu-tab-close")) {
      event.preventDefault();
      return;
    }
    const item = event.target.closest<HTMLElement>(".ldu-tab-item[data-tab-id]");
    if (!item?.dataset.tabId) return;
    draggedTabId = item.dataset.tabId;
    item.classList.add("is-dragging");
    item.setAttribute("aria-grabbed", "true");
    event.dataTransfer?.setData("text/plain", draggedTabId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  };
  root.ondragover = (event) => {
    if (!draggedTabId || !(event.target instanceof Element)) return;
    const item = event.target.closest<HTMLElement>(".ldu-tab-item[data-tab-id]");
    const targetTabId = item?.dataset.tabId;
    if (!item || !targetTabId || targetTabId === draggedTabId) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    const rect = item.getBoundingClientRect();
    const position = event.clientX < rect.left + rect.width / 2 ? "before" : "after";
    if (dropTarget?.tabId === targetTabId && dropTarget.position === position) return;
    root.querySelectorAll(".is-drop-before, .is-drop-after").forEach((target) => {
      target.classList.remove("is-drop-before", "is-drop-after");
    });
    item.classList.add(position === "before" ? "is-drop-before" : "is-drop-after");
    dropTarget = { tabId: targetTabId, position };
  };
  root.ondrop = (event) => {
    if (!draggedTabId || !dropTarget) return;
    event.preventDefault();
    const sourceTabId = draggedTabId;
    const target = dropTarget;
    clearDragState();
    callbacks.onReorder?.(sourceTabId, target.tabId, target.position);
  };
  root.ondragend = clearDragState;
  const focusTab = (index: number) => {
    const buttons = root.querySelectorAll<HTMLButtonElement>(".ldu-tab-button");
    buttons[Math.min(buttons.length - 1, Math.max(0, index))]?.focus();
  };
  const fallbackColors = new Map(tabs
    .filter((tab) => !tab.categoryColor)
    .map((tab) => [tab.id, resolveTabCategoryColor(tab.title, root.ownerDocument)]));
  tabs.forEach((tab, index) => {
    const item = document.createElement("div");
    item.className = "ldu-tab-item";
    item.dataset.tabId = tab.id;
    item.draggable = Boolean(callbacks.onReorder);
    item.setAttribute("role", "presentation");
    item.setAttribute("aria-grabbed", "false");
    item.classList.toggle("is-active", tab.id === activeTabId);
    item.title = `${tab.title}\n${tab.url}`;
    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      callbacks.onContextMenu?.(tab.id, event.clientX, event.clientY);
    });
    const categoryColor = tab.categoryColor || fallbackColors.get(tab.id);
    if (categoryColor) item.style.setProperty("--ldu-tab-category-color", categoryColor);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ldu-tab-button";
    button.textContent = tab.title || `主题 ${tab.topicId}`;
    button.id = `ldu-tab-${tab.id}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(tab.id === activeTabId));
    button.tabIndex = tab.id === activeTabId ? 0 : -1;
    button.setAttribute("aria-label", `打开 ${button.textContent}`);
    button.addEventListener("click", () => callbacks.onActivate(tab.id));
    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        callbacks.onActivate(tabs[next]!.id);
        focusTab(next);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : tabs.length - 1;
        callbacks.onActivate(tabs[next]!.id);
        focusTab(next);
      } else if (event.key === "Delete") {
        event.preventDefault();
        callbacks.onClose(tab.id);
      }
    });

    const close = document.createElement("button");
    close.type = "button";
    close.className = "ldu-tab-close";
    close.draggable = false;
    setIcon(close, "close", 16);
    close.title = "关闭帖子标签";
    close.setAttribute("aria-label", `关闭 ${button.textContent}`);
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      callbacks.onClose(tab.id);
    });

    item.append(button, close);
    root.append(item);
  });
}
