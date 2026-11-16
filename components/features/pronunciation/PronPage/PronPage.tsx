"use client";

import React, { useState } from "react";

import TargetMark from "@/components/shared/patterns/target-mark";
import WordTile from "@/components/shared/patterns/word-tile";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import SpeakerIcon from "@/components/ui/speaker-icon";
import TextButton from "@/components/ui/text-button";
import { PRON_SECS } from "@/const/pronunciation.constant";
import { idOf, VOCAB_PRON } from "@/lib/content";
import { speak } from "@/lib/helpers/speech.helper";

const clean = (s: string) =>
  s
    .replace(/\s*[✗↗↘].*$/, "")
    .replace(/\(.*?\)/g, "")
    .trim();

const Speaker = () => (
  <span aria-hidden className="inline-flex text-accent">
    <SpeakerIcon size={13} />
  </span>
);

// "phoTOgraphy": the capitalised syllable is the stressed one (the hint
// above says so). It keeps its capitals and also gets the target band.
const Stressed = ({ w }: { w: string }) => (
  <>
    {w
      .split(/([A-Z]{2,})/)
      .map((p, i) =>
        i % 2 ? (
          <TargetMark key={i}>{p}</TargetMark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
  </>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <span className="max-w-[760px] text-[13px] leading-[18px] text-pretty text-ink-2">
    {children}
  </span>
);

// Halaman Pelafalan: bunyi sulit, -ed, tekanan kata, intonasi, ucapan cepat, frasa saat mentok.
const PronPage = React.memo(() => {
  const [sec, setSec] = useState("sounds");
  const D = VOCAB_PRON;
  if (!D) return null;

  return (
    <section className="flex flex-col gap-[22px]">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Pelafalan &amp; ucapan cepat</PageHeading>
        <Lead>
          Kosakata benar tapi terdengar kaku biasanya karena tiga hal: bunyi
          yang tertukar, tekanan di suku kata yang salah, dan tidak menyambung
          kata. Latih dengan menekan <b>dengar</b>, lalu ulangi keras-keras
          (shadowing).
        </Lead>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-2">
          {PRON_SECS.map(([id, label]) => (
            <Pill key={id} on={sec === id} onClick={() => setSec(id)}>
              {label}
            </Pill>
          ))}
        </div>
        {sec === "sounds" && (
          <Hint>
            Kolom kiri = bunyi target, kolom kanan = pasangan pembandingnya (✗ =
            ucapan salah yang umum). Klik untuk dengar keduanya berurutan sampai
            bedanya terasa.
          </Hint>
        )}
        {sec === "stress" && (
          <Hint>
            Huruf KAPITAL = suku kata yang ditekan (lebih keras, lebih panjang,
            nada lebih tinggi). Suku kata lain dilemahkan.
          </Hint>
        )}
      </div>

      {sec === "sounds" && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
          {D.sounds.map(
            (s: {
              sym: string;
              name: string;
              tip: string;
              pairs: [string, string][];
            }) => (
              <Card key={s.sym} className="gap-4">
                <div className="flex flex-wrap items-start gap-x-4 gap-y-1">
                  <span className="text-[38px] leading-[44px] font-black text-accent">
                    {s.sym}
                  </span>
                  <div className="flex min-w-[180px] flex-1 flex-col gap-1 pt-1">
                    <span className="text-lg leading-6 font-black text-ink">
                      {s.name}
                    </span>
                    <span className="text-sm leading-5 text-pretty text-ink-2">
                      {s.tip}
                    </span>
                  </div>
                </div>
                {/* Each row is a pair: target on the left, its contrast on the right. */}
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-2">
                  <SectionLabel tone="green">Target</SectionLabel>
                  <SectionLabel>Kontras</SectionLabel>
                  {s.pairs.map(([a, b], i) => (
                    <div key={i} className="contents">
                      <WordTile
                        onClick={() => speak(a)}
                        title="Dengarkan"
                        className="col-start-1 text-left"
                      >
                        <span className="min-w-0 flex-1">{a}</span>
                        <Speaker />
                      </WordTile>
                      {/* Contrast words are real words, not mistakes: dashed,
                          without a ✕ (the data marks real slips with ✗). */}
                      <WordTile
                        used
                        onClick={() => speak(clean(b))}
                        title="Dengarkan"
                        className="col-start-2 text-left"
                      >
                        <span className="min-w-0 flex-1">{b}</span>
                        <Speaker />
                      </WordTile>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          )}
        </div>
      )}

      {sec === "ed" && (
        <>
          <Card pad="lg" className="max-w-[920px] gap-0">
            {D.ed.map((e: { rule: string; when: string; ex: string[] }) => (
              <div
                key={e.rule}
                className="grid gap-3 border-t-2 border-dashed border-line py-4 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[220px_minmax(0,1fr)] md:gap-5"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[28px] leading-9 font-black text-accent">
                    -ed = {e.rule}
                  </span>
                  <span className="text-sm leading-5 text-pretty text-ink-2">
                    {e.when}
                  </span>
                  <TextButton
                    tone="green"
                    onClick={() => speak(e.ex.join(", "))}
                    className="hit-44 mt-1 self-start"
                  >
                    dengar semua
                  </TextButton>
                </div>
                <div className="flex flex-wrap content-start gap-2">
                  {e.ex.map((w) => (
                    <WordTile key={w} onClick={() => speak(w)}>
                      {w}
                      <Speaker />
                    </WordTile>
                  ))}
                </div>
              </div>
            ))}
          </Card>
          <Card className="max-w-[760px] text-sm leading-[22px] text-ink-2">
            <p className="m-0">
              <b className="font-extrabold text-ink">Kesalahan paling umum:</b>{" "}
              membaca semua -ed sebagai &quot;-ed&quot; dua suku kata (
              <i>work-ed</i>, <i>stop-ed</i>). Hanya setelah{" "}
              <b className="font-extrabold text-ink">t</b> dan{" "}
              <b className="font-extrabold text-ink">d</b> yang jadi /ɪd/.
              Sisanya satu suku kata: <i>worked</i> = &quot;workt&quot;,{" "}
              <i>played</i> = &quot;pleid&quot;.
            </p>
          </Card>
        </>
      )}

      {sec === "stress" && (
        <div className="flex max-w-[820px] flex-col gap-3">
          {D.stress.map((s: { rule: string; ex: string[] }) => (
            <Card key={s.rule} className="gap-3">
              <span className="text-[15px] leading-[22px] font-extrabold text-ink">
                {s.rule}
              </span>
              <div className="flex flex-wrap gap-2">
                {s.ex.map((w) => (
                  <WordTile
                    key={w}
                    onClick={() => speak(clean(w).toLowerCase())}
                  >
                    <Stressed w={w} />
                    <Speaker />
                  </WordTile>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {sec === "into" && (
        <div className="flex max-w-[820px] flex-col gap-3">
          {D.intonation.map(
            (s: { name: string; tip: string; ex: [string, string][] }) => (
              <Card key={s.name} className="gap-2.5">
                <div className="flex flex-col gap-1">
                  <span className="text-base leading-[22px] font-black text-ink">
                    {s.name}
                  </span>
                  <span className="text-sm leading-5 text-pretty text-ink-2">
                    {s.tip}
                  </span>
                </div>
                {s.ex.map(([t, note], i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 border-t-2 border-dashed border-line pt-2"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        speak(
                          clean(t)
                            .toLowerCase()
                            .replace(/^\w/, (c) => c.toUpperCase()),
                        )
                      }
                      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm bg-transparent p-0 text-left text-[15px] leading-[22px] font-bold text-ink focus-ring hover:text-accent-edge"
                    >
                      {t}
                      <Speaker />
                    </button>
                    {!!note && (
                      <span className="text-[13px] text-ink-2">→ {note}</span>
                    )}
                    {!!idOf(t) && (
                      <span className="basis-full text-[13px] text-ink-2">
                        {idOf(t)}
                      </span>
                    )}
                  </div>
                ))}
              </Card>
            ),
          )}
        </div>
      )}

      {sec === "conn" && (
        <div className="flex flex-col gap-3.5">
          {D.connected.map(
            (g: { name: string; tip: string; items: string[][] }) => (
              <Card key={g.name}>
                <div className="flex flex-col gap-1">
                  <span className="text-lg leading-6 font-black text-ink">
                    {g.name}
                  </span>
                  <span className="text-sm leading-5 text-pretty text-ink-2">
                    {g.tip}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2">
                  {g.items.map(([fast, full, pron, ex], i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => speak(ex)}
                      className="flex cursor-pointer flex-col gap-1 rounded-lg border-2 border-line bg-surface px-3 py-2.5 text-left focus-ring transition-colors hover:bg-sunken"
                    >
                      <div className="flex w-full flex-wrap items-center gap-2">
                        <span className="text-[17px] leading-6 font-black text-accent-edge">
                          {fast}
                        </span>
                        <span className="text-[13px] text-ink-2">{pron}</span>
                        <span className="ml-auto">
                          <Speaker />
                        </span>
                      </div>
                      {fast !== full && (
                        <span className="text-[13px] text-ink-2">= {full}</span>
                      )}
                      <span className="text-[15px] leading-[22px] font-bold text-ink">
                        {ex}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            ),
          )}
        </div>
      )}

      {sec === "stuck" && (
        <>
          <span className="max-w-[760px] text-[15px] leading-[22px] text-ink-2">
            Fluent bukan berarti tidak pernah mentok, tapi{" "}
            <b className="font-extrabold text-ink">
              tetap mengalir saat mentok
            </b>
            . Hafalkan satu frasa per kelompok, pakai otomatis.
          </span>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5">
            {D.stuck.map(
              (g: { name: string; tip: string; items: string[][] }) => (
                <Card key={g.name} className="gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg leading-6 font-black text-ink">
                      {g.name}
                    </span>
                    <span className="text-sm leading-5 text-pretty text-ink-2">
                      {g.tip}
                    </span>
                  </div>
                  {g.items.map(([en, id, ex, note], i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => speak(ex)}
                      className="flex cursor-pointer flex-col gap-1 rounded-sm border-t-2 border-dashed border-line bg-transparent pt-2.5 text-left focus-ring"
                    >
                      <div className="flex w-full flex-wrap items-center gap-2">
                        <span className="text-base leading-[22px] font-extrabold text-accent-edge">
                          {en}
                        </span>
                        <span className="text-[13px] text-ink-2">{id}</span>
                        <span className="ml-auto">
                          <Speaker />
                        </span>
                      </div>
                      <span className="text-[15px] leading-[22px] font-bold text-ink">
                        {ex}
                      </span>
                      {!!note && (
                        <span className="text-[12.5px] font-bold text-ink-2">
                          {note}
                        </span>
                      )}
                    </button>
                  ))}
                </Card>
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
});

PronPage.displayName = "PronPage";

export default PronPage;
