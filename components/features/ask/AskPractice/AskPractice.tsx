"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import Pill from "@/components/ui/pill";
import SpeakButton from "@/components/ui/speak-button";
import SpeakerIcon from "@/components/ui/speaker-icon";
import TextButton from "@/components/ui/text-button";
import { ASK_GEN } from "@/lib/content";
import { noCue, type PracticeGen } from "@/lib/helpers/bank-practice.helper";
import { speak } from "@/lib/helpers/speech.helper";
import type {
  AskQ,
  PracticeSession,
  PracticeStage,
} from "@/lib/types/ask-practice.types";
import { useAskPracticeStore } from "@/stores/useAskPracticeStore";
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
  }: Props) => {
    const G: PracticeGen | null = gen === undefined ? ASK_GEN : gen;
    const stats = useAskPracticeStore((s) => s.stats);
    const updateRule = useAskPracticeStore((s) => s.updateRule);
    const resetRule = useAskPracticeStore((s) => s.resetRule);

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
    // built: susunan kata terbaru dari tahap Susun kata. answer() dipanggil lewat setTimeout dengan P lama
    // (belum berisi kata terakhir), jadi tanpa ini kata terakhir hilang dari kotak jawaban setelah dinilai.
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

    return (
      <div className="flex flex-col gap-3.5 border-t-[1.5px] border-ink pt-[18px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-[3px]">
            <span className="font-mono text-xs tracking-[0.06em] text-green">
              LATIHAN TANPA BATAS · {ruleNo}
            </span>
            <span className="text-[17px] font-bold">{title}</span>
          </div>
          {R.seen > 0 && (
            <div className="flex items-baseline gap-3.5 font-mono text-xs text-muted">
              <span>
                dijawab <b className="text-ink">{R.seen}</b>
              </span>
              <span>
                akurasi <b className="text-ink">{acc}%</b>
              </span>
              <span>
                dikuasai{" "}
                <b className="text-green">{Object.keys(R.done).length}</b>
              </span>
              <TextButton
                onClick={() => {
                  if (window.confirm("Hapus progres latihan rumus ini?")) {
                    resetRule(rule);
                    setP(null);
                  }
                }}
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
              className="h-9 px-3.5 text-[13.5px]"
            >
              {label}
            </Pill>
          ))}
        </div>
        <span className="text-[13.5px] leading-[1.5] text-ink-3">{hint}</span>

        {!P && (
          <Button
            variant="green"
            className="self-start px-5 py-[11px]"
            onClick={() => start(stage)}
          >
            Mulai 20 soal
          </Button>
        )}

        {P && !P.finished && q && (
          <div className="flex flex-col gap-3.5 rounded-xl border-[1.5px] border-ink bg-sand px-[22px] py-5">
            <div className="flex flex-wrap justify-between gap-2.5 font-mono text-xs text-muted">
              <span>
                SOAL {P.i + 1} / {P.qs.length}
              </span>
              <span>benar {P.score}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-muted">{q.hint}</span>
              <span className="font-serif text-[26px] leading-[1.3]">
                {shown?.main}
              </span>
              {!!shown?.sub && (
                <span className="text-[13.5px] text-muted">{shown.sub}</span>
              )}
            </div>

            {P.stage === "mc" && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2">
                {q.opts.map((o) => {
                  const right = o === q.ans;
                  const chosen = o === P.picked;
                  return (
                    <button
                      type="button"
                      key={o}
                      onClick={() => answer(o)}
                      className={classNames(
                        "flex cursor-pointer flex-col gap-1.5 rounded-lg border-[1.5px] px-3.5 py-3 text-left font-sans text-[15px] transition-colors hover:border-ink",
                        answered && right
                          ? "border-green bg-green-bg2"
                          : answered && chosen
                            ? "border-red bg-red-bg"
                            : "border-line-2 bg-card",
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span>{o}</span>
                        {answered && (
                          <span
                            className={classNames(
                              "font-mono text-[11px] whitespace-nowrap",
                              right ? "text-green" : "text-red",
                            )}
                          >
                            {right ? "✓ benar" : chosen ? "✗ pilihanmu" : "✗"}
                          </span>
                        )}
                      </span>
                      {answered && (
                        <span
                          className={classNames(
                            "border-t border-dashed border-black/15 pt-1.5 text-[12.5px] leading-[1.45]",
                            right ? "text-green-deep" : "text-red-deep",
                          )}
                        >
                          {q.explain?.[o]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {P.stage === "order" && (
              <>
                {/* Kata di kotak jawaban diklik → ditandai; kartu di bawah lalu menggantikannya di posisi yang sama.
                  Klik kata lain (di kotak atau kartu abu-abu) saat ada yang ditandai → keduanya bertukar posisi. */}
                <div className="flex min-h-[46px] items-center justify-between gap-2.5 rounded-lg border-[1.5px] border-dashed border-faint bg-card px-3 py-2.5">
                  <span className="flex min-h-[22px] flex-wrap items-baseline gap-x-1 font-serif text-[19px]">
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
                            "cursor-pointer rounded border-none px-1 font-serif text-[19px]",
                            sel === b.i
                              ? "bg-green text-card"
                              : "bg-transparent text-ink hover:bg-green-bg2",
                          )}
                        >
                          {b.t}
                        </button>
                      ),
                    )}
                  </span>
                  {P.built.length > 0 && !answered && (
                    <span className="shrink-0 text-xs text-faint">
                      {selOn
                        ? "pilih kata pengganti di bawah · klik lagi untuk batal"
                        : "klik kata untuk menggantinya"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {q.shuffled.map((tk) => {
                    const u = used.has(tk.i);
                    return (
                      <button
                        type="button"
                        key={tk.i}
                        onClick={() => {
                          if (answered) return;
                          // Kartu abu-abu = kata yang sudah ada di kotak: perlakukan sama seperti mengklik kata itu.
                          if (u) return pickSlot(tk.i);
                          if (selOn) {
                            setP({
                              ...P,
                              built: P.built.map((x) => (x.i === sel ? tk : x)),
                            });
                            return setSel(null);
                          }
                          const nb = [...P.built, tk];
                          setP({ ...P, built: nb });
                          if (nb.length === q.tokens.length)
                            setTimeout(
                              () => answer(nb.map((b) => b.t).join(" "), nb),
                              120,
                            );
                        }}
                        className={classNames(
                          "rounded-lg border-[1.5px] px-3 py-2 font-sans text-[15px]",
                          u
                            ? sel === tk.i
                              ? "cursor-pointer border-green bg-green-bg2 text-green-deep"
                              : "cursor-pointer border-track bg-transparent text-[#c4beb0] hover:border-line-2"
                            : classNames(
                                "cursor-pointer border-ink bg-card text-ink hover:bg-sand",
                                selOn && "border-green",
                              ),
                        )}
                      >
                        {tk.t}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {P.stage === "type" && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={P.typed}
                  onChange={(e) => setP({ ...P, typed: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !answered && P.typed.trim())
                      answer(P.typed);
                  }}
                  placeholder={placeholder}
                  className="min-w-[240px] flex-1 rounded-lg border-[1.5px] border-ink bg-card px-[13px] py-[11px] font-sans text-base text-ink outline-none"
                />
                {!answered && (
                  <Button
                    variant="dark"
                    className="px-[18px] py-[11px]"
                    onClick={() => P.typed.trim() && answer(P.typed)}
                  >
                    Periksa
                  </Button>
                )}
              </div>
            )}

            {answered && (
              <div className="flex flex-col gap-2 border-t border-dashed border-line-2 pt-3">
                <span
                  className={classNames(
                    "text-[15px] font-bold",
                    P.ok ? "text-green" : "text-red",
                  )}
                >
                  {P.ok
                    ? "Benar."
                    : "Kurang tepat. Soal ini akan muncul lagi di set berikutnya."}
                </span>
                {!P.ok && P.stage !== "mc" && (
                  <span className="rounded-md bg-red-bg px-2.5 py-2 text-[13.5px] leading-[1.5] text-red-deep">
                    <b>Jawabanmu:</b> {P.picked} —{" "}
                    {G.explain(q, P.picked || "", P.stage)}
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-serif text-xl italic">{q.ans}</span>
                  {!!q.ansId && (
                    <span className="text-[13.5px] text-muted">{q.ansId}</span>
                  )}
                  <SpeakButton text={q.ans} />
                </div>
                <span className="font-mono text-[12.5px] text-muted">
                  {q.why}
                </span>
                <Button variant="dark" className="self-end" onClick={next}>
                  {P.i >= P.qs.length - 1 ? "Lihat hasil" : "Soal berikutnya"}
                </Button>
              </div>
            )}
          </div>
        )}

        {P && P.finished && (
          <div className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-ink bg-sand px-[22px] py-5">
            <span className="text-4xl font-bold tracking-[-0.02em]">
              {P.score} / {P.qs.length}{" "}
              <span className="text-base font-normal text-muted">
                · {Math.round((P.score / P.qs.length) * 100)}%
              </span>
            </span>
            <span className="text-[15px] leading-[1.5] text-ink-2">
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
          </div>
        )}

        {!!R.retry?.length && (
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs tracking-[0.06em] text-red">
              TERAKHIR SALAH · AKAN MUNCUL LAGI
            </span>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-1.5">
              {R.retry
                .slice(-6)
                .reverse()
                .map((x, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => speak(x.ans)}
                    className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-red-line bg-red-bg px-[11px] py-[9px] text-left font-sans"
                  >
                    <span className="text-[13px] text-muted">
                      {noCue(x.prompt)}{" "}
                      <span className="text-faint">· {x.hint}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 font-serif text-[15.5px] italic">
                      {x.ans}
                      <span className="inline-flex text-green">
                        <SpeakerIcon size={12} />
                      </span>
                    </span>
                  </button>
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
