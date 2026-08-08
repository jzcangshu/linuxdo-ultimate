import type { LayoutMode, LayoutPreference, PaneSizes } from "../core/types";
import { ensureAppStyles } from "./styles";

const NARROW_BREAKPOINT = 1100;
const WIDE_BREAKPOINT = 1680;
export type PaneLayout = "single" | "dual";

interface ListHandoff {
  outlet: HTMLElement;
  parent: HTMLElement;
  nextSibling: Node | null;
  scrollY: number;
}

export function resolveLayoutMode(preference: LayoutPreference, viewportWidth: number): LayoutMode {
  if (viewportWidth < NARROW_BREAKPOINT) return "native";
  if (preference === "two" || preference === "three") return preference;
  return viewportWidth >= WIDE_BREAKPOINT ? "three" : "two";
}

interface LayoutControllerOptions {
  preference: LayoutPreference;
  paneSizes: PaneSizes;
  dualPaneSizes?: PaneSizes;
  hidePosters: boolean;
  onPaneSizesChange?: (sizes: PaneSizes, layout: PaneLayout) => void;
}

export class LayoutController {
  private shell: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private secondaryPanel: HTMLElement | null = null;
  private secondaryContent: HTMLElement | null = null;
  private listContent: HTMLElement | null = null;
  private preference: LayoutPreference;
  private paneSizes: PaneSizes;
  private dualPaneSizes: PaneSizes;
  private hidePosters: boolean;
  private open = false;
  private secondaryOpen = false;
  private listHandoff: ListHandoff | null = null;
  private headerResizeObserver: ResizeObserver | null = null;
  private readonly resizeListener = () => this.apply();

  constructor(private readonly options: LayoutControllerOptions) {
    this.preference = options.preference;
    this.paneSizes = { ...options.paneSizes };
    this.dualPaneSizes = { ...(options.dualPaneSizes ?? options.paneSizes) };
    this.hidePosters = options.hidePosters;
  }

  mount(): boolean {
    ensureAppStyles();
    const wrapper = document.querySelector<HTMLElement>("#main-outlet-wrapper");
    const outlet = document.querySelector<HTMLElement>("#main-outlet");
    if (!wrapper || !outlet) return false;
    if (!this.shell) {
      this.shell = this.createShell();
      document.body.append(this.shell);
      this.panel = this.shell.querySelector<HTMLElement>("#ldu-topic-panel");
      this.content = this.panel?.querySelector<HTMLElement>(".ldu-topic-content") ?? null;
      this.secondaryPanel = this.shell.querySelector<HTMLElement>("#ldu-secondary-topic-panel");
      this.secondaryContent = this.secondaryPanel?.querySelector<HTMLElement>(".ldu-topic-content") ?? null;
      this.listContent = this.shell.querySelector<HTMLElement>(".ldu-list-content");
      window.addEventListener("resize", this.resizeListener, { passive: true });
      if (typeof ResizeObserver !== "undefined") {
        const header = document.querySelector<HTMLElement>(".d-header");
        if (header) {
          this.headerResizeObserver = new ResizeObserver(() => this.apply());
          this.headerResizeObserver.observe(header);
        }
      }
    } else if (this.shell.parentElement !== document.body) {
      document.body.append(this.shell);
    }
    document.body.classList.toggle("ldu-hide-posters", this.hidePosters);
    this.apply();
    return true;
  }

  destroy(): void {
    this.finishListHandoff();
    window.removeEventListener("resize", this.resizeListener);
    this.headerResizeObserver?.disconnect();
    this.headerResizeObserver = null;
    this.shell?.remove();
    this.shell = null;
    this.panel = null;
    this.content = null;
    this.secondaryPanel = null;
    this.secondaryContent = null;
    this.listContent = null;
    this.open = false;
    this.secondaryOpen = false;
    document.body.classList.remove("ldu-layout-active", "ldu-layout-two", "ldu-layout-three", "ldu-hide-posters", "ldu-secondary-open");
    document.documentElement.classList.remove("ldu-layout-two-root");
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.apply();
  }

  setSecondaryOpen(open: boolean): void {
    this.secondaryOpen = open;
    this.apply();
  }

  setPreference(preference: LayoutPreference): void {
    this.preference = preference;
    this.apply();
  }

  setPaneSizes(paneSizes: PaneSizes, dualPaneSizes: PaneSizes = this.dualPaneSizes): void {
    this.paneSizes = { ...paneSizes };
    this.dualPaneSizes = { ...dualPaneSizes };
    this.apply();
  }

  getContentElement(): HTMLElement | null {
    return this.content;
  }

  getSecondaryContentElement(): HTMLElement | null { return this.secondaryContent; }

  getListContentElement(): HTMLElement | null { return this.listContent; }
  getShellElement(): HTMLElement | null { return this.shell; }

  beginListHandoff(scrollY: number): boolean {
    if (this.listHandoff || !this.listContent) return false;
    const outlet = document.querySelector<HTMLElement>("#main-outlet");
    const parent = outlet?.parentElement;
    if (!outlet || !parent || parent === this.listContent) return false;
    this.listHandoff = {
      outlet,
      parent,
      nextSibling: outlet.nextSibling,
      scrollY: Math.max(0, scrollY),
    };
    this.listContent.classList.add("is-native-handoff");
    this.listContent.prepend(outlet);
    this.listContent.scrollTop = this.listHandoff.scrollY;
    return true;
  }

  finishListHandoff(): number | null {
    const handoff = this.listHandoff;
    if (!handoff) return null;
    this.listHandoff = null;
    if (handoff.nextSibling?.parentNode === handoff.parent) {
      handoff.parent.insertBefore(handoff.outlet, handoff.nextSibling);
    } else {
      handoff.parent.append(handoff.outlet);
    }
    this.listContent?.classList.remove("is-native-handoff");
    if (this.listContent) this.listContent.scrollTop = 0;
    return handoff.scrollY;
  }

  getTabStripElement(): HTMLElement | null {
    return this.panel?.querySelector<HTMLElement>(".ldu-tab-strip") ?? null;
  }

  getSecondaryTabStripElement(): HTMLElement | null {
    return this.secondaryPanel?.querySelector<HTMLElement>(".ldu-tab-strip") ?? null;
  }

  getActionsElement(): HTMLElement | null {
    return this.panel?.querySelector<HTMLElement>(".ldu-topic-actions") ?? null;
  }

  getSecondaryActionsElement(): HTMLElement | null {
    return this.secondaryPanel?.querySelector<HTMLElement>(".ldu-topic-actions") ?? null;
  }

  getPanelElement(): HTMLElement | null { return this.panel; }
  getSecondaryPanelElement(): HTMLElement | null { return this.secondaryPanel; }

  setHidePosters(hide: boolean): void {
    this.hidePosters = hide;
    document.body.classList.toggle("ldu-hide-posters", hide);
  }

  getMode(): LayoutMode {
    return this.open ? resolveLayoutMode(this.preference, window.innerWidth) : "native";
  }

  private apply(): void {
    if (!this.panel || !this.secondaryPanel || !this.shell) return;
    this.syncHeaderHeight();
    const mode = this.getMode();
    const active = mode !== "native";
    this.panel.hidden = !active;
    this.secondaryPanel.hidden = !active || !this.secondaryOpen;
    this.shell.hidden = !active;
    document.body.classList.toggle("ldu-layout-active", active);
    document.body.classList.toggle("ldu-layout-two", mode === "two");
    document.body.classList.toggle("ldu-layout-three", mode === "three");
    document.documentElement.classList.toggle("ldu-layout-two-root", mode === "two");
    document.body.classList.toggle("ldu-secondary-open", active && this.secondaryOpen);
    const paneSizes = this.getActivePaneSizes();
    document.documentElement.style.setProperty("--ldu-sidebar-width", `${paneSizes.sidebar}px`);
    document.documentElement.style.setProperty("--ldu-topic-track", `${1 - paneSizes.listRatio}fr`);
    document.documentElement.style.setProperty("--ldu-topic-split-track", `${(1 - paneSizes.listRatio) / 2}fr`);
    document.documentElement.style.setProperty("--ldu-list-track", `${paneSizes.listRatio}fr`);
    this.updateSeparatorValues();
  }

  private createPanel(secondary = false): HTMLElement {
    const panel = document.createElement("section");
    panel.id = secondary ? "ldu-secondary-topic-panel" : "ldu-topic-panel";
    panel.className = secondary ? "ldu-secondary-topic-panel" : "";
    panel.hidden = true;
    panel.setAttribute("aria-label", secondary ? "第二帖子阅读区" : "帖子阅读区");
    panel.innerHTML = `
      <div class="ldu-topic-toolbar">
        <div class="ldu-tab-strip" role="tablist" aria-label="${secondary ? "第二阅读区" : "主阅读区"}已打开的帖子"></div>
        <div class="ldu-topic-actions"></div>
      </div>
      <div class="ldu-topic-content">
        <div class="ldu-topic-empty">从列表中选择帖子</div>
      </div>
      ${secondary ? "" : '<button class="ldu-resize-handle ldu-resize-before" type="button" aria-label="调整左侧区域宽度"></button><button class="ldu-resize-handle ldu-resize-after" type="button" aria-label="调整主题列表宽度"></button>'}
    `;
    if (!secondary) {
      this.bindResizeHandle(panel.querySelector(".ldu-resize-before"), "before");
      this.bindResizeHandle(panel.querySelector(".ldu-resize-after"), "after");
    }
    return panel;
  }

  private createShell(): HTMLElement {
    const shell = document.createElement("div");
    shell.id = "ldu-layout-shell";
    shell.hidden = true;
    shell.setAttribute("aria-label", "Linux Do 分屏工作区");
    const list = document.createElement("div");
    list.className = "ldu-list-content";
    list.setAttribute("aria-label", "非阅读页区域");
    shell.append(list, this.createPanel(), this.createPanel(true));
    return shell;
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
      const layout: PaneLayout = this.secondaryOpen ? "dual" : "single";
      const paneSizes = this.getActivePaneSizes();
      if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
        paneSizes.sidebar = event.key === "Home" ? 160
          : event.key === "End" ? 360
          : Math.min(360, Math.max(160, paneSizes.sidebar + (direction * 12)));
      } else if ((side === "after" && mode === "three") || (side === "before" && mode === "two")) {
        const ratioDirection = mode === "three" ? -direction : direction;
        paneSizes.listRatio = event.key === "Home" ? 0.3
          : event.key === "End" ? 0.7
          : clampRatio(paneSizes.listRatio + (ratioDirection * 0.02));
      } else {
        return;
      }
      this.apply();
      this.options.onPaneSizesChange?.({ ...paneSizes }, layout);
    });
    handle.addEventListener("pointerdown", (event) => {
      if (!(event instanceof PointerEvent) || event.button !== 0) return;
      const startX = event.clientX;
      const layout: PaneLayout = this.secondaryOpen ? "dual" : "single";
      const paneSizes = this.getActivePaneSizes();
      const start = { ...paneSizes };
      handle.setPointerCapture(event.pointerId);
      const move = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const mode = this.getMode();
        const wrapper = this.panel?.parentElement;
        const availableWidth = Math.max(1, (wrapper?.clientWidth ?? window.innerWidth) - paneSizes.sidebar);
        if (side === "after" && mode === "three") {
          paneSizes.listRatio = clampRatio(start.listRatio - (delta / availableWidth));
        } else if (side === "before" && mode === "two") {
          paneSizes.listRatio = clampRatio(start.listRatio + (delta / availableWidth));
        } else if (side === "before" && mode === "three" && document.body.classList.contains("has-sidebar-page")) {
          paneSizes.sidebar = Math.round(Math.min(360, Math.max(160, start.sidebar + delta)));
        }
        this.apply();
      };
      const finish = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", finish);
        handle.removeEventListener("pointercancel", finish);
        this.options.onPaneSizesChange?.({ ...paneSizes }, layout);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", finish);
      handle.addEventListener("pointercancel", finish);
    });
  }

  private updateSeparatorValues(): void {
    if (!this.panel) return;
    const mode = this.getMode();
    const paneSizes = this.getActivePaneSizes();
    const before = this.panel.querySelector<HTMLElement>(".ldu-resize-before");
    const after = this.panel.querySelector<HTMLElement>(".ldu-resize-after");
    const set = (handle: HTMLElement | null, value: number, min: number, max: number) => {
      if (!handle) return;
      handle.setAttribute("aria-valuemin", String(min));
      handle.setAttribute("aria-valuemax", String(max));
      handle.setAttribute("aria-valuenow", String(value));
    };
    if (mode === "three" && document.body.classList.contains("has-sidebar-page")) {
      set(before, paneSizes.sidebar, 160, 360);
    } else {
      set(before, Math.round(paneSizes.listRatio * 100), 30, 70);
    }
    set(after, Math.round(paneSizes.listRatio * 100), 30, 70);
  }

  private syncHeaderHeight(): void {
    const header = document.querySelector<HTMLElement>(".d-header");
    if (!header) return;
    const height = Math.ceil(header.getBoundingClientRect().height);
    if (height > 0) document.documentElement.style.setProperty("--ldu-header-height", `${height}px`);
  }

  private getActivePaneSizes(): PaneSizes {
    return this.secondaryOpen ? this.dualPaneSizes : this.paneSizes;
  }
}

function clampRatio(value: number): number {
  return Math.round(Math.min(0.7, Math.max(0.3, value)) * 1000) / 1000;
}
