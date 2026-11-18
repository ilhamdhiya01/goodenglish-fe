"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Jalak from "@/components/brand/Jalak";
import AnswerOption, {
  type AnswerState,
} from "@/components/shared/patterns/answer-option/AnswerOption";
import Correction from "@/components/shared/patterns/correction";
import WordTile from "@/components/shared/patterns/word-tile";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { PRACTICE_CATEGORY } from "@/const/mistake-categories.constant";
import { ASK_GEN } from "@/lib/content";
import { noCue, type PracticeGen } from "@/lib/helpers/bank-practice.helper";
import type {
  AskQ,
  PracticeSession,
  PracticeStage,
} from "@/lib/types/ask-practice.types";
import type { LevelId } from "@/lib/types/session.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
import { confirmDialog } from "@/stores/useConfirmStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { addMistake } from "@/stores/useMistakeStore";
import { usePlanStore } from "@/stores/usePlanStore";
import { usePracticeSessionStore } from "@/stores/usePracticeSessionStore";

const ASK_STAGES: [PracticeStage, string, string][] = [
  [
    "mc",
    "1 · Pilihan ganda",
    "Tahap 1. Pilih pertanyaan yang benar; opsi salahnya adalah jebakan khas rumus ini. Lanjut ke tahap 2 saat akurasi ≥ 80%.",
  ],
  [
    "order",
    "2 · Susun kata",
    "Tahap 2. Klik kata satu per satu untuk menyusun pertanyaannya. Ini melatih urutan kata, inti dari 4 rumus.",
  ],
  [
    "type",
    "3 · Ketik sendiri",
    "Tahap 3. Ketik pertanyaannya sendiri. Huruf besar, tanda tanya, dan kontraksi tidak dihitung salah.",
  ],
];

interface Props {
  rule: string;
  ruleNo: string;
  /** Sumber soal; default generator Bertanya. */
  gen?: PracticeGen | null;
  /** Judul di atas latihan. */
  title?: string;
  /** Label & keterangan tiap tahap. */
  stages?: [PracticeStage, string, string][];
  placeholder?: string;
  /** "Buku kesalahanku" category of wrong answers here. */
  mistakeCategory?: string;
}

// Latihan per rumus/set: 20 soal per set, tiga tahap (pilihan ganda → susun kata → ketik).
// Dipakai tab Bertanya (generator otomatis) dan sub-tab lain dengan bank soal (lib/bank-practice).
// Statistik per rumus/set di ask-practice store.
const AskPractice = React.memo(
  ({
    rule,
    ruleNo,
    gen,
    title = "Soal dibuat otomatis, 20 per set, tidak mengulang yang sudah kamu jawab benar",
    stages: STAGES = ASK_STAGES,
    placeholder = "Ketik pertanyaannya, lalu Enter…",
    mistakeCategory = PRACTICE_CATEGORY.ask,
  }: Props) => {
    const level = useLevelStore((s) => s.level);
    const G: PracticeGen | null = gen === undefined ? ASK_GEN : gen;
    const stats = useAskPracticeStore((s) => s.stats);
    const updateRule = useAskPracticeStore((s) => s.updateRule);
    const resetRule = useAskPracticeStore((s) => s.resetRule);
    const bumpTally = usePlanStore((s) => s.bumpTally);

    // Sesi berjalan disimpan per rumus/set di store (localStorage), jadi tidak hilang saat pindah tab,
    // pindah set, atau refresh. Hanya start(), Tutup, dan reset yang mengganti / menghapusnya.
    const session = usePracticeSessionStore((s) => s.sessions[rule]);
    const setSession = usePracticeSessionStore((s) => s.setSession);
    const stage: PracticeStage = session?.stage ?? "mc";
    const P: PracticeSession | null = session?.P ?? null;
    const setP = (p: PracticeSession | null) => setSession(rule, stage, p);
    // Susun kata: id kartu yang sedang ditandai untuk diganti (klik kata di kotak jawaban).
    const [sel, setSel] = useState<number | null>(null);

    if (!G) return null;
    const R = stats[rule] || { done: {}, seen: 0, right: 0, wrong: 0 };
    const acc = R.seen ? Math.round((R.right / R.seen) * 100) : 0;

    const start = (st: PracticeStage) => {
      const qs = G.make(rule, 20, Date.now() % 2147483647, R.done) as AskQ[];
      setSession(rule, st, {
        stage: st,
        qs,
        i: 0,
        picked: null,
        ok: false,
        typed: "",
        built: [],
        score: 0,
        finished: false,
      });
      setSel(null);
    };
    // built: susunan kata yang dinilai (tahap Susun kata, lewat tombol Periksa).
    const answer = (given: string, built?: PracticeSession["built"]) => {
      if (!P || P.picked !== null) return;
      const q = P.qs[P.i];
      const ok =
        P.stage === "mc"
          ? given === q.ans
          : G.check
            ? G.check(given, q, P.stage)
            : G.norm(given) === G.norm(q.ans);
      updateRule(rule, (cur) => {
        const n = { ...cur, done: { ...cur.done }, seen: cur.seen + 1 };
        if (ok) {
          n.right++;
          n.done[q.ans.toLowerCase()] = 1;
        } else {
          n.wrong++;
          n.retry = [
            ...(cur.retry || []).filter((x) => x.ans !== q.ans),
            { prompt: q.prompt, hint: q.hint, ans: q.ans, why: q.why },
          ].slice(-30);
        }
        return n;
      });
      if (!ok) {
        // Buku kesalahanku: the learner's whole sentence vs the key.
        addMistake({
          source: "Grammar",
          wrong: G.full ? G.full(q, given, P.stage) : given,
          correct: q.ans,
          explanation_id: G.explain(q, given, P.stage).replace(/^Benar: /, ""),
          category: mistakeCategory,
          level: level as LevelId,
          refId: `${rule}:${q.ans}`,
        });
      }
      bumpTally("ask");
      setP({
        ...P,
        built: built || P.built,
        picked: given,
        ok,
        score: P.score + (ok ? 1 : 0),
      });
    };
    const next = () => {
      if (!P) return;
      if (P.i >= P.qs.length - 1) setP({ ...P, finished: true });
      else setP({ ...P, i: P.i + 1, picked: null, typed: "", built: [] });
      setSel(null);
    };

    const q = P ? P.qs[P.i] : null;
    // Tampilan soal bisa beda per tahap (bank soal: susun kata hanya menampilkan arti Indonesia).
    const shown =
      q && P
        ? G.view
          ? G.view(q, P.stage)
          : { main: q.prompt, sub: q.promptId }
        : null;
    const answered = !!P && P.picked !== null;
    const used = new Set((P?.built || []).map((b) => b.i));
    const selOn = sel !== null && used.has(sel) && !answered;
    // Klik kata yang sudah disusun: tandai; klik lagi untuk batal; klik kata lain saat ada yang ditandai → tukar posisi.
    const pickSlot = (id: number) => {
      if (!P) return;
      if (!selOn || sel === id) return setSel(selOn && sel === id ? null : id);
      const a = P.built.find((x) => x.i === sel)!,
        b = P.built.find((x) => x.i === id)!;
      setP({
        ...P,
        built: P.built.map((x) => (x.i === sel ? b : x.i === id ? a : x)),
      });
      setSel(null);
    };
    const hint = STAGES.find((s) => s[0] === stage)![2];
    const optState = (o: string): AnswerState =>
      !answered
        ? "idle"
        : o === q?.ans
          ? "correct"
          : o === P?.picked
            ? "wrong"
            : "dimmed";

    return (
      <div className="flex flex-col gap-4 border-t-2 border-line pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <SectionLabel tone="green">
              LATIHAN TANPA BATAS · {ruleNo}
            </SectionLabel>
            <span className="text-base leading-[22px] font-extrabold text-ink">
              {title}
            </span>
          </div>
          {R.seen > 0 && (
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 text-[13px] font-bold text-ink-2">
              <span>
                dijawab <b className="text-ink">{R.seen}</b>
              </span>
              <span>
                akurasi <b className="text-ink">{acc}%</b>
              </span>
              <span>
                dikuasai{" "}
                <b className="text-ink">{Object.keys(R.done).length}</b>
              </span>
              <TextButton
                onClick={() =>
                  void confirmDialog({
                    title: "Reset latihan rumus ini?",
                    message: "Progres latihan rumus ini akan dihapus.",
                    confirmLabel: "Reset",
                    tone: "danger",
                  }).then((ok) => {
                    if (!ok) return;
                    resetRule(rule);
                    setP(null);
                  })
                }
              >
                reset
              </TextButton>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STAGES.map(([id, label, desc]) => (
            <Pill
              key={id}
              on={stage === id}
              title={desc}
              onClick={() => start(id)}
            >
              {label}
            </Pill>
          ))}
        </div>
        <span className="text-[13.5px] leading-[19px] text-ink-2">{hint}</span>

        {!P && (
          <Button
            variant="green"
            className="self-start"
            onClick={() => start(stage)}
          >
            Mulai 20 soal
          </Button>
        )}

        {P && !P.finished && q && (
          <div className="flex flex-col gap-4 rounded-xl border-2 border-line bg-sunken px-5 py-4.5">
            <div className="flex flex-wrap justify-between gap-2.5 text-[13px] font-extrabold text-ink-2">
              <span>
                Soal {P.i + 1} / {P.qs.length}
              </span>
              <span>benar {P.score}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13.5px] font-bold text-ink-2">
                {q.hint}
              </span>
              <span className="text-[22px] leading-[30px] font-extrabold text-ink">
                {shown?.main}
              </span>
              {!!shown?.sub && (
                <span className="text-[13.5px] text-ink-2">{shown.sub}</span>
              )}
            </div>

            {P.stage === "mc" && (
              <div className="grid gap-2 md:grid-cols-2">
                {q.opts.map((o, k) => (
                  <AnswerOption
                    key={o}
                    letter={"ABCDEFGH"[k]}
                    data-testid="practice-option"
                    disabled={answered}
                    state={optState(o)}
                    note={q.explain?.[o]}
                    onClick={() => answer(o)}
                  >
                    {o}
                  </AnswerOption>
                ))}
              </div>
            )}

            {P.stage === "order" && (
              <>
                {/* Kata di garis jawaban diklik → ditandai; kartu di bawah lalu menggantikannya di posisi yang sama.
                  Klik kata lain (di garis atau kartu yang sudah dipakai) saat ada yang ditandai → keduanya bertukar posisi. */}
                <div className="flex min-h-[52px] flex-wrap items-end justify-between gap-2.5 border-b-[3px] border-ink pb-2">
                  <span className="flex min-h-7 flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[19px] font-extrabold text-ink">
                    {P.built.map((b) =>
                      answered ? (
                        <span key={b.i}>{b.t}</span>
                      ) : (
                        <button
                          type="button"
                          key={b.i}
                          title="Klik untuk mengganti kata ini"
                          onClick={() => pickSlot(b.i)}
                          className={classNames(
                            "cursor-pointer rounded-md px-1 focus-ring",
                            sel === b.i
                              ? "bg-accent text-on-accent"
                              : "hover:bg-accent-tint",
                          )}
                        >
                          {b.t}
                        </button>
                      ),
                    )}
                  </span>
                  {P.built.length > 0 && !answered && (
                    <span className="shrink-0 text-xs font-bold text-ink-2">
                      {selOn
                        ? "pilih kata pengganti di bawah · klik lagi untuk batal"
                        : "klik kata untuk menggantinya"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {q.shuffled.map((tk) => {
                    const u = used.has(tk.i);
                    return (
                      <WordTile
                        key={tk.i}
                        data-testid="practice-token"
                        used={u && sel !== tk.i}
                        selected={u && sel === tk.i}
                        onClick={() => {
                          if (answered) return;
                          // Kartu yang sudah dipakai = kata yang sudah ada di garis: perlakukan sama seperti mengklik kata itu.
                          if (u) return pickSlot(tk.i);
                          if (selOn) {
                            setP({
                              ...P,
                              built: P.built.map((x) => (x.i === sel ? tk : x)),
                            });
                            return setSel(null);
                          }
                          // Not checked yet: the learner presses Periksa,
                          // so a stray tap on the last tile can't submit.
                          setP({ ...P, built: [...P.built, tk] });
                        }}
                      >
                        {tk.t}
                      </WordTile>
                    );
                  })}
                </div>
                {!answered && (
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      variant="green"
                      disabled={P.built.length < q.tokens.length}
                      onClick={() =>
                        answer(P.built.map((b) => b.t).join(" "), P.built)
                      }
                    >
                      Periksa
                    </Button>
                    {P.built.length > 0 && (
                      <TextButton
                        onClick={() => {
                          setP({ ...P, built: [] });
                          setSel(null);
                        }}
                      >
                        Susun ulang
                      </TextButton>
                    )}
                    {P.built.length < q.tokens.length && (
                      <span className="text-[13px] font-bold text-ink-2">
                        Pakai semua kata dulu ({P.built.length}/
                        {q.tokens.length})
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {P.stage === "type" && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={P.typed}
                  onChange={(e) => setP({ ...P, typed: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !answered && P.typed.trim())
                      answer(P.typed);
                  }}
                  aria-label="Jawabanmu"
                  placeholder={placeholder}
                  className="min-w-[240px] flex-1 bg-surface"
                />
                {!answered && (
                  <Button
                    variant="green"
                    onClick={() => P.typed.trim() && answer(P.typed)}
                  >
                    Periksa
                  </Button>
                )}
              </div>
            )}

            {answered && (
              <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-line pt-3">
                <span
                  role="status"
                  className={classNames(
                    "text-[15px] font-extrabold",
                    P.ok ? "text-ok" : "text-bad",
                  )}
                >
                  {P.ok
                    ? "Benar."
                    : "Kurang tepat. Soal ini akan muncul lagi di set berikutnya."}
                </span>
                {!P.ok && P.stage !== "mc" && (
                  <span className="rounded-lg bg-bad-bg px-3 py-2.5 text-[13.5px] leading-[19px] text-ink">
                    <b className="font-extrabold">Jawabanmu:</b> {P.picked} —{" "}
                    {G.explain(q, P.picked || "", P.stage)}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xl leading-[26px] font-extrabold text-ink">
                    {q.ans}
                  </span>
                  {!!q.ansId && (
                    <span className="text-[13.5px] text-ink-2">{q.ansId}</span>
                  )}
                  <SpeakButton text={q.ans} />
                </div>
                <span className="text-[13.5px] leading-[19px] text-ink-2">
                  {q.why}
                </span>
                <Button variant="green" className="self-end" onClick={next}>
                  {P.i >= P.qs.length - 1 ? "Lihat hasil" : "Soal berikutnya"}
                </Button>
              </div>
            )}
          </div>
        )}

        {P && P.finished && (
          <Card tone="done" pad="lg" className="gap-3">
            <Jalak
              mood={P.score / P.qs.length >= 0.8 ? "senang" : "biasa"}
              size={96}
            />
            <span className="text-[44px] leading-12 font-black tracking-[-0.02em] text-ink">
              {P.score} / {P.qs.length}{" "}
              <span className="text-base font-bold text-ink-2">
                · {Math.round((P.score / P.qs.length) * 100)}%
              </span>
            </span>
            <span className="text-[15px] leading-[22px] text-ink-2">
              {P.score >= 16
                ? "Bagus. Kamu siap ke tahap berikutnya atau rumus berikutnya."
                : P.score >= 12
                  ? "Cukup baik. Generate set baru dan coba lagi; soal yang salah akan muncul lagi."
                  : "Belum stabil. Baca ulang langkah-langkahnya, lalu generate set baru."}
            </span>
            <div className="mt-1 flex flex-wrap gap-2.5">
              <Button variant="green" onClick={() => start(P.stage)}>
                Generate 20 soal baru
              </Button>
              <Button onClick={() => setP(null)}>Tutup</Button>
            </div>
          </Card>
        )}

        {!!R.retry?.length && (
          <div className="flex flex-col gap-2">
            <SectionLabel tone="red">
              TERAKHIR SALAH · AKAN MUNCUL LAGI
            </SectionLabel>
            <div className="grid gap-2 md:grid-cols-2">
              {R.retry
                .slice(-6)
                .reverse()
                .map((x, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1.5 rounded-lg border-2 border-bad-line bg-bad-bg px-3.5 py-3"
                  >
                    <span className="text-[13px] text-ink-2">
                      {noCue(x.prompt)} · {x.hint}
                    </span>
                    <Correction right={x.ans} speak={x.ans} />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  },
);

AskPractice.displayName = "AskPractice";

export default AskPractice;
