"use client";

import React from "react";
import { LuPlay, LuSnail } from "react-icons/lu";

import AnswerOption from "@/components/shared/patterns/answer-option";
import WordTile from "@/components/shared/patterns/word-tile";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { contrastVoice } from "@/lib/helpers/listening.helper";
import { speak, speakAll } from "@/lib/helpers/speech.helper";
import type { TestAnswer, TestQuestion } from "@/lib/types/exam.types";
import { useTtsStore } from "@/stores/useTtsStore";

import type { Gens } from "./useTestContent";

const LETTERS = ["A", "B", "C", "D"];
const PICKED = "border-accent-line! bg-accent-tint! text-accent-edge!";
const SLOW = 0.6;

interface Props {
  q: TestQuestion;
  gens: Gens;
  value: TestAnswer;
  onChange: (v: TestAnswer) => void;
  /** Enter in a text field. */
  onSubmit: () => void;
}

const Choices = ({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: TestAnswer;
  onChange: (v: string) => void;
}) => (
  <div className="grid gap-2 md:grid-cols-2">
    {options.map((o, i) => (
      <AnswerOption
        key={o}
        letter={LETTERS[i]}
        data-testid="test-option"
        aria-pressed={value === o}
        className={value === o ? PICKED : undefined}
        onClick={() => onChange(o)}
      >
        {o}
      </AnswerOption>
    ))}
  </div>
);

const Typed = ({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
}: {
  label: string;
  placeholder: string;
  value: TestAnswer;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    <Input
      aria-label={label}
      placeholder={placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      autoFocus
    />
  </form>
);

const Prompt = ({ ask, main }: { ask: string; main: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-sm font-bold text-ink-2">{ask}</span>
    <div className="text-2xl leading-8 font-black wrap-anywhere text-ink md:text-[28px] md:leading-9">
      {main}
    </div>
  </div>
);

// Susun kata: tap the tiles in order; tap a placed word to take it out.
const Order = ({
  tiles,
  value,
  onChange,
}: {
  tiles: { t: string; i: number }[];
  value: TestAnswer;
  onChange: (v: string) => void;
}) => {
  const built = (
    typeof value === "string" && value ? value.split("\u0001") : []
  )
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const set = (ids: number[]) => onChange(ids.join("\u0001"));
  const byId = new Map(tiles.map((x) => [x.i, x.t]));
  return (
    <div className="flex flex-col gap-3">
      <div
        aria-label="Susunanmu"
        className="flex min-h-14 flex-wrap items-center gap-1.5 rounded-lg border-2 border-dashed border-control bg-sunken px-2.5 py-2"
      >
        {built.length ? (
          built.map((id) => (
            <WordTile
              key={id}
              selected
              onClick={() => set(built.filter((x) => x !== id))}
            >
              {byId.get(id)}
            </WordTile>
          ))
        ) : (
          <span className="text-sm font-semibold text-ink-3">
            Ketuk kata di bawah sesuai urutan.
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tiles.map((x) => (
          <WordTile
            key={x.i}
            data-testid="test-tile"
            used={built.includes(x.i)}
            disabled={built.includes(x.i)}
            onClick={() => set([...built, x.i])}
          >
            {x.t}
          </WordTile>
        ))}
      </div>
      {built.length > 0 && (
        <TextButton className="self-start" onClick={() => set([])}>
          Ulangi susunan
        </TextButton>
      )}
    </div>
  );
};

/** The sentence a "Susun kata" answer builds (tile ids → words). */
export const orderText = (
  tiles: { t: string; i: number }[],
  value: TestAnswer,
) => {
  const byId = new Map(tiles.map((x) => [x.i, x.t]));
  return (typeof value === "string" && value ? value.split("\u0001") : [])
    .map((id) => byId.get(Number(id)) ?? "")
    .join(" ");
};

const PlayButtons = ({ onPlay }: { onPlay: (slow: boolean) => void }) => (
  <div className="flex flex-wrap gap-2">
    <Button variant="green" onClick={() => onPlay(false)}>
      <LuPlay aria-hidden size={16} />
      Putar
    </Button>
    <Button onClick={() => onPlay(true)}>
      <LuSnail aria-hidden size={16} />
      Pelan
    </Button>
  </div>
);

// One test question. No right/wrong shown: it's a test.
const QuestionView = ({ q, gens, value, onChange, onSubmit }: Props) => {
  const voice = useTtsStore((s) => s.voice);
  switch (q.kind) {
    case "vocab-mc":
      return (
        <div className="flex flex-col gap-4">
          <Prompt
            ask="Apa arti kata ini?"
            main={
              <span className="inline-flex flex-wrap items-center gap-3">
                {q.prompt}
                <SpeakButton text={q.prompt} />
              </span>
            }
          />
          <Choices options={q.options} value={value} onChange={onChange} />
        </div>
      );
    case "vocab-rev":
      return (
        <div className="flex flex-col gap-4">
          <Prompt ask="Apa bahasa Inggrisnya?" main={q.prompt} />
          <Choices options={q.options} value={value} onChange={onChange} />
        </div>
      );
    case "vocab-type":
      return (
        <div className="flex flex-col gap-4">
          <Prompt ask="Ketik bahasa Inggrisnya:" main={q.prompt} />
          <Typed
            label="Kata Inggrisnya"
            placeholder="Ketik kata Inggrisnya…"
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
          />
        </div>
      );
    case "grammar": {
      const g = gens[q.topic];
      const view = g?.view
        ? g.view(q.q, q.stage)
        : { main: q.q.prompt, sub: q.q.promptId };
      return (
        <div className="flex flex-col gap-4">
          <Prompt
            ask={
              q.stage === "mc"
                ? "Pilih kalimat yang benar."
                : q.stage === "order"
                  ? "Susun kalimat bahasa Inggrisnya."
                  : "Ketik isian yang tepat."
            }
            main={view.main}
          />
          {!!view.sub && (
            <span className="-mt-2 text-sm text-ink-2">{view.sub}</span>
          )}
          {q.stage === "mc" ? (
            <Choices options={q.q.opts} value={value} onChange={onChange} />
          ) : q.stage === "order" ? (
            <Order tiles={q.q.shuffled} value={value} onChange={onChange} />
          ) : (
            <Typed
              label="Isianmu"
              placeholder="Ketik isian, lalu Enter…"
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
            />
          )}
        </div>
      );
    }
    case "dictation":
      return (
        <div className="flex flex-col gap-4">
          <Prompt ask="Dengarkan, lalu tulis kalimatnya." main="Dikte" />
          <PlayButtons
            onPlay={(slow) =>
              speak(q.sentence.text, slow ? { speed: SLOW } : undefined)
            }
          />
          <Typed
            label="Tulis yang kamu dengar"
            placeholder="Tulis yang kamu dengar…"
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
          />
        </div>
      );
    case "listen":
      return (
        <div className="flex flex-col gap-4">
          <Prompt
            ask={`Dengarkan ${q.dialog ? "percakapan" : "pengumuman"} ini.`}
            main={q.question.question}
          />
          <PlayButtons
            onPlay={(slow) =>
              void speakAll(
                q.lines.map((l) => ({
                  text: l.text,
                  voice: l.speaker === "B" ? contrastVoice(voice) : voice,
                  ...(slow ? { speed: SLOW } : {}),
                })),
              )
            }
          />
          <div className="grid gap-2 md:grid-cols-2">
            {q.question.options.map((o, i) => (
              <AnswerOption
                key={i}
                letter={LETTERS[i]}
                data-testid="test-option"
                aria-pressed={value === i}
                className={value === i ? PICKED : undefined}
                onClick={() => onChange(i)}
              >
                {o}
              </AnswerOption>
            ))}
          </div>
        </div>
      );
  }
};

export default QuestionView;
