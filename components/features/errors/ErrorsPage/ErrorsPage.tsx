"use client";

import classNames from "classnames";
import React, { useMemo, useState } from "react";

import AnswerOption from "@/components/shared/patterns/answer-option";
import Correction from "@/components/shared/patterns/correction";
import ListItem from "@/components/shared/patterns/list-item";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
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

  const catId = (cat: string) =>
    "kat-" + cat.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Kesalahan umum penutur Indonesia</PageHeading>
        <Lead>
          Pola salah yang muncul karena struktur bahasa Indonesia terbawa. Baca
          yang benar keras-keras sampai yang salah terdengar aneh, lalu uji diri
          dengan kuis &quot;mana yang benar&quot;.
        </Lead>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <FieldLabel label="Level" className="w-full max-w-[260px]">
          <Select
            value={lv}
            onChange={(e) => {
              setLv(e.target.value);
              setMode("read");
            }}
          >
            {[["all", "Semua level"] as [string, string]]
              .concat(LEVELS.map((l) => [l[0], l[1]] as [string, string]))
              .map(([lvId, name]) => (
                <option key={lvId} value={lvId}>
                  {name}
                </option>
              ))}
          </Select>
        </FieldLabel>
        <div className="flex gap-2">
          <Pill on={mode === "read"} onClick={() => setMode("read")}>
            Baca
          </Pill>
          <Pill on={mode === "quiz"} onClick={start}>
            Kuis · {pool.length} soal
          </Pill>
        </div>
      </div>

      {mode === "quiz" && q && (
        <Card pad="lg" className="max-w-[760px] gap-4">
          <div className="flex flex-wrap justify-between gap-2.5">
            <SectionLabel>{q.cat}</SectionLabel>
            <span className="text-[13px] font-bold text-ink-2">
              benar {score.ok}/{score.n} · soal {(i % order.length) + 1}/
              {order.length}
            </span>
          </div>
          <span className="text-[15px] font-semibold text-ink-2">
            Mana yang benar? Ucapkan dulu dalam hati, lalu pilih.
          </span>
          <div className="grid gap-2.5 md:grid-cols-2">
            {q.opts.map((o, k) => (
              <AnswerOption
                key={o}
                letter={"AB"[k]}
                data-testid="error-option"
                disabled={!!picked}
                onClick={() => choose(o)}
                state={
                  !picked
                    ? "idle"
                    : o === q.right
                      ? "correct"
                      : o === picked
                        ? "wrong"
                        : "dimmed"
                }
              >
                {o}
              </AnswerOption>
            ))}
          </div>
          {picked && (
            <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-line pt-3.5">
              <span
                role="status"
                className={classNames(
                  "flex items-center gap-2 text-[15px] font-extrabold",
                  picked === q.right ? "text-ok" : "text-bad",
                )}
              >
                {picked === q.right ? "✓ Benar." : "✕ Yang benar: " + q.right}
                <SpeakButton size={28} icon={13} text={q.right} />
              </span>
              {!!q.why && (
                <span className="text-sm leading-5 text-ink-2">{q.why}</span>
              )}
              <Button variant="green" className="self-start" onClick={next}>
                Soal berikutnya →
              </Button>
            </div>
          )}
        </Card>
      )}

      {mode === "read" && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col gap-4">
            {groups.map((g) => (
              <Card
                key={g.cat}
                id={catId(g.cat)}
                pad="lg"
                className="scroll-mt-[calc(var(--shell-top,0px)+16px)] gap-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl leading-[26px] font-black text-ink">
                    {g.cat}
                  </span>
                  <span className="text-[13px] font-bold text-ink-2">
                    {g.items.length} butir · {LV_SHORT[g.lv] || "PRE"}
                  </span>
                </div>
                {g.items.map(([wrong, right, why], k) => (
                  <Correction
                    key={k}
                    wrong={wrong}
                    right={right}
                    speak={right.split(" / ")[0]}
                    why={why || undefined}
                    className="border-t-2 border-dashed border-line pt-3"
                  />
                ))}
              </Card>
            ))}
          </div>
          <nav
            aria-label="Kategori"
            className="hidden flex-col gap-1 rounded-xl border-2 border-line bg-surface p-2 lg:sticky lg:top-6 lg:flex"
          >
            <SectionLabel className="px-3 pt-1.5 pb-1">
              {groups.length} kategori
            </SectionLabel>
            {groups.map((g) => (
              <ListItem
                key={g.cat}
                href={"#" + catId(g.cat)}
                trailing={g.items.length}
              >
                {g.cat}
              </ListItem>
            ))}
          </nav>
        </div>
      )}
    </section>
  );
});

ErrorsPage.displayName = "ErrorsPage";

export default ErrorsPage;
