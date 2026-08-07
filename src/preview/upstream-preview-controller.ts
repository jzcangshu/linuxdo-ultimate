import { getTopicInfo } from "../discourse/routes";
import { installLinkHoverPreviewer } from "./link-hover-previewer-upstream";

interface PreviewOptions {
  isEnabled: () => boolean;
  clickMode: () => "double" | "single";
  onClickModeChange?: (mode: "double" | "single") => void;
}

interface UpstreamPreviewApi {
  openFromFrame: (url: string, anchorRect: { left: number; top: number; bottom: number }) => void;
  close: () => void;
  syncClickMode: () => void;
}

export class PreviewController {
  private api: UpstreamPreviewApi | null = null;

  constructor(private readonly options: PreviewOptions) {}

  mount(): void {
    if (this.api || !this.options.isEnabled()) return;
    this.api = installLinkHoverPreviewer({
      isEnabled: this.options.isEnabled,
      clickMode: this.options.clickMode,
      onClickModeChange: this.options.onClickModeChange,
      isPreviewableUrl: (url: string, link: HTMLAnchorElement | null) => this.isPreviewable(url, link),
    }) as UpstreamPreviewApi;
  }

  close(): void {
    this.api?.close();
  }

  syncClickMode(): void {
    this.mount();
    this.api?.syncClickMode();
  }

  openFromFrame(
    url: string,
    iframe: HTMLIFrameElement,
    anchorRect: { left: number; bottom: number } | undefined,
  ): void {
    if (!this.options.isEnabled() || !this.isPreviewable(url, null)) return;
    this.mount();
    if (!this.api) return;
    const frameRect = iframe.getBoundingClientRect();
    const rect = anchorRect ?? { left: 0, bottom: 0 };
    this.api.openFromFrame(url, {
      left: frameRect.left + rect.left,
      top: frameRect.top + rect.bottom,
      bottom: frameRect.top + rect.bottom,
    });
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
