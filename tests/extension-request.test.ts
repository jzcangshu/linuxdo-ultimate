import { describe, expect, it, vi } from "vitest";
import { createExtensionRequest } from "../src/extension/request-client";
import { EXTENSION_REQUEST, EXTENSION_REQUEST_CANCEL } from "../src/extension/request-protocol";

describe("extension request compatibility", () => {
  it("maps a successful background response to GM onload", async () => {
    const sendMessage = vi.fn<(message: unknown) => Promise<unknown>>(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      responseText: "<html></html>",
      responseHeaders: "content-type: text/html",
      finalUrl: "https://example.com/final",
    }));
    const onload = vi.fn();

    createExtensionRequest({ sendMessage })({
      method: "GET",
      url: "https://example.com/start",
      timeout: 10_000,
      onload,
    });

    await vi.waitFor(() => expect(onload).toHaveBeenCalledOnce());
    expect(sendMessage.mock.calls[0]?.[0]).toMatchObject({
      type: EXTENSION_REQUEST,
      method: "GET",
      url: "https://example.com/start",
    });
  });

  it("reports a background timeout through GM ontimeout", async () => {
    const sendMessage = vi.fn<(message: unknown) => Promise<unknown>>(async () => ({
      ok: false,
      status: 0,
      statusText: "",
      responseText: "",
      responseHeaders: "",
      finalUrl: "https://example.com",
      error: "timeout",
    }));
    const ontimeout = vi.fn();
    createExtensionRequest({ sendMessage })({ url: "https://example.com", ontimeout });
    await vi.waitFor(() => expect(ontimeout).toHaveBeenCalledOnce());
  });

  it("cancels the background request and suppresses late callbacks", async () => {
    const deferred: { resolve?: (value: unknown) => void } = {};
    const sendMessage = vi.fn((message: unknown) => {
      if ((message as { type?: string }).type === EXTENSION_REQUEST_CANCEL) return Promise.resolve(undefined);
      return new Promise((resolve) => { deferred.resolve = resolve; });
    });
    const onload = vi.fn();
    const onabort = vi.fn();
    const handle = createExtensionRequest({ sendMessage })({ url: "https://example.com", onload, onabort });

    handle.abort();
    deferred.resolve?.({ ok: true, status: 200, responseText: "late" });
    await Promise.resolve();

    expect(onabort).toHaveBeenCalledOnce();
    expect(onload).not.toHaveBeenCalled();
    expect(sendMessage.mock.calls[1]?.[0]).toMatchObject({ type: EXTENSION_REQUEST_CANCEL });
  });
});
