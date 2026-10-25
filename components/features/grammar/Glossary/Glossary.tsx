"use client";

import React from "react";

import Rich from "@/components/shared/rich";
import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import SpeakButton from "@/components/ui/speak-button";
import { ANATOMY, TERMS } from "@/const/glossary.constant";
import { speak } from "@/lib/helpers/speech.helper";

// Sub-tab "Istilah": anatomi satu kalimat + daftar istilah (S, V1, Aux, …).
const Glossary = React.memo(() => {
  return (
    <div className="flex flex-col gap-5.5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Istilah dan singkatan dalam rumus</PageHeading>
        <Lead>
          Rumus seperti <b>S + V1 + O</b> muncul di semua sub-tab. Baca bagian
          ini sekali supaya setiap rumus langsung terbaca sebagai kalimat.
        </Lead>
      </div>

      <Card tone="ink" pad="lg" className="gap-3.5">
        <span className="font-mono text-xs tracking-[0.06em] text-green">
          SATU KALIMAT, DIPOTONG PER BAGIAN
        </span>
        <div className="flex flex-wrap items-end gap-2">
          {ANATOMY.map(([w, tag, c]) => (
            <div key={w} className="flex flex-col items-center gap-1">
              <span
                className="border-b-[3px] px-0.5 pb-0.5 font-serif text-[22px] italic"
                style={{ borderColor: c }}
              >
                {w}
              </span>
              <span className="font-mono text-[11.5px]" style={{ color: c }}>
                {tag}
              </span>
            </div>
          ))}
          <SpeakButton text="My sister is cooking fried rice in the kitchen now." />
        </div>
        <span className="text-sm leading-[1.55] text-pretty text-ink-2">
          Rumusnya:{" "}
          <b className="font-mono text-[13px]">
            S + am/is/are + V-ing + O + keterangan
          </b>
          . Urutan dasar bahasa Inggris hampir selalu{" "}
          <b>S → V → O → keterangan tempat → keterangan waktu</b>.
        </span>
      </Card>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-2.5">
        {TERMS.map(([k, en, id, b, ex]) => (
          <div
            key={k}
            className="flex flex-col gap-1.5 rounded-[10px] border border-line bg-card px-4 py-3.5"
          >
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span className="font-mono text-[17px] font-bold text-green">
                {k}
              </span>
              <span className="text-sm font-bold">{en}</span>
              <span className="text-[13px] text-muted">· {id}</span>
            </div>
            <span className="text-[13.5px] leading-[1.5] text-pretty text-ink-2">
              {b}
            </span>
            <div className="flex items-center gap-2 border-t border-dashed border-line pt-1.5">
              <span className="font-serif text-[15.5px] italic">
                <Rich text={ex} />
              </span>
              <SpeakButton
                size={22}
                icon={11}
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
