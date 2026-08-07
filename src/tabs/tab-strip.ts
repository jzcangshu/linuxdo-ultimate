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

export const PRIMARY_CATEGORY_COLORS = [
  ["开发调优", "rgb(50, 195, 195)"],
  ["国产替代", "rgb(209, 44, 37)"],
  ["资源荟萃", "rgb(18, 168, 157)"],
  ["文档共建", "rgb(156, 182, 196)"],
  ["跳蚤市场", "rgb(237, 32, 123)"],
  ["积分乐园", "rgb(252, 202, 68)"],
  ["非我莫属", "rgb(168, 198, 254)"],
  ["读书成诗", "rgb(224, 217, 0)"],
  ["扬帆起航", "rgb(255, 152, 56)"],
  ["前沿快讯", "rgb(187, 143, 206)"],
  ["网络记忆", "rgb(247, 148, 29)"],
  ["福利羊毛", "rgb(228, 87, 53)"],
  ["搞七捻三", "rgb(58, 181, 74)"],
  ["社区孵化", "rgb(255, 187, 0)"],
  ["虫洞广场", "rgb(255, 0, 247)"],
  ["运营反馈", "rgb(128, 130, 129)"],
  ["深海幽域", "rgb(69, 183, 209)"],
] as const;

export function resolveTabCategoryColor(title: string, _root: Document = document): string | null {
  const titleWithoutSite = title.replace(/\s+-\s+LINUX DO(?:\s.*)?$/i, "");
  const separatorIndex = titleWithoutSite.lastIndexOf(" - ");
  const category = titleWithoutSite.slice(separatorIndex < 0 ? 0 : separatorIndex + 3).trim();
  const match = PRIMARY_CATEGORY_COLORS.find(([name]) => (
    category === name
    || category.startsWith(`${name} /`)
    || category.startsWith(`${name},`)
  ));
  return match?.[1] ?? null;
}

export function renderTabStrip(
  root: HTMLElement,
  tabs: TopicTabState[],
  activeTabId: string | null,
  callbacks: TabStripCallbacks,
  options: TabStripOptions = {},
): void {
  root.replaceChildren();
  root.classList.remove("is-reordering");
  root.classList.toggle("is-category-colors-enabled", options.colorizeTabs !== false);
  let draggedTabId: string | null = null;
  let dropTarget: { tabId: string; position: "before" | "after" } | null = null;
  let dragMetrics: Array<{
    tabId: string;
    item: HTMLElement;
    index: number;
    center: number;
    shift: number;
  }> | null = null;
  let insertionIndex: number | null = null;
  const clearDragState = () => {
    root.querySelectorAll<HTMLElement>(".is-dragging, .is-drop-before, .is-drop-after").forEach((item) => {
      item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
      item.setAttribute("aria-grabbed", "false");
      item.style.transform = "";
    });
    root.classList.remove("is-reordering");
    draggedTabId = null;
    dropTarget = null;
    dragMetrics = null;
    insertionIndex = null;
  };
  const updateDragPosition = (clientX: number) => {
    if (!draggedTabId || !dragMetrics) return;
    const source = dragMetrics.find((metric) => metric.tabId === draggedTabId);
    if (!source) return;
    const available = dragMetrics.filter((metric) => metric.tabId !== draggedTabId);
    const nextInsertionIndex = available.filter((metric) => clientX >= metric.center).length;
    if (nextInsertionIndex === insertionIndex) return;
    insertionIndex = nextInsertionIndex;
    const destinationIndex = nextInsertionIndex;
    for (const metric of dragMetrics) {
      let offset = 0;
      if (destinationIndex > source.index && metric.index > source.index && metric.index <= destinationIndex) {
        offset = -source.shift;
      } else if (destinationIndex < source.index && metric.index >= destinationIndex && metric.index < source.index) {
        offset = source.shift;
      }
      metric.item.style.transform = offset ? `translate3d(${offset}px, 0, 0)` : "";
      metric.item.classList.remove("is-drop-before", "is-drop-after");
    }
    const target = destinationIndex === 0 ? available[0] : available[destinationIndex - 1];
    if (!target) {
      dropTarget = null;
      return;
    }
    const position = destinationIndex === 0 ? "before" : "after";
    target.item.classList.add(position === "before" ? "is-drop-before" : "is-drop-after");
    dropTarget = { tabId: target.tabId, position };
  };
  root.ondragstart = (event) => {
    if (!callbacks.onReorder || !(event.target instanceof Element) || event.target.closest(".ldu-tab-close")) {
      event.preventDefault();
      return;
    }
    const item = event.target.closest<HTMLElement>(".ldu-tab-item[data-tab-id]");
    if (!item?.dataset.tabId) return;
    draggedTabId = item.dataset.tabId;
    const items = [...root.querySelectorAll<HTMLElement>(".ldu-tab-item[data-tab-id]")];
    const rects = items.map((candidate) => candidate.getBoundingClientRect());
    dragMetrics = items.map((candidate, index) => {
      const rect = rects[index]!;
      const nextRect = rects[index + 1];
      const previousRect = rects[index - 1];
      const gap = nextRect
        ? Math.max(0, nextRect.left - rect.right)
        : previousRect ? Math.max(0, rect.left - previousRect.right) : 0;
      return {
        tabId: candidate.dataset.tabId!,
        item: candidate,
        index,
        center: rect.left + rect.width / 2,
        shift: rect.width + gap,
      };
    });
    root.classList.add("is-reordering");
    item.classList.add("is-dragging");
    item.setAttribute("aria-grabbed", "true");
    event.dataTransfer?.setData("text/plain", draggedTabId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      const rect = item.getBoundingClientRect();
      event.dataTransfer.setDragImage(
        item,
        Math.max(0, event.clientX - rect.left),
        Math.max(0, event.clientY - rect.top),
      );
    }
  };
  root.ondragover = (event) => {
    if (!draggedTabId || !dragMetrics) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    if (Number.isFinite(event.clientX)) updateDragPosition(event.clientX);
  };
  root.ondrop = (event) => {
    if (!draggedTabId || !dragMetrics) return;
    event.preventDefault();
    if (Number.isFinite(event.clientX)) updateDragPosition(event.clientX);
    if (!dropTarget) {
      clearDragState();
      return;
    }
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
    const categoryColor = tab.categoryColor || resolveTabCategoryColor(tab.title, root.ownerDocument);
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
