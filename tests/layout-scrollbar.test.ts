// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayoutController } from "../src/ui/layout-controller";

describe("right-detail independent list viewport", () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.className = "";
    document.documentElement.classList.remove("ldu-layout-two-root");
    vi.restoreAllMocks();
  });

  it("uses an iframe host instead of mirroring the top-level page scrollbar", () => {
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

    const listHost = document.querySelector<HTMLElement>(".ldu-list-content")!;
    expect(document.documentElement.classList.contains("ldu-layout-two-root")).toBe(true);
    expect(listHost).not.toBeNull();
    expect(document.querySelector(".ldu-list-scrollbar")).toBeNull();
    expect(document.body.classList.contains("ldu-layout-active")).toBe(true);

    controller.destroy();
    expect(document.querySelector(".ldu-list-scrollbar")).toBeNull();
    expect(document.documentElement.classList.contains("ldu-layout-two-root")).toBe(false);
  });
});
