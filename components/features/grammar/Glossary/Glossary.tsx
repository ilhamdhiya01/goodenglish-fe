"use client";

import React from "react";

import Rich from "@/components/shared/rich";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { ANATOMY, TERMS } from "@/const/glossary.constant";
import { speak } from "@/lib/helpers/speech.helper";

// Sub-tab "Istilah": anatomi satu kalimat + daftar istilah (S, V1, Aux, …).
const Glossary = React.memo(() => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Istilah dan singkatan dalam rumus</PageHeading>
        <Lead>
          Rumus seperti <b>S + V1 + O</b> muncul di semua sub-tab. Baca bagian
          ini sekali supaya setiap rumus langsung terbaca sebagai kalimat.
        </Lead>
      </div>

      <Card pad="lg" className="gap-4">
        <SectionLabel tone="green">
          SATU KALIMAT, DIPOTONG PER BAGIAN
        </SectionLabel>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
          {ANATOMY.map(([w, tag]) => (
            <div key={w} className="flex flex-col items-center gap-1">
              <span className="border-b-[3px] border-ink px-0.5 pb-0.5 text-xl font-extrabold text-ink">
                {w}
              </span>
              <span className="rounded-[7px] bg-chip px-1.5 py-px text-[12px] font-extrabold text-ink-2">
                {tag}
              </span>
            </div>
          ))}
          <SpeakButton text="My sister is cooking fried rice in the kitchen now." />
        </div>
        <span className="text-sm leading-5 text-pretty text-ink-2">
          Rumusnya:{" "}
          <b className="font-extrabold text-ink">
            S + am/is/are + V-ing + O + keterangan
          </b>
          . Urutan dasar bahasa Inggris hampir selalu{" "}
          <b>S → V → O → keterangan tempat → keterangan waktu</b>.
        </span>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {TERMS.map(([k, en, id, b, ex]) => (
          <div
            key={k}
            className="flex flex-col gap-1.5 rounded-xl border-2 border-line bg-surface px-4 py-3.5"
          >
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="text-[17px] font-black text-accent-edge">
                {k}
              </span>
              <span className="text-sm font-extrabold text-ink">{en}</span>
              <span className="text-[13px] text-ink-2">· {id}</span>
            </div>
            <span className="text-[13.5px] leading-[19px] text-pretty text-ink-2">
              {b}
            </span>
            <div className="flex items-center gap-2 border-t-2 border-dashed border-line pt-2">
              <span className="text-[15px] leading-[22px] font-bold text-ink">
                <Rich text={ex} />
              </span>
              <SpeakButton
                size={28}
                icon={13}
                onClick={() => speak(ex.replace(/<\/?b>/g, ""))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

Glossary.displayName = "Glossary";

export default Glossary;
