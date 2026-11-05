// Isi tab "Cheat sheet". Markup ringan di dalam teks: **tebal**, *miring*
// (kalimat bahasa Inggris). Contoh ✅ bisa didengarkan, contoh ❌ tidak;
// "kalimat|catatan" menampilkan catatan tanpa ikut dibacakan.

export type CheatBlock =
  | { kind: "rule"; title: string; why: string; ok: string[]; bad: string[] }
  | { kind: "p"; text: string }
  | { kind: "list"; title?: string; ordered?: boolean; items: string[] }
  | {
      kind: "table";
      head: string[];
      rows: string[][];
      /** Kolom berisi kalimat bahasa Inggris (dicetak miring). */
      en?: number[];
      /** Kolom berisi kalimat salah (merah, dicoret). */
      wrong?: number;
    }
  | { kind: "tip"; label: string; text: string }
  | { kind: "phrases"; items: string[] };

export interface CheatSection {
  id: string;
  title: string;
  blocks: CheatBlock[];
}

export const CHEAT_SECTIONS: CheatSection[] = [
  {
    id: "aturan-dasar",
    title: "Lima aturan dasar",
    blocks: [
      {
        kind: "rule",
        title: "Tidak ada kata kerja → wajib pakai be (am/is/are/was/were).",
        why: 'Bahasa Indonesia boleh bilang *"Aku capek"*, tapi setiap kalimat bahasa Inggris wajib punya kata kerja. Kalau tidak ada, *be* yang mengisi.',
        ok: ["I am tired.", "She is at home.", "The store is open."],
        bad: ["I tired.", "She at home."],
      },
      {
        kind: "rule",
        title: "Ada kata kerja → jangan tambah be.",
        why: "*be* sendiri sudah kata kerja. Dua kata kerja bertabrakan.",
        ok: ["I agree.", "It helps me.", "I feel tired."],
        bad: ["I am agree.", "It is help me.", "I am feel tired."],
      },
      {
        kind: "rule",
        title:
          "Setelah be, kata kerja hanya boleh V-ing (sedang) atau V3 (di-).",
        why: "*be + V-ing* = sedang melakukan. *be + V3* = dikenai (pasif). *be + V1* atau *be + V2* tidak punya arti.",
        ok: ["I was working.|tadi sedang", "The shirt was printed.|dicetak"],
        bad: ["I was work.", "I was worked.", "I am get home."],
      },
      {
        kind: "rule",
        title: "Setelah do/does/did, can/will/should, dan to → selalu V1.",
        why: "Penanda waktu (-s atau lampau) sudah dibawa oleh kata bantunya, jadi kata kerjanya tidak perlu berubah lagi.",
        ok: [
          "Did you go?",
          "Does he play?",
          "I will come.",
          "I want to speak.",
        ],
        bad: ["Did you went?", "Does he plays?", "I want to speaking."],
      },
      {
        kind: "rule",
        title: "V2 selalu berdiri sendiri, tanpa kata bantu dan tanpa -s.",
        why: "V2 sudah berarti lampau. Tambahan apa pun jadi dobel.",
        ok: ["She left him.", "I went home.", "I fell getting out of the car."],
        bad: ["She lefts him.", "I was went home.", "I am fall."],
      },
      {
        kind: "tip",
        label: "Cara cek cepat sebelum bicara",
        text: "Ada kata kerja? → pakai kata kerjanya (atau do/does/did). Tidak ada? → pakai be.",
      },
    ],
  },
  {
    id: "am-is-are",
    title: "Memilih am / is / are",
    blocks: [
      {
        kind: "p",
        text: "Pilih berdasarkan **subjek** (siapa/apa yang dibicarakan), bukan berdasarkan kata tanya.",
      },
      {
        kind: "table",
        head: ["Subjek", "Sekarang", "Lampau", "Contoh"],
        en: [3],
        rows: [
          ["I", "am", "was", "I am busy."],
          [
            "he, she, it, satu benda, uncountable (water, stuff, money), every…, one of…",
            "is",
            "was",
            "Your class is at 9. · There is a lot of stuff. · One of my friends is here.",
          ],
          [
            "you, we, they, benda jamak",
            "are",
            "were",
            "The stores are open. · Where are you?",
          ],
        ],
      },
      {
        kind: "list",
        items: [
          "**Hati-hati:** *you* selalu *are/were*, walaupun hanya satu orang. ❌ *Where is you?* ❌ *You was born.*",
          "**Di pertanyaan**, subjek ada **setelah** be: *What are the things…?* → subjeknya *the things* (jamak) → *are*.",
        ],
      },
      {
        kind: "tip",
        label: "Trik",
        text: "Ganti subjeknya dengan he/she/it atau they. *your class → it → is.* *the things → they → are.*",
      },
    ],
  },
  {
    id: "tense",
    title: "Kapan pakai tense apa",
    blocks: [
      {
        kind: "table",
        head: ["Maksud", "Pola", "Contoh"],
        en: [2],
        rows: [
          [
            "Kebiasaan / fakta",
            "V1 (+s untuk he/she/it)",
            "I work out every day. · She works in Jakarta.",
          ],
          [
            "Sedang terjadi / rencana dekat",
            "am/is/are + V-ing",
            "I'm on my way. · Are you going to Jakarta tomorrow?",
          ],
          [
            "Sudah selesai (ada waktu lampau)",
            "V2",
            "I went to Bali last year.",
          ],
          [
            "Tadi sedang",
            "was/were + V-ing",
            "I was taking a shower when you called.",
          ],
          [
            "Sudah / pernah (hasilnya terasa sekarang)",
            "have/has + V3",
            "I've finished. · I've been to Bali. · I have never been fishing.",
          ],
          [
            "Dari dulu sampai sekarang (masih lanjut)",
            "have been + V-ing + for/since",
            "I've been learning English for two months.",
          ],
          [
            "Di- (pasif)",
            "be + V3",
            "My phone was stolen. · The bug has been fixed.",
          ],
          [
            "Akan, ada rencana / ada bukti",
            "going to + V1",
            "It's going to rain. (langit mendung)",
          ],
          [
            "Akan, janji / keputusan spontan",
            "will + V1",
            "I'll be there. · I'll call you.",
          ],
        ],
      },
      {
        kind: "list",
        title: "was vs have been",
        items: [
          "*was* → sudah lewat dan selesai, biasanya ada waktu jelas: *I was busy yesterday.*",
          '*have been* → masih nyambung ke sekarang: *I have been busy all week* (sampai sekarang masih sibuk), atau pengalaman "pernah" tanpa menyebut kapan.',
          "❌ *I have been to Bali last year.* → ada waktu lampau, pakai V2: *I went to Bali last year.*",
        ],
      },
      {
        kind: "list",
        items: [
          "**Yang paling sering dipakai di obrolan:** Present Simple dan Past Simple. Kuasai dua ini dulu.",
          "**Kata kerja keadaan tidak pakai -ing:** know, like, want, need, understand, belong. ✅ *I don't understand.* ❌ *I'm not understanding.*",
        ],
      },
    ],
  },
  {
    id: "pertanyaan",
    title: "Membuat pertanyaan",
    blocks: [
      {
        kind: "list",
        title: "Aturan: kata bantu pindah ke depan subjek",
        items: [
          "*You are ready.* → *Are you ready?*",
          "*I can eat it.* → *Can I eat it?*",
          "*You don't call me.* → *Why don't you call me?*",
          "*I can't speak like you.* → *Why can't I speak like you?*",
        ],
      },
      {
        kind: "list",
        title:
          "Kalau tidak ada kata bantu (Present/Past Simple), pinjam do/does/did",
        items: [
          "*You want coffee.* → *What do you want?*",
          "*Your class starts at 9.* → *What time does your class start?* (does karena *your class* = it; *starts* kembali jadi *start*)",
          "*You went home.* → *Where did you go?*",
        ],
      },
      {
        kind: "list",
        title: "Kalau tidak ada kata kerja sama sekali, pakai be",
        items: [
          "*Where are you?* · *Where are you from?* · *Where were you yesterday?*",
          "❌ *Where do you from?* (tidak ada kata kerja, jadi bukan do)",
          "**Jangan dua kata bantu sekaligus:** ❌ *Am I can eat it?* ❌ *What's is toilet?* (what's = what is)",
        ],
      },
      {
        kind: "list",
        title: "Pola khusus",
        items: [
          "*What … like?* = seperti apa. *What's the weather like?* · *What's your new office like?* (jangan *How … like*)",
          "Kalau benda sudah disebut, **jangan tambah it**: ❌ *What it's your office like?*",
          "*What does it mean?* (mean = kata kerja → does). *What's the meaning?* (meaning = kata benda → is).",
          "Pertanyaan **di dalam kalimat** → urutan normal, do hilang: *I don't know what it means.* · *I understand what you mean.*",
          "Frekuensi: *How often do you go?* atau *How many times a week…?* (bukan *how many do you*)",
          "Transportasi: *How did you get here?*",
        ],
      },
    ],
  },
  {
    id: "a-an-the",
    title: "a / an / the",
    blocks: [
      {
        kind: "p",
        text: "Bahasa Indonesia tidak punya kata ini, jadi perlu kebiasaan baru. Tanya tiga hal:",
      },
      {
        kind: "list",
        ordered: true,
        items: [
          "**Bisa dihitung?** Tidak (water, stuff, information, coffee) → tanpa a.",
          "**Satu?** Tidak (jamak: shoes, people) → tanpa a. Ya → lanjut ke 3.",
          "**Sudah jelas yang mana?** Belum → **a/an**. Sudah → **the**.",
        ],
      },
      {
        kind: "list",
        items: [
          "*a* sebelum bunyi konsonan, *an* sebelum bunyi vokal: *a spouse, a Grab, an umbrella, an hour* (h tidak dibunyikan).",
          "*the* kalau sudah dibicarakan atau sudah jelas dari situasi: *I ordered a Grab. The Grab is here.* · *the gym, the office* (yang biasa didatangi).",
          "Benda tunggal **tidak boleh sendirian**: ❌ *I have spouse.* ✅ *I have a spouse.*",
          "Jamak **tidak boleh pakai a**: ❌ *They sell a shoes.* ✅ *They sell shoes.*",
          "*the same* selalu pakai *the*: *It's still the same.*",
        ],
      },
      {
        kind: "list",
        title: "some / any / no",
        items: [
          "*some* di kalimat positif: *There is some water.*",
          "*any* di negatif dan pertanyaan: *Is there any water?* · *There isn't any water.*",
          "*no* langsung + benda, tanpa any: *There is no water.* ❌ *There is no any water.*",
        ],
      },
      {
        kind: "list",
        title: "every / one of / other",
        items: [
          "*every* + tunggal, kata kerja tunggal: *Every store has a fitting room.* Jangan gabung dengan *usually* (bertentangan) → *Most stores have…*",
          "*one of* + jamak, kata kerja tunggal: *One of my friends lives in Makassar.* ❌ *one of my friend*",
          "*other* + benda / setelah no (*no other person*) · *another* = satu lagi (*another coffee*) · *others* sendirian (*the others*).",
        ],
      },
      {
        kind: "tip",
        label: "Tanpa a/the sama sekali",
        text: "*go home, go to work, go to school, go to bed, by bus, by taxi.*",
      },
    ],
  },
  {
    id: "to-atau-ing",
    title: "to + V1 atau V-ing?",
    blocks: [
      {
        kind: "table",
        head: ["Setelah kata ini", "Pakai", "Contoh"],
        en: [2],
        rows: [
          [
            "want, need, have to, ready, supposed, be able",
            "**to + V1**",
            "I want to go. · I'm ready to practice.",
          ],
          [
            "like, love, enjoy, hate, stop, finish, practice",
            "**V-ing**",
            "I liked drawing. · I'm practicing speaking.",
          ],
          [
            "be used to, get used to, look forward to",
            '**V-ing** (to di sini = "terhadap", bukan "untuk")',
            "I'm used to speaking English.",
          ],
          [
            "preposisi: for, about, before, after",
            "**V-ing**",
            "Thanks for helping me.",
          ],
          ["ask + orang", "**to + V1**", "I asked my friend to take me home."],
          [
            "let, make, have + orang",
            "**V1** (tanpa to)",
            "Let them know. · I have my friend look after my pet.",
          ],
          ["help + orang", "**V1**", "It helps me relax."],
        ],
      },
      {
        kind: "p",
        text: '**Kenapa *I liked drawing* padahal *liked* sudah lampau?** Karena *drawing* di sini bukan "sedang", tapi "kegiatan menggambar" (dijadikan kata benda). Penanda lampau cukup di *liked*.',
      },
      {
        kind: "list",
        title: "used to, tiga arti",
        items: [
          "*used to + V1* = **dulu** biasanya, sekarang tidak: *I used to swim.*",
          "*be used to + V-ing* = **sudah terbiasa**: *I'm used to speaking English.*",
          "*get used to + V-ing* = **mulai terbiasa**: *I'm getting used to it.* · *You'll get used to it.*",
          "❌ *I used to swimming* (campuran) · ❌ *I'm used to speak* (harus -ing)",
        ],
      },
      {
        kind: "list",
        title: "Lain-lain",
        items: [
          "*so (that)* + kalimat = supaya: *I speak English every day so that I get used to it.*",
          "Minta: *Can I have the menu?* (langsung minta barang) · *I asked for water.* (cerita) · *I asked him to help.* (minta orang melakukan)",
          "Baru saja: *I just told him.* (just + V2) atau *I've just finished.* (have just + V3)",
          "*ever* hanya di pertanyaan: *Have you ever been to Bali?* Di kalimat positif tanpa ever: *I have been to Bali.*",
        ],
      },
    ],
  },
  {
    id: "preposisi",
    title: "Preposisi tempat & kendaraan",
    blocks: [
      {
        kind: "list",
        items: [
          "**in** = di dalam area: *in Jakarta, in Karanganyar, in the yard, in the drawer.*",
          "**on** = di atas permukaan / nama jalan: *on the table, on the bookshelf, on Sudirman Street.*",
          "**at** = tempat kegiatan: *at the gym, at the office, at the zoo, at home.*",
          '**Tanpa to:** *go home, get home, get here, get there.* Kenapa: *home/here/there* sudah mengandung arti "ke". Tapi *go to your home, go to the office* tetap pakai to.',
        ],
      },
      {
        kind: "table",
        head: ["Jenis", "Naik", "Turun", "Di dalam"],
        en: [3],
        rows: [
          [
            "bus, kereta, pesawat, motor, sepeda",
            "**get on**",
            "**get off**",
            "I'm on the bus. · I'm on a Gojek.",
          ],
          [
            "mobil, taksi, Grab car",
            "**get in**",
            "**get out of**",
            "I'm in the car. · I'm in a Grab.",
          ],
        ],
      },
      {
        kind: "p",
        text: "**Kenapa beda:** bus/kereta bisa dijalani di dalamnya, motor diduduki di atasnya → *on*. Mobil dimasuki seperti ruang kecil → *in*.",
      },
      {
        kind: "list",
        items: [
          "*fell off* the motorcycle (dari atas) · *fell getting out of* the car (saat turun dari mobil).",
          "❌ *fell off the car* (artinya jatuh dari atap) · ❌ *get off from* · ❌ *get in of* · ❌ *fell off on*",
          "*take the bus* = memilih bus · *by bus* (tanpa the) = dengan bus · *drive* = pakai mobil sendiri · *give someone a ride* = mengantar · *I'm on my way* = otw · *heading home* = menuju pulang.",
          "*I'm almost home* / *I just got home* / *I'm home* (bukan *I'm getting home*).",
        ],
      },
    ],
  },
  {
    id: "preposisi-lain",
    title: "Preposisi bahasa, kemampuan & keadaan",
    blocks: [
      {
        kind: "p",
        text: "Preposisi bukan cuma untuk tempat. Logikanya tetap sama: **in** = di dalam, **on** = sedang aktif, **at** = satu titik.",
      },
      {
        kind: "rule",
        title: "Bahasa → in.",
        why: "Bahasa itu seperti wadah: kalimatnya ada *di dalam* bahasa itu. Tapi kalau bahasanya jadi objek (*speak, learn, study*), tidak perlu preposisi.",
        ok: [
          "Say it in English.",
          "What's this in English?",
          "I speak English.|tanpa in",
        ],
        bad: ["Say it with English.", "What's this by English?"],
      },
      {
        kind: "rule",
        title: "Jago melakukan sesuatu → good at (+ V-ing).",
        why: 'Jago itu soal satu kegiatan, jadi pakai *at* (titik). Jangan terjemahkan "pintar **dalam**" jadi *in*. Kalau setelah *at* ada kata kerja, pakai V-ing.',
        ok: [
          "I'm good at English.",
          "She's bad at cooking.",
          "I'm getting better at speaking.",
        ],
        bad: ["I'm good in English.", "I'm good at speak."],
      },
      {
        kind: "list",
        title: "Masih soal kemampuan",
        items: [
          "**interested in** = tertarik: *I'm interested in music.*",
          "**experience in** / **skilled in** = berpengalaman atau ahli di satu bidang (sering dipakai di CV): *I have experience in marketing.*",
        ],
      },
      {
        kind: "rule",
        title: "Sedang berada dalam suatu keadaan → in.",
        why: "Bayangkan keadaan itu seperti ruangan: kamu sedang *di dalam* masalah, *di dalam* buru-buru, *di dalam* mood yang baik.",
        ok: [
          "The car is in good condition.",
          "I'm in a hurry.",
          "He's in trouble.",
          "She's in a good mood.",
        ],
        bad: ["The car is on good condition.", "I'm on a hurry."],
      },
      {
        kind: "table",
        head: ["Preposisi", "Rasanya", "Contoh"],
        en: [2],
        rows: [
          [
            "**in**",
            "sedang di dalam keadaan itu",
            "in good condition · in trouble · in pain · in love",
          ],
          [
            "**on**",
            "status yang sedang aktif",
            "on sale · on time · on leave · on a diet · on vacation",
          ],
          ["**at**", "satu titik / posisi", "at risk · at work · at peace"],
          [
            "**under**",
            "sedang ditekan atau diproses",
            "under pressure · under control · under construction",
          ],
        ],
      },
      {
        kind: "rule",
        title: "Kata sifat + preposisi → hafalkan sepaket.",
        why: 'Pasangan ini tidak selalu bisa ditebak dengan logika, dan sering salah karena terjemahan "dengan". Hafalkan pasangannya, jangan per kata.',
        ok: [
          "I'm afraid of dogs.",
          "I'm proud of you.",
          "I'm tired of waiting.",
          "I'm worried about you.",
          "She's married to my cousin.",
        ],
        bad: ["I'm afraid with dogs.", "She's married with my cousin."],
      },
      {
        kind: "tip",
        label: "Cara cepat memilih",
        text: "Tanya diri sendiri: ini *di dalam* sesuatu (**in**), *sedang berjalan* (**on**), atau *satu titik* (**at**)? Kalau berpasangan dengan kata sifat, jangan ditebak. Pakai pasangan yang sudah dihafal.",
      },
    ],
  },
  {
    id: "waktu",
    title: "Waktu & frekuensi",
    blocks: [
      {
        kind: "list",
        items: [
          "**for** + lama waktu: *for two hours, for a week.*",
          "**during** + kata benda: *during the meeting, during my holiday.*",
          "**while** + kalimat (subjek + kata kerja): *while I'm on holiday.* ❌ *during I'm on holiday*",
          "**at** jam pasti (*at 7*), **around/about** kira-kira (*around 7, for about two hours*). Kalau pasti, tidak perlu about.",
          "*once, twice, three times a week* (bukan *fiveth*) · *every Saturday* (tanpa on) · *this year, last night* (tanpa in) · *two years ago.*",
          '*until now* biasanya salah, terdengar "lalu berhenti". Pakai **still** (masih) atau **for/since**.',
        ],
      },
    ],
  },
  {
    id: "urutan-kata",
    title: "Urutan kata",
    blocks: [
      {
        kind: "list",
        items: [
          "**Penjelas di depan benda**, kebalikan bahasa Indonesia: *class schedule* (jadwal kelas), *Gojek motorcycle*, *snack wrapper*. ❌ *the schedule of class.* Pemilik pakai **'s**: *my friend's house.*",
          "**Subjek → kata kerja → objek**: *Can you put these pens on the table?* ❌ *These pens can you put…*",
          "**usually, always, never, often** → setelah subjek, sebelum kata kerja: *I usually go…* Setelah be: *I'm usually busy.* Hanya *usually/sometimes* boleh di awal kalimat.",
          "**it / that / this** untuk hal yang sudah disebut: *I play games. It helps me relax.* ❌ *that's can* (that's = that is, bertabrakan dengan can)",
          "Jangan ulang subjek dengan it: ✅ *I think this task is hard.* ❌ *this task it's hard.*",
          "**Perintah tanpa subjek:** *Go straight, then turn left.* · *Put on your hat.* · *Don't be noisy.* · *Never let them know.*",
          "**Cuaca selalu subjek it:** *It's going to rain.* · *It's foggy.* ❌ *The weather is going to rain.*",
          "**getting + kata sifat** = mulai/semakin: *It's getting dark.* ❌ *It's getting rain.*",
          '**Kata ekstrem tanpa very:** *really terrible, so great* (terrible/great sudah berarti "sangat").',
          "**-s hanya untuk V1 + he/she/it:** *I think he likes you.* · *The umbrella belongs to my teacher.*",
        ],
      },
    ],
  },
  {
    id: "kesalahan",
    title: "Kesalahan yang sering berulang",
    blocks: [
      {
        kind: "table",
        head: ["Salah", "Benar", "Aturan"],
        en: [0, 1],
        wrong: 0,
        rows: [
          [
            "I am get home. / I am fall. / I am feel tired.",
            "I got home. / I fell. / I feel tired.",
            "be + V1 tidak boleh",
          ],
          [
            "Where were you go? / How were you feel?",
            "Where did you go? / How do you feel?",
            "ada kata kerja → do/did",
          ],
          [
            "I was develop the feature.",
            "I developed / I was developing",
            "setelah be → V-ing/V3",
          ],
          [
            "Does he plays? / Did you went? / She lefts",
            "Does he play? / Did you go? / She left",
            "V1 setelah do; V2 tanpa -s",
          ],
          [
            "I not understand.",
            "I don't understand.",
            "not butuh teman (do/be)",
          ],
          [
            "I have spouse. / They sell a shoes.",
            "I have a spouse. / They sell shoes.",
            "a = satu, bisa dihitung",
          ],
          ["the yard of house", "my yard", "penjelas di depan benda"],
          [
            "What it's your office like?",
            "What's your office like?",
            "benda sudah disebut",
          ],
          [
            "used to speak (maksud: terbiasa)",
            "used to speaking",
            "be/get used to + V-ing",
          ],
          ["until now I'm learning", "I'm still learning", "until now → still"],
          [
            "go to home / get to here",
            "go home / get here",
            "home, here, there tanpa to",
          ],
          [
            "fell off the car",
            "fell getting out of the car",
            "mobil → in / out of",
          ],
          ["What's is… / Am I can…", "What's… / Can I…", "satu kata bantu"],
          ["every store usually have", "most stores have", "every = tunggal"],
        ],
      },
    ],
  },
  {
    id: "frasa-penyelamat",
    title: "Frasa penyelamat saat blank",
    blocks: [
      {
        kind: "phrases",
        items: [
          "Let me think…",
          "How can I say it…",
          "What's the word…",
          "What is it in English?",
          "How do you say … in English?",
          "What do you mean?",
          "I don't understand.",
          "Could you say that again?",
          "I'm not sure.",
          "It depends.",
          "It doesn't matter.",
          "That's great!",
        ],
      },
    ],
  },
  {
    id: "cara-belajar",
    title: "Cara belajar yang disepakati",
    blocks: [
      {
        kind: "list",
        items: [
          "Hafalkan **frasa dan pola**, bukan kata satu-satu. Siapkan jawaban stok: *I run a clothing business. We make custom t-shirts.*",
          "Pagi: 3 kalimat kebiasaan (Present Simple). Malam: 3 kalimat tentang hari ini (Past Simple).",
          "Baca **out loud**. Self-talk 5 menit sehari.",
          "Kalimat pendek yang benar lebih baik daripada kalimat panjang yang macet.",
          "Salah preposisi atau a/the = ringan, orang tetap paham. **Tetap bicara.**",
          "*Everyone has their own journey. The more I speak English, the easier it gets.*",
        ],
      },
    ],
  },
];
