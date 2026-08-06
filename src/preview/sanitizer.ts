const REMOVE_TAGS = [
  "script", "meta", "base", "iframe", "frame", "frameset", "object", "embed",
  "form", "input", "button", "textarea", "select", "option", "video", "audio", "canvas",
  "svg", "math", "template", "noscript", "picture", "source",
];

const FALLBACK_STYLES = "body{margin:16px;font:14px/1.6 system-ui,sans-serif;color:#222}img{max-width:100%;height:auto}a{color:#06c}";
const DYNAMIC_BRIDGE = `
(function () {
  if (window.__lduPreviewBridge) return;
  window.__lduPreviewBridge = true;
  var sent = false;
  var scheduled = false;
  var observer = null;
  function meaningful() {
    if (!document.body) return false;
    var text = (document.body.innerText || document.body.textContent || "").replace(/\\s+/g, "");
    if (text.length >= 12) return true;
    return Boolean(document.body.querySelector("img[src],video,canvas,svg,article,main>*,[role=main]>*"));
  }
  function check() {
    scheduled = false;
    if (sent || !meaningful()) return;
    sent = true;
    if (observer) observer.disconnect();
    window.parent.postMessage({ type: "ldu:external-preview-ready", token: window.name }, "*");
  }
  function schedule() {
    if (sent || scheduled) return;
    scheduled = true;
    setTimeout(check, 50);
  }
  try {
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement || document, { childList: true, subtree: true, characterData: true });
    setTimeout(function () { if (observer) observer.disconnect(); }, 15000);
  } catch (_) {}
  document.addEventListener("DOMContentLoaded", schedule, { once: true });
  window.addEventListener("load", schedule, { once: true });
  schedule();
})();`;

export interface PreparedPreviewHtml {
  html: string;
  dynamic: boolean;
  title: string;
  metadata: PreviewMetadata;
}

export interface PreviewMetadata {
  title: string;
  description: string;
  image: string;
  siteName: string;
  url: string;
}

function readMetadata(parsed: Document, baseUrl: string, title: string): PreviewMetadata {
  const content = (selector: string) => parsed.querySelector<HTMLMetaElement>(selector)?.content.trim() ?? "";
  const rawImage = content('meta[property="og:image"]') || content('meta[name="twitter:image"]');
  return {
    title: content('meta[property="og:title"]') || content('meta[name="twitter:title"]') || title,
    description: content('meta[property="og:description"]')
      || content('meta[name="description"]')
      || content('meta[name="twitter:description"]'),
    image: rawImage ? isSafeUrl(rawImage, baseUrl, true) ?? "" : "",
    siteName: content('meta[property="og:site_name"]'),
    url: baseUrl,
  };
}

function isSafeUrl(raw: string, baseUrl: string, allowDataImage = false): string | null {
  try {
    const url = new URL(raw, baseUrl);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    if (allowDataImage && url.protocol === "data:" && /^data:image\//i.test(raw)) return raw;
    return null;
  } catch {
    return null;
  }
}

export function sanitizePreviewHtml(html: string, baseUrl: string, document: Document): string {
  const Parser = document.defaultView?.DOMParser ?? DOMParser;
  const parsed = new Parser().parseFromString(html, "text/html");
  parsed.querySelectorAll("link").forEach((link) => {
    const rel = link.rel.toLowerCase().split(/\s+/);
    if (!rel.includes("stylesheet")) link.remove();
  });
  for (const tag of REMOVE_TAGS) {
    parsed.querySelectorAll(tag).forEach((node) => node.remove());
  }
  parsed.querySelectorAll("*").forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name.includes(":") || name === "srcset" || name === "integrity" || name === "nonce") {
        element.removeAttribute(attribute.name);
      }
    }
    for (const attrName of ["href", "src", "action", "formaction"]) {
      const raw = element.getAttribute(attrName);
      if (raw === null) continue;
      const safe = isSafeUrl(raw, baseUrl, attrName === "src" && element.tagName === "IMG");
      if (safe) element.setAttribute(attrName, safe);
      else element.removeAttribute(attrName);
    }
    if (element.tagName === "A") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  });
  const base = parsed.createElement("base");
  base.href = baseUrl;
  const charset = parsed.createElement("meta");
  charset.setAttribute("charset", "utf-8");
  const fallback = parsed.createElement("style");
  fallback.textContent = FALLBACK_STYLES;
  parsed.head.prepend(charset, base, fallback);
  return `<!doctype html>${parsed.documentElement.outerHTML}`;
}

export function preparePreviewHtml(html: string, baseUrl: string, document: Document): PreparedPreviewHtml {
  const Parser = document.defaultView?.DOMParser ?? DOMParser;
  const parsed = new Parser().parseFromString(html, "text/html");
  const title = parsed.title.trim() || "链接预览";
  const metadata = readMetadata(parsed, baseUrl, title);
  const dynamic = [...parsed.querySelectorAll("script")].some((script) => Boolean(script.src || script.textContent?.trim()));
  if (!dynamic) return { html: sanitizePreviewHtml(html, baseUrl, document), dynamic: false, title, metadata };

  parsed.querySelectorAll("base, iframe, frame, frameset, object, embed").forEach((node) => node.remove());
  parsed.querySelectorAll<HTMLMetaElement>("meta[http-equiv]").forEach((meta) => {
    const directive = meta.httpEquiv.toLowerCase();
    if (directive === "content-security-policy" || directive === "refresh") meta.remove();
  });
  parsed.querySelectorAll("*").forEach((element) => {
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.includes(":") || name === "integrity" || name === "nonce" || name === "srcset") {
        element.removeAttribute(attribute.name);
      }
    }
    for (const attrName of ["href", "src", "action", "formaction"]) {
      const raw = element.getAttribute(attrName);
      if (raw === null) continue;
      const safe = isSafeUrl(raw, baseUrl, attrName === "src" && element.tagName === "IMG");
      if (safe) element.setAttribute(attrName, safe);
      else element.removeAttribute(attrName);
    }
    if (element.tagName === "A") {
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  });
  const base = parsed.createElement("base");
  base.href = baseUrl;
  const charset = parsed.createElement("meta");
  charset.setAttribute("charset", "utf-8");
  const bridge = parsed.createElement("script");
  bridge.textContent = DYNAMIC_BRIDGE;
  parsed.head.prepend(charset, base, bridge);
  return { html: `<!doctype html>${parsed.documentElement.outerHTML}`, dynamic: true, title, metadata };
}

export function prepareCompatiblePreviewHtml(
  html: string,
  baseUrl: string,
  document: Document,
): PreparedPreviewHtml {
  const Parser = document.defaultView?.DOMParser ?? DOMParser;
  const parsed = new Parser().parseFromString(html, "text/html");
  const title = parsed.title.trim() || "链接预览";
  const metadata = readMetadata(parsed, baseUrl, title);
  parsed.querySelectorAll("base").forEach((node) => node.remove());
  parsed.querySelectorAll<HTMLMetaElement>("meta[http-equiv]").forEach((meta) => {
    const directive = meta.httpEquiv.toLowerCase();
    if (directive === "content-security-policy" || directive === "refresh") meta.remove();
  });
  const base = parsed.createElement("base");
  base.href = baseUrl;
  const bridge = parsed.createElement("script");
  bridge.textContent = DYNAMIC_BRIDGE;
  parsed.head.prepend(base, bridge);
  return {
    html: `<!doctype html>${parsed.documentElement.outerHTML}`,
    dynamic: true,
    title,
    metadata,
  };
}
