import { PRE_PLAN } from "@/const/plan.constant";
import { VOCAB, VOCAB_L, VOCAB_X } from "@/lib/content";
import type { CustomWord, Item, PlanRow, Week } from "@/lib/types/vocab.types";

export interface LevelData {
  plan: PlanRow[];
  V: Record<string, Week>;
}

export interface Flat {
  w: number;
  it: Item;
  lv?: string;
}

// Dua arti dianggap sama kalau ada kata (≥3 huruf) yang beririsan, mis. "sebelum" vs "sebelum". "jam tangan" vs "menonton" dianggap beda.
// Sinonim Indonesia yang sering dipakai bergantian dalam data.
const SYN: string[][] = [
  ["rekan", "kolega"],
  ["penasaran", "ingin tahu"],
  ["performa", "kinerja"],
  ["target", "tujuan", "sasaran"],
  ["pilihan", "opsi"],
  ["masuk akal", "wajar"],
  ["segera", "langsung"],
  ["menguji", "tes", "ujian"],
  ["tinggal", "menginap"],
  ["beres", "merapikan", "rapi"],
  ["mengantar", "menurunkan"],
  ["tenang", "menenangkan"],
  ["permintaan", "permohonan"],
  ["tawaran", "menawarkan"],
  ["nggak mungkin", "masa sih", "serius"],
  ["maksudmu", "maksudnya"],
  ["mungkin", "barangkali"],
];
const norm = (s: string) => {
  let x = s.toLowerCase().replace(/\(.*?\)/g, " ");
  SYN.forEach((g) =>
    g.forEach((w) => {
      if (x.includes(w)) x = x.replace(w, " " + g[0].replace(/ /g, "_") + " ");
    }),
  );
  return x;
};
const tokens = (s: string) =>
  norm(s)
    .split(/[^a-z_]+/)
    .filter((x) => x.length >= 3);
export const sameMeaning = (a: string, b: string): boolean => {
  const ta = tokens(a),
    tb = tokens(b);
  if (!ta.length || !tb.length) return true;
  return ta.some((x) =>
    tb.some(
      (y) =>
        x === y ||
        (x.length >= 4 &&
          y.length >= 4 &&
          (x.includes(y) || y.includes(x) || x.slice(0, 5) === y.slice(0, 5))),
    ),
  );
};

// Buang kata yang muncul lebih dari sekali dalam satu level (dipakai yang paling awal). Kata yang sama tapi artinya beda (watch = jam tangan / menonton) tetap dipertahankan.
// Kata yang sengaja muncul dua kali dengan kelas kata berbeda (sifat vs kerja, benda vs kerja) dan artinya mirip di bahasa Indonesia.
const KEEP_BOTH = new Set(["open", "clean", "stop", "turn"]);
export const dedupe = (V: Record<string, Week>): Record<string, Week> => {
  const seen: Record<string, string[]> = {};
  const out: Record<string, Week> = {};
  Object.keys(V)
    .sort((a, b) => +a - +b)
    .forEach((w) => {
      const items: Item[] = [];
      V[w].items.forEach((it) => {
        const k = it[1].toLowerCase().trim();
        const prev = seen[k] || [];
        if (!KEEP_BOTH.has(k) && prev.some((m) => sameMeaning(m, it[3])))
          return;
        seen[k] = [...prev, it[3]];
        items.push(it);
      });
      out[w] = { ...V[w], items };
    });
  return out;
};

// Susun {plan, V} untuk satu level. Pre-intermediate memakai VOCAB + VOCAB_X (dedupe per kata), level lain dari VOCAB_L.
export const levelData = (id: string, custom: CustomWord[]): LevelData => {
  let out: LevelData;
  if (id === "pre") {
    const V: Record<string, Week> = {};
    Object.keys(VOCAB)
      .sort((a, b) => +a - +b)
      .forEach((w) => {
        V[w] = {
          ...VOCAB[w],
          items: (VOCAB[w].items as Item[]).concat(
            (VOCAB_X[w] || []) as Item[],
          ),
        };
      });
    out = { plan: PRE_PLAN, V: dedupe(V) };
  } else {
    const L = VOCAB_L[id];
    out = L
      ? { plan: L.plan || [], V: dedupe({ ...(L.weeks || {}) }) }
      : { plan: [], V: {} };
  }
  // Kata tambahan pengguna ("Kataku"): [type,en,pron,id,ex,syn] + key di index 6
  const mine = custom.filter((c) => c.level === id);
  if (mine.length) {
    const V: Record<string, Week> = {};
    Object.keys(out.V).forEach((w) => {
      V[w] = { ...out.V[w], items: [...out.V[w].items] };
    });
    mine.forEach((c) => {
      const w = String(c.week);
      if (!V[w]) {
        const p = out.plan.find((x) => x[0] === c.week);
        V[w] = {
          week: c.week,
          title: p ? p[1] : "Minggu " + c.week,
          topic: "",
          tense: null,
          conj: [],
          items: [],
        };
      }
      V[w].items.push([
        c.type,
        c.en,
        c.pron || "",
        c.id,
        c.ex || "",
        c.syn || "",
        c.key,
      ]);
    });
    out = { plan: out.plan, V };
  }
  return out;
};

export const flatten = (V: Record<string, Week>): Flat[] => {
  const all: Flat[] = [];
  Object.keys(V).forEach((w) =>
    V[w].items.forEach((it) => all.push({ w: +w, it })),
  );
  return all;
};

// Tebak jenis kata dari bentuknya. Bisa diubah manual di form.
export const guessType = (en: string): string => {
  const s = en.trim(),
    low = s.toLowerCase(),
    words = low.split(/\s+/);
  const CJ = [
    "and",
    "but",
    "so",
    "because",
    "although",
    "though",
    "however",
    "whereas",
    "while",
    "since",
    "unless",
    "until",
    "therefore",
    "moreover",
    "otherwise",
    "meanwhile",
    "despite",
    "besides",
    "nevertheless",
    "furthermore",
    "instead",
    "yet",
    "as",
    "if",
    "once",
    "whenever",
    "wherever",
  ];
  if (words.length === 1 && CJ.includes(low)) return "cj";
  if (/[?!]$/.test(s) || /^(hey|oh|wow|yeah|nope|yep|okay|ok)\b/.test(low))
    return "ex";
  if (
    /…|\.\.\.|\+|\b(sb|sth|someone|something)\b/.test(low) ||
    /^(i|you|we|they|it|let's|would|could|shall|do|does|did|how|what|why|where|when)\b.*\b(you|i|we|me|us)\b/.test(
      low,
    )
  )
    return "st";
  const PART = [
    "up",
    "down",
    "out",
    "off",
    "on",
    "in",
    "into",
    "over",
    "away",
    "back",
    "through",
    "along",
    "around",
    "about",
    "after",
    "for",
    "with",
    "to",
    "by",
    "at",
  ];
  if (
    words.length === 2 &&
    PART.includes(words[1]) &&
    /^[a-z]+$/.test(words[0])
  )
    return "pv";
  if (words.length === 3 && PART.includes(words[1]) && PART.includes(words[2]))
    return "pv";
  if (words.length === 1) return "w";
  if (words.length >= 4) return "ex";
  return "col";
};
