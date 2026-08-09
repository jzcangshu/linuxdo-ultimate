const frameName = window.name;
const role = frameName.startsWith("ldu-list:")
  ? "list"
  : frameName.startsWith("ldu-topic:") ? "topic" : null;

if (window.self !== window.top && role && !location.pathname.startsWith("/challenge")) {
  const attribute = role === "list" ? "lduEmbeddedList" : "lduEmbeddedTopic";
  document.documentElement.dataset[attribute] = "true";
  const bootstrapStyle = document.createElement("style");
  bootstrapStyle.id = "ldu-frame-bootstrap-style";
  bootstrapStyle.textContent = `
    html[data-ldu-embedded-list="true"] .d-header,
    html[data-ldu-embedded-list="true"] #d-sidebar,
    html[data-ldu-embedded-list="true"] .sidebar-wrapper,
    html[data-ldu-embedded-topic="true"] .d-header,
    html[data-ldu-embedded-topic="true"] #d-sidebar,
    html[data-ldu-embedded-topic="true"] .sidebar-wrapper { display: none !important; }
  `;
  document.documentElement.append(bootstrapStyle);
  const runtimeUrl = chrome.runtime.getURL("frame-runtime.js");
  void import(runtimeUrl).catch((error: unknown) => {
    bootstrapStyle.remove();
    delete document.documentElement.dataset[attribute];
    console.error("[Linux Do Ultimate] Frame runtime failed to load", error);
  });
}
