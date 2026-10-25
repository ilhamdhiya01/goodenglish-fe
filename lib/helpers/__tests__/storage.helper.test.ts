import { beforeEach, describe, expect, it, vi } from "vitest";

const queueProgress = vi.fn();
vi.mock("@/lib/helpers/progress-sync.helper", () => ({ queueProgress }));

const {
  hasLegacyProgress,
  load,
  loadStr,
  readLegacyProgress,
  save,
  saveStr,
  setProgressSnapshot,
  STORAGE_KEYS,
} = await import("../storage.helper");

describe("storage.helper", () => {
  beforeEach(() => {
    localStorage.clear();
    queueProgress.mockClear();
    setProgressSnapshot({});
  });

  it("reads progress keys from the server snapshot, not localStorage", () => {
    localStorage.setItem(STORAGE_KEYS.known, JSON.stringify({ old: 1 }));
    setProgressSnapshot({ known: { "1:w:be": 1 }, level: "inter" });

    expect(load(STORAGE_KEYS.known, {})).toEqual({ "1:w:be": 1 });
    expect(loadStr(STORAGE_KEYS.level)).toBe("inter");
    expect(load(STORAGE_KEYS.srs, { empty: true })).toEqual({ empty: true });
  });

  it("queues progress writes for the server and updates the snapshot", () => {
    save(STORAGE_KEYS.plan, { rule: "r2" });

    expect(queueProgress).toHaveBeenCalledWith("plan", { rule: "r2" });
    expect(load(STORAGE_KEYS.plan, {})).toEqual({ rule: "r2" });
    expect(localStorage.getItem(STORAGE_KEYS.plan)).toBeNull();
  });

  it("folds the per-level week keys into one `weeks` document", () => {
    setProgressSnapshot({ weeks: { pre: "3" } });
    saveStr(STORAGE_KEYS.week("beginner"), "2");

    expect(queueProgress).toHaveBeenCalledWith("weeks", {
      pre: "3",
      beginner: "2",
    });
    expect(loadStr(STORAGE_KEYS.week("pre"))).toBe("3");
    expect(loadStr(STORAGE_KEYS.weekLegacy)).toBeNull();
  });

  it("keeps device-only preferences (TTS voice) in localStorage", () => {
    saveStr(STORAGE_KEYS.voice, "Samantha");

    expect(queueProgress).not.toHaveBeenCalled();
    expect(loadStr(STORAGE_KEYS.voice)).toBe("Samantha");
  });

  it("reads the old app's localStorage as server documents for import", () => {
    localStorage.setItem(STORAGE_KEYS.known, JSON.stringify({ "1:w:be": 1 }));
    localStorage.setItem(STORAGE_KEYS.level, "pre");
    localStorage.setItem(STORAGE_KEYS.weekLegacy, "4");

    const legacy = readLegacyProgress();

    expect(legacy).toEqual({
      known: { "1:w:be": 1 },
      level: "pre",
      weeks: { pre: "4" },
    });
    expect(hasLegacyProgress(legacy)).toBe(true);
    expect(hasLegacyProgress({ level: "pre" })).toBe(false);
  });
});
