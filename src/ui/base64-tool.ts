import { iconSvg } from "./icons";

const TOOLBAR_SELECTOR = '[data-identifier="post-text-selection-toolbar"]';
const TRIGGER_SELECTOR = ".ldu-base64-trigger";

export interface Base64ToolOptions {
  window?: Window;
  document?: Document;
  observeMutations?: boolean;
}

export function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export function decodeBase64Utf8(value: string): string {
  let normalized = value.replace(/\s+/g, "").replaceAll("-", "+").replaceAll("_", "/");
  if (!normalized) return "";
  if (normalized.length % 4 === 1) throw new Error("无效的 Base64 内容");
  normalized += "=".repeat((4 - (normalized.length % 4)) % 4);
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) {
    throw new Error("无效的 Base64 内容");
  }
  try {
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("无效的 Base64 内容");
  }
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export class Base64ToolController {
  private readonly win: Window;
  private readonly doc: Document;
  private readonly observeMutations: boolean;
  private observer: MutationObserver | null = null;
  private syncTimer: number | null = null;
  private started = false;
  private active = true;
  private selectionText = "";
  private dialog: HTMLElement | null = null;
  private mode: "encode" | "decode" = "encode";
  private drag: DragState | null = null;

  constructor(options: Base64ToolOptions = {}) {
    this.win = options.window ?? window;
    this.doc = options.document ?? document;
    this.observeMutations = options.observeMutations !== false;
  }

  start(): this {
    if (this.started) return this;
    this.started = true;
    this.doc.addEventListener("selectionchange", this.captureSelection);
    this.doc.addEventListener("pointerup", this.captureSelection, true);
    this.doc.addEventListener("keyup", this.captureSelection, true);
    this.doc.addEventListener("keydown", this.handleKeydown, true);
    if (this.observeMutations) {
      const Observer = (this.win as Window & typeof globalThis).MutationObserver;
      const target = this.doc.body ?? this.doc.documentElement;
      if (Observer && target) {
        this.observer = new Observer(() => this.scheduleSync());
        this.observer.observe(target, { childList: true, subtree: true });
      }
    }
    this.scheduleSync();
    return this;
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.observer?.disconnect();
    this.observer = null;
    if (this.syncTimer !== null) this.win.clearTimeout(this.syncTimer);
    this.syncTimer = null;
    this.doc.removeEventListener("selectionchange", this.captureSelection);
    this.doc.removeEventListener("pointerup", this.captureSelection, true);
    this.doc.removeEventListener("keyup", this.captureSelection, true);
    this.doc.removeEventListener("keydown", this.handleKeydown, true);
    this.doc.querySelectorAll(TRIGGER_SELECTOR).forEach((trigger) => trigger.remove());
    this.dialog?.remove();
    this.dialog = null;
    this.drag = null;
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    if (!active) {
      this.doc.querySelectorAll(TRIGGER_SELECTOR).forEach((trigger) => trigger.remove());
      if (this.dialog) this.dialog.hidden = true;
      return;
    }
    this.scheduleSync();
  }

  refresh(): void {
    this.scheduleSync();
  }

  private readonly captureSelection = (): void => {
    if (!this.active) return;
    const text = this.win.getSelection?.()?.toString() ?? "";
    if (text.trim()) this.selectionText = text;
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.dialog && !this.dialog.hidden) {
      this.closeDialog();
    }
  };

  private scheduleSync(): void {
    if (!this.started || !this.active || this.syncTimer !== null) return;
    this.syncTimer = this.win.setTimeout(() => {
      this.syncTimer = null;
      this.syncToolbar();
    }, 0);
  }

  private syncToolbar(): void {
    if (!this.active) return;
    const toolbar = this.doc.querySelector<HTMLElement>(TOOLBAR_SELECTOR);
    const buttons = toolbar?.querySelector<HTMLElement>(".quote-button .buttons");
    if (!toolbar || !buttons || buttons.querySelector(TRIGGER_SELECTOR)) return;
    const trigger = this.doc.createElement("button");
    trigger.type = "button";
    trigger.className = "btn btn-icon-text btn-flat ldu-base64-trigger";
    trigger.title = "Base64工具";
    trigger.setAttribute("aria-label", "Base64工具");
    trigger.setAttribute("aria-controls", "ldu-base64-dialog");
    trigger.innerHTML = `${iconSvg("code", 16)}<span class="d-button-label">Base64工具</span>`;
    trigger.addEventListener("pointerdown", this.captureSelection, true);
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.openDialog(toolbar);
    });
    const copyQuote = buttons.querySelector(".copy-quote");
    if (copyQuote) buttons.insertBefore(trigger, copyQuote.nextSibling);
    else buttons.append(trigger);
  }

  private openDialog(toolbar: HTMLElement): void {
    const dialog = this.dialog ?? this.createDialog();
    const input = dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-input")!;
    if (this.selectionText) input.value = this.selectionText;
    this.setMode(this.mode);
    dialog.hidden = false;
    if (!this.dialogPositioned(dialog)) this.positionDialog(dialog, toolbar);
    input.focus({ preventScroll: true });
  }

  private createDialog(): HTMLElement {
    const dialog = this.doc.createElement("section");
    dialog.id = "ldu-base64-dialog";
    dialog.className = "ldu-base64-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-label", "Base64工具");
    dialog.innerHTML = `
      <header class="ldu-base64-header">
        <div class="ldu-base64-drag-handle" title="拖动窗口" tabindex="0">
          <span class="ldu-base64-title">Base64工具</span>
          <span class="ldu-base64-subtitle">UTF-8</span>
        </div>
        <button type="button" class="ldu-base64-close" title="关闭" aria-label="关闭 Base64 工具">${iconSvg("close", 16)}</button>
      </header>
      <div class="ldu-base64-body">
        <label class="ldu-base64-field">
          <span>输入</span>
          <textarea class="ldu-base64-input" rows="5" spellcheck="false" placeholder="输入文本或 Base64 内容"></textarea>
        </label>
        <div class="ldu-base64-mode" role="group" aria-label="Base64操作">
          <button type="button" class="ldu-base64-mode-button is-active" data-mode="encode" aria-pressed="true">编码</button>
          <button type="button" class="ldu-base64-mode-button" data-mode="decode" aria-pressed="false">解码</button>
        </div>
        <label class="ldu-base64-field">
          <span>结果</span>
          <textarea class="ldu-base64-output" rows="5" readonly spellcheck="false"></textarea>
        </label>
        <div class="ldu-base64-status" role="status" aria-live="polite"></div>
      </div>
      <footer class="ldu-base64-footer">
        <button type="button" class="ldu-base64-clear">${iconSvg("trash", 14)}清空</button>
        <button type="button" class="ldu-base64-copy">${iconSvg("copy", 14)}复制结果</button>
      </footer>
    `;
    this.doc.body?.append(dialog);
    this.dialog = dialog;

    dialog.querySelector<HTMLButtonElement>(".ldu-base64-close")?.addEventListener("click", () => this.closeDialog());
    dialog.querySelector<HTMLButtonElement>(".ldu-base64-clear")?.addEventListener("click", () => {
      const input = dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-input")!;
      input.value = "";
      this.renderResult("");
      this.setStatus("");
      input.focus({ preventScroll: true });
    });
    dialog.querySelector<HTMLButtonElement>(".ldu-base64-copy")?.addEventListener("click", () => void this.copyResult());
    dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-input")?.addEventListener("input", () => this.renderResult());
    dialog.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => this.setMode(button.dataset.mode === "decode" ? "decode" : "encode"));
    });
    dialog.querySelector<HTMLElement>(".ldu-base64-drag-handle")?.addEventListener("pointerdown", this.startDrag);
    dialog.querySelector<HTMLElement>(".ldu-base64-drag-handle")?.addEventListener("pointermove", this.moveDrag);
    dialog.querySelector<HTMLElement>(".ldu-base64-drag-handle")?.addEventListener("pointerup", this.endDrag);
    dialog.querySelector<HTMLElement>(".ldu-base64-drag-handle")?.addEventListener("pointercancel", this.endDrag);
    return dialog;
  }

  private setMode(mode: "encode" | "decode"): void {
    this.mode = mode;
    this.dialog?.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    this.renderResult();
  }

  private renderResult(fallbackInput?: string): void {
    if (!this.dialog) return;
    const input = this.dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-input")!;
    const value = fallbackInput ?? input.value;
    try {
      const output = this.mode === "encode" ? encodeBase64Utf8(value) : decodeBase64Utf8(value);
      this.dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-output")!.value = output;
      this.dialog.dataset.state = "ready";
      this.setStatus("");
    } catch (error) {
      this.dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-output")!.value = "";
      this.dialog.dataset.state = "error";
      this.setStatus(error instanceof Error ? error.message : "转换失败");
    }
  }

  private setStatus(message: string): void {
    if (this.dialog) this.dialog.querySelector<HTMLElement>(".ldu-base64-status")!.textContent = message;
  }

  private async copyResult(): Promise<void> {
    if (!this.dialog) return;
    const output = this.dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-output")!;
    if (!output.value) return;
    try {
      const writeText = this.win.navigator.clipboard?.writeText;
      if (!writeText) throw new Error("Clipboard API unavailable");
      await writeText.call(this.win.navigator.clipboard, output.value);
    } catch {
      output.focus({ preventScroll: true });
      output.select();
      this.doc.execCommand?.("copy");
    }
    this.setStatus("已复制");
  }

  private closeDialog(): void {
    if (this.dialog) this.dialog.hidden = true;
    this.drag = null;
  }

  private dialogPositioned(dialog: HTMLElement): boolean {
    return dialog.style.left !== "" && dialog.style.top !== "";
  }

  private positionDialog(dialog: HTMLElement, toolbar: HTMLElement): void {
    const width = Math.min(440, Math.max(280, this.win.innerWidth - 16));
    const rect = toolbar.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const height = dialogRect.height || 360;
    const left = clamp(rect.left, 8, Math.max(8, this.win.innerWidth - width - 8));
    const top = rect.bottom + height + 12 <= this.win.innerHeight
      ? rect.bottom + 12
      : Math.max(8, rect.top - height - 12);
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
  }

  private readonly startDrag = (event: PointerEvent): void => {
    if ((event.target as Element | null)?.closest("button")) return;
    if (!this.dialog) return;
    const rect = this.dialog.getBoundingClientRect();
    this.drag = {
      pointerId: event.pointerId ?? 0,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    (event.currentTarget as HTMLElement).setPointerCapture?.(this.drag.pointerId);
    this.dialog.classList.add("is-dragging");
  };

  private readonly moveDrag = (event: PointerEvent): void => {
    if (!this.drag || (event.pointerId ?? 0) !== this.drag.pointerId || !this.dialog) return;
    const nextLeft = clamp(this.drag.left + event.clientX - this.drag.startX, 8, Math.max(8, this.win.innerWidth - this.drag.width - 8));
    const nextTop = clamp(this.drag.top + event.clientY - this.drag.startY, 8, Math.max(8, this.win.innerHeight - this.drag.height - 8));
    this.dialog.style.transform = `translate3d(${nextLeft - this.drag.left}px, ${nextTop - this.drag.top}px, 0)`;
  };

  private readonly endDrag = (event: PointerEvent): void => {
    if (!this.drag || (event.pointerId ?? 0) !== this.drag.pointerId || !this.dialog) return;
    const nextLeft = clamp(this.drag.left + event.clientX - this.drag.startX, 8, Math.max(8, this.win.innerWidth - this.drag.width - 8));
    const nextTop = clamp(this.drag.top + event.clientY - this.drag.startY, 8, Math.max(8, this.win.innerHeight - this.drag.height - 8));
    this.dialog.style.left = `${nextLeft}px`;
    this.dialog.style.top = `${nextTop}px`;
    this.dialog.style.transform = "";
    this.dialog.classList.remove("is-dragging");
    this.drag = null;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
