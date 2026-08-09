import type { TopicTabState } from "../core/types";
import {
  PRIMARY_CATEGORY_COLORS,
  resolveFixedCategoryColor,
  resolveFixedPrimaryCategory,
} from "../discourse/category";
import { setIcon } from "../ui/icons";

export interface TabStripCallbacks {
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onContextMenu?: (tabId: string, clientX: number, clientY: number) => void;
  onReorder?: (tabId: string, targetTabId: string, position: "before" | "after") => void;
}

export interface TabStripOptions {
  colorizeTabs?: boolean;
  orientation?: "horizontal" | "vertical";
  groupByCategory?: boolean;
}

export { PRIMARY_CATEGORY_COLORS };

export const resolveTabCategoryColor = resolveFixedCategoryColor;

interface TabStripRenderState {
  tabs: TopicTabState[];
  callbacks: TabStripCallbacks;
}

interface DragMetric {
  tabId: string;
  item: HTMLElement;
  index: number;
  center: number;
  shift: number;
}

const tabStripStates = new WeakMap<HTMLElement, TabStripRenderState>();

function resetTabDragVisuals(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(":scope > .ldu-tab-item[data-tab-id]").forEach((item) => {
    item.classList.remove("is-dragging", "is-drop-before", "is-drop-after");
    item.setAttribute("aria-grabbed", "false");
    item.style.transform = "";
  });
  root.classList.remove("is-reordering");
}

function createTabItem(root: HTMLElement): HTMLElement {
  const item = document.createElement("div");
  item.className = "ldu-tab-item";
  item.setAttribute("role", "presentation");
  item.setAttribute("aria-grabbed", "false");
  item.addEventListener("contextmenu", (event) => {
    const tabId = item.dataset.tabId;
    const state = tabStripStates.get(root);
    if (!tabId || !state) return;
    event.preventDefault();
    event.stopPropagation();
    state.callbacks.onContextMenu?.(tabId, event.clientX, event.clientY);
  });
  item.addEventListener("auxclick", (event) => {
    if (event.button !== 1) return;
    const tabId = item.dataset.tabId;
    const state = tabStripStates.get(root);
    if (!tabId || !state) return;
    event.preventDefault();
    event.stopPropagation();
    state.callbacks.onClose(tabId);
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ldu-tab-button";
  button.setAttribute("role", "tab");
  const glyph = document.createElement("span");
  glyph.className = "ldu-tab-glyph";
  setIcon(glyph, "list", 15);
  const label = document.createElement("span");
  label.className = "ldu-tab-title";
  button.append(glyph, label);
  button.addEventListener("click", () => {
    const tabId = item.dataset.tabId;
    const state = tabStripStates.get(root);
    if (tabId && state) state.callbacks.onActivate(tabId);
  });
  button.addEventListener("keydown", (event) => {
    const tabId = item.dataset.tabId;
    const state = tabStripStates.get(root);
    if (!tabId || !state) return;
    const visibleItems = [...root.querySelectorAll<HTMLElement>(":scope > .ldu-tab-item[data-tab-id]")];
    const index = visibleItems.findIndex((candidate) => candidate.dataset.tabId === tabId);
    if (index < 0) return;
    const vertical = root.classList.contains("is-vertical");
    const previousKey = vertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";
    let next = index;
    if (event.key === previousKey || event.key === nextKey) {
      event.preventDefault();
      next = (index + (event.key === nextKey ? 1 : -1) + visibleItems.length) % visibleItems.length;
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      next = event.key === "Home" ? 0 : visibleItems.length - 1;
    } else if (event.key === "Delete") {
      event.preventDefault();
      state.callbacks.onClose(tabId);
      return;
    } else {
      return;
    }
    const nextItem = visibleItems[next];
    if (!nextItem?.dataset.tabId) return;
    state.callbacks.onActivate(nextItem.dataset.tabId);
    nextItem.querySelector<HTMLButtonElement>(".ldu-tab-button")?.focus();
  });

  const close = document.createElement("button");
  close.type = "button";
  close.className = "ldu-tab-close";
  close.draggable = false;
  setIcon(close, "close", 16);
  close.title = "关闭帖子标签";
  close.addEventListener("click", (event) => {
    event.stopPropagation();
    const tabId = item.dataset.tabId;
    const state = tabStripStates.get(root);
    if (tabId && state) state.callbacks.onClose(tabId);
  });

  item.append(button, close);
  return item;
}

function updateTabItem(
  item: HTMLElement,
  tab: TopicTabState,
  activeTabId: string | null,
  callbacks: TabStripCallbacks,
): void {
  const active = tab.id === activeTabId;
  const title = tab.title || `主题 ${tab.topicId}`;
  item.dataset.tabId = tab.id;
  item.draggable = Boolean(callbacks.onReorder);
  item.classList.toggle("is-active", active);
  item.title = `${tab.title}\n${tab.url}`;
  const category = resolveFixedPrimaryCategory(tab.title);
  item.dataset.categoryGroup = category?.name ?? "other";
  if (category) item.style.setProperty("--ldu-tab-category-color", category.color);
  else item.style.removeProperty("--ldu-tab-category-color");

  const button = item.querySelector<HTMLButtonElement>(".ldu-tab-button")!;
  button.querySelector<HTMLElement>(".ldu-tab-title")!.textContent = title;
  button.id = `ldu-tab-${tab.id}`;
  button.setAttribute("aria-selected", String(active));
  button.tabIndex = active ? 0 : -1;
  button.setAttribute("aria-label", `打开 ${title}`);
  item.querySelector<HTMLButtonElement>(".ldu-tab-close")?.setAttribute("aria-label", `关闭 ${title}`);
}

function createGroupHeader(key: string): HTMLElement {
  const header = document.createElement("div");
  header.className = "ldu-tab-group-header";
  header.dataset.groupKey = key;
  header.setAttribute("role", "presentation");
  const marker = document.createElement("span");
  marker.className = "ldu-tab-group-marker";
  const label = document.createElement("span");
  label.className = "ldu-tab-group-label";
  header.append(marker, label);
  return header;
}

export function renderTabStrip(
  root: HTMLElement,
  tabs: TopicTabState[],
  activeTabId: string | null,
  callbacks: TabStripCallbacks,
  options: TabStripOptions = {},
): void {
  tabStripStates.set(root, { tabs, callbacks });
  resetTabDragVisuals(root);
  const orientation = options.orientation === "vertical" ? "vertical" : "horizontal";
  const grouped = orientation === "vertical" && options.groupByCategory === true;
  root.classList.toggle("is-vertical", orientation === "vertical");
  root.classList.toggle("is-grouped", grouped);
  root.setAttribute("aria-orientation", orientation);
  root.classList.toggle("is-category-colors-enabled", options.colorizeTabs !== false);

  let draggedTabId: string | null = null;
  let dropTarget: { tabId: string; position: "before" | "after" } | null = null;
  let dragMetrics: DragMetric[] | null = null;
  let insertionIndex: number | null = null;
  const clearDragState = () => {
    resetTabDragVisuals(root);
    draggedTabId = null;
    dropTarget = null;
    dragMetrics = null;
    insertionIndex = null;
  };
  const updateDragPosition = (pointerPosition: number) => {
    if (!draggedTabId || !dragMetrics) return;
    const source = dragMetrics.find((metric) => metric.tabId === draggedTabId);
    if (!source) return;
    const available = dragMetrics.filter((metric) => metric.tabId !== draggedTabId);
    const nextInsertionIndex = available.filter((metric) => pointerPosition >= metric.center).length;
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
      metric.item.style.transform = offset
        ? orientation === "vertical" ? `translate3d(0, ${offset}px, 0)` : `translate3d(${offset}px, 0, 0)`
        : "";
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
    const sourceGroup = item.dataset.categoryGroup;
    const items = [...root.querySelectorAll<HTMLElement>(".ldu-tab-item[data-tab-id]")]
      .filter((candidate) => !grouped || candidate.dataset.categoryGroup === sourceGroup);
    const rects = items.map((candidate) => candidate.getBoundingClientRect());
    dragMetrics = items.map((candidate, index) => {
      const rect = rects[index]!;
      const nextRect = rects[index + 1];
      const previousRect = rects[index - 1];
      const start = orientation === "vertical" ? rect.top : rect.left;
      const end = orientation === "vertical" ? rect.bottom : rect.right;
      const size = orientation === "vertical" ? rect.height : rect.width;
      const nextStart = nextRect ? (orientation === "vertical" ? nextRect.top : nextRect.left) : null;
      const previousEnd = previousRect ? (orientation === "vertical" ? previousRect.bottom : previousRect.right) : null;
      const gap = nextStart !== null
        ? Math.max(0, nextStart - end)
        : previousEnd !== null ? Math.max(0, start - previousEnd) : 0;
      return {
        tabId: candidate.dataset.tabId!,
        item: candidate,
        index,
        center: start + size / 2,
        shift: size + gap,
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
    const pointerPosition = orientation === "vertical" ? event.clientY : event.clientX;
    if (Number.isFinite(pointerPosition)) updateDragPosition(pointerPosition);
  };
  root.ondrop = (event) => {
    if (!draggedTabId || !dragMetrics) return;
    event.preventDefault();
    const pointerPosition = orientation === "vertical" ? event.clientY : event.clientX;
    if (Number.isFinite(pointerPosition)) updateDragPosition(pointerPosition);
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

  const requestedIds = new Set(tabs.map((tab) => tab.id));
  const existing = new Map(
    [...root.querySelectorAll<HTMLElement>(":scope > .ldu-tab-item[data-tab-id]")]
      .map((item) => [item.dataset.tabId!, item]),
  );
  for (const [tabId, item] of existing) {
    if (!requestedIds.has(tabId)) {
      item.remove();
      existing.delete(tabId);
    }
  }
  const desiredItems = tabs.map((tab) => {
    const item = existing.get(tab.id) ?? createTabItem(root);
    updateTabItem(item, tab, activeTabId, callbacks);
    return item;
  });
  const existingHeaders = new Map(
    [...root.querySelectorAll<HTMLElement>(":scope > .ldu-tab-group-header[data-group-key]")]
      .map((header) => [header.dataset.groupKey!, header]),
  );
  const desiredNodes: HTMLElement[] = [];
  if (grouped) {
    const groups = new Map<string, { label: string; color: string | null; items: HTMLElement[] }>();
    tabs.forEach((tab, index) => {
      const category = resolveFixedPrimaryCategory(tab.title);
      const key = category?.name ?? "other";
      const group = groups.get(key) ?? {
        label: category?.name ?? "其他",
        color: category?.color ?? null,
        items: [],
      };
      group.items.push(desiredItems[index]!);
      groups.set(key, group);
    });
    for (const [key, group] of groups) {
      const header = existingHeaders.get(key) ?? createGroupHeader(key);
      header.querySelector<HTMLElement>(".ldu-tab-group-label")!.textContent = `${group.label} ${group.items.length}`;
      if (group.color) header.style.setProperty("--ldu-tab-category-color", group.color);
      else header.style.removeProperty("--ldu-tab-category-color");
      desiredNodes.push(header, ...group.items);
      existingHeaders.delete(key);
    }
  } else {
    desiredNodes.push(...desiredItems);
  }
  existingHeaders.forEach((header) => header.remove());
  let cursor = root.firstElementChild;
  for (const node of desiredNodes) {
    if (node !== cursor) root.insertBefore(node, cursor);
    cursor = node.nextElementSibling;
  }
}
