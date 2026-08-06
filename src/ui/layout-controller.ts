import type { LayoutMode, LayoutPreference, PaneSizes } from "../core/types";
import { ensureAppStyles } from "./styles";

const NARROW_BREAKPOINT = 1100;
const WIDE_BREAKPOINT = 1680;

export function resolveLayoutMode(preference: LayoutPreference, viewportWidth: number): LayoutMode {
  if (viewportWidth < NARROW_BREAKPOINT) return "native";
  if (preference === "two" || preference === "three") return preference;
  return viewportWidth >= WIDE_BREAKPOINT ? "three" : "two";
}

interface LayoutControllerOptions {
  preference: LayoutPreference;
  paneSizes: PaneSizes;
  hidePosters: boolean;
  onPaneSizesChange?: (sizes: PaneSizes) => void;
}

export class LayoutController {
  private panel: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private preference: LayoutPreference;
  private paneSizes: PaneSizes;
  private hidePosters: boolean;
  private open = false;
  private listScrollbar: HTMLElement | null = null;
  private listScrollbarThumb: HTMLElement | null = null;
  private listResizeObserver: ResizeObserver | null = null;
  private readonly resizeListener = () => this.apply();
  private readonly scrollListener = () => this.updateListScrollbar();

  constructor(private readonly options: LayoutControllerOptions) {
    this.preference = options.preference;
    this.paneSizes = { ...options.paneSizes };
    this.hidePosters = options.hidePosters;
  }

  mount(): boolean {
    ensureAppStyles();
    const wrapper = document.querySelector<HTMLElement>("#main-outlet-wrapper");
    const outlet = document.querySelector<HTMLElement>("#main-outlet");
    if (!wrapper || !outlet) return false;
    if (!this.panel) {
      this.panel = this.createPanel();
      wrapper.append(this.panel);
      this.content = this.panel.querySelector<HTMLElement>(".ldu-topic-content");
      this.createListScrollbar(outlet);
      window.addEventListener("resize", this.resizeListener, { passive: true });
      window.addEventListener("scroll", this.scrollListener, { passive: true });
    } else if (this.panel.parentElement !== wrapper) {
      wrapper.append(this.panel);
    }
    document.body.classList.toggle("ldu-hide-posters", this.hidePosters);
    this.apply();
    return true;
  }

  destroy(): void {
    window.removeEventListener("resize", this.resizeListener);
    window.removeEventListener("scroll", this.scrollListener);
    this.listResizeObserver?.disconnect();
    this.listResizeObserver = null;
    this.listScrollbar?.remove();
    this.listScrollbar = null;
    this.listScrollbarThumb = null;
    this.panel?.remove();
    this.panel = null;
    this.content = null;
    document.body.classList.remove("ldu-layout-active", "ldu-layout-two", "ldu-layout-three", "ldu-hide-posters");
    document.documentElement.classList.remove("ldu-layout-two-root");
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.apply();
  }

  setPreference(preference: LayoutPreference): void {
    this.preference = preference;
    this.apply();
  }

  setPaneSizes(paneSizes: PaneSizes): void {
    this.paneSizes = { ...paneSizes };
    this.apply();
  }

  getContentElement(): HTMLElement | null {
    return this.content;
  }

  getTabStripElement(): HTMLElement | null {
    return this.panel?.querySelector<HTMLElement>(".ldu-tab-strip") ?? null;
  }

  getActionsElement(): HTMLElement | null {
    return this.panel?.querySelector<HTMLElement>(".ldu-topic-actions") ?? null;
  }

  getPanelElement(): HTMLElement | null { return this.panel; }

  setHidePosters(hide: boolean): void {
    this.hidePosters = hide;
    document.body.classList.toggle("ldu-hide-posters", hide);
  }

  getMode(): LayoutMode {
    return this.open ? resolveLayoutMode(this.preference, window.innerWidth) : "native";
  }

  private apply(): void {
    if (!this.panel) return;
    const mode = this.getMode();
    const active = mode !== "native";
    this.panel.hidden = !active;
    document.body.classList.toggle("ldu-layout-active", active);
    document.body.classList.toggle("ldu-layout-two", mode === "two");
    document.body.classList.toggle("ldu-layout-three", mode === "three");
    document.documentElement.classList.toggle("ldu-layout-two-root", mode === "two");
    document.documentElement.style.setProperty("--ldu-sidebar-width", `${this.paneSizes.sidebar}px`);
    document.documentElement.style.setProperty("--ldu-topic-track", `${1 - this.paneSizes.listRatio}fr`);
    document.documentElement.style.setProperty("--ldu-list-track", `${this.paneSizes.listRatio}fr`);
    this.updateSeparatorValues();
    this.updateListScrollbar();
  }

  private createListScrollbar(outlet: HTMLElement): void {
    if (this.listScrollbar) return;
    const track = document.createElement("div");
    track.className = "ldu-list-scrollbar";
    track.hidden = true;
    track.tabIndex = 0;
    track.setAttribute("role", "scrollbar");
    track.setAttribute("aria-label", "帖子列表滚动条");
    track.setAttribute("aria-orientation", "vertical");
    const thumb = document.createElement("div");
    thumb.className = "ldu-list-scrollbar-thumb";
    track.append(thumb);
    document.body.append(track);
    this.listScrollbar = track;
    this.listScrollbarThumb = thumb;

    track.addEventListener("pointerdown", (event) => {
      if (event.target !== track || event.button !== 0) return;
      event.preventDefault();
      const rect = track.getBoundingClientRect();
      const thumbHeight = thumb.getBoundingClientRect().height || Number.parseFloat(thumb.style.height) || 0;
      this.scrollFromTrackPosition(event.clientY - rect.top - (thumbHeight / 2), rect.height, thumbHeight);
    });
    track.addEventListener("keydown", (event) => this.handleScrollbarKey(event));
    thumb.addEventListener("pointerdown", (event) => this.startScrollbarDrag(event, track, thumb));
    if (typeof ResizeObserver === "function") {
      this.listResizeObserver = new ResizeObserver(() => this.updateListScrollbar());
      this.listResizeObserver.observe(outlet);
    }
  }

  private updateListScrollbar(): void {
    const track = this.listScrollbar;
    const thumb = this.listScrollbarThumb;
    if (!track || !thumb) return;
    const outlet = document.querySelector<HTMLElement>("#main-outlet");
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (this.getMode() !== "two" || !outlet || maxScroll <= 0) {
      track.hidden = true;
      return;
    }
    const listRect = outlet.getBoundingClientRect();
    const headerBottom = document.querySelector<HTMLElement>(".d-header")?.getBoundingClientRect().bottom ?? 0;
    const top = Math.max(0, headerBottom);
    const height = Math.max(0, window.innerHeight - top);
    if (height <= 0 || listRect.width <= 0) {
      track.hidden = true;
      return;
    }
    const trackWidth = 10;
    track.hidden = false;
    track.style.left = `${Math.max(0, Math.min(window.innerWidth - trackWidth, listRect.right - trackWidth - 4))}px`;
    track.style.top = `${top}px`;
    track.style.height = `${height}px`;
    const thumbHeight = Math.min(height, Math.max(36, height * (window.innerHeight / document.documentElement.scrollHeight)));
    const travel = Math.max(0, height - thumbHeight);
    const thumbTop = maxScroll > 0 ? travel * (window.scrollY / maxScroll) : 0;
    thumb.style.height = `${thumbHeight}px`;
    thumb.style.transform = `translateY(${thumbTop}px)`;
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(Math.round(maxScroll)));
    track.setAttribute("aria-valuenow", String(Math.round(window.scrollY)));
  }

  private scrollFromTrackPosition(position: number, trackHeight: number, thumbHeight: number): void {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const travel = Math.max(1, trackHeight - thumbHeight);
    const ratio = Math.min(1, Math.max(0, position / travel));
    window.scrollTo({ top: ratio * maxScroll, behavior: "instant" });
  }

  private startScrollbarDrag(event: PointerEvent, track: HTMLElement, thumb: HTMLElement): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const pointerId = event.pointerId;
    const startY = event.clientY;
    const startScroll = window.scrollY;
    const trackHeight = track.getBoundingClientRect().height || Number.parseFloat(track.style.height) || 0;
    const thumbHeight = thumb.getBoundingClientRect().height || Number.parseFloat(thumb.style.height) || 0;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const travel = Math.max(1, trackHeight - thumbHeight);
    try { thumb.setPointerCapture(pointerId); } catch { /* Pointer capture is optional. */ }
    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      moveEvent.preventDefault();
      const next = startScroll + ((moveEvent.clientY - startY) / travel * maxScroll);
      window.scrollTo({ top: Math.min(maxScroll, Math.max(0, next)), behavior: "instant" });
    };
    const finish = (finishEvent: PointerEvent) => {
      if (finishEvent.pointerId !== pointerId) return;
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", finish);
      thumb.removeEventListener("pointercancel", finish);
      try { thumb.releasePointerCapture(pointerId); } catch { /* Pointer capture is optional. */ }
    };
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", finish);
    thumb.addEventListener("pointercancel", finish);
  }

  private handleScrollbarKey(event: KeyboardEvent): void {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    let next: number | null = null;
    if (event.key === "ArrowUp") next = window.scrollY - 40;
    if (event.key === "ArrowDown") next = window.scrollY + 40;
    if (event.key === "PageUp") next = window.scrollY - (window.innerHeight * 0.9);
    if (event.key === "PageDown") next = window.scrollY + (window.innerHeight * 0.9);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = maxScroll;
    if (next === null) return;
    event.preventDefault();
    window.scrollTo({ top: Math.min(maxScroll, Math.max(0, next)), behavior: "instant" });
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement("section");
    panel.id = "ldu-topic-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "帖子阅读区");
    panel.innerHTML = `
      <div class="ldu-topic-toolbar">
        <div class="ldu-tab-strip" role="tablist" aria-label="已打开的帖子"></div>
        <div class="ldu-topic-actions"></div>
      </div>
      <div class="ldu-topic-content">
        <div class="ldu-topic-empty">从列表中选择帖子</div>
      </div>
      <button class="ldu-resize-handle ldu-resize-before" type="button" aria-label="调整左侧区域宽度"></button>
      <button class="ldu-resize-handle ldu-resize-after" type="button" aria-label="调整主题列表宽度"></button>
    `;
    this.bindResizeHandle(panel.querySelector(".ldu-resize-before"), "before");
    this.bindResizeHandle(panel.querySelector(".ldu-resize-after"), "after");
    return panel;
  }

  private bindResizeHandle(handle: Element | null, side: "before" | "after"): void {
    if (!(handle instanceof HTMLElement)) return;
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-orientation", "vertical");
    handle.tabIndex = 0;
    handle.addEventListener("keydown", (event) => {
      if (!(event instanceof KeyboardEvent) || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      const mode = this.getMode();
      if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
        this.paneSizes.sidebar = event.key === "Home" ? 160
          : event.key === "End" ? 360
          : Math.min(360, Math.max(160, this.paneSizes.sidebar + (direction * 12)));
      } else if ((side === "after" && mode === "three") || (side === "before" && mode === "two")) {
        const ratioDirection = mode === "three" ? -direction : direction;
        this.paneSizes.listRatio = event.key === "Home" ? 0.3
          : event.key === "End" ? 0.7
          : clampRatio(this.paneSizes.listRatio + (ratioDirection * 0.02));
      } else {
        return;
      }
      this.apply();
      this.options.onPaneSizesChange?.({ ...this.paneSizes });
    });
    handle.addEventListener("pointerdown", (event) => {
      if (!(event instanceof PointerEvent) || event.button !== 0) return;
      const startX = event.clientX;
      const start = { ...this.paneSizes };
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const mode = this.getMode();
        const wrapper = this.panel?.parentElement;
        const availableWidth = Math.max(1, (wrapper?.clientWidth ?? window.innerWidth) - this.paneSizes.sidebar);
        if (side === "after" && mode === "three") {
          this.paneSizes.listRatio = clampRatio(start.listRatio - (delta / availableWidth));
        } else if (side === "before" && mode === "two") {
          this.paneSizes.listRatio = clampRatio(start.listRatio + (delta / availableWidth));
        } else if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
          this.paneSizes.sidebar = Math.round(Math.min(360, Math.max(160, start.sidebar + delta)));
        }
        this.apply();
      };
      const finish = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        this.options.onPaneSizesChange?.({ ...this.paneSizes });
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });
  }

  private updateSeparatorValues(): void {
    if (!this.panel) return;
    const mode = this.getMode();
    const before = this.panel.querySelector<HTMLElement>(".ldu-resize-before");
    const after = this.panel.querySelector<HTMLElement>(".ldu-resize-after");
    const set = (handle: HTMLElement | null, value: number, min: number, max: number) => {
      if (!handle) return;
      handle.setAttribute("aria-valuemin", String(min));
      handle.setAttribute("aria-valuemax", String(max));
      handle.setAttribute("aria-valuenow", String(value));
    };
    if (mode === "three" && document.body.classList.contains("has-sidebar-page")) {
      set(before, this.paneSizes.sidebar, 160, 360);
    } else {
      set(before, Math.round(this.paneSizes.listRatio * 100), 30, 70);
    }
    set(after, Math.round(this.paneSizes.listRatio * 100), 30, 70);
  }
}

function clampRatio(value: number): number {
  return Math.round(Math.min(0.7, Math.max(0.3, value)) * 1000) / 1000;
}
