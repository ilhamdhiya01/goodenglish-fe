"use client";

import classNames from "classnames";
import React, { useMemo, useState } from "react";

import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SpeakButton from "@/components/ui/speak-button";
import { LEVELS, LV_SHORT } from "@/const/levels.constant";
import { VOCAB_ERRORS } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";
import type { ErrorGroup } from "@/lib/types/scenario.types";
import { useLevelStore } from "@/stores/useLevelStore";

interface ErrQ {
  cat: string;
  wrong: string;
  right: string;
  why: string;
  opts: [string, string];
}

const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// Halaman "Kesalahan umum": mode baca (kartu per kategori) + kuis "mana yang benar".
const ErrorsPage = React.memo(() => {
  const level = useLevelStore((s) => s.level);
  const [lv, setLv] = useState<string>(level);
  const [mode, setMode] = useState<"read" | "quiz">("read");
  const [order, setOrder] = useState<number[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });

  const groups = (VOCAB_ERRORS as ErrorGroup[]).filter(
    (g) => lv === "all" || (g.lv || "pre") === lv,
  );
  const pool = useMemo<ErrQ[]>(
    () =>
      groups.flatMap((g) =>
        g.items.map(([wrong, right, why]) => ({
          cat: g.cat,
          wrong,
          right: right.split(" / ")[0],
          why: why || "",
          opts:
            Math.random() < 0.5
              ? [wrong, right.split(" / ")[0]]
              : [right.split(" / ")[0], wrong],
        })),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lv],
  );

  const start = () => {
    setOrder(shuffle(pool.map((_, k) => k)));
    setI(0);
    setPicked(null);
    setScore({ ok: 0, n: 0 });
    setMode("quiz");
  };
  const q = order.length ? pool[order[i % order.length]] : null;
  const next = () => {
    setI((k) => k + 1);
    setPicked(null);
  };
  const choose = (o: string) => {
    if (picked || !q) return;
    setPicked(o);
    setScore((s) => ({ ok: s.ok + (o === q.right ? 1 : 0), n: s.n + 1 }));
    if (o === q.right) speak(q.right);
  };

  return (
    <section className="flex flex-col gap-5.5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Kesalahan umum penutur Indonesia</PageHeading>
        <Lead>
          Pola salah yang muncul karena struktur bahasa Indonesia terbawa. Baca
          yang benar keras-keras sampai yang salah terdengar aneh, lalu uji diri
          dengan kuis &quot;mana yang benar&quot;.
        </Lead>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {[["all", "Semua level"] as [string, string]]
            .concat(LEVELS.map((l) => [l[0], l[1]] as [string, string]))
            .map(([lvId, name]) => (
              <Pill
                key={lvId}
                size="sm"
                on={lv === lvId}
                onClick={() => {
                  setLv(lvId);
                  setMode("read");
                }}
              >
                {name}
              </Pill>
            ))}
        </div>
        <div className="flex gap-1.5">
          <Pill size="sm" on={mode === "read"} onClick={() => setMode("read")}>
            Baca
          </Pill>
          <Pill size="sm" tone="green" on={mode === "quiz"} onClick={start}>
            Kuis · {pool.length} soal
          </Pill>
        </div>
      </div>

      {mode === "quiz" && q && (
        <Card tone="ink" pad="lg" className="max-w-[820px] gap-4 rounded-xl">
          <div className="flex flex-wrap justify-between gap-2.5">
            <span className="font-mono text-[11px] tracking-[0.06em] text-muted">
              {q.cat.toUpperCase()}
            </span>
            <span className="font-mono text-[11px] text-faint">
              benar {score.ok}/{score.n} · soal {(i % order.length) + 1}/
              {order.length}
            </span>
          </div>
          <span className="text-[15px] text-ink-2">
            Mana yang benar? Ucapkan dulu dalam hati, lalu pilih.
          </span>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-2.5">
            {q.opts.map((o) => {
              const isRight = o === q.right;
              const show = !!picked;
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => choose(o)}
                  className={classNames(
                    "flex cursor-pointer items-center justify-between gap-2.5 rounded-[10px] border-[1.5px] px-[18px] py-4 text-left font-sans text-[17px] leading-[1.4] transition-colors",
                    !show && "border-ink bg-card hover:border-green",
                    show && isRight && "border-green bg-green-bg2",
                    show && !isRight && o === picked && "border-red bg-red-bg",
                    show && !isRight && o !== picked && "border-line bg-card",
                    show && "cursor-default",
                  )}
                >
                  <span
                    className={classNames(
                      show && !isRight && "text-red line-through",
                      "text-ink",
                      show && !isRight && "text-red",
                    )}
                  >
                    {o}
                  </span>
                  {show && isRight && <SpeakButton nested text={o} />}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className="flex flex-col gap-2 border-t border-dashed border-line pt-3.5">
              <span
                className={classNames(
                  "text-[15px] font-semibold",
                  picked === q.right ? "text-green" : "text-red",
                )}
              >
                {picked === q.right ? "✓ Benar." : "✗ Yang benar: " + q.right}
              </span>
              {!!q.why && (
                <span className="text-sm leading-[1.5] text-ink-2">
                  {q.why}
                </span>
              )}
              <button
                type="button"
                onClick={next}
                className="cursor-pointer self-start rounded-full bg-ink px-5 py-2.5 font-sans font-semibold text-paper transition-colors hover:bg-ink-2"
              >
                Soal berikutnya →
              </button>
            </div>
          )}
        </Card>
      )}

      {mode === "read" && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5">
          {groups.map((g) => (
            <Card key={g.cat} tone="ink">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[17px] font-bold">{g.cat}</span>
                <span className="font-mono text-[10px] text-faint">
                  {LV_SHORT[g.lv] || "PRE"}
                </span>
              </div>
              {g.items.map(([wrong, right, why], k) => (
                <div
                  key={k}
                  className="flex flex-col gap-[3px] border-t border-dashed border-line pt-2.5"
                >
                  <span className="text-[14.5px] text-red line-through decoration-red/50">
                    {wrong}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[15.5px] font-semibold text-green">
                      {right}
                    </span>
                    <SpeakButton
                      size={22}
                      icon={11}
                      text={right.split(" / ")[0]}
                    />
                  </div>
                  {!!why && (
                    <span className="text-[12.5px] text-muted">{why}</span>
                  )}
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
});

ErrorsPage.displayName = "ErrorsPage";

export default ErrorsPage;
