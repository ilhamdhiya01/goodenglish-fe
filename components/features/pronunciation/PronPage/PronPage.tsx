"use client";

import classNames from "classnames";
import React, { useState } from "react";

import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
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

      <div className="flex flex-wrap gap-2">
        {PRON_SECS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            onClick={() => setSec(id)}
            className={classNames(
              "inline-flex h-9 cursor-pointer items-center rounded-full border-[1.5px] px-3.5 font-sans text-[13.5px] font-semibold transition-colors",
              sec === id
                ? "border-ink bg-ink text-paper"
                : "border-line-2 bg-card text-ink hover:border-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sec === "sounds" && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
            {D.sounds.map(
              (s: {
                sym: string;
                name: string;
                tip: string;
                pairs: [string, string][];
              }) => (
                <Card key={s.sym} tone="ink">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <span className="font-mono text-[15px] font-bold text-green">
                        {s.sym}
                      </span>
                      <span className="text-[17px] font-bold">{s.name}</span>
                    </div>
                    <span className="text-[13.5px] leading-[1.5] text-pretty text-ink-3">
                      {s.tip}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {s.pairs.map(([a, b], i) => (
                      <div key={i} className="contents">
                        <button
                          type="button"
                          onClick={() => speak(a)}
                          title="Dengarkan"
                          className="col-start-1 flex cursor-pointer items-center justify-between gap-1.5 rounded-md border-none bg-green-bg px-2.5 py-[7px] text-left font-sans text-[15px] font-semibold text-green-deep hover:bg-green-bg2"
                        >
                          {a}
                          <SpeakerIcon size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => speak(clean(b))}
                          title="Dengarkan"
                          className="col-start-2 flex cursor-pointer items-center justify-between gap-1.5 rounded-md border-none bg-sand px-2.5 py-[7px] text-left font-sans text-[15px] text-muted hover:bg-track"
                        >
                          {b}
                          <SpeakerIcon size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              ),
            )}
          </div>
          <span className="text-[13px] text-muted">
            Kolom kiri = bunyi target, kolom kanan = pasangan pembandingnya (✗ =
            ucapan salah yang umum). Klik untuk dengar keduanya berurutan sampai
            bedanya terasa.
          </span>
        </>
      )}

      {sec === "ed" && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
            {D.ed.map((e: { rule: string; when: string; ex: string[] }) => (
              <Card key={e.rule} tone="ink" className="gap-2.5">
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="font-mono text-[26px] font-bold text-green">
                    -ed = {e.rule}
                  </span>
                  <TextButton
                    tone="green"
                    onClick={() => speak(e.ex.join(", "))}
                  >
                    dengar semua
                  </TextButton>
                </div>
                <span className="text-[13.5px] leading-[1.5] text-ink-3">
                  {e.when}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {e.ex.map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => speak(w)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-green-bg px-[11px] py-[5px] font-sans text-[14.5px] font-semibold text-green-deep hover:bg-green-bg2"
                    >
                      {w}
                      <SpeakerIcon size={11} />
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="max-w-[760px] rounded-[10px] border-[1.5px] border-ink bg-card px-5 py-4 text-sm leading-[1.55]">
            <b>Kesalahan paling umum:</b> membaca semua -ed sebagai
            &quot;-ed&quot; dua suku kata (<i>work-ed</i>, <i>stop-ed</i>).
            Hanya setelah <b>t</b> dan <b>d</b> yang jadi /ɪd/. Sisanya satu
            suku kata: <i>worked</i> = &quot;workt&quot;, <i>played</i> =
            &quot;pleid&quot;.
          </div>
        </>
      )}

      {sec === "stress" && (
        <div className="flex max-w-[820px] flex-col gap-3">
          {D.stress.map((s: { rule: string; ex: string[] }) => (
            <Card key={s.rule} tone="ink" className="gap-2.5 px-5 py-4">
              <span className="text-[15px] font-bold">{s.rule}</span>
              <div className="flex flex-wrap gap-1.5">
                {s.ex.map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={() => speak(clean(w).toLowerCase())}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-sand px-[11px] py-[5px] font-mono text-sm text-ink hover:bg-track"
                  >
                    {w}
                    <span className="inline-flex text-green">
                      <SpeakerIcon size={11} />
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
          <span className="text-[13px] text-muted">
            Huruf KAPITAL = suku kata yang ditekan (lebih keras, lebih panjang,
            nada lebih tinggi). Suku kata lain dilemahkan.
          </span>
        </div>
      )}

      {sec === "into" && (
        <div className="flex max-w-[820px] flex-col gap-3">
          {D.intonation.map(
            (s: { name: string; tip: string; ex: [string, string][] }) => (
              <Card key={s.name} tone="ink" className="gap-2.5 px-5 py-4">
                <div className="flex flex-col gap-[3px]">
                  <span className="text-base font-bold">{s.name}</span>
                  <span className="text-[13.5px] leading-[1.5] text-ink-3">
                    {s.tip}
                  </span>
                </div>
                {s.ex.map(([t, note], i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-baseline gap-2.5 border-t border-dashed border-line pt-2"
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
                      className="inline-flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 font-serif text-lg leading-[1.4] text-ink hover:text-green"
                    >
                      {t}
                      <span className="inline-flex text-green">
                        <SpeakerIcon size={13} />
                      </span>
                    </button>
                    {!!note && (
                      <span className="text-[13px] text-muted">→ {note}</span>
                    )}
                    {!!idOf(t) && (
                      <span className="-mt-1 basis-full text-[12.5px] text-faint">
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
              <Card key={g.name} tone="ink">
                <div className="flex flex-col gap-[3px]">
                  <span className="text-lg font-bold">{g.name}</span>
                  <span className="text-[13.5px] leading-[1.5] text-ink-3">
                    {g.tip}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-2">
                  {g.items.map(([fast, full, pron, ex], i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => speak(ex)}
                      className="flex cursor-pointer flex-col gap-[3px] rounded-lg border border-line bg-card px-3 py-2.5 text-left font-sans transition-colors hover:border-ink"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[17px] font-bold text-green">
                          {fast}
                        </span>
                        <span className="font-mono text-[12.5px] text-muted">
                          {pron}
                        </span>
                        <span className="ml-auto inline-flex text-green">
                          <SpeakerIcon size={13} />
                        </span>
                      </div>
                      {fast !== full && (
                        <span className="text-[13px] text-muted">= {full}</span>
                      )}
                      <span className="font-serif text-[15px] text-ink-2 italic">
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
          <span className="max-w-[760px] text-[15px] leading-[1.55] text-ink-3">
            Fluent bukan berarti tidak pernah mentok, tapi{" "}
            <b>tetap mengalir saat mentok</b>. Hafalkan satu frasa per kelompok,
            pakai otomatis.
          </span>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3.5">
            {D.stuck.map(
              (g: { name: string; tip: string; items: string[][] }) => (
                <Card key={g.name} tone="ink">
                  <div className="flex flex-col gap-[3px]">
                    <span className="text-lg font-bold">{g.name}</span>
                    <span className="text-[13.5px] leading-[1.5] text-ink-3">
                      {g.tip}
                    </span>
                  </div>
                  {g.items.map(([en, id, ex, note], i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => speak(ex)}
                      className="flex cursor-pointer flex-col gap-[3px] border-t border-dashed border-line bg-transparent pt-2.5 text-left font-sans"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-green">
                          {en}
                        </span>
                        <span className="text-[13px] text-ink-3">{id}</span>
                        <span className="ml-auto inline-flex text-green">
                          <SpeakerIcon size={13} />
                        </span>
                      </div>
                      <span className="font-serif text-[15.5px] leading-[1.4] italic">
                        {ex}
                      </span>
                      {!!note && (
                        <span className="font-mono text-xs text-muted">
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
