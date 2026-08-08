import {
  EXTENSION_REQUEST,
  EXTENSION_REQUEST_CANCEL,
  type ExtensionRequestMessage,
  type ExtensionRequestResult,
} from "./request-protocol";

type GmRequestOptions = {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
  onload?: (response: ExtensionRequestResult) => void;
  onerror?: (error: unknown) => void;
  ontimeout?: () => void;
  onabort?: () => void;
};

interface RuntimePort {
  sendMessage(message: unknown): Promise<unknown>;
}

export function createExtensionRequest(runtime: RuntimePort = chrome.runtime): (options: GmRequestOptions) => { abort: () => void } {
  return (options) => {
    const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let settled = false;
    let aborted = false;
    const message: ExtensionRequestMessage = {
      type: EXTENSION_REQUEST,
      requestId,
      method: options.method ?? "GET",
      url: options.url,
      headers: { ...(options.headers ?? {}) },
      ...(typeof options.data === "string" ? { body: options.data } : {}),
      timeout: Math.max(0, options.timeout ?? 30_000),
    };
    void runtime.sendMessage(message).then((raw) => {
      if (settled || aborted) return;
      settled = true;
      const result = raw as ExtensionRequestResult | undefined;
      if (!result?.ok) {
        if (result?.error === "timeout") options.ontimeout?.();
        else options.onerror?.(result ?? new Error("Extension request failed"));
        return;
      }
      options.onload?.(result);
    }).catch((error: unknown) => {
      if (settled || aborted) return;
      settled = true;
      options.onerror?.(error);
    });
    return {
      abort: () => {
        if (settled || aborted) return;
        aborted = true;
        settled = true;
        options.onabort?.();
        void runtime.sendMessage({ type: EXTENSION_REQUEST_CANCEL, requestId }).catch(() => {});
      },
    };
  };
}

export function installExtensionRequestBridge(runtime: RuntimePort = chrome.runtime): void {
  Object.defineProperty(globalThis, "GM_xmlhttpRequest", {
    configurable: true,
    value: createExtensionRequest(runtime),
  });
}
