// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { ListFrameController } from "../src/tabs/list-frame";

describe("independent list frame", () => {
  it("accepts only messages from its managed frame", () => {
    const container = document.createElement("div");
    document.body.append(container);
    const onMessage = vi.fn();
    const controller = new ListFrameController(container, "session-1", onMessage);
    const iframe = controller.mount("https://linux.do/latest");
    expect(iframe.name).toBe("ldu-list:session-1");
    expect(controller.mount("https://linux.do/latest")).toBe(iframe);
    const message = new MessageEvent("message", {
      data: { type: "ldu:list-state", frameId: "session-1", url: "https://linux.do/c/develop/4", scrollY: 120 },
      origin: location.origin,
    });
    Object.defineProperty(message, "source", { value: iframe.contentWindow });
    controller.handleMessage(message);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ scrollY: 120 }), iframe);

    const wrappedSource = new MessageEvent("message", {
      data: { type: "ldu:list-state", frameId: "session-1", url: "https://linux.do/" },
      origin: location.origin,
    });
    Object.defineProperty(wrappedSource, "source", { value: window });
    controller.handleMessage(wrappedSource);
    expect(onMessage).toHaveBeenCalledTimes(1);

    const wrongFrame = new MessageEvent("message", {
      data: { type: "ldu:list-state", frameId: "another-session", url: "https://linux.do/" },
      origin: location.origin,
    });
    controller.handleMessage(wrongFrame);
    expect(onMessage).toHaveBeenCalledTimes(1);

    const foreignOrigin = new MessageEvent("message", {
      data: { type: "ldu:list-state", frameId: "session-1", url: "https://linux.do/" },
      origin: "https://attacker.example",
    });
    controller.handleMessage(foreignOrigin);
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it("removes its frame on destroy", () => {
    const container = document.createElement("div");
    const controller = new ListFrameController(container, "session-2", vi.fn());
    controller.mount("https://linux.do/");
    controller.destroy();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("does not treat clicked targets as the current list route", () => {
    const container = document.createElement("div");
    const controller = new ListFrameController(container, "session-3", vi.fn());
    const iframe = controller.mount(new URL("/latest", location.href).href);
    const state = new MessageEvent("message", {
      data: { type: "ldu:list-state", frameId: "session-3", url: new URL("/c/develop/4", location.href).href, scrollY: 0 },
      origin: location.origin,
    });
    Object.defineProperty(state, "source", { value: iframe.contentWindow });
    controller.handleMessage(state);
    const preview = new MessageEvent("message", {
      data: { type: "ldu:list-preview-open", frameId: "session-3", url: "https://example.com/" },
      origin: location.origin,
    });
    Object.defineProperty(preview, "source", { value: iframe.contentWindow });
    controller.handleMessage(preview);
    controller.mount(new URL("/c/develop/4", location.href).href);
    expect(iframe.src).toBe(new URL("/latest", location.href).href);
  });

  it("restores list scroll once without repeatedly driving incremental loading", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    document.body.append(container);
    const controller = new ListFrameController(container, "session-4", vi.fn());
    const iframe = controller.mount(new URL("/latest", location.href).href);
    let scrollY = 0;
    Object.defineProperty(iframe.contentWindow, "scrollY", { configurable: true, get: () => scrollY });
    const scrollTo = vi.spyOn(iframe.contentWindow!, "scrollTo").mockImplementation(() => {
      scrollY = scrollTo.mock.calls.length === 1 ? 400 : 1200;
    });

    controller.restoreScroll(1200);
    vi.advanceTimersByTime(5_000);

    expect(scrollTo).toHaveBeenCalledTimes(1);
    controller.destroy();
    vi.useRealTimers();
  });
});
