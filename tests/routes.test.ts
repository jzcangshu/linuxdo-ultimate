import { describe, expect, it } from "vitest";
import {
  classifyRoute,
  getTopicInfo,
  isSplitRoute,
  isSupportedTopicTarget,
} from "../src/discourse/routes";

describe("Discourse routes", () => {
  it.each([
    ["https://linux.do/", "list"],
    ["https://linux.do/latest", "list"],
    ["https://linux.do/c/develop/4", "list"],
    ["https://linux.do/tag/1451-tag/1451", "list"],
    ["https://linux.do/bookmarks", "list"],
    ["https://linux.do/search?expanded=true", "search"],
    ["https://linux.do/u/jzcangshu/activity", "user"],
    ["https://linux.do/chat", "chat"],
    ["https://linux.do/t/topic/2309449/41", "topic"],
  ] as const)("classifies %s", (url, expected) => {
    expect(classifyRoute(url)).toBe(expected);
  });

  it("parses both slugged and topic aliases", () => {
    expect(getTopicInfo("https://linux.do/t/topic/2309449/41")).toMatchObject({
      topicId: "2309449",
      postNumber: 41,
    });
    expect(getTopicInfo("https://linux.do/t/a-useful-title/2699329/3")).toMatchObject({
      topicId: "2699329",
      postNumber: 3,
    });
  });

  it("rejects unsupported hosts and the current topic", () => {
    expect(getTopicInfo("https://example.com/t/topic/1")).toBeNull();
    expect(isSupportedTopicTarget(
      "https://linux.do/t/topic/2309449/64",
      "https://linux.do/t/topic/2309449/41",
    )).toBe(false);
    expect(isSupportedTopicTarget(
      "https://linux.do/t/topic/2699329",
      "https://linux.do/latest",
    )).toBe(true);
  });

  it("uses one helper for every split-capable route", () => {
    expect(isSplitRoute("https://linux.do/")).toBe(true);
    expect(isSplitRoute("https://linux.do/search?q=test")).toBe(true);
    expect(isSplitRoute("https://linux.do/t/topic/1")).toBe(false);
  });
});
