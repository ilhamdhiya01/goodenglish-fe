import type { Detail } from "@/lib/types/grammar.types";

// Sub-tab "In / On / At": preposisi waktu, tempat, dan kendaraan.
export const PREP_DETAIL: Detail = {
  label: "IN · ON · AT",
  title: "Dari yang luas ke yang paling tepat",
  idea: 'Bahasa Indonesia cukup pakai "di" atau "pada", sedangkan bahasa Inggris memilih in, on, atau at sesuai seberapa luas tempat atau waktunya. In untuk yang luas atau "di dalam", on untuk permukaan, hari, dan tanggal, at untuk satu titik yang tepat.',
  steps: [
    {
      t: "Waktu: in → on → at",
      b: "In untuk rentang panjang: bulan, tahun, musim, abad, bagian hari. On untuk hari dan tanggal. At untuk jam dan momen tertentu (noon, night, the weekend versi UK).",
      ex: [
        ["I was born in 1998, in March.", "Aku lahir tahun 1998, bulan Maret."],
        [
          "The meeting is on Monday, on May 5th.",
          "Rapatnya hari Senin, tanggal 5 Mei.",
        ],
        ["It starts at 9 a.m.", "Mulainya jam 9 pagi."],
      ],
    },
    {
      t: "Tempat: in → on → at",
      b: "In untuk ruang tertutup atau wilayah (in the room, in Jakarta). On untuk permukaan dan jalan (on the table, on Sudirman Street). At untuk titik atau alamat lengkap dan tempat kegiatan (at the door, at No. 5, at the office).",
      ex: [
        ["She lives in Jakarta.", "Dia tinggal di Jakarta."],
        ["Her office is on Sudirman Street.", "Kantornya di Jalan Sudirman."],
        ["I'm at the station.", "Aku di stasiun (titik kumpul)."],
      ],
    },
    {
      t: "In vs at untuk tempat yang sama",
      b: 'Pakai in kalau menekankan "di dalam" bangunannya. Pakai at kalau menekankan tempat sebagai lokasi kegiatan atau titik temu.',
      ex: [
        ["Let's meet at the mall.", "Ketemu di mal (lokasi janjian)."],
        ["It's cold in the mall.", "Di dalam mal dingin."],
        ["He is at school now.", "Dia sedang di sekolah (sedang sekolah)."],
      ],
    },
    {
      t: "Kendaraan: in vs on",
      b: "In untuk kendaraan kecil yang kamu duduki dan tidak bisa berdiri di dalamnya (car, taxi). On untuk kendaraan umum atau besar yang bisa dinaiki berdiri, dan kendaraan yang dinaiki di atasnya (bus, train, plane, ship, bike, motorcycle). Untuk cara pergi: by car, by bus, on foot.",
      ex: [
        ["I'm in a taxi.", "Aku di taksi."],
        ["She's on the bus.", "Dia di bus."],
        ["I go to work by motorcycle.", "Aku ke kantor naik motor."],
      ],
    },
    {
      t: "Kapan TANPA preposisi",
      b: "Kata waktu dengan this, next, last, every, tomorrow, yesterday, today, tonight tidak memakai in/on/at. Home setelah kata kerja gerak juga tanpa preposisi (go home).",
      ex: [
        ["I saw her last Monday.", "Aku ketemu dia Senin lalu."],
        ["We're leaving next week.", "Kami berangkat minggu depan."],
        ["Let's go home.", "Ayo pulang."],
      ],
    },
  ],
  traps: [
    ["in Monday", "on Monday", "hari pakai on"],
    ["on 2024", "in 2024", "tahun pakai in"],
    ["in 7 o'clock", "at 7 o'clock", "jam pakai at"],
    [
      "in the night",
      "at night",
      "pengecualian: in the morning, in the afternoon, in the evening, tapi at night",
    ],
    ["on last Friday", "last Friday", "last/next/this/every tanpa preposisi"],
    ["go to home", "go home", "home tanpa to"],
    ["in the bus", "on the bus", "kendaraan umum pakai on"],
    ["I live at Jakarta.", "I live in Jakarta.", "kota dan negara pakai in"],
  ],
  summary:
    "In untuk yang luas atau di dalam, on untuk permukaan, hari, dan tanggal, at untuk titik dan jam yang tepat. Kalau ada this, next, last, atau every, tidak perlu preposisi.",
  drill: [
    ["Aku bangun jam enam.", "I wake up at six."],
    ["Ulang tahunku tanggal 12 Agustus.", "My birthday is on August 12th."],
    ["Dia lahir tahun 2001.", "She was born in 2001."],
    ["Kami libur di bulan Desember.", "We have a holiday in December."],
    ["Aku kerja di malam hari.", "I work at night."],
    ["Bukunya di atas meja.", "The book is on the table."],
    ["Kuncinya di dalam tas.", "The keys are in the bag."],
    ["Aku tunggu di pintu.", "I'll wait at the door."],
    ["Dia sedang di kantor.", "He's at the office."],
    ["Aku sedang di kereta.", "I'm on the train."],
    ["Ayo ketemu hari Jumat depan.", "Let's meet next Friday."],
    [
      "Rumahnya di Jalan Merdeka nomor 10.",
      "His house is at 10 Merdeka Street.",
    ],
  ],
};

// Tabel ringkas: [kategori, in, on, at]
export const PREP_TABLE: [string, string, string, string][] = [
  [
    "Waktu",
    "March · 2024 · summer · the morning · the 1990s",
    "Monday · May 5th · my birthday · Christmas Day",
    "7 o'clock · noon · night · the moment · Christmas",
  ],
  [
    "Tempat",
    "the room · the box · Jakarta · Indonesia · the car",
    "the table · the wall · the floor · Sudirman Street · page 5",
    "the door · the bus stop · No. 10 · home · work · school",
  ],
  [
    "Kendaraan",
    "a car · a taxi",
    "the bus · the train · the plane · a bike · a motorcycle",
    "—",
  ],
  [
    "Ungkapan tetap",
    "in time · in the end · in a hurry · in my opinion",
    "on time · on purpose · on sale · on TV",
    "at first · at least · at the end of · at the moment",
  ],
];

// Pasangan yang sering tertukar: [ungkapan 1, arti, ungkapan 2, arti]
export const PREP_PAIRS: [string, string, string, string][] = [
  [
    "on time",
    "tepat waktu sesuai jadwal",
    "in time",
    "masih sempat, tidak terlambat",
  ],
  [
    "in the end",
    "akhirnya (setelah proses)",
    "at the end (of)",
    "di bagian akhir (titik)",
  ],
  [
    "in the corner",
    "di pojok dalam ruangan",
    "on / at the corner",
    "di pojok jalan / persimpangan",
  ],
  ["at the weekend", "akhir pekan (UK)", "on the weekend", "akhir pekan (AS)"],
];
