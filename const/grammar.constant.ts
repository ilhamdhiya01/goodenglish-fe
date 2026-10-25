import type { Detail } from "@/lib/types/grammar.types";
import type { Tense } from "@/lib/types/vocab.types";

// Tense inti per level (dicocokkan dengan nama tense di data, huruf kecil, 'includes').
export const CORE_TENSES: Record<string, string[]> = {
  beginner: ["be", "there is", "present simple", "past simple", "future"],
  pre: ["present simple", "past simple", "present continuous", "future"],
  inter: ["present perfect", "past perfect", "conditional", "reported"],
  upper: ["conditional", "inversion", "mixed", "wish"],
};

export const TENSE_TIPS: Record<string, [string, string][]> = {
  beginner: [
    [
      "1 · Siapa / apa?",
      'Menyebut nama, pekerjaan, tempat, perasaan → <b>am / is / are</b>. Menyebut "ada" → <b>there is / are</b>. Menyebut punya → <b>have / has</b>.',
    ],
    [
      "2 · Kapan?",
      "Kebiasaan → <b>present simple</b> (I eat). Sudah lewat → <b>past simple</b> (I ate). Nanti → <b>will / going to</b>.",
    ],
    [
      "3 · Bisa / perintah?",
      "Kemampuan atau izin → <b>can</b>. Menyuruh atau memberi arah → kata kerja dasar (<b>Turn left</b>).",
    ],
  ],
  pre: [
    [
      "1 · Kapan?",
      "Sudah lewat → <b>past</b>. Sekarang / biasanya → <b>present</b>. Nanti → <b>future</b>.",
    ],
    [
      "2 · Kebiasaan atau sedang?",
      "Kebiasaan / fakta → <b>simple</b> (I work). Sedang berlangsung → <b>continuous</b> (I'm working).",
    ],
    [
      "3 · Rencana atau spontan?",
      "Sudah direncanakan → <b>going to</b>. Diputuskan saat itu juga / janji → <b>will</b>.",
    ],
  ],
  inter: [
    [
      "1 · Masih berlanjut?",
      "Mulai dulu, masih sekarang, tekankan durasi → <b>present perfect continuous</b>. Dua kejadian lampau, mana yang lebih dulu → <b>past perfect</b>.",
    ],
    [
      "2 · Nyata atau khayalan?",
      "Kemungkinan nyata → <b>first conditional</b>. Tidak nyata sekarang → <b>second conditional</b> (If I were …).",
    ],
    [
      "3 · Siapa yang bicara / bertindak?",
      "Mengulang ucapan orang → <b>reported speech</b> (tense mundur). Pelaku tidak penting → <b>passive</b>. Menilai masa lalu → <b>should / could have</b>.",
    ],
  ],
  upper: [
    [
      "1 · Waktu sebab dan akibat berbeda?",
      "Sebab dulu, akibat sekarang (atau sebaliknya) → <b>mixed conditional</b>. Penyesalan → <b>wish / if only</b>.",
    ],
    [
      "2 · Mau menekankan apa?",
      "Satu bagian kalimat → <b>cleft</b> (What matters is …). Nada dramatis / formal → <b>inversion</b> (Never have I …).",
    ],
    [
      "3 · Konteksnya?",
      "Bercerita → campur <b>narrative tenses</b>. Ngobrol santai → <b>ellipsis + question tags</b>. Presentasi → <b>emphasis</b> (It does work).",
    ],
  ],
};

export const IRR: [string, string, string][] = [
  ["be", "was / were", "adalah"],
  ["have", "had", "punya"],
  ["do", "did", "melakukan"],
  ["go", "went", "pergi"],
  ["get", "got", "dapat"],
  ["make", "made", "membuat"],
  ["take", "took", "ambil"],
  ["come", "came", "datang"],
  ["see", "saw", "lihat"],
  ["know", "knew", "tahu"],
  ["think", "thought", "pikir"],
  ["say", "said", "bilang"],
  ["tell", "told", "memberi tahu"],
  ["give", "gave", "memberi"],
  ["find", "found", "menemukan"],
  ["leave", "left", "pergi / meninggalkan"],
  ["feel", "felt", "merasa"],
  ["bring", "brought", "membawa"],
  ["buy", "bought", "membeli"],
  ["pay", "paid", "membayar"],
  ["send", "sent", "mengirim"],
  ["meet", "met", "bertemu"],
  ["write", "wrote", "menulis"],
  ["speak", "spoke", "berbicara"],
  ["eat", "ate", "makan"],
  ["drink", "drank", "minum"],
  ["sleep", "slept", "tidur"],
  ["begin", "began", "mulai"],
  ["build", "built", "membangun"],
  ["spend", "spent", "menghabiskan"],
];

// Kalimat "I … busy" dalam lima tense. [bentuk be, penanda waktu, nama tense, warna aksen]
export const BE_ROWS: [string, string, string, string][] = [
  ["am", "now", "Present simple", "#1F4E86"],
  ["was", "last night", "Past simple", "#B42318"],
  ["have been", "all week", "Present perfect", "#1F6B57"],
  ["will be", "tomorrow", "Future (will)", "#7A5A00"],
  ["had been", "all day before she came", "Past perfect", "#1F4E86"],
];
export const BE_DRILL: [string, string][] = [
  ["Aku sibuk sekarang.", "I am busy now."],
  ["Aku sibuk tadi malam.", "I was busy last night."],
  ["Aku sibuk sepanjang minggu ini.", "I have been busy all week."],
  ["Aku akan sibuk besok.", "I will be busy tomorrow."],
  ["Aku sibuk belakangan ini.", "I have been busy lately."],
  [
    "Aku sudah sibuk seharian sebelum dia (pr) datang.",
    "I had been busy all day before she came.",
  ],
  ["Dia (pr) lelah sejak pagi.", "She has been tired since this morning."],
  ["Kami lapar tadi siang.", "We were hungry this afternoon."],
];

// Kalimat "I … eat" dalam enam bentuk; <b> menandai bagian yang berubah. [kalimat, tense, warna]
export const DO_ROWS: [string, string, string][] = [
  ["I <b>eat</b> rice every day.", "Present simple (+)", "#1F4E86"],
  ["I <b>don't eat</b> rice every day.", "Present simple (−)", "#1F4E86"],
  ["I <b>ate</b> rice yesterday.", "Past simple (+)", "#B42318"],
  ["I <b>didn't eat</b> rice yesterday.", "Past simple (−)", "#B42318"],
  ["I<b>'m eating</b> rice now.", "Present continuous", "#1F6B57"],
  [
    "I<b>'ll eat</b> rice tomorrow. · I<b>'m going to eat</b> rice tomorrow.",
    "Future",
    "#7A5A00",
  ],
];
export const DO_DRILL: [string, string][] = [
  ["Dia (pr) tidak suka kopi.", "She doesn't like coffee."],
  ["Dia (lk) tidak bekerja hari Minggu.", "He doesn't work on Sundays."],
  ["Aku tidak pergi kemarin.", "I didn't go yesterday."],
  ["Aku makan nasi kemarin.", "I ate rice yesterday."],
  ["Dia (pr) tidak menelepon tadi malam.", "She didn't call last night."],
  ["Mereka tidak tinggal di sini lagi.", "They don't live here anymore."],
  ["Dia (pr) sedang masak sekarang.", "She's cooking now."],
  ["Aku akan telepon kamu besok.", "I'll call you tomorrow."],
  [
    "Kami biasanya minum teh di pagi hari.",
    "We usually drink tea in the morning.",
  ],
  ["Dia (lk) bangun jam enam setiap hari.", "He gets up at six every day."],
];

// Rumus simbolik per tense: [kunci nama (huruf kecil, includes), [+, −, ?]]. Urutan penting: yang lebih spesifik dulu.
export const TENSE_FORMULA: [string, string[]][] = [
  [
    "kata be",
    ["S + am/is/are + C", "S + am/is/are + not + C", "Am/Is/Are + S + C?"],
  ],
  [
    "there is",
    [
      "There is + N tunggal · There are + N jamak",
      "There isn't / aren't + N",
      "Is / Are there + N?",
    ],
  ],
  [
    "have / has got",
    [
      "S + have/has got + O",
      "S + haven't/hasn't got + O",
      "Have/Has + S + got + O?",
    ],
  ],
  [
    "present perfect continuous",
    [
      "S + have/has + been + V-ing",
      "S + have/has + not + been + V-ing",
      "Have/Has + S + been + V-ing?",
    ],
  ],
  [
    "present perfect",
    ["S + have/has + V3", "S + have/has + not + V3", "Have/Has + S + V3?"],
  ],
  [
    "present simple",
    ["S + V1(s/es)", "S + do/does + not + V1", "Do/Does + S + V1?"],
  ],
  [
    "present continuous",
    [
      "S + am/is/are + V-ing",
      "S + am/is/are + not + V-ing",
      "Am/Is/Are + S + V-ing?",
    ],
  ],
  [
    "past continuous",
    [
      "S + was/were + V-ing",
      "S + was/were + not + V-ing",
      "Was/Were + S + V-ing?",
    ],
  ],
  ["past perfect", ["S + had + V3", "S + had + not + V3", "Had + S + V3?"]],
  [
    "narrative (past simple + past continuous)",
    ["S + was/were + V-ing + when + S + V2"],
  ],
  [
    "past simple",
    [
      "S + V2 · S + was/were + C",
      "S + did + not + V1 · S + was/were + not + C",
      "Did + S + V1? · Was/Were + S + C?",
    ],
  ],
  ["can / can", ["S + can + V1", "S + can't + V1", "Can + S + V1?"]],
  ["modal:", ["S + modal + V1", "S + modal + not + V1", "Modal + S + V1?"]],
  ["imperatives", ["V1 + O", "Don't + V1 + O"]],
  [
    "future",
    [
      "S + will + V1 · S + am/is/are + going to + V1",
      "S + won't + V1 · S + am/is/are + not going to + V1",
      "Will + S + V1? · Am/Is/Are + S + going to + V1?",
    ],
  ],
  ["first conditional", ["If + S + V1(s/es), S + will + V1"]],
  ["second conditional", ["If + S + V2 (be → were), S + would + V1"]],
  [
    "mixed conditional",
    [
      "If + S + had + V3, S + would + V1 (akibat sekarang)",
      "If + S + V2, S + would have + V3 (akibat lampau)",
    ],
  ],
  [
    "used to",
    ["S + used to + V1", "S + didn't use to + V1", "Did + S + use to + V1?"],
  ],
  [
    "modal perfect",
    [
      "S + should/could/might + have + V3",
      "S + shouldn't/couldn't + have + V3",
    ],
  ],
  [
    "passive",
    ["S + be (ikut tense) + V3 (+ by …)", "S + be + not + V3", "Be + S + V3?"],
  ],
  ["reported speech", ["S + said (that) + S + V (mundur satu tense)"]],
  [
    "wish",
    ["S + wish + S + V2 (sekarang)", "S + wish + S + had + V3 (lampau)"],
  ],
  [
    "comparatives",
    [
      "S + be + Adj-er / more + Adj + than …",
      "S + be + the + Adj-est / the most + Adj",
    ],
  ],
  ["relative clauses", ["N + who / which / that + V …"]],
];

// Tiga present tense yang belum ada di sebagian level. Disisipkan ke tabel "Memilih tense" bila level itu belum
// punya tense dengan nama sama (huruf besar diabaikan). exId = arti tiap contoh (urutan sama dengan ex).
export const PRESENT_EXTRA: (Tense & { exId: string[] })[] = [
  {
    name: "Present Continuous",
    use: "Sesuatu yang sedang terjadi saat bicara, atau kegiatan sementara di periode ini (hari ini, minggu ini).",
    form: [
      ["subjek", "I → am · He/She/It → is · You/We/They → are  (+ V-ing)"],
      ["+", "I am studying · He is writing · They are watching"],
      ["−", "I'm not studying · She isn't writing · We aren't speaking"],
      ["?", "Am I late? · Is it raining? · Are you playing?"],
      ["-ing", "study → studying · write → writing · run → running"],
    ],
    markers:
      "now, right now, at the moment, today, this week, these days, Look!, Listen!",
    ex: [
      "I am studying.",
      "You are playing.",
      "He is writing.",
      "She is writing.",
      "It is raining.",
      "We are speaking English.",
      "They are watching TV.",
    ],
    exId: [
      "Saya sedang belajar.",
      "Kamu sedang bermain.",
      "Dia (lk) sedang menulis.",
      "Dia (pr) sedang menulis.",
      "Sedang hujan.",
      "Kami sedang berbicara bahasa Inggris.",
      "Mereka sedang menonton TV.",
    ],
    tip: "Kata kerja perasaan atau keadaan (like, know, want, need) biasanya tidak pakai -ing: I'm wanting ✗ → I want ✓",
  },
  {
    name: "Present Perfect",
    use: "Pengalaman atau hasil yang masih terasa sekarang, tanpa menyebut kapan persisnya. Juga untuk hal yang baru saja selesai.",
    form: [
      ["subjek", "I/You/We/They → have · He/She/It → has  (+ V3)"],
      ["+", "I have finished · She has eaten · They have travelled"],
      ["−", "I haven't seen · He hasn't arrived · We haven't met"],
      ["?", "Have you finished? · Has she eaten? · Have they left?"],
      ["V3", "finish → finished · eat → eaten · see → seen · go → gone"],
    ],
    markers: "already, yet, just, ever, never, so far, recently, before",
    ex: [
      "I have finished my work.",
      "You have seen this movie.",
      "He has eaten lunch.",
      "She has learned English.",
      "It has stopped working.",
      "We have met before.",
      "They have travelled to Canada.",
    ],
    exId: [
      "Saya sudah menyelesaikan pekerjaan saya.",
      "Kamu sudah pernah menonton film ini.",
      "Dia (lk) sudah makan siang.",
      "Dia (pr) sudah belajar bahasa Inggris.",
      "Alat itu sudah tidak berfungsi.",
      "Kami sudah pernah bertemu sebelumnya.",
      "Mereka sudah pernah ke Kanada.",
    ],
    tip: "Kalau waktunya disebut (yesterday, last year), pakai past simple: I have seen it yesterday ✗ → I saw it yesterday ✓",
  },
  {
    name: "Present Perfect Continuous",
    use: "Kegiatan yang dimulai di masa lalu dan masih berlangsung sampai sekarang, menekankan sudah berapa lama.",
    form: [
      ["subjek", "I/You/We/They → have been · He/She/It → has been  (+ V-ing)"],
      [
        "+",
        "I have been studying · She has been waiting · They have been talking",
      ],
      ["−", "I haven't been sleeping well · He hasn't been working"],
      ["?", "How long have you been waiting? · Has it been raining?"],
      [
        "for/since",
        "for + lamanya (for 8 hours) · since + titik mulai (since morning)",
      ],
    ],
    markers: "for, since, all day, all week, lately, recently, how long",
    ex: [
      "I have been studying for 8 hours.",
      "You have been running since morning.",
      "He has been working for you since 2020.",
      "She has been waiting all week.",
      "It has been raining all week.",
      "We have been practicing cricket since June.",
      "They have been talking for hours.",
    ],
    exId: [
      "Saya sudah belajar selama 8 jam.",
      "Kamu sudah berlari sejak pagi.",
      "Dia (lk) sudah bekerja untukmu sejak 2020.",
      "Dia (pr) sudah menunggu sepanjang minggu.",
      "Sudah hujan sepanjang minggu.",
      "Kami sudah berlatih kriket sejak Juni.",
      "Mereka sudah mengobrol berjam-jam.",
    ],
    tip: "Bedakan: I've read the book (selesai, hasil) vs I've been reading the book (masih berlangsung, proses).",
  },
];

// Materi "dibedah" per sub-tab (dipakai komponen GrammarDetail).
export const DETAIL: Record<string, Detail> = {
  tense: {
    label: "TENSE",
    title: "Penanda waktu: petunjuk tense paling cepat",
    idea: "Bahasa Indonesia menunjukkan waktu dengan kata keterangan saja (kemarin, sedang, sudah). Bahasa Inggris juga memakai kata keterangan itu, tapi kata kerjanya ikut berubah. Kalau kamu mendengar atau memakai penanda waktu tertentu, tense-nya hampir pasti ikut.",
    steps: [
      {
        t: "Kebiasaan / fakta → Present simple",
        b: "Penanda: every day, usually, often, sometimes, never, on Mondays. Kata frekuensi (usually, often) ditaruh sebelum kata kerja, tapi sesudah be.",
        ex: [
          [
            "I usually take the bus to work.",
            "Aku biasanya naik bus ke kantor",
          ],
          ["She is always late.", "Dia selalu terlambat"],
        ],
      },
      {
        t: "Sudah lewat, waktunya jelas → Past simple",
        b: "Penanda: yesterday, last week, two days ago, in 2019, when I was a kid. Begitu waktunya disebut dan sudah selesai, pakai bentuk lampau.",
        ex: [
          ["I met her two days ago.", "Aku bertemu dia dua hari lalu"],
          [
            "We lived in Bandung when I was a kid.",
            "Kami tinggal di Bandung waktu aku kecil",
          ],
        ],
      },
      {
        t: "Sedang berlangsung → Present continuous",
        b: "Penanda: now, right now, at the moment, today, this week. Juga dipakai untuk rencana yang sudah pasti (I'm meeting him tomorrow).",
        ex: [
          [
            "I'm working from home this week.",
            "Aku kerja dari rumah minggu ini",
          ],
          ["I'm meeting him tomorrow.", "Aku ketemu dia besok (sudah janjian)"],
        ],
      },
      {
        t: "Nanti → will / going to",
        b: "Penanda: tomorrow, next week, later, soon. Pakai going to untuk rencana yang sudah diputuskan, will untuk keputusan saat itu juga, janji, atau tebakan.",
        ex: [
          [
            "I'm going to visit my parents next week.",
            "Aku mau mengunjungi orang tua minggu depan",
          ],
          ["I'll help you.", "Aku bantu (diputuskan sekarang)"],
        ],
      },
      {
        t: "Sudah, waktunya tidak disebut → Present perfect",
        b: "Penanda: already, yet, ever, never, just, so far. Yang penting hasilnya sekarang, bukan kapan terjadinya. Kalau waktunya disebut (yesterday), kembali ke past simple.",
        ex: [
          ["I've already eaten.", "Aku sudah makan"],
          ["Have you ever been to Bali?", "Kamu pernah ke Bali?"],
        ],
      },
    ],
    traps: [
      [
        "I have seen him yesterday.",
        "I saw him yesterday.",
        "yesterday = waktu jelas → past simple",
      ],
      [
        "I am usually go to the gym.",
        "I usually go to the gym.",
        "usually tidak butuh be",
      ],
      [
        "I will going to call you.",
        "I'm going to call you.",
        "pilih satu: will ATAU going to",
      ],
      [
        "Now I work on a report.",
        "I'm working on a report now.",
        "now → continuous",
      ],
    ],
    summary:
      "Dengar penanda waktunya dulu: yesterday → past, now → continuous, every day → simple, tomorrow → will/going to, already/ever → present perfect.",
    drill: [
      [
        "Aku biasanya bangun jam enam.",
        "I usually get up at six.",
        "usually → present simple",
      ],
      [
        "Aku pindah ke Jakarta tiga tahun lalu.",
        "I moved to Jakarta three years ago.",
        "ago → past simple",
      ],
      [
        "Dia sedang menyetir sekarang.",
        "She's driving right now.",
        "right now → continuous",
      ],
      [
        "Aku sudah selesai.",
        "I've already finished.",
        "already → present perfect",
      ],
      [
        "Kamu pernah makan durian?",
        "Have you ever eaten durian?",
        "ever → present perfect",
      ],
      [
        "Aku mau beli mobil tahun depan.",
        "I'm going to buy a car next year.",
        "rencana → going to",
      ],
    ],
  },
  bedo: {
    label: "KATA BANTU",
    title: "Be atau do? Lihat kata setelah subjek",
    idea: 'Penutur Indonesia sering memasang am/is/are di depan semua kata kerja, karena terasa seperti "adalah". Padahal be dan do tidak pernah dipakai berdua untuk satu kata kerja. Pilihannya ditentukan oleh kata yang mengikuti subjek.',
    steps: [
      {
        t: "Diikuti kata sifat, kata benda, atau tempat → BE",
        b: 'Kalimat tanpa kata kerja "beraksi" butuh be sebagai penghubung: perasaan, sifat, pekerjaan, lokasi.',
        ex: [
          ["I'm tired.", "Aku capek"],
          ["She's a nurse.", "Dia perawat"],
          ["They're at the office.", "Mereka di kantor"],
        ],
      },
      {
        t: "Diikuti kata kerja biasa → tanpa BE",
        b: "Kalau sudah ada kata kerja (work, like, go), be tidak dipakai. Untuk negatif, tambahkan do/does/did + not.",
        ex: [
          ["I work in Jakarta.", "Aku kerja di Jakarta"],
          ["She doesn't like spicy food.", "Dia tidak suka makanan pedas"],
        ],
      },
      {
        t: "Diikuti kata kerja -ing → BE (continuous)",
        b: "Be boleh bertemu kata kerja hanya jika kata kerjanya berbentuk -ing (sedang) atau bentuk ke-3 (pasif).",
        ex: [
          ["I'm working now.", "Aku sedang kerja"],
          [
            "The room is cleaned every day.",
            "Ruangannya dibersihkan setiap hari",
          ],
        ],
      },
      {
        t: "Negatif: ikuti kata bantunya",
        b: "Kalimat dengan be → be + not. Kalimat dengan kata kerja biasa → do/does/did + not + kata kerja dasar. Jangan dicampur.",
        ex: [
          ["I'm not busy.", "Aku tidak sibuk"],
          ["I don't have time.", "Aku tidak punya waktu"],
        ],
      },
    ],
    traps: [
      ["I am agree.", "I agree.", "agree kata kerja → tanpa be"],
      [
        "She is live in Bogor.",
        "She lives in Bogor.",
        "live kata kerja → tanpa be, tambah -s",
      ],
      ["I don't busy.", "I'm not busy.", "busy kata sifat → be + not"],
      ["I am work now.", "I'm working now.", "be + kata kerja harus -ing"],
    ],
    summary:
      "Kata sifat/benda/tempat → be. Kata kerja biasa → tanpa be (negatif pakai do). Be + kata kerja hanya kalau -ing.",
    drill: [
      ["Aku lapar.", "I'm hungry.", "kata sifat → be"],
      ["Aku suka musik jazz.", "I like jazz.", "kata kerja → tanpa be"],
      [
        "Dia (lk) tidak setuju.",
        "He doesn't agree.",
        "agree kata kerja → does not",
      ],
      ["Kami tidak di rumah.", "We're not at home.", "tempat → be + not"],
      ["Dia (pr) sedang tidur.", "She's sleeping.", "sedang → be + -ing"],
      [
        "Mereka tidak kenal aku.",
        "They don't know me.",
        "know kata kerja → do not",
      ],
    ],
  },
  irr: {
    label: "KATA KERJA TAK BERATURAN",
    title: "Tiga bentuk, empat pola, satu aturan pakai",
    idea: "Setiap kata kerja punya tiga bentuk: dasar (V1), lampau (V2), dan bentuk ke-3 (V3). Kata kerja beraturan cukup ditambah -ed. Yang tak beraturan harus dihafal, tapi kebanyakan mengikuti salah satu dari empat pola, jadi hafalkan per kelompok.",
    steps: [
      {
        t: "Kapan pakai V2, kapan V3",
        b: "V2 berdiri sendiri untuk lampau (I went). V3 tidak pernah sendiri: selalu setelah have/has/had (sudah) atau be (pasif).",
        ex: [
          ["I went home early.", "Aku pulang lebih awal (V2)"],
          ["I've gone there twice.", "Aku sudah ke sana dua kali (V3)"],
          ["It was made in Japan.", "Itu dibuat di Jepang (V3, pasif)"],
        ],
      },
      {
        t: "Pola A · tiga bentuk sama",
        b: "cut – cut – cut. Termasuk: put, let, set, hit, cost, hurt, shut, quit. Paling gampang, waktunya terlihat dari penanda waktu.",
        ex: [
          ["It cost a lot yesterday.", "Kemarin harganya mahal"],
          ["I put it on the table.", "Aku taruh di meja"],
        ],
      },
      {
        t: "Pola B · V2 = V3",
        b: "buy – bought – bought. Termasuk: bring, think, teach, catch, feel, keep, leave, meet, send, spend, sleep, make, say, pay, find, tell.",
        ex: [
          ["I bought it last week.", "Aku beli minggu lalu"],
          ["I've bought a new phone.", "Aku sudah beli HP baru"],
        ],
      },
      {
        t: "Pola C · V1 = V3",
        b: "come – came – come. Termasuk: become, run. Hanya beberapa, jadi hafalkan sebagai pengecualian.",
        ex: [
          ["She came late.", "Dia datang terlambat"],
          ["She has come back.", "Dia sudah kembali"],
        ],
      },
      {
        t: "Pola D · tiga bentuk beda",
        b: "go – went – gone. Termasuk: see – saw – seen, eat – ate – eaten, take – took – taken, write – wrote – written, speak – spoke – spoken, begin – began – begun, drink – drank – drunk. Banyak yang V3-nya berakhiran -en.",
        ex: [
          ["I saw it.", "Aku melihatnya"],
          ["I've seen it.", "Aku sudah melihatnya"],
        ],
      },
    ],
    traps: [
      ["He has went home.", "He has gone home.", "setelah has → V3 (gone)"],
      [
        "I have saw that movie.",
        "I have seen that movie.",
        "setelah have → V3 (seen)",
      ],
      ["She buyed a bag.", "She bought a bag.", "buy tak beraturan, bukan -ed"],
      [
        "I seen him yesterday.",
        "I saw him yesterday.",
        "V3 tidak bisa berdiri sendiri",
      ],
    ],
    summary:
      "Lampau biasa → V2. Setelah have/has/had atau be → V3. Hafalkan per pola, bukan satu per satu.",
    drill: [
      [
        "Aku makan nasi goreng tadi malam.",
        "I ate fried rice last night.",
        "lampau → V2",
      ],
      ["Aku sudah makan.", "I've eaten.", "have → V3 (pola D)"],
      [
        "Dia (pr) menulis surat kemarin.",
        "She wrote a letter yesterday.",
        "lampau → V2",
      ],
      ["Kamu sudah bertemu dia?", "Have you met him?", "have → V3 (pola B)"],
      ["Harganya naik.", "The price has gone up.", "has → V3 (gone)"],
      [
        "Aku menaruh kuncinya di sini.",
        "I put the keys here.",
        "pola A, bentuk sama",
      ],
    ],
  },
  num: {
    label: "ANGKA",
    title: "Cara mengucapkan angka dalam situasi nyata",
    idea: "Mengenal one, two, first, second baru langkah pertama. Saat bicara, angka muncul sebagai tanggal, tahun, harga, nomor telepon, dan jumlah besar, dan masing-masing punya cara baca sendiri.",
    steps: [
      {
        t: "Menulis ordinal: -st, -nd, -rd, -th",
        b: "Akhiran mengikuti angka terakhir: 1 → -st, 2 → -nd, 3 → -rd, sisanya -th. Pengecualian: 11th, 12th, 13th selalu -th. Angka puluhan: twenty-first, thirty-second.",
        ex: [
          ["twenty-first", "21st"],
          ["twelfth", "12th (bukan twelveth)"],
          ["thirty-third", "33rd"],
        ],
      },
      {
        t: "Tanggal → ordinal",
        b: 'Tanggal selalu dibaca ordinal. Dua cara: "the third of May" atau "May third". Hari pakai preposisi on.',
        ex: [
          ["My birthday is on the third of May.", "Ulang tahunku 3 Mei"],
          ["The meeting is on June twenty-first.", "Rapatnya 21 Juni"],
        ],
      },
      {
        t: "Tahun → dipotong dua-dua",
        b: "1998 = nineteen ninety-eight. 2000 = two thousand. 2009 = two thousand and nine. 2025 = twenty twenty-five. Tahun pakai preposisi in.",
        ex: [
          ["I was born in nineteen ninety-eight.", "Aku lahir tahun 1998"],
          ["I graduated in twenty twenty.", "Aku lulus tahun 2020"],
        ],
      },
      {
        t: "Jumlah besar: hundred, thousand, million tanpa -s",
        b: "Setelah angka, hundred/thousand/million tidak pernah ditambah -s. Ratusan diikuti and (British). Titik ribuan Indonesia (1.000) ditulis koma di Inggris (1,000).",
        ex: [
          ["two hundred people", "200 orang"],
          ["It costs fifty thousand rupiah.", "Harganya 50 ribu rupiah"],
          ["three million", "3 juta"],
        ],
      },
      {
        t: "Nomor telepon dan desimal → satu per satu",
        b: 'Nomor telepon dibaca per angka; 0 dibaca "oh" atau "zero". Desimal pakai point, bukan koma: 2,5 → two point five.',
        ex: [
          ["My number is oh-eight-one-two…", "Nomorku 0812…"],
          ["It's two point five kilometers.", "Jaraknya 2,5 km"],
        ],
      },
    ],
    traps: [
      [
        "two hundreds people",
        "two hundred people",
        "hundred setelah angka tanpa -s",
      ],
      ["the twenty-oneth", "the twenty-first", "angka terakhir 1 → first"],
      [
        "I live in the floor two.",
        "I live on the second floor.",
        "lantai → ordinal + on",
      ],
      ["two coma five", "two point five", "desimal pakai point"],
    ],
    summary:
      "Menghitung → cardinal. Urutan, tanggal, lantai → ordinal. Tahun dipotong dua-dua, telepon dibaca satu per satu, hundred/thousand tanpa -s.",
    drill: [
      ["Baca: 17 Agustus", "the seventeenth of August", "tanggal → ordinal"],
      ["Baca: tahun 2015", "twenty fifteen", "tahun dipotong dua-dua"],
      [
        "Baca: Rp 250.000",
        "two hundred and fifty thousand rupiah",
        "hundred & thousand tanpa -s",
      ],
      ["Aku di lantai tiga.", "I'm on the third floor.", "lantai → ordinal"],
      ["Baca: 22nd", "twenty-second", "angka terakhir 2 → second"],
      [
        "Baca: 3,75",
        "three point seven five",
        "desimal: point, lalu satu per satu",
      ],
    ],
  },
};
