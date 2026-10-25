import type { AskQ, PracticeStage } from "@/lib/types/ask-practice.types";

// Soal latihan dari bank tertulis (bukan generator): kalimat dengan satu bagian kosong,
// satu kunci, dan tiga pengecoh yang masing-masing punya alasan salah.
export interface BankItem {
  set: string;
  promptId: string;
  prompt: string;
  hint: string;
  ans: string;
  why: string;
  wrong: [string, string][];
  /** Bentuk lain yang juga benar (mis. versi Amerika); diterima saat mengetik, tidak pernah jadi pengecoh. */
  alt?: string[];
  /** Urutan lain dari kata-kata yang sama yang juga benar (dipakai tahap susun kata). */
  orders?: string[];
}

/** Tampilan soal per tahap: teks utama (besar) dan keterangan kecil di bawahnya. */
export interface StageView {
  main: string;
  sub?: string;
}

export interface PracticeGen {
  make: (
    rule: string,
    n: number,
    seed: number,
    done: Record<string, 1>,
  ) => AskQ[];
  norm: (s: string) => string;
  /** Opsional: cara membandingkan jawaban ketik/susun dengan kunci (default: norm sama). */
  check?: (given: string, q: AskQ, stage: PracticeStage) => boolean;
  explain: (q: AskQ, given: string, stage?: PracticeStage) => string;
  /** Opsional: apa yang ditampilkan per tahap (default: prompt + promptId). */
  view?: (q: AskQ, stage: PracticeStage) => StageView;
}

const mulberry = (a: number) => {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const shuffle = <T>(r: () => number, arr: T[]): T[] => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Samakan jawaban: huruf kecil, spasi tunggal, tanpa tanda baca, kontraksi tak-ambigu dibuka.
// 's (is / has) dan 'd (had / would) sengaja dibiarkan — ditangani `variants` di bawah.
export const normAnswer = (s: string): string => {
  return (
    String(s || "")
      .toLowerCase()
      .replace(/[’`]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      // Singkatan positif di akhir kalimat/klausa itu salah (Yes, it's. ✗ → Yes, it is.), jadi jangan dibuka.
      // Ditandai agar tidak pernah sama dengan bentuk panjangnya; negatif (No, it isn't.) tetap boleh.
      .replace(/\b(\w+)'(s|re|ve|m|ll|d)(?=\s*([.,!?;:]|$))/g, "$1_$2_end")
      .replace(/[?.!]+$/, "")
      .replace(/\bwon't\b/g, "will not")
      .replace(/\bcan't\b/g, "cannot")
      .replace(/\b(\w+)n't\b/g, "$1 not")
      .replace(/\bi'm\b/g, "i am")
      .replace(/\b(\w+)'re\b/g, "$1 are")
      .replace(/\b(\w+)'ve\b/g, "$1 have")
      .replace(/\b(\w+)'ll\b/g, "$1 will")
      // Tanda baca di dalam kalimat tidak dinilai (Mr. = Mr, p.m. = pm, koma opsional).
      .replace(/[.,!?;:"]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
};

// Semua kemungkinan bacaan 's → is | has | (kepemilikan) dan 'd → had | would.
const variants = (s: string): string[] => {
  let out = [normAnswer(s)];
  const step = (re: RegExp, a: string, b: string) => {
    out = out.flatMap((x) => {
      const m = x.match(re);
      if (!m || m.index === undefined) return [x];
      const head = x.slice(0, m.index) + m[1] + " ";
      const tail = x.slice(m.index + m[0].length);
      // Bentuk aslinya ikut dipertahankan: 's bisa juga kepemilikan (Rani's car).
      return [x, head + a + tail, head + b + tail];
    });
  };
  // Tiap langkah hanya memproses kontraksi pertama yang tersisa; batasi 3 putaran (cukup untuk satu kalimat).
  for (let i = 0; i < 3; i++) {
    step(/\b(\w+)'s\b/, "is", "has");
    step(/\b(\w+)'d\b/, "had", "would");
  }
  return [...new Set(out)];
};

/** Jawaban dianggap benar kalau salah satu bacaan kontraksinya sama persis dengan kunci. */
export const sameAnswer = (given: string, key: string): boolean => {
  const k = normAnswer(key);
  return variants(given).includes(k);
};

// Kata untuk kartu susun kata: tanpa tanda baca di ujung (urutan lain sering memindahkan titik/koma).
const words = (s: string) =>
  s
    .split(" ")
    .map((w) => w.replace(/[.,!?;:"]+$/, ""))
    .filter(Boolean);
// "Tanpa kata" di tahap ketik (isian kosong, mis. tanpa preposisi).
const EMPTY = /^(—|–|-|tanpa( preposisi)?|kosong|none|nothing)?$/i;

interface Meta {
  pre: string;
  post: string;
  keys: string[]; // kunci + alt (kalimat lengkap)
  orders: string[];
  wrong: [string, string][];
  extra: string[]; // kartu pengecoh
}

// Petunjuk dalam kurung tidak ditampilkan ke pengguna: "___ (know)" → "___", "lampau (last night)" → "lampau".
// Data tetap memakai "___ (petunjuk)" karena split() butuh pola itu untuk memisahkan bagian kosong.
export const noCue = (prompt: string) => prompt.replace(/___ \([^)]*\)/, "___");
export const noParen = (s: string) => s.replace(/\s*\([^)]*\)/g, "").trim();

// Bagian sebelum/sesudah "___ (petunjuk)" dan isi bagian kosong pada sebuah opsi.
const split = (prompt: string) => {
  const m = prompt.match(/^(.*?)___ \([^)]*\)(.*)$/);
  return m ? { pre: m[1], post: m[2] } : { pre: "", post: "" };
};
const fillOf = (opt: string, pre: string, post: string) => {
  const a = opt.slice(pre.trimEnd().length),
    b = a.slice(0, a.length - post.trimStart().length);
  return b.trim();
};

export const bankGen = (bank: BankItem[]): PracticeGen => {
  const meta = new Map<string, Meta>();
  for (const b of bank) {
    const { pre, post } = split(b.prompt);
    const ansFill = new Set(
      words(fillOf(b.ans, pre, post)).map((w) => w.toLowerCase()),
    );
    const extra: string[] = [];
    for (const [w] of b.wrong)
      for (const t of words(fillOf(w, pre, post)))
        if (
          !ansFill.has(t.toLowerCase()) &&
          !extra.some((e) => e.toLowerCase() === t.toLowerCase())
        )
          extra.push(t);
    meta.set(b.ans, {
      pre,
      post,
      keys: [b.ans, ...(b.alt || [])],
      orders: b.orders || [],
      wrong: b.wrong,
      extra: extra.slice(0, 3),
    });
  }
  // Isian ketik → kalimat lengkap, supaya kontraksi / alt / alasan salah tetap dinilai per kalimat.
  const assemble = (m: Meta, given: string) => {
    const g = given.trim();
    return (m.pre + (EMPTY.test(g) ? "" : g) + m.post)
      .replace(/\s+/g, " ")
      .trim();
  };
  return {
    make(rule, n, seed, done) {
      const r = mulberry(seed || 1);
      const pool = bank.filter((b) => b.set === rule);
      const fresh = shuffle(
        r,
        pool.filter((b) => !done[b.ans.toLowerCase()]),
      );
      // Bank habis → isi sisanya dengan soal yang sudah pernah benar supaya set tetap 20 soal.
      const old = shuffle(
        r,
        pool.filter((b) => done[b.ans.toLowerCase()]),
      );
      return fresh
        .concat(old)
        .slice(0, n)
        .map((b) => {
          const explain: Record<string, string> = {
            [b.ans]: "Benar: " + b.why,
          };
          b.wrong.forEach(([w, why]) => (explain[w] = why));
          const tokens = words(b.ans);
          const tiles = tokens.concat(meta.get(b.ans)!.extra);
          return {
            prompt: noCue(b.prompt),
            promptId: b.promptId,
            hint: noParen(b.hint),
            ans: b.ans,
            why: b.why,
            opts: shuffle(r, [b.ans, ...b.wrong.map((w) => w[0])]),
            explain,
            tokens,
            shuffled: shuffle(
              r,
              tiles.map((t, i) => ({ t, i })),
            ),
          };
        });
    },
    norm: normAnswer,
    check(given, q, stage) {
      const m = meta.get(q.ans)!;
      if (stage === "type")
        return m.keys.some((k) => sameAnswer(assemble(m, given), k));
      return [...m.keys, ...m.orders].some((k) => sameAnswer(given, k));
    },
    explain(q, given, stage) {
      const m = meta.get(q.ans);
      if (m && stage === "type") {
        const full = assemble(m, given);
        const hit = m.wrong.find(([w]) => sameAnswer(full, w));
        return hit ? hit[1] : "Bentuknya belum sesuai kunci. " + q.why;
      }
      if (m && stage === "order") {
        const used = new Set(words(given).map((w) => w.toLowerCase()));
        const bad = m.extra.find(
          (t) =>
            used.has(t.toLowerCase()) &&
            !words(q.ans).some((a) => a.toLowerCase() === t.toLowerCase()),
        );
        if (bad) {
          const hit = m.wrong.find(([w]) =>
            words(fillOf(w, m.pre, m.post)).some(
              (t) => t.toLowerCase() === bad.toLowerCase(),
            ),
          );
          return '"' + bad + '" tidak tepat di sini. ' + (hit ? hit[1] : q.why);
        }
        return "Kata-katanya sudah tepat, tapi urutannya belum benar.";
      }
      const hit = Object.keys(q.explain || {}).find(
        (o) => o !== q.ans && sameAnswer(given, o),
      );
      return hit ? q.explain![hit] : "Bentuknya belum sesuai kunci. " + q.why;
    },
    view(q, stage) {
      // Susun kata: hanya arti Indonesia (kalimat Inggris disembunyikan).
      if (stage === "order") return { main: q.promptId || q.prompt };
      return { main: q.prompt, sub: q.promptId };
    },
  };
};
