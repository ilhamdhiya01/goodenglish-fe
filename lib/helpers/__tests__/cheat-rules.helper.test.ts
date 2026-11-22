import { describe, expect, it } from "vitest";

import { CHEAT_RULE_IDS, ruleId, ruleOf } from "../cheat-rules.helper";

// Mirrors goodenglish-be src/common/cheat-rules.ts: the AI can only pick a
// rule listed there, and only ids known here are kept. Update both together.
const BACKEND_RULE_IDS = [
  "aturan-dasar/be-tanpa-kata-kerja",
  "aturan-dasar/jangan-be-dobel",
  "aturan-dasar/setelah-be",
  "aturan-dasar/setelah-kata-bantu",
  "aturan-dasar/v2-sendiri",
  "am-is-are/benda-jamak-they",
  "tense/he-she-it-s",
  "tense/being-sifat",
  "tense/i-wish",
  "sudah-belum/have-v3",
  "sudah-belum/yet",
  "sudah-belum/already",
  "pasif/be-ikut-waktu",
  "pasif/aktif-atau-pasif",
  "pertanyaan/preposisi-di-akhir",
  "pertanyaan/hari-jam-tanggal",
  "a-an-the/satu-negatif",
  "preposisi-lain/bahasa-in",
  "preposisi-lain/good-at",
  "preposisi-lain/keadaan-in",
  "preposisi-lain/sifat-preposisi",
  "kata-tertukar/like-looks-like",
  "kata-tertukar/look-at",
  "kata-tertukar/see-hear-ing",
  "kata-tertukar/matter",
  "kata-tertukar/must-be",
  "waktu/anymore",
  "urutan-kata/s-kata-kerja-utama",
  "urutan-kata/something-sifat",
];

describe("Cheat sheet rules", () => {
  it("every rule has its own id, the same list as the backend", () => {
    expect(new Set(CHEAT_RULE_IDS).size).toBe(CHEAT_RULE_IDS.length);
    expect([...CHEAT_RULE_IDS].sort()).toEqual([...BACKEND_RULE_IDS].sort());
  });

  it("an id names its own section", () => {
    for (const id of CHEAT_RULE_IDS)
      expect(id.startsWith(ruleOf(id)!.section.id + "/")).toBe(true);
  });

  it("finds a rule by id and refuses unknown ones", () => {
    expect(ruleOf("tense/he-she-it-s")?.rule.title).toMatch(/he \/ she \/ it/);
    expect(ruleOf("made/up")).toBeNull();
    expect(ruleOf(undefined)).toBeNull();
    expect(ruleId(" tense/he-she-it-s ")).toBe("tense/he-she-it-s");
    expect(ruleId("none")).toBeUndefined();
  });
});
