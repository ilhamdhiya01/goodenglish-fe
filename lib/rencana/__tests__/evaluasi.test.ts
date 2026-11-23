import { describe, expect, it } from "vitest";

import type {
  DataJenis,
  JenisAktivitas,
  Laporan,
} from "@/lib/rencana/rencana.contract";
import type { MenuId } from "@/lib/types/session.types";

import {
  evaluasiCheckpoint,
  evaluasiHari,
  hariDari,
  jendelaCheckpoint,
  type KonteksHari,
} from "../evaluasi";

// 2026-11-16 Monday … 2026-11-22 Sunday.
const MON = Date.UTC(2026, 10, 16) / 86_400_000;
const TUE = MON + 1;
const WED = MON + 2;
const THU = MON + 3;
const FRI = MON + 4;
const SAT = MON + 5;
const SUN = MON + 6;

const ALL: MenuId[] = [
  "plan",
  "vocab",
  "review",
  "scenario",
  "grammar",
  "ai",
  "roleplay",
  "listening",
  "reading",
];

let n = 0;
const lap = <J extends JenisAktivitas>(
  jenis: J,
  day: number,
  data: DataJenis[J],
  o: Partial<Laporan> = {},
): Laporan =>
  ({
    id: `id${++n}`,
    jenis,
    menu: "plan",
    level: "pre",
    week: 3,
    day,
    data,
    ...o,
  }) as Laporan;

const ctx = (T: number, laporan: Laporan[], o: Partial<KonteksHari> = {}) =>
  evaluasiHari({
    laporan,
    T,
    menus: ALL,
    durasi: 25,
    level: "pre",
    minggu: 3,
    topik: "tense",
    skenario: "hotel",
    mainPeranTersedia: true,
    ...o,
  });

const kartu = (day: number, k = 1) =>
  Array.from({ length: k }, () =>
    lap("kartu_diulang", day, { kartu: "kata", benar: true }),
  );
const kata = (day: number, k: number, o: Partial<Laporan> = {}) =>
  Array.from({ length: k }, (_, i) =>
    lap("kata_ditandai", day, { kunci: `3:w:k${i}`, sisa: 10 }, o),
  );
const done = (r: ReturnType<typeof evaluasiHari>, id: string) =>
  r.langkah.find((l) => l.id === id)?.selesai;

describe("hari", () => {
  it("day numbers map to weekdays", () => {
    expect([MON, FRI, SAT, SUN].map(hariDari)).toEqual([1, 5, 6, 0]);
  });
});

describe("opening the app ticks nothing", () => {
  it("no reports → nothing done, no streak", () => {
    const r = ctx(MON, []);
    expect(r.selesai).toBe(0);
    expect(r.streak).toBe(false);
    expect(r.berikutnya?.id).toBe("ulang");
  });
});

describe("durasi", () => {
  it("15: Ulang, Kata, Masuk, Pakai · 25: six · 40: eight", () => {
    expect(ctx(MON, [], { durasi: 15 }).langkah.map((l) => l.id)).toEqual([
      "ulang",
      "kata",
      "masuk",
      "pakai",
    ]);
    expect(ctx(MON, []).jumlah).toBe(6);
    expect(ctx(MON, [], { durasi: 40 }).jumlah).toBe(8);
  });

  it("weekend: only Ulang", () => {
    for (const T of [SAT, SUN]) {
      const r = ctx(T, [], { durasi: 40 });
      expect(r.langkah.map((l) => l.id)).toEqual(["ulang"]);
    }
  });
});

describe("Ulang", () => {
  it("20 cards, or the due queue emptied after answering, or the quiz", () => {
    expect(done(ctx(MON, kartu(MON, 19)), "ulang")).toBe(false);
    expect(done(ctx(MON, kartu(MON, 20)), "ulang")).toBe(true);
    expect(
      done(ctx(MON, [...kartu(MON, 3), lap("ulang_habis", MON, {})]), "ulang"),
    ).toBe(true);
    // Emptied without answering anything (a new learner): not done.
    expect(done(ctx(MON, [lap("ulang_habis", MON, {})]), "ulang")).toBe(false);
    expect(
      done(ctx(MON, [lap("kuis_kesalahan_selesai", MON, {})]), "ulang"),
    ).toBe(true);
  });

  it("yesterday's cards don't count today", () => {
    expect(done(ctx(TUE, kartu(MON, 20)), "ulang")).toBe(false);
  });
});

describe("Kata", () => {
  it("6 words of the active week, still marked", () => {
    expect(done(ctx(MON, kata(MON, 5)), "kata")).toBe(false);
    expect(done(ctx(MON, kata(MON, 6)), "kata")).toBe(true);
    // Another week's words don't count while this week has words left.
    expect(done(ctx(MON, kata(MON, 6, { week: 2 })), "kata")).toBe(false);
  });

  it("unmarking the same day counts back", () => {
    const six = kata(MON, 6);
    const r = ctx(MON, [
      ...six,
      lap("kata_batal", MON, { kunci: "3:w:k0", sisa: 11 }),
    ]);
    expect(done(r, "kata")).toBe(false);
    expect(r.langkah.find((l) => l.id === "kata")?.progres).toEqual({
      n: 5,
      dari: 6,
    });
  });

  it("week already all marked: any word, or skip", () => {
    const habis = lap("status_kata_minggu", MON, { sisa: 0, total: 30 });
    const r = ctx(MON, [habis]);
    expect(r.langkah.find((l) => l.id === "kata")?.bolehLewati).toBe(true);
    expect(done(ctx(MON, [habis, ...kata(MON, 1, { week: 2 })]), "kata")).toBe(
      true,
    );
    expect(
      done(
        ctx(MON, [habis, lap("langkah_dilewati", MON, { langkah: "kata" })]),
        "kata",
      ),
    ).toBe(true);
    // Fewer than 6 left: done once they are all marked.
    const last = lap("kata_ditandai", MON, { kunci: "3:w:z", sisa: 0 });
    expect(done(ctx(MON, [last]), "kata")).toBe(true);
  });

  it("Friday: the 5-question mistakes quiz", () => {
    expect(done(ctx(FRI, kata(FRI, 6)), "kata")).toBe(false);
    const q = lap("kuis_kesalahan_selesai", FRI, {}, { skor: 4, total: 5 });
    const r = ctx(FRI, [q]);
    expect(done(r, "kata")).toBe(true);
    // The same quiz also covers Ulang when nothing was due.
    expect(done(r, "ulang")).toBe(true);
  });
});

describe("Masuk and Lancar", () => {
  it("a passing new reading; a failed or repeated one doesn't count", () => {
    const ok = lap(
      "bacaan_selesai",
      MON,
      { textId: "t1", baru: true },
      { skor: 4, total: 5 },
    );
    const low = lap(
      "bacaan_selesai",
      MON,
      { textId: "t1", baru: true },
      { skor: 3, total: 5 },
    );
    const again = lap(
      "bacaan_selesai",
      MON,
      { textId: "t0", baru: false },
      { skor: 5, total: 5 },
    );
    expect(done(ctx(MON, [ok]), "masuk")).toBe(true);
    expect(done(ctx(MON, [low]), "masuk")).toBe(false);
    expect(done(ctx(MON, [again]), "masuk")).toBe(false);
  });

  it("any input kind counts, whatever the day suggests", () => {
    const dengar = lap(
      "dengar_selesai",
      MON,
      { tahap: 1 },
      { skor: 4, total: 6 },
    );
    expect(done(ctx(MON, [dengar]), "masuk")).toBe(true);
    expect(
      done(
        ctx(WED, [lap("dialog_diputar", WED, { scenarioId: "hotel" })]),
        "masuk",
      ),
    ).toBe(true);
  });

  it("one Dikte set can't count for both Masuk and Lancar", () => {
    const d1 = lap("dikte_selesai", MON, { tahap: 1 }, { skor: 40, total: 50 });
    let r = ctx(MON, [d1]);
    expect(done(r, "masuk")).toBe(true);
    expect(done(r, "lancar")).toBe(false);
    const d2 = lap("dikte_selesai", MON, { tahap: 1 }, { skor: 40, total: 50 });
    r = ctx(MON, [d1, d2]);
    expect(done(r, "lancar")).toBe(true);
    // With a reading for Masuk, the one Dikte goes to Lancar.
    const read = lap(
      "bacaan_selesai",
      MON,
      { textId: "t", baru: true },
      { skor: 5, total: 5 },
    );
    r = ctx(MON, [d1, read]);
    expect(done(r, "masuk") && done(r, "lancar")).toBe(true);
  });
});

describe("Bentuk", () => {
  it("10 answers on the week's topic", () => {
    const ans = (topik: string, k: number) =>
      Array.from({ length: k }, () =>
        lap("jawaban_grammar", MON, {
          topik,
          set: `${topik}1`,
          tahap: "mc",
          benar: true,
        }),
      );
    expect(done(ctx(MON, ans("tense", 9)), "bentuk")).toBe(false);
    expect(done(ctx(MON, ans("tense", 10)), "bentuk")).toBe(true);
    expect(done(ctx(MON, ans("prep", 10)), "bentuk")).toBe(false);
    expect(ctx(MON, []).langkah.find((l) => l.id === "bentuk")?.tautan).toBe(
      "/grammar/tense",
    );
  });
});

describe("Pakai per hari", () => {
  const kal = (day: number, k: number) =>
    Array.from({ length: k }, () =>
      lap("kalimat_dicek", day, { benar: true, sumber: "rencana" }),
    );
  it("Mon/Tue/Fri: 3 checked sentences", () => {
    expect(done(ctx(MON, kal(MON, 2)), "pakai")).toBe(false);
    expect(done(ctx(TUE, kal(TUE, 3)), "pakai")).toBe(true);
    expect(done(ctx(FRI, kal(FRI, 3)), "pakai")).toBe(true);
  });

  it("only sentences from the Rencana panel count, not Tanya AI", () => {
    const ai = Array.from({ length: 3 }, () =>
      lap("kalimat_dicek", MON, { benar: true, sumber: "tanya_ai" }),
    );
    expect(done(ctx(MON, ai), "pakai")).toBe(false);
  });

  it("Wednesday: 3 lines answered in the week's scenario", () => {
    const jawab = (sid: string) =>
      [1, 3, 5].map((b) =>
        lap("dialog_dijawab", WED, { scenarioId: sid, baris: b }),
      );
    expect(done(ctx(WED, jawab("hotel")), "pakai")).toBe(true);
    expect(done(ctx(WED, jawab("smalltalk")), "pakai")).toBe(false);
    expect(done(ctx(WED, kal(WED, 3)), "pakai")).toBe(false);
  });

  it("Thursday: a short roleplay; without roleplay back to 3 sentences", () => {
    const short = lap("main_peran_selesai", THU, {
      mode: "pendek",
      misi: false,
      scenarioId: "hotel",
      giliran: 6,
    });
    expect(done(ctx(THU, [short]), "pakai")).toBe(true);
    expect(done(ctx(THU, kal(THU, 3)), "pakai")).toBe(false);
    const noRp = ctx(THU, kal(THU, 3), { mainPeranTersedia: false });
    expect(done(noRp, "pakai")).toBe(true);
    expect(noRp.langkah.find((l) => l.id === "pakai")?.aksi).toBe(
      "pakai_kalimat",
    );
  });
});

describe("streak", () => {
  const full = (T: number) => [
    ...kartu(T, 20),
    ...kata(T, 6),
    lap(
      "bacaan_selesai",
      T,
      { textId: "x", baru: true },
      { skor: 5, total: 5 },
    ),
    ...Array.from({ length: 3 }, () =>
      lap("kalimat_dicek", T, { benar: true, sumber: "rencana" }),
    ),
  ];
  it("Mon–Thu: Ulang + Kata + Masuk + Pakai (Bentuk/Lancar not needed)", () => {
    const r = ctx(MON, full(MON));
    expect(r.streak).toBe(true);
    expect(r.flags).toMatchObject({ v2: true, s: true, ulang: true });
    expect(
      ctx(
        MON,
        full(MON).filter((l) => l.jenis !== "kata_ditandai"),
      ).streak,
    ).toBe(false);
  });

  it("Friday: Ulang + Masuk + Pakai", () => {
    const fri = full(FRI).filter((l) => l.jenis !== "kata_ditandai");
    expect(ctx(FRI, fri).streak).toBe(true);
  });

  it("weekend: Ulang only", () => {
    expect(ctx(SAT, kartu(SAT, 20)).streak).toBe(true);
    expect(ctx(SAT, []).streak).toBe(false);
  });

  it("a menu turned off: its step is hidden and not needed", () => {
    const menus = ALL.filter((m) => m !== "ai");
    const r = ctx(
      MON,
      full(MON).filter((l) => l.jenis !== "kalimat_dicek"),
      { menus },
    );
    expect(r.langkah.some((l) => l.id === "pakai")).toBe(false);
    expect(r.streak).toBe(true);
  });

  it("a menu that never reports leaves its step undone, without error", () => {
    const r = ctx(MON, kartu(MON, 20));
    expect(done(r, "kata")).toBe(false);
    expect(r.streak).toBe(false);
  });
});

describe("changing week mid-day", () => {
  it("steps follow the new week; earlier reports stay", () => {
    const old = kata(MON, 6, { week: 3 });
    const r = ctx(MON, old, { minggu: 4 });
    expect(done(r, "kata")).toBe(false);
    expect(done(ctx(MON, old), "kata")).toBe(true);
  });
});

describe("checkpoint", () => {
  const cp = (
    T: number,
    laporan: Laporan[],
    o: Partial<Parameters<typeof evaluasiCheckpoint>[0]> = {},
  ) =>
    evaluasiCheckpoint({
      laporan,
      T,
      menus: ALL,
      level: "pre",
      minggu: 3,
      topik: "tense",
      skenario: "hotel",
      ...o,
    });
  const tes = (day: number, skor: number) =>
    lap("tes_cepat_selesai", day, { lingkup: "week" }, { skor, total: 20 });
  const ketik = (day: number, benar: number, salah: number) => [
    ...Array.from({ length: benar }, () =>
      lap("jawaban_grammar", day, {
        topik: "tense",
        set: "tense1",
        tahap: "type",
        benar: true,
      }),
    ),
    ...Array.from({ length: salah }, () =>
      lap("jawaban_grammar", day, {
        topik: "tense",
        set: "tense1",
        tahap: "type",
        benar: false,
      }),
    ),
  ];
  const dikte = (day: number, skor: number) =>
    lap("dikte_selesai", day, { tahap: 1 }, { skor, total: 100 });
  const mp = (day: number, o: Partial<DataJenis["main_peran_selesai"]> = {}) =>
    lap("main_peran_selesai", day, {
      mode: "penuh",
      misi: true,
      scenarioId: "hotel",
      giliran: 10,
      ...o,
    });
  const ringkasan = (day: number, kata: number) =>
    lap("ringkasan_tugas", day, { teks: "…" }, { jumlah: kata });

  it("window is Saturday–Monday", () => {
    expect(jendelaCheckpoint(SAT)).toEqual([SAT, SAT + 2]);
    expect(jendelaCheckpoint(SUN)).toEqual([SAT, SAT + 2]);
    expect(jendelaCheckpoint(MON)).toEqual([MON - 2, MON]);
    expect(cp(SAT, []).tampil).toBe(true);
    expect(cp(WED, []).tampil).toBe(false);
  });

  it("3 of 4 with the real task: passes", () => {
    const r = cp(
      SAT,
      [tes(SAT, 17), ketik(TUE, 9, 1), mp(FRI), ringkasan(SAT, 70)].flat(),
    );
    expect(r.syarat.map((s) => [s.id, s.ok])).toEqual([
      ["kosakata", true],
      ["grammar", true],
      ["menyimak", false],
      ["tugas", true],
    ]);
    expect(r.lulus).toBe(true);
    expect(r.kurang).toEqual(["Menyimak"]);
  });

  it("3 of 4 without the real task: not yet", () => {
    const r = cp(SAT, [tes(SAT, 17), ketik(TUE, 10, 0), dikte(WED, 90)].flat());
    expect(r.lulus).toBe(false);
    expect(r.kurang).toEqual(["Tugas nyata"]);
  });

  it("rules: quiz in the window, ≥10 typed at 80%, summary 60–100 words after the roleplay", () => {
    // Quiz on Thursday: outside the window.
    expect(cp(SAT, [tes(THU, 20)]).syarat[0].ok).toBe(false);
    expect(cp(SAT, ketik(TUE, 7, 2)).syarat[1].ok).toBe(false); // 9 answers
    expect(cp(SAT, ketik(TUE, 8, 3)).syarat[1].ok).toBe(false); // 73%
    expect(cp(SAT, [mp(FRI), ringkasan(SAT, 40)]).syarat[3].ok).toBe(false);
    expect(cp(SAT, [mp(FRI), ringkasan(SAT, 40)]).perluRingkasan).toBe(true);
    expect(
      cp(SAT, [mp(FRI, { misi: false }), ringkasan(SAT, 70)]).syarat[3].ok,
    ).toBe(false);
    expect(
      cp(SAT, [mp(FRI, { scenarioId: "standup" }), ringkasan(SAT, 70)])
        .syarat[3].ok,
    ).toBe(false);
  });

  it("only this level and week, and only since 'Mulai ulang minggu ini'", () => {
    const evidence = [
      tes(SAT, 18),
      ketik(TUE, 10, 0),
      dikte(WED, 90),
      mp(FRI),
      ringkasan(SAT, 70),
    ].flat();
    expect(cp(SAT, evidence).lulus).toBe(true);
    expect(cp(SAT, evidence, { minggu: 4 }).lulus).toBe(false);
    const r = cp(SAT, evidence, { mulai: THU });
    expect(r.syarat.find((s) => s.id === "grammar")?.ok).toBe(false);
    expect(r.syarat.find((s) => s.id === "menyimak")?.ok).toBe(false);
  });

  it("a menu off: dropped, all but one of the rest", () => {
    const menus = ALL.filter((m) => m !== "roleplay");
    const r = cp(SAT, [tes(SAT, 18), ketik(TUE, 10, 0)].flat(), { menus });
    expect(r.syarat.map((s) => s.id)).toEqual([
      "kosakata",
      "grammar",
      "menyimak",
    ]);
    expect(r.lulus).toBe(true);
  });
});
