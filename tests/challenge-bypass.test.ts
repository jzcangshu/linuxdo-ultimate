import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  ChallengeBypassController,
  buildChallengeUrl,
  getChallengeReturnTarget,
} from "../src/discourse/challenge-bypass";

function createPage(url = "https://linux.do/latest") {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url });
  const navigations: Array<{ url: string; mode: "assign" | "replace" }> = [];
  const controller = new ChallengeBypassController({
    window: dom.window as unknown as Window,
    document: dom.window.document,
    navigate: (target, mode) => navigations.push({ url: target, mode }),
  });
  return { dom, controller, navigations };
}

describe("Cloudflare challenge bypass", () => {
  it("keeps the original page as the challenge redirect target", () => {
    expect(buildChallengeUrl("https://linux.do/t/topic/123/4?foo=bar#reply"))
      .toBe("/challenge?redirect=https%3A%2F%2Flinux.do%2Ft%2Ftopic%2F123%2F4%3Ffoo%3Dbar%23reply");
  });

  it("only accepts same-origin challenge return targets", () => {
    expect(getChallengeReturnTarget(
      "https://linux.do/challenge?redirect=%2Flatest",
      "https://linux.do",
    )).toBe("https://linux.do/latest");
    expect(getChallengeReturnTarget(
      "https://linux.do/challenge?redirect=https%3A%2F%2Fevil.example%2F",
      "https://linux.do",
    )).toBeUndefined();
  });

  it.each([
    "403 error",
    "429 error",
    "该响应是很久以前创建的",
    "reaction was created too long ago",
    "我们无法加载该话题",
    "You are not allowed to react",
  ])("redirects when the dialog contains %s", (message) => {
    const { dom, controller, navigations } = createPage("https://linux.do/t/topic/123");
    dom.window.document.body.innerHTML = `<div class="dialog-body">${message}</div>`;

    controller.start();

    expect(navigations).toEqual([{
      url: "/challenge?redirect=https%3A%2F%2Flinux.do%2Ft%2Ftopic%2F123",
      mode: "assign",
    }]);
  });

  it("observes a failure dialog added after startup", async () => {
    const { dom, controller, navigations } = createPage();
    controller.start();

    const dialog = dom.window.document.createElement("div");
    dialog.className = "dialog-body";
    dialog.textContent = "403 error";
    dom.window.document.body.append(dialog);
    await new Promise((resolve) => dom.window.setTimeout(resolve, 0));

    expect(navigations).toHaveLength(1);
    controller.stop();
  });

  it("suppresses a repeated automatic challenge redirect for the same page", () => {
    const { dom, navigations } = createPage("https://linux.do/t/topic/123");
    dom.window.document.body.innerHTML = '<div class="dialog-body">429 error</div>';
    const now = 10_000;
    const first = new ChallengeBypassController({
      window: dom.window as unknown as Window,
      document: dom.window.document,
      navigate: (url, mode) => navigations.push({ url, mode }),
      now: () => now,
    });
    const repeated = new ChallengeBypassController({
      window: dom.window as unknown as Window,
      document: dom.window.document,
      navigate: (url, mode) => navigations.push({ url, mode }),
      now: () => now + 1_000,
    });

    first.start();
    repeated.start();

    expect(navigations).toHaveLength(1);
  });

  it("returns from a missing challenge page to its safe redirect", () => {
    const { dom, controller, navigations } = createPage(
      "https://linux.do/challenge?redirect=%2Ft%2Ftopic%2F456",
    );
    dom.window.document.body.innerHTML = '<main class="page-not-found"></main>';

    controller.start();

    expect(navigations).toEqual([{
      url: "https://linux.do/t/topic/456",
      mode: "replace",
    }]);
  });

  it("falls back to the forum home for an unsafe challenge redirect", () => {
    const { dom, controller, navigations } = createPage(
      "https://linux.do/challenge?redirect=https%3A%2F%2Fevil.example%2F",
    );
    dom.window.document.body.innerHTML = '<main class="page-not-found"></main>';

    controller.start();

    expect(navigations).toEqual([{ url: "https://linux.do/", mode: "replace" }]);
  });

  it("suppresses a repeated missing-page redirect for five seconds", () => {
    const { dom, controller, navigations } = createPage(
      "https://linux.do/challenge?redirect=%2Flatest",
    );
    dom.window.document.body.innerHTML = '<main class="page-not-found"></main>';
    const now = 10_000;
    const first = new ChallengeBypassController({
      window: dom.window as unknown as Window,
      document: dom.window.document,
      now: () => now,
      navigate: (target, mode) => navigations.push({ url: target, mode }),
    });
    const repeated = new ChallengeBypassController({
      window: dom.window as unknown as Window,
      document: dom.window.document,
      now: () => now + 4_999,
      navigate: (target, mode) => navigations.push({ url: target, mode }),
    });

    first.start();
    repeated.start();

    expect(navigations).toHaveLength(1);
    controller.stop();
  });

  it("keeps the missing-page guard independent between split frames", () => {
    const { dom, navigations } = createPage(
      "https://linux.do/challenge?redirect=%2Flatest",
    );
    dom.window.document.body.innerHTML = '<main class="page-not-found"></main>';
    dom.window.name = "ldu-topic:topic-1";
    new ChallengeBypassController({
      window: dom.window as unknown as Window,
      document: dom.window.document,
      now: () => 10_000,
      navigate: (target, mode) => navigations.push({ url: target, mode }),
    }).start();
    dom.window.name = "ldu-topic:topic-2";
    new ChallengeBypassController({
      window: dom.window as unknown as Window,
      document: dom.window.document,
      now: () => 10_100,
      navigate: (target, mode) => navigations.push({ url: target, mode }),
    }).start();

    expect(navigations).toHaveLength(2);
  });

  it("does not redirect a working challenge page", () => {
    const { controller, navigations } = createPage("https://linux.do/challenge?redirect=%2Flatest");

    controller.start();

    expect(navigations).toEqual([]);
  });
});
