import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postLaporan = vi.fn();
const getLaporan = vi.fn();
vi.mock("@/services/laporan.service", () => ({ postLaporan, getLaporan }));

const sync = await import("../laporan-sync");
const { laporAktivitas } = await import("../lapor");
const { useLaporanStore } = await import("@/stores/useLaporanStore");
const { mingguHabis } = await import("../evaluasi");
const { today } = await import("@/lib/helpers/storage.helper");

describe("laporAktivitas + sync", () => {
  beforeEach(() => {
    sync.__resetLaporanSync();
    localStorage.clear();
    useLaporanStore.setState({ items: [], dimuat: false });
    postLaporan.mockReset().mockResolvedValue({ data: { saved: 1 } });
    getLaporan.mockReset().mockResolvedValue({ data: [] });
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("counts right away, sends nothing before start", async () => {
    const l = laporAktivitas("kartu_diulang", {
      data: { kartu: "kata", benar: true },
    });
    expect(l.menu).toBe("review");
    expect(useLaporanStore.getState().items).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(postLaporan).not.toHaveBeenCalled();
  });

  it("sends in a batch after start; a failure stays queued and retries", async () => {
    await sync.startLaporan("tok", 20000);
    postLaporan.mockRejectedValueOnce(new Error("offline"));
    laporAktivitas("ulang_habis", { data: {} });
    laporAktivitas("kuis_kesalahan_selesai", { skor: 4, total: 5, data: {} });
    await vi.advanceTimersByTimeAsync(1000);
    expect(postLaporan).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`${sync.LAPORAN_OUTBOX_KEY}:tok`)).toContain(
      "ulang_habis",
    );
    await vi.advanceTimersByTimeAsync(10_000);
    expect(postLaporan).toHaveBeenCalledTimes(2);
    expect(postLaporan.mock.calls[1][0]).toHaveLength(2);
    expect(localStorage.getItem(`${sync.LAPORAN_OUTBOX_KEY}:tok`)).toBeNull();
  });

  // Session gone: retrying can't help (and the app is on the token screen).
  // The reports stay in this token's outbox for its next sign-in.
  it("401 stops retrying and keeps the reports on the device", async () => {
    await sync.startLaporan("tok", 20000);
    postLaporan.mockRejectedValue({ response: { status: 401 } });
    laporAktivitas("ulang_habis", { data: {} });
    await vi.advanceTimersByTimeAsync(1000);
    expect(postLaporan).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(postLaporan).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(`${sync.LAPORAN_OUTBOX_KEY}:tok`)).toContain(
      "ulang_habis",
    );
  });

  it("a closed tab's reports come back on the next start, for that token only", async () => {
    await sync.startLaporan("tok", 20000);
    postLaporan.mockRejectedValue(new Error("offline"));
    laporAktivitas("ulang_habis", { data: {} });
    await vi.advanceTimersByTimeAsync(1000);
    sync.__resetLaporanSync();
    useLaporanStore.setState({ items: [], dimuat: false });

    await sync.startLaporan("other", 20000);
    expect(useLaporanStore.getState().items).toHaveLength(0);
    sync.__resetLaporanSync();

    postLaporan.mockReset().mockResolvedValue({ data: { saved: 1 } });
    await sync.startLaporan("tok", 20000);
    expect(useLaporanStore.getState().items.map((l) => l.jenis)).toEqual([
      "ulang_habis",
    ]);
    await vi.advanceTimersByTimeAsync(0);
    expect(postLaporan).toHaveBeenCalled();
  });

  it("loads the server's last days and merges by id", async () => {
    getLaporan.mockResolvedValue({
      data: [{ id: "s1", jenis: "kata_ditandai", menu: "vocab", day: 19990 }],
    });
    await sync.startLaporan("tok", 20000);
    expect(getLaporan).toHaveBeenCalledWith(20000 - 45);
    await sync.muatLaporan(20000);
    const s = useLaporanStore.getState();
    expect(s.dimuat).toBe(true);
    expect(s.items.map((l) => l.id)).toEqual(["s1"]);
  });
});

describe("order after a reload", () => {
  beforeEach(() => {
    sync.__resetLaporanSync();
    localStorage.clear();
    useLaporanStore.setState({ items: [], dimuat: false });
    postLaporan.mockReset().mockRejectedValue(new Error("offline"));
    getLaporan.mockReset().mockResolvedValue({ data: [] });
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it("a report left in the outbox stays the latest, after older server ones", async () => {
    const k = { level: "pre", minggu: 1, topik: "r", skenario: "order" };
    // Last word of the week marked, tab closed before it was sent.
    await sync.startLaporan("tok", 20000);
    laporAktivitas("kata_ditandai", {
      level: "pre",
      week: 1,
      data: { kunci: "w2", sisa: 0 },
    });
    sync.__resetLaporanSync();
    useLaporanStore.setState({ items: [], dimuat: false });

    // Next start: the server has only the earlier mark (sisa 1).
    getLaporan.mockResolvedValue({
      data: [
        {
          id: "s1",
          jenis: "kata_ditandai",
          menu: "vocab",
          level: "pre",
          week: 1,
          day: today(),
          data: { kunci: "w1", sisa: 1 },
        },
      ],
    });
    await sync.startLaporan("tok", today());
    const items = useLaporanStore.getState().items;
    expect(items.map((l) => l.id)[0]).toBe("s1");
    expect(mingguHabis(items, k)).toBe(true);
  });
});
