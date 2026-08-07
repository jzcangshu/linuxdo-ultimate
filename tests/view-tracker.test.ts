import { describe, expect, it, vi } from "vitest";
import { getOrCreateTrackingSessionId, MemoryWebStorage, ViewTracker } from "../src/discourse/view-tracker";
import { getTopicInfo } from "../src/discourse/routes";

function topic() {
  return getTopicInfo("https://linux.do/t/topic/2309449/41")!;
}

function response(headers: Record<string, string> = {}, status = 200): Response {
  return new Response(null, { status, headers });
}

describe("view tracking", () => {
  it("confirms with /pageview and does not use the fallback", async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ "x-discourse-trackview": "1" }));
    const tracker = new ViewTracker({
      storage: new MemoryWebStorage(),
      fetcher,
      now: () => 1_000,
      csrfToken: () => "csrf",
      trackingSessionId: () => "session",
    });

    const result = await tracker.track(topic(), "split-open", "https://linux.do/latest");

    expect(result.status).toBe("confirmed");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://linux.do/pageview");
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ method: "POST", credentials: "same-origin" });
  });

  it("falls back to topic JSON when pageview lacks confirmation", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response({ "x-discourse-browserpageview": "1" }));
    const tracker = new ViewTracker({
      storage: new MemoryWebStorage(), fetcher, now: () => 2_000,
      csrfToken: () => "", trackingSessionId: () => "session",
    });

    const result = await tracker.track(topic(), "restored-tab", "");

    expect(result.status).toBe("confirmed");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toContain("/t/2309449.json?track_visit=true&forceLoad=true");
  });

  it("deduplicates fresh pending and completed topic locks", async () => {
    const storage = new MemoryWebStorage();
    const fetcher = vi.fn().mockResolvedValue(response({ "x-discourse-trackview": "1" }));
    const tracker = new ViewTracker({
      storage, fetcher, now: () => 3_000,
      csrfToken: () => "", trackingSessionId: () => "session",
    });

    await tracker.track(topic(), "split-open", "");
    const second = await tracker.track(topic(), "split-open", "");

    expect(second.status).toBe("skipped");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("clears a failed lock so a later attempt can retry", async () => {
    const storage = new MemoryWebStorage();
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(response({ "x-discourse-trackview": "1" }));
    let now = 4_000;
    const tracker = new ViewTracker({
      storage, fetcher, now: () => now,
      csrfToken: () => "", trackingSessionId: () => "session",
    });

    expect((await tracker.track(topic(), "split-open", "")).status).toBe("failed");
    now += 1;
    expect((await tracker.track(topic(), "manual-retry", "")).status).toBe("confirmed");
  });

  it("keeps one tracking session ID for the browser tab", () => {
    const storage = new MemoryWebStorage();
    const createId = vi.fn(() => "stable-session");
    expect(getOrCreateTrackingSessionId(storage, "", createId)).toBe("stable-session");
    expect(getOrCreateTrackingSessionId(storage, "", createId)).toBe("stable-session");
    expect(createId).toHaveBeenCalledTimes(1);
    expect(getOrCreateTrackingSessionId(storage, "server-session", createId)).toBe("server-session");
  });

  it("honors a Discourse base path for both tracking endpoints", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response({ "x-discourse-trackview": "1" }));
    const tracker = new ViewTracker({
      storage: new MemoryWebStorage(), fetcher, now: () => 5_000,
      csrfToken: () => "", trackingSessionId: () => "session", basePath: () => "/forum/",
    });
    await tracker.track(topic(), "split-open", "");
    expect(fetcher.mock.calls[0]?.[0]).toBe("https://linux.do/forum/pageview");
    expect(fetcher.mock.calls[1]?.[0]).toContain("https://linux.do/forum/t/2309449.json");
  });

  it("reclaims expired topic locks and their index entries", async () => {
    const storage = new MemoryWebStorage();
    let now = 1_000;
    const fetcher = vi.fn().mockResolvedValue(response({ "x-discourse-trackview": "1" }));
    const tracker = new ViewTracker({
      storage, fetcher, now: () => now,
      csrfToken: () => "", trackingSessionId: () => "session",
    });
    await tracker.track(topic(), "split-open", "");
    now += 8 * 60 * 60_000 + 1;

    await tracker.track(getTopicInfo("https://linux.do/t/topic/2")!, "split-open", "");

    expect(storage.keys().some((key) => key.endsWith(":2309449"))).toBe(false);
  });

  it("falls back without throwing when lock storage is unavailable", async () => {
    const storage = {
      getItem: vi.fn(() => { throw new Error("blocked"); }),
      setItem: vi.fn(() => { throw new Error("quota"); }),
      removeItem: vi.fn(() => { throw new Error("blocked"); }),
    };
    const fetcher = vi.fn().mockResolvedValue(response({ "x-discourse-trackview": "1" }));
    const tracker = new ViewTracker({
      storage, fetcher, now: () => 1_000,
      csrfToken: () => "", trackingSessionId: () => "session",
    });

    await expect(tracker.track(topic(), "split-open", "")).resolves.toMatchObject({ status: "confirmed" });
    await expect(tracker.track(topic(), "split-open", "")).resolves.toMatchObject({ status: "skipped" });
  });

  it("abandons a claim when another browser tab wins ownership", async () => {
    const storage = new MemoryWebStorage();
    const fetcher = vi.fn().mockResolvedValue(response({ "x-discourse-trackview": "1" }));
    const tracker = new ViewTracker({
      storage, fetcher, now: () => 1_000,
      csrfToken: () => "", trackingSessionId: () => "session",
      beforeClaimConfirmation: () => {
        const key = storage.keys().find((candidate) => candidate.endsWith(":2309449"))!;
        const state = JSON.parse(storage.getItem(key)!);
        storage.setItem(key, JSON.stringify({ ...state, token: "other-tab" }));
      },
    });

    expect((await tracker.track(topic(), "split-open", "")).status).toBe("skipped");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
