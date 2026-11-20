import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CHECKPOINT,
  type Durasi,
  type Hari,
  LANGKAH,
  RENCANA,
  type Syarat,
  type VarianLangkah,
} from "@/const/rencana.config";

import { evaluasiCheckpoint, evaluasiHari } from "../evaluasi";
import { JENIS_AKTIVITAS, type JenisAktivitas } from "../rencana.contract";

// The contract between Rencana and the menus: every kind of activity a step
// or the checkpoint reads must be sent by some menu, from the file the
// contract names. A menu that is rebuilt later only has to keep sending it.

const syaratOf = (v: Pick<VarianLangkah, "selesaiBila" | "cadangan">) => [
  ...(v.selesaiBila ?? []),
  ...(v.cadangan?.selesaiBila ?? []),
];

const dipakai = new Set<JenisAktivitas>();
for (const l of LANGKAH) {
  const all: Syarat[] = [
    ...syaratOf(l),
    ...Object.values(l.perHari ?? {}).flatMap((v) => syaratOf(v!)),
  ];
  all.forEach((s) => {
    dipakai.add(s.jenis);
    if (s.butuh) dipakai.add(s.butuh.jenis);
  });
}
CHECKPOINT.forEach((c) => c.jenis.forEach((j) => dipakai.add(j)));

const root = resolve(__dirname, "../../..");

describe("kontrak catatan aktivitas", () => {
  it("every kind the steps and checkpoint read has a sender", () => {
    for (const j of dipakai) {
      expect(JENIS_AKTIVITAS[j], j).toBeDefined();
      expect(JENIS_AKTIVITAS[j].berkas.length, j).toBeGreaterThan(0);
    }
  });

  it("each sender file really reports that kind through laporAktivitas", () => {
    for (const [jenis, def] of Object.entries(JENIS_AKTIVITAS)) {
      for (const berkas of def.berkas) {
        const src = readFileSync(resolve(root, berkas), "utf8");
        expect(src, `${berkas} → laporAktivitas`).toContain("laporAktivitas");
        expect(src, `${berkas} → "${jenis}"`).toContain(`"${jenis}"`);
      }
    }
  });

  it("with no reports at all nothing is done, on any day or duration, without errors", () => {
    const MON = Date.UTC(2026, 10, 16) / 86_400_000;
    for (let d = 0; d < 7; d++)
      for (const durasi of RENCANA.durasi as readonly Durasi[]) {
        const r = evaluasiHari({
          laporan: [],
          T: MON + d,
          menus: [
            "review",
            "vocab",
            "reading",
            "listening",
            "scenario",
            "grammar",
            "ai",
            "roleplay",
          ],
          durasi,
          level: "pre",
          minggu: 1,
          topik: "r",
          skenario: "standup",
          mainPeranTersedia: true,
        });
        expect(r.selesai).toBe(0);
        expect(r.streak).toBe(false);
        expect(r.hari).toBe(
          new Date((MON + d) * 86_400_000).getUTCDay() as Hari,
        );
      }
    const cp = evaluasiCheckpoint({
      laporan: [],
      T: MON,
      menus: ["vocab", "grammar", "listening", "roleplay"],
      level: "pre",
      minggu: 1,
      topik: "r",
      skenario: "standup",
    });
    expect(cp.lulus).toBe(false);
  });

  it("one menu reporting nothing only leaves its own steps undone", () => {
    const MON = Date.UTC(2026, 10, 16) / 86_400_000;
    // Everything except Menyimak/Bacaan reported: Masuk and Lancar stay open.
    const lap = (jenis: JenisAktivitas, data: object, o = {}) => ({
      id: Math.random().toString(36),
      jenis,
      menu: "plan" as const,
      level: "pre",
      week: 1,
      day: MON,
      data,
      ...o,
    });
    const laporan = [
      ...Array.from({ length: 20 }, () =>
        lap("kartu_diulang", { kartu: "kata", benar: true }),
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        lap("kata_ditandai", { kunci: `1:w:${i}`, sisa: 5 }),
      ),
      ...Array.from({ length: 10 }, () =>
        lap("jawaban_grammar", {
          topik: "r",
          set: "r1",
          tahap: "mc",
          benar: true,
        }),
      ),
      ...Array.from({ length: 3 }, () =>
        lap("kalimat_dicek", { benar: true, sumber: "rencana" }),
      ),
    ];
    const r = evaluasiHari({
      laporan: laporan as never,
      T: MON,
      menus: ["review", "vocab", "reading", "listening", "grammar", "ai"],
      durasi: 25,
      level: "pre",
      minggu: 1,
      topik: "r",
      skenario: "standup",
      mainPeranTersedia: false,
    });
    const open = r.langkah.filter((l) => !l.selesai).map((l) => l.id);
    expect(open).toEqual(["masuk", "lancar"]);
  });
});
