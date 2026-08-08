import {
  EXTENSION_REQUEST,
  EXTENSION_REQUEST_CANCEL,
  isExtensionRuntimeMessage,
  type ExtensionRequestMessage,
  type ExtensionRequestResult,
} from "./request-protocol";

const pending = new Map<string, AbortController>();

function serializeHeaders(headers: Headers): string {
  return [...headers.entries()].map(([name, value]) => `${name}: ${value}`).join("\r\n");
}

async function executeRequest(message: ExtensionRequestMessage): Promise<ExtensionRequestResult> {
  const controller = new AbortController();
  pending.set(message.requestId, controller);
  const timeoutId = message.timeout > 0
    ? setTimeout(() => controller.abort("timeout"), message.timeout)
    : null;
  try {
    const response = await fetch(message.url, {
      method: message.method,
      headers: message.headers,
      ...(message.body !== undefined ? { body: message.body } : {}),
      credentials: "include",
      redirect: "follow",
      signal: controller.signal,
    });
    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      responseText: await response.text(),
      responseHeaders: serializeHeaders(response.headers),
      finalUrl: response.url,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: "",
      responseText: "",
      responseHeaders: "",
      finalUrl: message.url,
      error: controller.signal.reason === "timeout"
        ? "timeout"
        : error instanceof Error ? error.message : "request failed",
    };
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
    pending.delete(message.requestId);
  }
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isExtensionRuntimeMessage(message)) return false;
  if (message.type === EXTENSION_REQUEST_CANCEL) {
    pending.get(message.requestId)?.abort("aborted");
    return false;
  }
  if (message.type !== EXTENSION_REQUEST) return false;
  void executeRequest(message).then(sendResponse);
  return true;
});
