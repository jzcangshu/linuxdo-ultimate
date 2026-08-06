// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayoutController } from "../src/ui/layout-controller";

describe("right-detail list scrollbar", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.classList.remove("ldu-layout-two-root");
    vi.restoreAllMocks();
  });

  it("places a synchronized scrollbar inside the list edge while retaining page scrolling", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1440);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(900);
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 3600 });
    const header = document.createElement("header");
    header.className = "d-header";
    header.getBoundingClientRect = () => ({ bottom: 52 } as DOMRect);
    const wrapper = document.createElement("div");
    wrapper.id = "main-outlet-wrapper";
    const outlet = document.createElement("main");
    outlet.id = "main-outlet";
    outlet.getBoundingClientRect = () => ({ right: 500, width: 360 } as DOMRect);
    wrapper.append(outlet);
    document.body.append(header, wrapper);
    const controller = new LayoutController({
      preference: "two",
      paneSizes: { sidebar: 216, listRatio: 0.35 },
      hidePosters: true,
    });
    controller.setOpen(true);
    controller.mount();

    const scrollbar = document.querySelector<HTMLElement>(".ldu-list-scrollbar")!;
    expect(document.documentElement.classList.contains("ldu-layout-two-root")).toBe(true);
    expect(scrollbar.hidden).toBe(false);
    expect(scrollbar.style.left).toBe("486px");
    expect(scrollbar.style.top).toBe("52px");
    expect(scrollbar.style.height).toBe("848px");
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);

    controller.destroy();
    expect(document.querySelector(".ldu-list-scrollbar")).toBeNull();
    expect(document.documentElement.classList.contains("ldu-layout-two-root")).toBe(false);
  });
});
