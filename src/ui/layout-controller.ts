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
  private shell: HTMLElement | null = null;
  private panel: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private secondaryPanel: HTMLElement | null = null;
  private secondaryContent: HTMLElement | null = null;
  private listContent: HTMLElement | null = null;
  private preference: LayoutPreference;
  private paneSizes: PaneSizes;
  private hidePosters: boolean;
  private open = false;
  private secondaryOpen = false;
  private readonly resizeListener = () => this.apply();

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
    if (!this.shell) {
      this.shell = this.createShell();
      document.body.append(this.shell);
      this.panel = this.shell.querySelector<HTMLElement>("#ldu-topic-panel");
      this.content = this.panel?.querySelector<HTMLElement>(".ldu-topic-content") ?? null;
      this.secondaryPanel = this.shell.querySelector<HTMLElement>("#ldu-secondary-topic-panel");
      this.secondaryContent = this.secondaryPanel?.querySelector<HTMLElement>(".ldu-topic-content") ?? null;
      this.listContent = this.shell.querySelector<HTMLElement>(".ldu-list-content");
      window.addEventListener("resize", this.resizeListener, { passive: true });
    } else if (this.shell.parentElement !== document.body) {
      document.body.append(this.shell);
    }
    document.body.classList.toggle("ldu-hide-posters", this.hidePosters);
    this.apply();
    return true;
  }

  destroy(): void {
    window.removeEventListener("resize", this.resizeListener);
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
    document.documentElement.classList.remove("ldu-split-booting");
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

  setPaneSizes(paneSizes: PaneSizes): void {
    this.paneSizes = { ...paneSizes };
    this.apply();
  }

  getContentElement(): HTMLElement | null {
    return this.content;
  }

  getSecondaryContentElement(): HTMLElement | null { return this.secondaryContent; }

  getListContentElement(): HTMLElement | null { return this.listContent; }
  getShellElement(): HTMLElement | null { return this.shell; }

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
    if (active) document.documentElement.classList.remove("ldu-split-booting");
    document.documentElement.style.setProperty("--ldu-sidebar-width", `${this.paneSizes.sidebar}px`);
    document.documentElement.style.setProperty("--ldu-topic-track", `${1 - this.paneSizes.listRatio}fr`);
    document.documentElement.style.setProperty("--ldu-topic-split-track", `${(1 - this.paneSizes.listRatio) / 2}fr`);
    document.documentElement.style.setProperty("--ldu-list-track", `${this.paneSizes.listRatio}fr`);
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
        const sidebarWidth = document.body.classList.contains("has-sidebar-page") ? start.sidebar : 0;
        const availableWidth = Math.max(1, (wrapper?.clientWidth || window.innerWidth) - sidebarWidth);
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
