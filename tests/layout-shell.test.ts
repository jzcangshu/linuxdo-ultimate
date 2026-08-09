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

  it("switches both reading panels between horizontal and vertical tab presentation", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    document.body.innerHTML = '<div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>';
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
      tabPresentation: "vertical",
      verticalTabsAutoCollapse: true,
    });
    controller.setOpen(true);
    controller.mount();
    controller.setSecondaryOpen(true);
    expect(document.body.classList).toContain("ldu-tabs-vertical");
    expect(document.body.classList).not.toContain("ldu-vertical-tabs-static");

    controller.setTabPresentation("vertical", false);
    expect(document.body.classList).toContain("ldu-vertical-tabs-static");
    controller.setTabInteractionLocked(true, "secondary");
    expect(controller.getSecondaryPanelElement()?.querySelector(".ldu-topic-toolbar")?.classList).toContain("is-interaction-locked");

    controller.setTabPresentation("horizontal", true);
    expect(document.body.classList).not.toContain("ldu-tabs-vertical");
    controller.destroy();
    expect(document.body.classList).not.toContain("ldu-vertical-tabs-static");
  });

  it("remembers independent pane ratios for single and dual reading layouts", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    document.body.innerHTML = '<div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>';
    const changes: Array<{ ratio: number; layout: "single" | "dual" }> = [];
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
      dualPaneSizes: { sidebar: 216, listRatio: 0.45 },
      onPaneSizesChange: (sizes, layout) => changes.push({ ratio: sizes.listRatio, layout }),
    });
    controller.setOpen(true);
    controller.mount();
    const handle = controller.getPanelElement()!.querySelector<HTMLElement>(".ldu-resize-before")!;

    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.documentElement.style.getPropertyValue("--ldu-list-track")).toBe("0.37fr");
    controller.setSecondaryOpen(true);
    expect(document.documentElement.style.getPropertyValue("--ldu-list-track")).toBe("0.45fr");
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(document.documentElement.style.getPropertyValue("--ldu-list-track")).toBe("0.43fr");

    controller.setSecondaryOpen(false);
    expect(document.documentElement.style.getPropertyValue("--ldu-list-track")).toBe("0.37fr");
    expect(changes).toEqual([
      { ratio: 0.37, layout: "single" },
      { ratio: 0.43, layout: "dual" },
    ]);
  });

  it("temporarily hosts the native outlet in the list pane and restores its exact position", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    document.body.innerHTML = `
      <div id="main-outlet-wrapper">
        <aside class="sidebar-wrapper"></aside>
        <span id="before"></span><main id="main-outlet">当前列表</main><span id="after"></span>
      </div>`;
    const wrapper = document.querySelector<HTMLElement>("#main-outlet-wrapper")!;
    const outlet = document.querySelector<HTMLElement>("#main-outlet")!;
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
    });
    expect(controller.mount()).toBe(true);

    expect(controller.beginListHandoff(640)).toBe(true);
    controller.setOpen(true);
    expect(outlet.parentElement).toBe(controller.getListContentElement());
    expect(controller.getListContentElement()?.classList.contains("is-native-handoff")).toBe(true);
    expect(controller.getListContentElement()?.scrollTop).toBe(640);

    expect(controller.finishListHandoff()).toBe(640);
    expect(outlet.parentElement).toBe(wrapper);
    expect(outlet.previousElementSibling?.id).toBe("before");
    expect(outlet.nextElementSibling?.id).toBe("after");
    expect(controller.getListContentElement()?.classList.contains("is-native-handoff")).toBe(false);
  });

  it("restores a pending native outlet when the split shell is destroyed", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    document.body.innerHTML = '<div id="main-outlet-wrapper"><aside class="sidebar-wrapper"></aside><main id="main-outlet"></main></div>';
    const wrapper = document.querySelector<HTMLElement>("#main-outlet-wrapper")!;
    const outlet = document.querySelector<HTMLElement>("#main-outlet")!;
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
    });
    controller.mount();
    controller.beginListHandoff(120);

    controller.destroy();

    expect(outlet.parentElement).toBe(wrapper);
    expect(document.querySelector("#ldu-layout-shell")).toBeNull();
  });
});
