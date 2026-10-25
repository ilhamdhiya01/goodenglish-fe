// Kata sambung per fungsi, per level. CORE = yang wajib dikuasai dulu.

type ConjGroupDef = [string, string, string[]];

export const CONJ: ConjGroupDef[] = [
  [
    "Menambah",
    "Menyambung ide yang searah",
    [
      "and",
      "also",
      "too",
      "as well",
      "in addition",
      "besides",
      "as well as",
      "not only … but also",
    ],
  ],
  [
    "Kontras",
    "Dua hal yang berlawanan",
    [
      "but",
      "although",
      "however",
      "even though",
      "despite",
      "instead",
      "whereas",
      "on the other hand",
      "in contrast",
    ],
  ],
  [
    "Alasan & akibat",
    "Kenapa, dan apa hasilnya",
    ["because", "so", "as", "therefore", "as a result", "otherwise"],
  ],
  ["Tujuan", "Supaya / untuk apa", ["so that", "in order to"]],
  [
    "Urutan",
    "Menceritakan langkah atau kejadian",
    [
      "first",
      "then",
      "after that",
      "finally",
      "firstly",
      "secondly",
      "lastly",
      "in the end",
      "before",
      "after",
      "as soon as",
    ],
  ],
  [
    "Waktu",
    "Kapan sesuatu terjadi",
    [
      "when",
      "while",
      "during",
      "since",
      "for",
      "by the time",
      "already",
      "yet",
    ],
  ],
  [
    "Syarat",
    "Kalau … maka …",
    ["if", "unless", "as long as", "in case", "provided that"],
  ],
  [
    "Membandingkan",
    "Mirip atau berbeda",
    ["than", "compared to", "similarly", "rather than", "as if"],
  ],
  [
    "Contoh & kesimpulan",
    "Memberi contoh, lalu menutup",
    ["for example", "such as", "in conclusion"],
  ],
  [
    "Pilihan",
    "Memilih atau menolak dua hal",
    ["or", "either … or", "neither … nor"],
  ],
  ["Keterangan", "Menjelaskan kata benda sebelumnya", ["which", "that"]],
];
export const CORE: Record<string, 1> = {
  and: 1,
  but: 1,
  because: 1,
  so: 1,
  first: 1,
  then: 1,
  when: 1,
  if: 1,
  or: 1,
};

export const CONJ_L: Record<string, ConjGroupDef[]> = {
  beginner: [
    ["Menambah", "Menyambung dua hal", ["and", "too", "also"]],
    ["Kontras", "Berlawanan", ["but"]],
    ["Alasan & akibat", "Kenapa, hasilnya apa", ["because", "so"]],
    [
      "Urutan",
      "Langkah demi langkah",
      ["first", "next", "then", "after", "before"],
    ],
    ["Waktu & syarat", "Kapan / jika", ["when", "if", "maybe"]],
    ["Pilihan", "Atau", ["or"]],
  ],
  inter: [
    [
      "Waktu & urutan",
      "Mana yang lebih dulu",
      [
        "by the time",
        "once",
        "until",
        "after",
        "lately",
        "recently",
        "so far",
        "meanwhile",
      ],
    ],
    [
      "Kontras halus",
      "Berlawanan, lebih formal",
      [
        "nevertheless",
        "nonetheless",
        "whereas",
        "on the contrary",
        "admittedly",
        "arguably",
      ],
    ],
    [
      "Akibat & tambahan formal",
      "Untuk email dan laporan",
      [
        "consequently",
        "moreover",
        "furthermore",
        "hence",
        "thus",
        "in light of",
      ],
    ],
    [
      "Sebab (formal)",
      "Karena, versi berita",
      ["due to", "owing to", "as a consequence", "in response to", "amid"],
    ],
    [
      "Hipotetis",
      "Kalau seandainya",
      ["if I were", "otherwise", "supposing", "in that case"],
    ],
    [
      "Melaporkan ucapan",
      "Bahwa / apakah",
      ["that", "whether", "if", "apparently"],
    ],
    [
      "Keterangan",
      "Menjelaskan kata benda",
      ["who", "which", "whose", "where", "whom"],
    ],
  ],
  upper: [
    [
      "Kondisional lanjutan",
      "Andai / kalau bukan karena",
      [
        "had I known",
        "were it not for",
        "but for",
        "if only",
        "would rather",
        "as though",
      ],
    ],
    [
      "Inversi & penekanan",
      "Formal, dramatis",
      [
        "not only … but also",
        "no sooner … than",
        "hardly … when",
        "seldom",
        "under no circumstances",
        "indeed",
        "let alone",
        "not to mention",
        "above all",
        "in essence",
      ],
    ],
    [
      "Konsesi halus",
      "Meskipun, dengan catatan",
      ["albeit", "notwithstanding", "granted", "that said", "insofar as"],
    ],
    [
      "Fokus (cleft)",
      "Yang penting adalah …",
      ["what matters is", "the reason … is", "the thing is", "it's … that"],
    ],
    [
      "Percakapan",
      "Ekor kalimat santai",
      ["isn't it", "right?", "though", "anyway"],
    ],
    [
      "Narasi",
      "Waktu dalam cerita",
      ["the moment", "by then", "until then", "in the meantime"],
    ],
  ],
};
export const CORE_L: Record<string, Record<string, 1>> = {
  beginner: {
    and: 1,
    but: 1,
    because: 1,
    so: 1,
    then: 1,
    when: 1,
    if: 1,
    or: 1,
  },
  inter: {
    "by the time": 1,
    nevertheless: 1,
    consequently: 1,
    "due to": 1,
    "if I were": 1,
    that: 1,
    who: 1,
  },
  upper: {
    "had I known": 1,
    "not only … but also": 1,
    albeit: 1,
    "what matters is": 1,
    "isn't it": 1,
    "the moment": 1,
  },
};

// Pasangan arti-mirip-beda-pola: kiri diikuti kalimat lengkap, kanan kata benda / -ing.
export const CONJ_PATTERN: [string, string, string, string, string, string][] =
  [
    [
      "although / even though",
      "+ kalimat (S + V)",
      "Although it was raining, we went out.",
      "despite / in spite of",
      "+ kata benda / -ing",
      "Despite the rain, we went out.",
    ],
    [
      "because",
      "+ kalimat (S + V)",
      "I stayed home because I was sick.",
      "because of / due to",
      "+ kata benda",
      "I stayed home because of my illness.",
    ],
    [
      "while",
      "+ kalimat (S + V)",
      "I fell asleep while I was watching TV.",
      "during",
      "+ kata benda",
      "I fell asleep during the movie.",
    ],
    [
      "so that",
      "+ kalimat (S + can/will)",
      "I left early so that I could catch the bus.",
      "in order to / to",
      "+ kata kerja dasar",
      "I left early to catch the bus.",
    ],
  ];

// [soal, jawaban, alasan]
export const CONJ_DRILL: [string, string, string][] = [
  [
    "I was tired. I finished the report. (although)",
    "Although I was tired, I finished the report.",
    "although + kalimat, tanpa but",
  ],
  [
    "It rained. We cancelled the trip. (so)",
    "It rained, so we cancelled the trip.",
    "so di tengah, setelah koma",
  ],
  [
    "The traffic was bad. I was late. (because of)",
    "I was late because of the bad traffic.",
    "because of + kata benda",
  ],
  [
    "She studied hard. She wanted to pass. (so that)",
    "She studied hard so that she could pass.",
    "so that + kalimat",
  ],
  [
    "The hotel is cheap. It is far from the city. (however)",
    "The hotel is cheap. However, it's far from the city.",
    "however di awal kalimat baru + koma",
  ],
  [
    "I was cooking. My phone rang. (while)",
    "My phone rang while I was cooking.",
    "while + kalimat continuous",
  ],
  [
    "You hurry. You will miss the train. (unless)",
    "You'll miss the train unless you hurry.",
    "unless = if … not",
  ],
  [
    "He was sick. He came to work. (despite)",
    "Despite being sick, he came to work.",
    "despite + -ing / kata benda",
  ],
];
