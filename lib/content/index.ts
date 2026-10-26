/* eslint-disable @typescript-eslint/no-explicit-any -- the content packs are untyped JS data (see raw/*.js); typing them is phase-2 work when content moves to the database. */
import ask from "./raw/ask.js";
import askgen from "./raw/askgen.js";
import beginner from "./raw/beginner.js";
import exId from "./raw/ex-id.js";
import extras from "./raw/extras.js";
import extras2 from "./raw/extras2.js";
import extras3 from "./raw/extras3.js";
import forms from "./raw/forms.js";
import idmap from "./raw/id.js";
import inter from "./raw/inter.js";
import notes from "./raw/notes.js";
import notesV2Index from "./raw/notes-v2-index.js";
import pron from "./raw/pron.js";
import ttt from "./raw/ttt.js";
import upper from "./raw/upper.js";
import w1 from "./raw/w1.js";
import w2 from "./raw/w2.js";
import w3 from "./raw/w3.js";
import w4 from "./raw/w4.js";
import w5 from "./raw/w5.js";
import w6 from "./raw/w6.js";
import w7 from "./raw/w7.js";
import w8 from "./raw/w8.js";
import w9 from "./raw/w9.js";
import w10 from "./raw/w10.js";
import w11 from "./raw/w11.js";
import w12 from "./raw/w12.js";
import x1 from "./raw/x1.js";
import x2 from "./raw/x2.js";
import x3 from "./raw/x3.js";
import x4 from "./raw/x4.js";
import x5 from "./raw/x5.js";
import x6 from "./raw/x6.js";
import x7 from "./raw/x7.js";

// Semua paket data dijalankan berurutan ke satu objek bersama, meniru urutan <script> pada versi HTML.
const W: Record<string, any> = {};
[
  w1,
  w2,
  w3,
  w4,
  w5,
  w6,
  w7,
  w8,
  w9,
  w10,
  w11,
  w12,
  x1,
  x2,
  x3,
  x4,
  x5,
  x6,
  x7,
  beginner,
  inter,
  upper,
  extras,
  forms,
  pron,
  ask,
  askgen,
  idmap,
  notes,
  notesV2Index,
  extras2,
  ttt,
  exId,
  // Last: appends to VOCAB_L / VOCAB_X / VERB_FORMS / VOCAB_ID set up above.
  extras3,
].forEach((f) => f(W));

export const VOCAB: Record<string, any> = W.VOCAB || {};
export const VOCAB_X: Record<string, any[]> = W.VOCAB_X || {};
export const VOCAB_L: Record<string, any> = W.VOCAB_L || {};
export const VOCAB_SCEN: any[] = W.VOCAB_SCEN || [];
export const VOCAB_ERRORS: any[] = W.VOCAB_ERRORS || [];
export const VERB_FORMS: {
  IRREG: Record<string, string[]>;
  SPELL: Record<string, string[]>;
} = W.VERB_FORMS || { IRREG: {}, SPELL: {} };
export const VOCAB_PRON: any = W.VOCAB_PRON || null;
export const VOCAB_ASK: any = W.VOCAB_ASK || null;
export const ASK_GEN: {
  make: (
    rule: string,
    n: number,
    seed: number,
    done: Record<string, 1>,
  ) => any[];
  norm: (s: string) => string;
  explain: (q: any, opt: string) => string;
} | null = W.ASK_GEN || null;

// Bentuk V2 / V3 per kartu kata kerja: kunci "type|en|arti" → [V2, V3, 1 = tak beraturan].
import verbCards from "./verb-forms.json";
export const VERB_CARDS = verbCards as unknown as Record<
  string,
  [string, string, number]
>;

export const VOCAB_ID: { get: (en: string) => string } = W.VOCAB_ID || {
  get: () => "",
};
export const idOf = (en?: string): string => (en ? VOCAB_ID.get(en) : "");

// Penjelasan detail per kata: mekanisme di notes.js, indeks kata di notes-v2-index.js (langsung),
// isi penjelasan di notes-v2-<level>.js (±2,6 MB) yang dimuat belakangan lewat loadNotes() supaya bundle awal tetap ringan.
export interface WordNote {
  core: string;
  forms?: [string, string][];
  use?: [string, string][];
  traps?: [string, string, string?][];
  see?: string[];
}
export const VOCAB_NOTES: {
  has: (en: string) => boolean;
  get: (en: string) => WordNote | null;
  count: number;
} = W.VOCAB_NOTES || { has: () => false, get: () => null, count: 0 };
/** Ada penjelasan untuk kata ini? Langsung tersedia, tanpa menunggu loadNotes(). */
export const hasNote = (en?: string): boolean =>
  en ? VOCAB_NOTES.has(en) : false;
/** Isi penjelasan; null sampai loadNotes() selesai. */
export const noteOf = (en?: string): WordNote | null =>
  en ? VOCAB_NOTES.get(en) : null;

let notesReady = false;
let notesLoading: Promise<void> | null = null;
const notesListeners = new Set<() => void>();
export const notesLoaded = (): boolean => notesReady;
export const onNotesLoaded = (fn: () => void): (() => void) => {
  notesListeners.add(fn);
  return () => notesListeners.delete(fn);
};
/** Muat isi penjelasan semua level (sekali saja; kalau gagal, misalnya offline, boleh dicoba lagi). */
export const loadNotes = (): Promise<void> => {
  if (notesReady) return Promise.resolve();
  notesLoading ||= Promise.all([
    import("./raw/notes-v2-beginner.js"),
    import("./raw/notes-v2-pre.js"),
    import("./raw/notes-v2-inter.js"),
    import("./raw/notes-v2-upper.js"),
    import("./raw/notes-v2-extra.js"),
  ])
    .then((mods) => {
      mods.forEach((m) => m.default(W));
      notesReady = true;
      notesListeners.forEach((fn) => fn());
    })
    .catch((e) => {
      notesLoading = null;
      throw e;
    });
  return notesLoading;
};

export interface ScenKey {
  phrases: [string, string, string][];
  variants: [string, string][];
}
export const VOCAB_SCEN_KEY: Record<string, ScenKey> = W.VOCAB_SCEN_KEY || {};
export const CONJ_JOIN: Record<string, [string, string, string, string]> =
  W.CONJ_JOIN || {};
