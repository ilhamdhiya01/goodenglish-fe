import type { Detail } from "@/lib/types/grammar.types";

// Sub-tab "Was / Have / Been": was/were, have/has (punya & kata bantu), have been, had been, dan versi -ing-nya.
export const WHB_DETAIL: Detail = {
  label: "WAS · HAVE · BEEN",
  title: "Tanya dulu: titik acuannya kapan?",
  idea: 'Bahasa Indonesia memakai kata kerja yang sama lalu menambah keterangan: "tadi", "sudah", "sejak", "pernah". Bahasa Inggris mengganti bentuk kata kerjanya sesuai hubungan kejadian dengan titik acuan. Selesai di masa lampau → was. Dimulai dulu dan masih terasa sampai sekarang → have been. Sudah terjadi sebelum kejadian lampau lain → had been. Kata have sendiri punya dua tugas: arti "punya", dan kata bantu untuk bentuk "sudah" (have + V3).',
  steps: [
    {
      t: "Was / were → keadaan yang sudah selesai di masa lampau",
      b: "Was / were adalah bentuk lampau dari am / is / are. Was untuk I, he, she, it. Were untuk you, we, they. Dipakai kalau waktunya sudah lewat dan selesai: yesterday, last night, in 2019, when I was a kid. Negatif: wasn't / weren't. Tanya: Was she …? / Were you …?",
      ex: [
        ["I was at the office yesterday.", "Aku di kantor kemarin."],
        ["They were late this morning.", "Mereka terlambat tadi pagi."],
        ["Was she sick last week?", "Apa dia (pr) sakit minggu lalu?"],
      ],
    },
    {
      t: 'Have / has → arti "punya" (kata kerja biasa)',
      b: 'Have untuk I, you, we, they. Has untuk he, she, it. Sebagai "punya", have adalah kata kerja biasa, jadi negatif dan tanyanya memakai do / does: I don\'t have, Does she have …? Have juga dipakai untuk makan dan minum (have lunch) serta keluhan badan (have a headache).',
      ex: [
        ["I have two kids.", "Aku punya dua anak."],
        ["She doesn't have a car.", "Dia (pr) tidak punya mobil."],
        ["Do you have a minute?", "Kamu ada waktu sebentar?"],
      ],
    },
    {
      t: 'Have / has + V3 → "sudah", hasilnya terasa sekarang (present perfect)',
      b: "Di sini have bukan \"punya\", melainkan kata bantu yang diikuti bentuk ke-3 kata kerja (V3). Pakai untuk hal yang sudah terjadi tapi waktunya tidak disebut, karena yang penting hasilnya sekarang. Juga untuk pengalaman (ever, never) dan kabar baru (just, already, yet). Negatif: haven't / hasn't + V3. Kalau waktunya disebut (yesterday, last week), kembali ke past simple.",
      ex: [
        [
          "I've finished the report.",
          "Laporannya sudah selesai (sekarang sudah ada).",
        ],
        [
          "She has never tried durian.",
          "Dia (pr) belum pernah mencoba durian.",
        ],
        ["Have you eaten yet?", "Kamu sudah makan?"],
      ],
    },
    {
      t: "Have / has been → keadaan dari dulu sampai sekarang, atau pernah ke suatu tempat",
      b: "Been adalah V3 dari be. Jadi have been = present perfect dari am / is / are. Ada dua pemakaian utama. (1) Keadaan yang dimulai di masa lalu dan masih berlangsung sekarang, biasanya dengan for (lamanya) atau since (titik mulainya). (2) Pengalaman pernah ke suatu tempat: have been to + tempat (sudah pulang lagi).",
      ex: [
        [
          "I've been sick since Monday.",
          "Aku sakit sejak Senin (sampai sekarang masih).",
        ],
        [
          "We've been friends for ten years.",
          "Kami sudah berteman selama sepuluh tahun.",
        ],
        ["Have you ever been to Japan?", "Kamu pernah ke Jepang?"],
      ],
    },
    {
      t: "Have / has been + -ing → kegiatan yang sudah lama dan masih berlangsung",
      b: "Kalau yang dibicarakan kegiatan (bukan keadaan) dan kamu ingin menekankan lamanya, pakai have been + kata kerja -ing (present perfect continuous). Penanda: for, since, all day, lately, How long …? Biasanya kegiatannya masih berjalan, atau baru saja berhenti dan bekasnya masih terlihat.",
      ex: [
        [
          "I've been waiting for 20 minutes.",
          "Aku sudah menunggu 20 menit (dan masih menunggu).",
        ],
        [
          "How long have you been learning English?",
          "Sudah berapa lama kamu belajar bahasa Inggris?",
        ],
        ["It's been raining all day.", "Hujan terus seharian."],
      ],
    },
    {
      t: 'Had + V3 / had been → "sudah" sebelum kejadian lampau lain (past perfect)',
      b: "Bayangkan kamu sedang bercerita tentang masa lalu, lalu mundur satu langkah lagi. Had + V3 dipakai untuk kejadian yang terjadi lebih dulu sebelum titik lampau itu. Had been = keadaan yang sudah berlangsung sampai titik lampau itu. Had sama untuk semua subjek. Tanpa had, urutannya bisa berubah arti.",
      ex: [
        [
          "When I arrived, the meeting had already started.",
          "Waktu aku datang, rapatnya sudah mulai.",
        ],
        [
          "He had been sick for a week before he saw a doctor.",
          "Dia (lk) sudah sakit seminggu sebelum ke dokter.",
        ],
        [
          "I had never been on a plane before 2015.",
          "Sebelum 2015 aku belum pernah naik pesawat.",
        ],
      ],
    },
    {
      t: "Had been + -ing → kegiatan yang sudah lama berlangsung sampai titik lampau",
      b: "Versi -ing dari had been (past perfect continuous). Dipakai saat bercerita untuk menjelaskan kegiatan yang sudah berjalan lama ketika sesuatu terjadi, sering untuk menjelaskan sebab (kenapa capek, kenapa basah). Bandingkan dengan have been + -ing: titik acuannya sekarang, sedangkan had been + -ing titik acuannya di masa lampau.",
      ex: [
        [
          "I had been waiting for an hour when the bus finally came.",
          "Aku sudah menunggu sejam waktu busnya akhirnya datang.",
        ],
        [
          "They had been driving all night, so they were exhausted.",
          "Mereka sudah menyetir semalaman, jadi mereka kelelahan.",
        ],
        [
          "Her eyes were red. She had been crying.",
          "Matanya merah. Dia (pr) habis menangis.",
        ],
      ],
    },
  ],
  traps: [
    [
      "I am here since 2020.",
      "I've been here since 2020.",
      "since / for sampai sekarang → have been, bukan am / is / are",
    ],
    [
      "I have been to Bali last year.",
      "I went to Bali last year.",
      "waktunya disebut (last year) → past simple",
    ],
    [
      "I already eat.",
      "I've already eaten.",
      '"sudah" yang hasilnya terasa sekarang → have + V3',
    ],
    [
      "I haven't a car.",
      "I don't have a car.",
      "have = punya → negatif pakai do",
    ],
    [
      "She was been sick.",
      "She was sick. / She has been sick.",
      "was dan been tidak dipakai berdua",
    ],
    [
      "When I arrived, the meeting already started.",
      "When I arrived, the meeting had already started.",
      "terjadi sebelum titik lampau lain → had + V3",
    ],
    [
      "I've been waiting since two hours.",
      "I've been waiting for two hours.",
      "lamanya → for · titik mulainya → since",
    ],
  ],
  summary:
    "Selesai di masa lampau → was. Dari dulu sampai sekarang → have been. Sebelum kejadian lampau lain → had been. Tambah -ing kalau yang ditekankan lamanya kegiatan.",
  drill: [
    [
      "Aku sakit kemarin.",
      "I was sick yesterday.",
      "yesterday, sudah selesai → was",
    ],
    [
      "Aku sakit sejak Senin (sekarang masih sakit).",
      "I've been sick since Monday.",
      "since, masih berlangsung → have been",
    ],
    [
      "Kami sudah berteman selama sepuluh tahun.",
      "We've been friends for ten years.",
      "for, sampai sekarang → have been",
    ],
    [
      "Kamu pernah ke Bali?",
      "Have you ever been to Bali?",
      "pengalaman pernah ke tempat → have been to",
    ],
    ["Dia (pr) punya dua kucing.", "She has two cats.", "punya → has"],
    [
      "Aku sudah selesai mengerjakan PR.",
      "I've finished my homework.",
      "sudah, hasilnya sekarang → have + V3",
    ],
    [
      "Aku sudah menunggu 30 menit.",
      "I've been waiting for 30 minutes.",
      "kegiatan lama, masih berlangsung → have been + -ing",
    ],
    [
      "Waktu aku sampai, filmnya sudah mulai.",
      "When I arrived, the movie had already started.",
      "sebelum titik lampau → had + V3",
    ],
    [
      "Dia (lk) sudah sakit seminggu sebelum ke dokter.",
      "He had been sick for a week before he saw a doctor.",
      "keadaan sampai titik lampau → had been",
    ],
    [
      "Mereka sudah menyetir semalaman, jadi mereka capek.",
      "They had been driving all night, so they were tired.",
      "kegiatan lama sampai titik lampau → had been + -ing",
    ],
  ],
};

// Garis waktu. Posisi dalam persen sepanjang sumbu: 0 = dulu sekali, PAST = titik lampau, 100 = sekarang.
export const WHB_PAST = 55;
// [bentuk, contoh, dari %, sampai %, panah sampai sekarang?, keterangan, warna]
export const WHB_TIMELINE: [
  string,
  string,
  number,
  number,
  boolean,
  string,
  string,
][] = [
  [
    "was / were",
    "I was sick yesterday.",
    58,
    72,
    false,
    "selesai di masa lampau",
    "#B42318",
  ],
  [
    "have been",
    "I've been sick since Monday.",
    72,
    100,
    true,
    "mulai dulu, masih sampai sekarang",
    "#1F6B57",
  ],
  [
    "have been + -ing",
    "I've been waiting for 20 minutes.",
    82,
    100,
    true,
    "kegiatan, masih berjalan",
    "#1F6B57",
  ],
  [
    "had + V3",
    "The meeting had started.",
    30,
    34,
    false,
    "terjadi lebih dulu dari titik lampau",
    "#1F4E86",
  ],
  [
    "had been",
    "He had been sick for a week.",
    18,
    55,
    false,
    "keadaan sampai titik lampau",
    "#1F4E86",
  ],
  [
    "had been + -ing",
    "I had been waiting for an hour.",
    30,
    55,
    false,
    "kegiatan sampai titik lampau",
    "#1F4E86",
  ],
];

// Satu kalimat lintas bentuk; <b> menandai bagian yang berubah. [kalimat, bentuk, warna]
export const WHB_ROWS: [string, string, string][] = [
  ["She <b>is</b> sick today.", "Present simple (be)", "#7A5A00"],
  ["She <b>was</b> sick yesterday.", "Past simple (be)", "#B42318"],
  ["She <b>has been</b> sick since Monday.", "Present perfect (be)", "#1F6B57"],
  [
    "She <b>had been</b> sick for a week before she saw a doctor.",
    "Past perfect (be)",
    "#1F4E86",
  ],
  [
    "She <b>has been working</b> here since 2020.",
    "Present perfect continuous",
    "#1F6B57",
  ],
  [
    "She <b>had been working</b> there for five years when the company closed.",
    "Past perfect continuous",
    "#1F4E86",
  ],
];

// Have sebagai "punya" vs kata bantu. [punya, kata bantu (+ V3), keterangan baris]
export const WHB_HAVE: [string, string, string][] = [
  ["I have a car.", "I've bought a car.", "positif"],
  ["I don't have a car.", "I haven't bought a car.", "negatif"],
  ["Do you have a car?", "Have you bought a car?", "tanya"],
  ["She has a cold.", "She's had a cold since Friday.", "he / she / it → has"],
];

// Pasangan yang sering tertukar: [kalimat 1, arti, kalimat 2, arti]
export const WHB_PAIRS: [string, string, string, string][] = [
  [
    "I've been to Bali.",
    "pernah ke Bali (sudah pulang)",
    "She's gone to Bali.",
    "sedang pergi ke Bali (belum kembali)",
  ],
  [
    "I was here for two years.",
    "dulu dua tahun di sini (sekarang sudah tidak)",
    "I've been here for two years.",
    "sudah dua tahun, dan masih di sini",
  ],
  [
    "When I arrived, she left.",
    "dia pergi setelah aku datang",
    "When I arrived, she had left.",
    "dia sudah pergi sebelum aku datang",
  ],
  [
    "I've read the book.",
    "bukunya sudah selesai dibaca",
    "I've been reading the book.",
    "sedang membaca, belum tentu selesai",
  ],
];
