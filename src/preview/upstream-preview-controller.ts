import { getTopicInfo } from "../discourse/routes";

interface PreviewOptions {
  isEnabled: () => boolean;
  clickMode: () => "double" | "single";
  onClickModeChange?: (mode: "double" | "single") => void;
  loadPreviewer: PreviewLoader;
}

export interface UpstreamPreviewApi {
  openFromFrame: (url: string, anchorRect: { left: number; top: number; bottom: number }) => void;
  close: () => void;
  syncClickMode: () => void;
}

export interface UpstreamPreviewOptions {
  isEnabled: () => boolean;
  clickMode: () => "double" | "single";
  onClickModeChange?: (mode: "double" | "single") => void;
  isPreviewableUrl: (url: string, link: HTMLAnchorElement | null) => boolean;
}

export type PreviewInstaller = (options: UpstreamPreviewOptions) => UpstreamPreviewApi | undefined;
export type PreviewLoader = () => PreviewInstaller | Promise<PreviewInstaller>;

export class PreviewController {
  private api: UpstreamPreviewApi | null = null;
  private loading: Promise<UpstreamPreviewApi | null> | null = null;

  constructor(private readonly options: PreviewOptions) {}

  mount(): void {
    const result = this.ensureApi();
    if (result instanceof Promise) void result;
  }

  private install(installer: PreviewInstaller): UpstreamPreviewApi | null {
    if (this.api || !this.options.isEnabled()) return this.api;
    const installed = installer({
      isEnabled: this.options.isEnabled,
      clickMode: this.options.clickMode,
      ...(this.options.onClickModeChange ? { onClickModeChange: this.options.onClickModeChange } : {}),
      isPreviewableUrl: (url: string, link: HTMLAnchorElement | null) => this.isPreviewable(url, link),
    });
    this.api = installed ?? null;
    return this.api;
  }

  private ensureApi(): UpstreamPreviewApi | null | Promise<UpstreamPreviewApi | null> {
    if (this.api || !this.options.isEnabled()) return this.api;
    if (this.loading) return this.loading;
    try {
      const loaded = this.options.loadPreviewer();
      if (!(loaded instanceof Promise)) return this.install(loaded);
      this.loading = loaded
        .then((installer) => this.install(installer))
        .catch((error: unknown) => {
          console.error("[Linux Do Ultimate] Preview runtime failed to load", error);
          return null;
        })
        .finally(() => { this.loading = null; });
      return this.loading;
    } catch (error) {
      console.error("[Linux Do Ultimate] Preview runtime failed to load", error);
      return null;
    }
  }

  close(): void {
    this.api?.close();
  }

  syncClickMode(): void {
    const result = this.ensureApi();
    if (result instanceof Promise) void result.then((api) => api?.syncClickMode());
    else result?.syncClickMode();
  }

  openFromFrame(
    url: string,
    iframe: HTMLIFrameElement,
    anchorRect: { left: number; bottom: number } | undefined,
  ): void {
    if (!this.options.isEnabled() || !this.isPreviewable(url, null)) return;
    const frameRect = iframe.getBoundingClientRect();
    const rect = anchorRect ?? { left: 0, bottom: 0 };
    const open = (api: UpstreamPreviewApi | null) => {
      if (!api || !this.options.isEnabled()) return;
      api.openFromFrame(url, {
        left: frameRect.left + rect.left,
        top: frameRect.top + rect.bottom,
        bottom: frameRect.top + rect.bottom,
      });
    };
    const result = this.ensureApi();
    if (result instanceof Promise) void result.then(open);
    else open(result);
  }

  private isPreviewable(url: string, link: HTMLAnchorElement | null): boolean {
    if (!/^https?:/i.test(url) || getTopicInfo(url)) return false;
    if (!link) return true;
    if (link.closest(".d-header, .sidebar-wrapper, .ldu-topic-toolbar, .ldu-settings-panel")) return false;
    if (link.closest("button, [role=button], .btn, .d-button, input, textarea, select")) return false;
    if (link.matches(".lightbox") || link.querySelector("img, picture")) return false;
    return !link.closest("img, picture, .lightbox-wrapper");
  }
}
