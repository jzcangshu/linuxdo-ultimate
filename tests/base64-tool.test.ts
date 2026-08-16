// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Base64ToolController,
  decodeBase64Utf8,
  encodeBase64Utf8,
} from "../src/ui/base64-tool";

function selectionToolbar(): HTMLDivElement {
  const toolbar = document.createElement("div");
  toolbar.dataset.identifier = "post-text-selection-toolbar";
  toolbar.innerHTML = `
    <div class="fk-d-menu__inner-content">
      <div class="quote-button visible">
        <div class="buttons">
          <button class="btn btn-icon-text btn-flat insert-quote">引用</button>
          <button class="btn btn-icon-text btn-flat copy-quote">复制引用</button>
        </div>
      </div>
    </div>
  `;
  return toolbar;
}

describe("Base64 tool", () => {
  afterEach(() => {
    try { vi.runOnlyPendingTimers(); } catch { /* this test did not use fake timers */ }
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it("round-trips UTF-8 text and rejects malformed input", () => {
    const source = "Linux Do 你好，世界";
    expect(decodeBase64Utf8(encodeBase64Utf8(source))).toBe(source);
    expect(() => decodeBase64Utf8("not base64!")) .toThrow("无效的 Base64 内容");
  });

  it("injects one native-style trigger and restores it after a toolbar rerender", async () => {
    vi.useFakeTimers();
    document.body.append(selectionToolbar());
    const controller = new Base64ToolController();
    controller.start();
    await vi.runOnlyPendingTimersAsync();

    const trigger = document.querySelector<HTMLButtonElement>(".ldu-base64-trigger")!;
    expect(trigger.textContent).toContain("Base64工具");
    expect(trigger.classList.contains("btn")).toBe(true);
    expect(trigger.classList.contains("btn-icon-text")).toBe(true);
    expect(trigger.classList.contains("btn-flat")).toBe(true);
    expect(document.querySelectorAll(".ldu-base64-trigger")).toHaveLength(1);

    document.querySelector('[data-identifier="post-text-selection-toolbar"]')?.replaceWith(selectionToolbar());
    await vi.runOnlyPendingTimersAsync();
    expect(document.querySelectorAll(".ldu-base64-trigger")).toHaveLength(1);
    controller.stop();
  });

  it("prefills the latest selection and stays open after outside clicks", async () => {
    vi.useFakeTimers();
    let selectedText = "选中的文字";
    vi.spyOn(window, "getSelection").mockImplementation(() => ({ toString: () => selectedText }) as Selection);
    document.body.append(selectionToolbar());
    const controller = new Base64ToolController();
    controller.start();
    document.dispatchEvent(new Event("selectionchange"));
    await vi.runOnlyPendingTimersAsync();

    document.querySelector<HTMLButtonElement>(".ldu-base64-trigger")!.click();
    const dialog = document.querySelector<HTMLElement>(".ldu-base64-dialog")!;
    const input = dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-input")!;
    const output = dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-output")!;
    expect(dialog.hidden).toBe(false);
    expect(input.value).toBe(selectedText);
    expect(output.value).toBe(encodeBase64Utf8(selectedText));

    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(dialog.hidden).toBe(false);

    selectedText = "下一段";
    document.dispatchEvent(new Event("selectionchange"));
    dialog.querySelector<HTMLButtonElement>(".ldu-base64-close")!.click();
    expect(dialog.hidden).toBe(true);
    document.querySelector<HTMLButtonElement>(".ldu-base64-trigger")!.click();
    expect(input.value).toBe(selectedText);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dialog.hidden).toBe(true);
    controller.stop();
  });

  it("switches between encoding and decoding and reports invalid input", async () => {
    vi.useFakeTimers();
    document.body.append(selectionToolbar());
    const controller = new Base64ToolController();
    controller.start();
    await vi.runOnlyPendingTimersAsync();
    document.querySelector<HTMLButtonElement>(".ldu-base64-trigger")!.click();

    const dialog = document.querySelector<HTMLElement>(".ldu-base64-dialog")!;
    const input = dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-input")!;
    const output = dialog.querySelector<HTMLTextAreaElement>(".ldu-base64-output")!;
    input.value = encodeBase64Utf8("中文内容");
    dialog.querySelector<HTMLButtonElement>('[data-mode="decode"]')!.click();
    expect(output.value).toBe("中文内容");

    input.value = "%%%";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(output.value).toBe("");
    expect(dialog.querySelector(".ldu-base64-status")?.textContent).toContain("无效的 Base64 内容");
    expect(dialog.dataset.state).toBe("error");
    controller.stop();
  });

  it("drags by the header and clamps the committed position to the viewport", async () => {
    vi.useFakeTimers();
    document.body.append(selectionToolbar());
    const controller = new Base64ToolController();
    controller.start();
    await vi.runOnlyPendingTimersAsync();
    document.querySelector<HTMLButtonElement>(".ldu-base64-trigger")!.click();

    const dialog = document.querySelector<HTMLElement>(".ldu-base64-dialog")!;
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
      x: 100, y: 100, left: 100, top: 100, right: 540, bottom: 460,
      width: 440, height: 360, toJSON: () => ({}),
    });
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 800 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 600 });
    const handle = dialog.querySelector<HTMLElement>(".ldu-base64-drag-handle")!;
    handle.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 120, clientY: 120 }));
    handle.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 900, clientY: 900 }));
    expect(dialog.style.transform).toContain("translate3d(252px, 132px, 0)");
    handle.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientX: 900, clientY: 900 }));
    expect(dialog.style.left).toBe("352px");
    expect(dialog.style.top).toBe("232px");
    expect(dialog.style.transform).toBe("");
    controller.stop();
  });
});
