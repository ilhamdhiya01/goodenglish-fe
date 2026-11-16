"use client";

import classNames from "classnames";
import React, { useState } from "react";

import ListItem from "@/components/shared/patterns/list-item";
import WordTile from "@/components/shared/patterns/word-tile";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import { LEVELS } from "@/const/levels.constant";
import { VOCAB_SCEN, VOCAB_SCEN_KEY } from "@/lib/content";
import { speak, speakAll } from "@/lib/helpers/speech.helper";
import type { Scenario } from "@/lib/types/scenario.types";
import { useLevelStore } from "@/stores/useLevelStore";

const SC = VOCAB_SCEN as Scenario[];
const isYou = (r: string) => r === "You" || r === "A";

// Halaman Skenario: daftar skenario per level, dialog 8–12 baris sebagai
// gelembung (lawan bicara kiri, "You" kanan), frasa kunci, variasi jawaban.
const ScenarioPage = React.memo(() => {
  const level = useLevelStore((s) => s.level);

  const first = SC.find((x) => x.level === level) || SC[0];
  const [id, setId] = useState(first ? first.id : "standup");
  const [solo, setSolo] = useState(false);
  const [showId, setShowId] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [revealed, setRevealed] = useState<Record<number, 1>>({});

  const cur = SC.find((x) => x.id === id) ||
    SC[0] || { id: "", level: "", title: "", where: "", lines: [] };
  const key = VOCAB_SCEN_KEY[id];
  const byLevel = [level]
    .concat(LEVELS.map((l) => l[0]).filter((l) => l !== level))
    .map((lv) => ({
      lv,
      name: (LEVELS.find((l) => l[0] === lv) || [])[1] || lv,
      items: SC.filter((x) => x.level === lv),
    }))
    .filter((g) => g.items.length);

  const pick = (sid: string) => {
    setId(sid);
    setRevealed({});
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Skenario percakapan</PageHeading>
        <Lead>
          Satu situasi utuh, 8–12 kalimat berurutan. Latih dengan menutup
          terjemahan, baca peranmu keras-keras, lalu coba tanpa melihat teks.
          Skenario level lain tetap bisa dibuka.
        </Lead>
      </div>

      <div className="grid items-start gap-5 md:grid-cols-[230px_minmax(0,1fr)]">
        {/* Phone: one select; wider screens: the list grouped by level,
            the learner's own level first. */}
        <FieldLabel label="Skenario" className="md:hidden">
          <Select value={cur.id} onChange={(e) => pick(e.target.value)}>
            {byLevel.map((g, gi) => (
              <optgroup
                key={g.lv}
                label={g.name + (gi === 0 ? " · levelmu" : "")}
              >
                {g.items.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </FieldLabel>
        <nav
          aria-label="Daftar skenario"
          className="hidden flex-col gap-3 rounded-xl border-2 border-line bg-surface p-2 md:sticky md:top-[calc(var(--shell-top)+24px)] md:flex"
        >
          {byLevel.map((g, gi) => (
            <div key={g.lv} className="flex flex-col gap-1">
              <SectionLabel
                tone={gi === 0 ? "green" : "muted"}
                className="px-3 pt-1.5"
              >
                {String(g.name).toUpperCase()}
                {gi === 0 ? " · LEVELMU" : ""}
              </SectionLabel>
              {g.items.map((x) => (
                <ListItem
                  key={x.id}
                  active={x.id === cur.id}
                  onClick={() => pick(x.id)}
                >
                  {x.title}
                </ListItem>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          <Card pad="lg" className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xl leading-[26px] font-black text-ink">
                  {cur.title}
                </span>
                <span className="text-[13.5px] text-ink-2">{cur.where}</span>
              </div>
              <Button
                variant="green"
                size="sm"
                onClick={() => speakAll(cur.lines.map((l) => l[1]))}
              >
                Putar semua
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill
                size="sm"
                check
                on={showId}
                onClick={() => setShowId(!showId)}
              >
                Terjemahan
              </Pill>
              <Pill
                size="sm"
                check
                on={!showEn && !solo}
                onClick={() => {
                  setShowEn(!showEn);
                  setRevealed({});
                  setSolo(false);
                }}
              >
                Sembunyikan baris &quot;You&quot;
              </Pill>
              <Pill
                size="sm"
                check
                on={solo}
                title="Baris lawan bicara diputar, kamu jawab sendiri, lalu buka"
                onClick={() => {
                  setSolo(!solo);
                  setShowEn(solo);
                  setRevealed({});
                }}
              >
                Jawab sendiri
              </Pill>
            </div>
          </Card>

          <ol
            aria-label="Dialog"
            className="m-0 flex list-none flex-col gap-3 p-0"
          >
            {cur.lines.map((l, i) => {
              const you = isYou(l[0]);
              const hidden = (!showEn || solo) && you && !revealed[i];
              const prev = i > 0 ? cur.lines[i - 1] : null;
              return (
                <li
                  key={i}
                  className={classNames(
                    "flex flex-col gap-1",
                    you ? "items-end" : "items-start",
                  )}
                >
                  <SectionLabel tone={you ? "green" : "muted"}>
                    {l[0]}
                    {you ? " · giliranmu" : ""}
                  </SectionLabel>
                  <div
                    className={classNames(
                      "flex max-w-[88%] min-w-0 items-start gap-3 rounded-xl border-2 px-4 py-3 md:max-w-[80%]",
                      hidden
                        ? "border-dashed border-control bg-transparent"
                        : you
                          ? "border-accent-line bg-accent-tint"
                          : "border-line bg-surface",
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      {!hidden && (
                        <span className="text-base leading-[22px] font-bold text-ink">
                          {l[1]}
                        </span>
                      )}
                      {hidden && (
                        <div className="flex flex-wrap items-center gap-3">
                          {solo && prev && !isYou(prev[0]) && (
                            <button
                              type="button"
                              onClick={() => speak(prev[1])}
                              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md bg-transparent px-1 text-[13.5px] font-bold text-ink focus-ring"
                            >
                              <SpeakButton
                                nested
                                size={28}
                                icon={13}
                                text={prev[1]}
                              />
                              dengar lawan bicara
                            </button>
                          )}
                          <TextButton
                            onClick={() =>
                              setRevealed((r) => ({ ...r, [i]: 1 }))
                            }
                          >
                            {solo
                              ? "Jawab dengan suaramu, lalu buka"
                              : "Coba ucapkan dulu, lalu klik"}
                          </TextButton>
                        </div>
                      )}
                      {showId && (!hidden || !solo) && (
                        <span className="text-[13.5px] leading-[19px] text-ink-2">
                          {l[2]}
                        </span>
                      )}
                    </div>
                    <SpeakButton text={l[1]} />
                  </div>
                </li>
              );
            })}
          </ol>

          {key && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="gap-3">
                <div className="flex flex-col gap-1">
                  <SectionLabel tone="green">
                    FRASA KUNCI · PAKAI ULANG DI SITUASI LAIN
                  </SectionLabel>
                  <span className="text-[13.5px] leading-[19px] text-ink-2">
                    Hafalkan ini, bukan naskahnya. Polanya yang dibawa ke
                    percakapan nyata.
                  </span>
                </div>
                {key.phrases.map(([en, id2, note], i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 border-t-2 border-dashed border-line pt-3"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <WordTile
                        title={`Dengarkan "${en}"`}
                        onClick={() => speak(en)}
                      >
                        {en}
                      </WordTile>
                      <span className="text-[13.5px] text-ink-2">{id2}</span>
                    </div>
                    <span className="text-[13px] leading-[18px] text-ink-2">
                      {note}
                    </span>
                  </div>
                ))}
              </Card>
              <Card className="gap-3">
                <div className="flex flex-col gap-1">
                  <SectionLabel>KALAU DIA BILANG … KAMU JAWAB …</SectionLabel>
                  <span className="text-[13.5px] leading-[19px] text-ink-2">
                    Percakapan nyata tidak selalu sesuai naskah. Latih
                    variasinya.
                  </span>
                </div>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-line text-[12.5px] font-extrabold tracking-[0.07em] text-ink-3 uppercase">
                      <th scope="col" className="w-1/2 py-2 pr-3">
                        DIA
                      </th>
                      <th scope="col" className="w-1/2 py-2">
                        KAMU
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {key.variants.map(([they, you], i) => (
                      <tr key={i} className="border-b-2 border-line align-top">
                        <td className="py-2.5 pr-3">
                          <span className="flex items-start gap-2 text-[14.5px] leading-5 text-ink-2">
                            <span className="min-w-0 flex-1">{they}</span>
                            <SpeakButton size={28} icon={13} text={they} />
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="flex items-start gap-2 text-[15px] leading-5 font-bold text-ink">
                            <span className="min-w-0 flex-1">{you}</span>
                            <SpeakButton size={28} icon={13} text={you} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

ScenarioPage.displayName = "ScenarioPage";

export default ScenarioPage;
