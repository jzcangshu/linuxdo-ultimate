import {
  applyStaticPageToolsConfig,
  DEFAULT_PAGE_TOOLS_CONFIG,
  samePageToolsConfig,
  type PageToolsConfig,
} from "./page-tools-config";

export type { PageToolsConfig } from "./page-tools-config";

export interface OwnerViewOptions {
  window?: Window;
  document?: Document;
  isEmbedded?: boolean;
  isSplitHost?: () => boolean;
  base64Enabled?: boolean;
}

export interface OwnerViewController {
  setConfig?(patch: { base64Enabled: boolean; ownerOnlyEnabled?: boolean }): void;
  setActive(active: boolean): void;
  stop(clearNativeFilter?: boolean): void;
}

export type OwnerViewInstaller = (options?: OwnerViewOptions) => OwnerViewController;
export type OwnerViewLoader = () => OwnerViewInstaller | Promise<OwnerViewInstaller>;

export interface PageToolsClientOptions extends OwnerViewOptions {
  allowOwnerView?: boolean;
  loadOwnerView?: OwnerViewLoader;
}

export class PageToolsClient {
  private config: PageToolsConfig = { ...DEFAULT_PAGE_TOOLS_CONFIG };
  private active = true;
  private stopped = false;
  private ownerInstaller: OwnerViewInstaller | null = null;
  private ownerController: OwnerViewController | null = null;
  private ownerLoad: Promise<OwnerViewInstaller | null> | null = null;
  private readonly win: Window;
  private readonly doc: Document;

  constructor(private readonly options: PageToolsClientOptions = {}) {
    this.win = options.window ?? window;
    this.doc = options.document ?? document;
  }

  setConfig(patch: Partial<PageToolsConfig>): void {
    if (this.stopped) return;
    const next = { ...this.config, ...patch };
    if (samePageToolsConfig(this.config, next)) return;
    this.config = next;
    this.applyStaticModes();
    this.ownerController?.setConfig?.({
      ownerOnlyEnabled: next.ownerOnlyEnabled,
      base64Enabled: next.base64Enabled !== false,
    });
    this.syncOwnerView();
  }

  setActive(active: boolean): void {
    if (this.stopped || this.active === active) return;
    this.active = active;
    this.syncOwnerView();
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.ownerController?.stop();
    this.ownerController = null;
    delete this.doc.documentElement.dataset.lduHidePosters;
    delete this.doc.documentElement.dataset.lduHideNotices;
    delete this.doc.documentElement.dataset.lduHideCategoryBadges;
    delete this.doc.documentElement.dataset.lduHideTags;
    delete this.doc.documentElement.dataset.lduLowEnd;
  }

  private applyStaticModes(): void {
    applyStaticPageToolsConfig(this.doc.documentElement, this.win.navigator, this.config);
  }

  private wantsOwnerView(): boolean {
    return this.active && this.ownerViewConfigured();
  }

  private ownerViewConfigured(): boolean {
    return this.options.allowOwnerView !== false
      && this.config.ownerOnlyEnabled
      && typeof this.options.loadOwnerView === "function";
  }

  private syncOwnerView(): void {
    if (!this.ownerViewConfigured()) {
      this.ownerController?.stop(true);
      this.ownerController = null;
      return;
    }
    if (!this.active) {
      this.ownerController?.setActive(false);
      return;
    }
    if (this.ownerController) {
      this.ownerController.setActive(true);
      return;
    }
    if (this.ownerInstaller) {
      this.installOwnerView(this.ownerInstaller);
      return;
    }
    if (this.ownerLoad) return;
    try {
      const loaded = this.options.loadOwnerView!();
      if (!(loaded instanceof Promise)) {
        this.ownerInstaller = loaded;
        this.installOwnerView(loaded);
        return;
      }
      this.ownerLoad = loaded
        .then((installer) => {
          this.ownerInstaller = installer;
          if (this.wantsOwnerView()) this.installOwnerView(installer);
          return installer;
        })
        .catch((error: unknown) => {
          console.error("[Linux Do Ultimate] Owner view runtime failed to load", error);
          return null;
        })
        .finally(() => { this.ownerLoad = null; });
    } catch (error) {
      console.error("[Linux Do Ultimate] Owner view runtime failed to load", error);
    }
  }

  private installOwnerView(installer: OwnerViewInstaller): void {
    if (!this.wantsOwnerView() || this.ownerController) return;
    this.ownerController = installer({
      window: this.win,
      document: this.doc,
      ...(this.options.isEmbedded !== undefined ? { isEmbedded: this.options.isEmbedded } : {}),
      ...(this.options.isSplitHost ? { isSplitHost: this.options.isSplitHost } : {}),
      base64Enabled: this.config.base64Enabled !== false,
    });
    this.ownerController.setActive(true);
  }
}
