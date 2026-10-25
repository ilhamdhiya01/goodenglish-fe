// Latihan soal per sub-tab Panduan grammar. Bank soal tiap topik ada di data/practice/<topik>.json
// dan baru dimuat saat sub-tabnya dibuka. Id set dipakai sebagai kunci progres (ask-practice store),
// jadi jangan diganti setelah dirilis.

export type PracticeTopic =
  "whb" | "irr" | "prep" | "bedo" | "tense" | "conj" | "thit";

/** [id set, nomor, judul, keterangan] */
export type PracticeSet = [string, string, string, string];

export interface PracticeTopicDef {
  intro: string;
  sets: PracticeSet[];
}

export const PRACTICE: Record<PracticeTopic, PracticeTopicDef> = {
  whb: {
    intro:
      "Isi bagian kosong sesuai konteks dan arti Indonesianya. Mulai dari Set 1, lalu naik. Set 7 mencampur semua bentuk.",
    sets: [
      [
        "whb1",
        "SET 1",
        "Was / were",
        "Sekarang (am / is / are) atau lampau (was / were), dan was vs were sesuai subjek.",
      ],
      [
        "whb2",
        "SET 2",
        "Have = punya",
        "Have vs has, dan negatif/tanya pakai do / does: I don't have, Does she have …?",
      ],
      [
        "whb3",
        "SET 3",
        "Have + V3",
        '"Sudah" yang hasilnya terasa sekarang vs kejadian lampau yang waktunya jelas.',
      ],
      [
        "whb4",
        "SET 4",
        "Have been",
        "Dari dulu sampai sekarang (for / since), pernah ke (been to), vs was dan am / is.",
      ],
      [
        "whb5",
        "SET 5",
        "Have been + -ing",
        "Kegiatan yang sudah lama dan masih berlangsung.",
      ],
      [
        "whb6",
        "SET 6",
        "Had + V3 / had been",
        "Sudah terjadi sebelum kejadian lampau lain.",
      ],
      [
        "whb7",
        "SET 7",
        "Campuran",
        "Semua bentuk dicampur. Tentukan sendiri dari konteksnya.",
      ],
    ],
  },
  irr: {
    intro:
      "Isi bagian kosong dengan bentuk kata kerja yang tepat. Lihat dulu strukturnya: berdiri sendiri (V2), setelah did (V1), atau setelah have / has / had (V3).",
    sets: [
      [
        "irr1",
        "SET 1",
        "V2 untuk lampau",
        "Kalimat lampau positif: went, bought, wrote. Bukan goed, bukan gone.",
      ],
      [
        "irr2",
        "SET 2",
        "V3 setelah have / had",
        "Have / has / had + V3, dan bentuk pasif (was written).",
      ],
      [
        "irr3",
        "SET 3",
        "V1, V2, atau V3?",
        "did + V1, V2 sendiri, atau have + V3. Strukturnya yang menentukan.",
      ],
      [
        "irr4",
        "SET 4",
        "Pola yang menjebak",
        "Tiga bentuk sama (cut, put, hit) dan V1 = V3 (come, become, run).",
      ],
      ["irr5", "SET 5", "Campuran", "Semua pola dan struktur dicampur."],
    ],
  },
  prep: {
    intro:
      "Pilih in, on, at, atau tanpa preposisi (—). Ingat urutannya: in (luas) → on (permukaan / hari) → at (titik / jam).",
    sets: [
      [
        "prep1",
        "SET 1",
        "Waktu",
        "in July · on Monday · on May 5th · at 8 o'clock · at night · in the morning.",
      ],
      [
        "prep2",
        "SET 2",
        "Tempat",
        "in Surabaya · on the wall · at the bus stop, dan in vs at untuk gedung yang sama.",
      ],
      [
        "prep3",
        "SET 3",
        "Kendaraan & ungkapan tetap",
        "in a taxi · on foot · on time vs in time · at first · at least.",
      ],
      [
        "prep4",
        "SET 4",
        "Tanpa preposisi & campuran",
        "next week, last year, tomorrow, get home: tanpa in / on / at.",
      ],
    ],
  },
  bedo: {
    intro:
      "Tentukan sendiri: pakai be (am / is / are) atau do (do / does), lihat kata setelah subjek.",
    sets: [
      [
        "bedo1",
        "SET 1",
        "Kalimat positif",
        "Be + sifat / benda / tempat vs kata kerja biasa: I agree, bukan I am agree.",
      ],
      [
        "bedo2",
        "SET 2",
        "Kalimat negatif",
        "I'm not busy vs I don't like: negatif ikut kata bantunya.",
      ],
      [
        "bedo3",
        "SET 3",
        "Kalimat tanya",
        "Are you …? vs Do you …? Is she …? vs Does she …?",
      ],
      [
        "bedo4",
        "SET 4",
        "Sedang vs kebiasaan",
        "Be + -ing untuk yang sedang terjadi, tanpa be untuk kebiasaan, dan campuran.",
      ],
    ],
  },
  tense: {
    intro:
      "Isi bagian kosong dengan tense yang tepat. Cari penanda waktunya dulu: every day, now, yesterday, tomorrow.",
    sets: [
      [
        "tense1",
        "SET 1",
        "Kebiasaan vs sedang",
        "Present simple (every day) vs present continuous (now).",
      ],
      [
        "tense2",
        "SET 2",
        "Lampau vs sekarang",
        "Past simple (yesterday, ago) vs present.",
      ],
      [
        "tense3",
        "SET 3",
        "Will vs going to",
        "Keputusan spontan (will) vs rencana / bukti yang terlihat (going to).",
      ],
      [
        "tense4",
        "SET 4",
        "Campuran",
        "Semua tense inti dicampur. Tentukan dari penanda waktunya.",
      ],
    ],
  },
  thit: {
    intro:
      "Pilih bentuk yang tepat: this is untuk menunjuk / memperkenalkan, it is untuk membicarakan lagi atau cuaca / waktu / jarak, dan Is it …? untuk bertanya.",
    sets: [
      [
        "thit1",
        "SET 1",
        "This / that / these / those",
        "Menunjuk dan memperkenalkan: dekat vs jauh, satu vs banyak.",
      ],
      [
        "thit2",
        "SET 2",
        "It is",
        "Membicarakan lagi benda yang sudah disebut, dan it untuk cuaca, waktu, jarak.",
      ],
      [
        "thit3",
        "SET 3",
        "Tanya & jawaban pendek",
        "Is it …? / Is this …? dan Yes, it is. / No, it isn't.",
      ],
      [
        "thit4",
        "SET 4",
        "Campuran",
        "Semua bentuk dicampur. Tentukan dari konteksnya.",
      ],
    ],
  },
  conj: {
    intro:
      "Pilih kata sambung yang cocok dengan polanya: diikuti kalimat lengkap (S + V) atau kata benda / -ing.",
    sets: [
      [
        "conj1",
        "SET 1",
        "Because / because of / so",
        "because + kalimat, because of + kata benda, so untuk akibat.",
      ],
      [
        "conj2",
        "SET 2",
        "Although / despite / however",
        'although + kalimat, despite + kata benda / -ing, tanpa "but" ganda.',
      ],
      [
        "conj3",
        "SET 3",
        "While / during, so that / to",
        "while + kalimat, during + kata benda; so that + kalimat, to + kata kerja.",
      ],
      [
        "conj4",
        "SET 4",
        "Campuran",
        "Ditambah if / unless / as soon as / before / after.",
      ],
    ],
  },
};
