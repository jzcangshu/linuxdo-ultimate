export interface PageToolsConfig {
  ownerOnlyEnabled: boolean;
  minimalHidePosters: boolean;
  minimalHideNotices: boolean;
  minimalHideCategoryBadges: boolean;
  minimalHideTags: boolean;
  lowEndOptimizationEnabled: boolean;
}

export const DEFAULT_PAGE_TOOLS_CONFIG: PageToolsConfig = {
  ownerOnlyEnabled: false,
  minimalHidePosters: false,
  minimalHideNotices: false,
  minimalHideCategoryBadges: false,
  minimalHideTags: false,
  lowEndOptimizationEnabled: false,
};

export function writeFramePageToolsConfig(frame: HTMLIFrameElement, config: PageToolsConfig): void {
  const encoded = JSON.stringify(config);
  if (frame.dataset.lduPageTools !== encoded) frame.dataset.lduPageTools = encoded;
}

export function readFramePageToolsConfig(frame: Element | null): PageToolsConfig | null {
  if (!(frame instanceof HTMLElement)) return null;
  const encoded = frame.dataset.lduPageTools;
  if (!encoded) return null;
  try {
    const source = JSON.parse(encoded) as Partial<PageToolsConfig> | null;
    if (!source || typeof source !== "object") return null;
    return {
      ownerOnlyEnabled: source.ownerOnlyEnabled === true,
      minimalHidePosters: source.minimalHidePosters === true,
      minimalHideNotices: source.minimalHideNotices === true,
      minimalHideCategoryBadges: source.minimalHideCategoryBadges === true,
      minimalHideTags: source.minimalHideTags === true,
      lowEndOptimizationEnabled: source.lowEndOptimizationEnabled === true,
    };
  } catch {
    return null;
  }
}

export function applyStaticPageToolsConfig(
  root: HTMLElement,
  navigator: Navigator,
  config: PageToolsConfig,
): void {
  setDataset(root, "lduHidePosters", config.minimalHidePosters);
  setDataset(root, "lduHideNotices", config.minimalHideNotices);
  setDataset(root, "lduHideCategoryBadges", config.minimalHideCategoryBadges);
  setDataset(root, "lduHideTags", config.minimalHideTags);
  setDataset(root, "lduLowEnd", config.lowEndOptimizationEnabled && isLowEndDevice(navigator));
}

export function samePageToolsConfig(left: PageToolsConfig, right: PageToolsConfig): boolean {
  return left.ownerOnlyEnabled === right.ownerOnlyEnabled
    && left.minimalHidePosters === right.minimalHidePosters
    && left.minimalHideNotices === right.minimalHideNotices
    && left.minimalHideCategoryBadges === right.minimalHideCategoryBadges
    && left.minimalHideTags === right.minimalHideTags
    && left.lowEndOptimizationEnabled === right.lowEndOptimizationEnabled;
}

function setDataset(
  root: HTMLElement,
  key: "lduHidePosters" | "lduHideNotices" | "lduHideCategoryBadges" | "lduHideTags" | "lduLowEnd",
  enabled: boolean,
): void {
  const next = String(enabled);
  if (root.dataset[key] !== next) root.dataset[key] = next;
}

function isLowEndDevice(navigator: Navigator): boolean {
  const hardwareConcurrency = navigator.hardwareConcurrency;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4)
    || (typeof deviceMemory === "number" && Number.isFinite(deviceMemory) && deviceMemory <= 4);
}
