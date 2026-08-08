export const EXTENSION_REQUEST = "ldu:extension-request";
export const EXTENSION_REQUEST_CANCEL = "ldu:extension-request-cancel";

export interface ExtensionRequestMessage {
  type: typeof EXTENSION_REQUEST;
  requestId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout: number;
}

export interface ExtensionRequestCancelMessage {
  type: typeof EXTENSION_REQUEST_CANCEL;
  requestId: string;
}

export interface ExtensionRequestResult {
  ok: boolean;
  status: number;
  statusText: string;
  responseText: string;
  responseHeaders: string;
  finalUrl: string;
  error?: string;
}

export type ExtensionRuntimeMessage = ExtensionRequestMessage | ExtensionRequestCancelMessage;

export function isExtensionRuntimeMessage(value: unknown): value is ExtensionRuntimeMessage {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return type === EXTENSION_REQUEST || type === EXTENSION_REQUEST_CANCEL;
}
