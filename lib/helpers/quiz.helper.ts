import { VERB_FORMS } from "@/lib/content";
import type { Flat } from "@/lib/helpers/level-data.helper";
import type { QuizQ, QuizState } from "@/lib/types/quiz.types";

const shuffle = <T>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

export const buildQuiz = (all: Flat[]): QuizState | null => {
  const norm = (s: string) => s.trim().toLowerCase();
  // arti yang sama dengan katanya (mis. API → API) membocorkan jawaban
  const pool = all.filter(
    (x) => x.it[3] && x.it[3].length < 48 && norm(x.it[3]) !== norm(x.it[1]),
  );
  if (pool.length < 8) return null;
  const seen = new Set<string>();
  const pick = shuffle(pool)
    .filter((x) => {
      const k = norm(x.it[1]);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 20);
  const IR = VERB_FORMS.IRREG || {};
  const irr = all.filter(
    (x) =>
      x.it[0] === "w" &&
      IR[x.it[1].toLowerCase()] &&
      !/\//.test(IR[x.it[1].toLowerCase()][0]),
  );
  const irrPast = [
    ...new Set(
      Object.values(IR)
        .map((f) => f[0])
        .filter((p) => !/\//.test(p)),
    ),
  ];
  const qs: QuizQ[] = pick.map((x) => {
    const used = new Set([norm(x.it[3])]);
    const wrong = shuffle(pool.filter((y) => y.it[1] !== x.it[1]))
      .map((y) => y.it[3])
      .filter((m) => {
        const k = norm(m);
        if (used.has(k)) return false;
        used.add(k);
        return true;
      })
      .slice(0, 3);
    return {
      word: x.it[1],
      ex: x.it[4],
      ans: x.it[3],
      prompt: "Apa arti kata ini?",
      opts: shuffle([x.it[3], ...wrong]),
    };
  });
  // ganti hingga 5 soal dengan soal bentuk lampau (V2) untuk verb tidak beraturan yang ada di level ini
  if (irr.length >= 4) {
    const inQ = new Set(qs.map((q) => norm(q.word)));
    const pv = shuffle(irr)
      .filter(
        (x, i, a) => a.findIndex((y) => norm(y.it[1]) === norm(x.it[1])) === i,
      )
      .slice(0, 5);
    pv.forEach((x, i) => {
      const ans = IR[x.it[1].toLowerCase()][0];
      const wrong = shuffle(irrPast.filter((p) => p !== ans)).slice(0, 3);
      qs[qs.length - 1 - i] = {
        word: x.it[1],
        ex: x.it[3],
        ans,
        prompt: "Bentuk lampau (V2) dari kata ini?",
        opts: shuffle([ans, ...wrong]),
      };
    });
    qs.sort(() => Math.random() - 0.5);
  }
  return { qs, i: 0, score: 0, picked: null, done: false };
};
