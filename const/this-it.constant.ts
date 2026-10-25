import type { Detail } from "@/lib/types/grammar.types";

// Sub-tab "This / It": this is (menunjuk / memperkenalkan), it is (merujuk balik / it kosong), is it (tanya).
export const THIT_DETAIL: Detail = {
  label: "THIS · IT",
  title: "Tunjuk dulu pakai this, bicarakan lagi pakai it",
  idea: 'Bahasa Indonesia memakai "ini" dan "itu" untuk hampir semuanya, bahkan sering tanpa subjek sama sekali ("Panas, ya."). Bahasa Inggris membedakan fungsinya. This is dipakai saat menunjuk atau memperkenalkan sesuatu untuk pertama kali. Setelah itu, benda yang sama dibicarakan dengan it. It juga wajib dipakai sebagai subjek "kosong" untuk cuaca, waktu, dan jarak, karena kalimat lengkap bahasa Inggris (selain kalimat perintah) wajib punya subjek.',
  steps: [
    {
      t: "This is → menunjuk atau memperkenalkan untuk pertama kali",
      b: "Pakai saat kamu menunjukkan sesuatu yang dekat (\"ini\"), atau memperkenalkan orang. Di telepon, untuk menyebut diri sendiri biasanya dipakai this is atau it's (It's Budi), lebih lazim daripada I am.",
      ex: [
        ["This is my new phone.", "Ini HP baruku. (sambil menunjukkan)"],
        ["This is Rina, my colleague.", "Ini Rina, rekan kerjaku."],
        ["Hello, this is Budi.", "Halo, saya Budi. (di telepon)"],
      ],
    },
    {
      t: "That is, these are, those are → jauh dan jamak",
      b: "This untuk yang dekat, that untuk yang jauh. Kalau bendanya lebih dari satu, this berubah jadi these dan that jadi those, dan is berubah jadi are.",
      ex: [
        [
          "That is our school, on the hill.",
          "Itu sekolah kami, di atas bukit.",
        ],
        ["These are my shoes.", "Ini sepatuku."],
        ["Those are my friends over there.", "Itu teman-temanku di sana."],
      ],
    },
    {
      t: "It is → membicarakan lagi benda yang sudah disebut",
      b: 'Setelah sebuah benda diperkenalkan, kalimat berikutnya biasanya memakai it sebagai pengganti kata bendanya, mirip "-nya" dalam bahasa Indonesia. It hanya untuk benda dan hewan; untuk orang pakai he / she (This is Rina. She is my colleague.). Polanya: this untuk memperkenalkan, it (atau he / she) untuk membicarakannya.',
      ex: [
        [
          "This is my new phone. It's very fast.",
          "Ini HP baruku. HP-nya cepat sekali.",
        ],
        [
          "I bought a bag yesterday. It was cheap.",
          "Aku beli tas kemarin. Harganya murah.",
        ],
        ["Look at that car! It's so old.", "Lihat mobil itu! Tua sekali."],
      ],
    },
    {
      t: 'It is → subjek "kosong" untuk cuaca, waktu, jarak, dan keadaan',
      b: 'Dalam bahasa Indonesia kalimat seperti "Panas" atau "Sudah jam tujuh" tidak punya subjek. Bahasa Inggris wajib punya subjek, jadi dipakai it yang tidak merujuk ke benda apa pun. Jangan pakai this untuk ini, dan jangan hilangkan it.',
      ex: [
        ["It's hot today.", "Hari ini panas."],
        ["It's seven o'clock.", "Sudah jam tujuh."],
        ["It's far from here.", "Jauh dari sini."],
      ],
    },
    {
      t: "Is it …? / Is this …? → bertanya, dan jawab pendek pakai it untuk benda",
      b: "Untuk bertanya, is pindah ke depan: it is → Is it …?, this is → Is this …?. Untuk benda, jawaban pendeknya memakai it (they untuk jamak), bukan this; untuk orang pakai he / she (Is that your brother? — Yes, he is.). Jawaban pendek positif tidak disingkat: Yes, it is (bukan Yes, it's), sedangkan yang negatif boleh: No, it isn't.",
      ex: [
        ["Is it far from here?", "Jauh nggak dari sini?"],
        ["Is this your bag? — Yes, it is.", "Ini tasmu? — Iya."],
        ["Are these your keys? — No, they aren't.", "Ini kuncimu? — Bukan."],
      ],
    },
  ],
  traps: [
    ["This is hot today.", "It's hot today.", "cuaca → it, bukan this"],
    [
      "Is far from here.",
      "It's far from here.",
      "subjek it tidak boleh hilang",
    ],
    [
      "It is my friend, Rina. (memperkenalkan)",
      "This is my friend, Rina.",
      "memperkenalkan orang → this",
    ],
    [
      "Is this your bag? — Yes, this is.",
      "Is this your bag? — Yes, it is.",
      "jawaban pendek untuk benda pakai it",
    ],
    [
      "Yes, it's.",
      "Yes, it is.",
      "jawaban pendek positif tidak disingkat (No, it isn't tetap boleh)",
    ],
    ["This is my shoes.", "These are my shoes.", "jamak → these are"],
  ],
  summary:
    "Menunjuk atau memperkenalkan → this is. Membicarakan lagi, atau cuaca/waktu/jarak → it is. Bertanya → Is it …? / Is this …?, dan jawab pendek dengan it untuk benda.",
  drill: [
    [
      "Ini kakakku, Dimas. (memperkenalkan)",
      "This is my brother, Dimas.",
      "memperkenalkan → this is",
    ],
    ["Hari ini dingin sekali.", "It's very cold today.", "cuaca → it"],
    [
      "Ini laptop baruku. Ringan sekali.",
      "This is my new laptop. It's very light.",
      "tunjuk → this, bicarakan lagi → it",
    ],
    [
      "Sudah jam sembilan. Ayo pulang.",
      "It's nine o'clock. Let's go home.",
      "waktu → it",
    ],
    ["Jauh nggak dari sini?", "Is it far from here?", "tanya → Is it …?"],
    [
      "Ini payungmu? — Iya.",
      "Is this your umbrella? — Yes, it is.",
      "jawab pendek → it",
    ],
    ["Ini sepatu baruku.", "These are my new shoes.", "jamak → these are"],
    [
      "Itu kantorku, gedung tinggi di sana itu.",
      "That's my office, the tall building over there.",
      "jauh → that",
    ],
  ],
};

// Dekat/jauh × tunggal/jamak. [label, tunggal, jamak]
export const THIT_TABLE: [string, string, string][] = [
  ["Dekat (ini)", "This is my bag.", "These are my bags."],
  ["Jauh (itu)", "That is my car.", "Those are my cars."],
  ["Tanya dekat", "Is this your bag?", "Are these your bags?"],
  ["Tanya jauh", "Is that your car?", "Are those your cars?"],
];

// It kosong. [keadaan, contoh, arti]
export const THIT_EMPTY: [string, string, string][] = [
  ["Cuaca", "It's raining.", "Lagi hujan."],
  ["Waktu", "It's half past seven.", "Sudah jam setengah delapan."],
  [
    "Hari / tanggal",
    "It's Monday. It's May 5th.",
    "Hari ini Senin. Tanggal 5 Mei.",
  ],
  ["Jarak", "It's ten minutes from here.", "Sepuluh menit dari sini."],
  [
    "Keadaan / pendapat",
    "It's okay. It's nice here.",
    "Tidak apa-apa. Enak di sini.",
  ],
  [
    "Lama waktu",
    "It takes ten minutes to get there.",
    "Butuh sepuluh menit untuk ke sana.",
  ],
];

// Tanya → jawaban pendek. [tanya, ya, tidak]
export const THIT_SHORT: [string, string, string][] = [
  ["Is it far?", "Yes, it is.", "No, it isn't."],
  ["Is this your phone?", "Yes, it is.", "No, it isn't."],
  ["Is that your car?", "Yes, it is.", "No, it isn't."],
  ["Are these your keys?", "Yes, they are.", "No, they aren't."],
];
