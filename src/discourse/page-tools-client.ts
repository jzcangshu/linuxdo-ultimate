export interface PageToolsConfig {
  ownerOnlyEnabled: boolean;
  cleanModeEnabled: boolean;
  lowEndOptimizationEnabled: boolean;
}

export interface OwnerViewOptions {
  window?: Window;
  document?: Document;
  isEmbedded?: boolean;
  isSplitHost?: () => boolean;
}

export interface OwnerViewController {
  setActive(active: boolean): void;
  stop(clearNativeFilter?: boolean): void;
}

export type OwnerViewInstaller = (options?: OwnerViewOptions) => OwnerViewController;
export type OwnerViewLoader = () => OwnerViewInstaller | Promise<OwnerViewInstaller>;

export interface PageToolsClientOptions extends OwnerViewOptions {
  allowOwnerView?: boolean;
  loadOwnerView?: OwnerViewLoader;
}

const DEFAULT_CONFIG: PageToolsConfig = {
  ownerOnlyEnabled: false,
  cleanModeEnabled: false,
  lowEndOptimizationEnabled: false,
};

export class PageToolsClient {
  private config: PageToolsConfig = { ...DEFAULT_CONFIG };
  private active = true;
  private stopped = false;
  private ownerInstaller: OwnerViewInstaller | null = null;
  private ownerController: OwnerViewController | null = null;
  private ownerLoad: Promise<OwnerViewInstaller | null> | null = null;
  private readonly win: Window;
  private readonly doc: Document;
  private readonly lowEndDevice: boolean;

  constructor(private readonly options: PageToolsClientOptions = {}) {
    this.win = options.window ?? window;
    this.doc = options.document ?? document;
    this.lowEndDevice = isLowEndDevice(this.win.navigator);
  }

  setConfig(patch: Partial<PageToolsConfig>): void {
    if (this.stopped) return;
    const next = { ...this.config, ...patch };
    if (sameConfig(this.config, next)) return;
    this.config = next;
    this.applyStaticModes();
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
    delete this.doc.documentElement.dataset.lduCleanMode;
    delete this.doc.documentElement.dataset.lduLowEnd;
  }

  private applyStaticModes(): void {
    const root = this.doc.documentElement;
    setDataset(root, "lduCleanMode", this.config.cleanModeEnabled);
    setDataset(root, "lduLowEnd", this.config.lowEndOptimizationEnabled && this.lowEndDevice);
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
    });
    this.ownerController.setActive(true);
  }
}

function sameConfig(left: PageToolsConfig, right: PageToolsConfig): boolean {
  return left.ownerOnlyEnabled === right.ownerOnlyEnabled
    && left.cleanModeEnabled === right.cleanModeEnabled
    && left.lowEndOptimizationEnabled === right.lowEndOptimizationEnabled;
}

function setDataset(root: HTMLElement, key: "lduCleanMode" | "lduLowEnd", enabled: boolean): void {
  const next = String(enabled);
  if (root.dataset[key] !== next) root.dataset[key] = next;
}

function isLowEndDevice(navigator: Navigator): boolean {
  const hardwareConcurrency = navigator.hardwareConcurrency;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (Number.isFinite(hardwareConcurrency) && hardwareConcurrency <= 4)
    || (typeof deviceMemory === "number" && Number.isFinite(deviceMemory) && deviceMemory <= 4);
}
