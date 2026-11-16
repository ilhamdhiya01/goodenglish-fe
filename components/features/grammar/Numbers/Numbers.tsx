"use client";

import React from "react";

import WordTile from "@/components/shared/patterns/word-tile";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { speak } from "@/lib/helpers/speech.helper";

const Ex = ({ en, id }: { en: string; id: string }) => {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-base leading-[22px] font-bold text-ink">
          {en}
        </span>
        <SpeakButton size={28} icon={13} text={en} />
      </div>
      <span className="text-[13px] text-ink-2">{id}</span>
    </div>
  );
};

const CARDINAL = [
  "1 (one)",
  "2 (two)",
  "3 (three)",
  "10 (ten)",
  "100 (a hundred)",
];
const ORDINAL = [
  "1st (first)",
  "2nd (second)",
  "3rd (third)",
  "10th (tenth)",
  "100th (hundredth)",
];

const Chips = ({ xs }: { xs: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {xs.map((x) => (
      <WordTile key={x} onClick={() => speak(x.replace(/^.*\((.*)\)$/, "$1"))}>
        {x}
      </WordTile>
    ))}
  </div>
);

// Sub-tab "Angka": cardinal vs ordinal dalam situasi nyata.
const Numbers = React.memo(() => {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex max-w-[760px] flex-col gap-1">
        <SectionLabel>NUMBERS</SectionLabel>
        <span className="text-[15px] leading-[22px] font-semibold text-pretty text-ink-2">
          Ketika berbicara tentang angka dalam bahasa Inggris, ada dua jenis
          utama yang perlu kamu pahami: <b>Cardinal Numbers</b> dan{" "}
          <b>Ordinal Numbers</b>. Apa bedanya?
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
        <Card pad="lg" className="gap-3">
          <SectionLabel tone="green">
            1 · CARDINAL NUMBERS (ANGKA KARDINAL)
          </SectionLabel>
          <span className="text-[15px] leading-[22px] font-semibold text-pretty text-ink-2">
            Angka yang digunakan untuk menghitung jumlah sesuatu. Sederhananya,
            angka biasa (tidak ada tingkatan) yang menjawab pertanyaan{" "}
            <b>&quot;Berapa banyak?&quot;</b>
          </span>
          <Chips xs={CARDINAL} />
          <span className="text-[13px] font-bold text-ink-2">
            Gunakan saat kamu ingin:
          </span>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <b className="text-sm font-extrabold text-ink">
                Menghitung sesuatu
              </b>
              <Ex en="I have three apples." id="Aku punya tiga apel" />
            </div>
            <div className="flex flex-col gap-1">
              <b className="text-sm font-extrabold text-ink">
                Menjawab pertanyaan jumlah
              </b>
              <Ex
                en="How many books do you have?"
                id="Berapa buku yang kamu punya?"
              />
              <Ex en="Five books." id="Lima buku" />
            </div>
          </div>
        </Card>
        <Card pad="lg" className="gap-3">
          <SectionLabel tone="green">
            2 · ORDINAL NUMBERS (ANGKA ORDINAL)
          </SectionLabel>
          <span className="text-[15px] leading-[22px] font-semibold text-pretty text-ink-2">
            Angka yang menunjukkan urutan atau posisi dalam sebuah daftar atau
            barisan. Ini menjawab pertanyaan <b>&quot;Yang keberapa?&quot;</b>
          </span>
          <Chips xs={ORDINAL} />
          <span className="text-[13px] font-bold text-ink-2">
            Gunakan untuk:
          </span>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <b className="text-sm font-extrabold text-ink">Urutan / posisi</b>
              <Ex en="She finished first." id="Dia selesai pertama" />
            </div>
            <div className="flex flex-col gap-1">
              <b className="text-sm font-extrabold text-ink">
                Tanggal dan lantai
              </b>
              <Ex
                en="My birthday is on the third of May."
                id="Ulang tahunku tanggal tiga Mei"
              />
              <Ex
                en="I live on the second floor."
                id="Aku tinggal di lantai dua"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

Numbers.displayName = "Numbers";

export default Numbers;
