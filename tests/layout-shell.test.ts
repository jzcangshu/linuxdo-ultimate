// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayoutController } from "../src/ui/layout-controller";

describe("stable split shell", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.className = "";
    vi.restoreAllMocks();
  });

  it("mounts one body-level shell with independent list and topic hosts", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    document.body.innerHTML = '<div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>';
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
      hidePosters: true,
    });
    controller.setOpen(true);
    expect(controller.mount()).toBe(true);
    expect(controller.mount()).toBe(true);
    expect(document.body.querySelectorAll(":scope > #ldu-layout-shell")).toHaveLength(1);
    expect(controller.getListContentElement()?.className).toBe("ldu-list-content");
    expect(controller.getContentElement()?.className).toBe("ldu-topic-content");
    expect(document.querySelector("#main-outlet-wrapper #ldu-topic-panel")).toBeNull();
  });

  it("mounts and removes exactly one independent secondary reading panel", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    document.body.innerHTML = '<div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>';
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
      hidePosters: true,
    });
    controller.setOpen(true);
    controller.mount();
    controller.setSecondaryOpen(true);
    controller.setSecondaryOpen(true);
    expect(document.querySelectorAll("#ldu-secondary-topic-panel")).toHaveLength(1);
    expect(controller.getSecondaryContentElement()?.className).toBe("ldu-topic-content");
    expect(controller.getSecondaryTabStripElement()?.getAttribute("role")).toBe("tablist");
    expect(document.body.classList.contains("ldu-secondary-open")).toBe(true);
    controller.setSecondaryOpen(false);
    expect(document.body.classList.contains("ldu-secondary-open")).toBe(false);
    expect(controller.getSecondaryPanelElement()?.hidden).toBe(true);
  });
});
