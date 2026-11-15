"use client";

import React, { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import IconButton from "@/components/ui/icon-button";
import Input from "@/components/ui/input";
import Lead from "@/components/ui/lead";
import Menu from "@/components/ui/menu";
import Modal from "@/components/ui/modal";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import ProgressBar from "@/components/ui/progress-bar";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import Sheet from "@/components/ui/sheet";
import SpeakButton from "@/components/ui/speak-button";
import TextButton from "@/components/ui/text-button";
import TypeBadge from "@/components/ui/type-badge";
import { TYPES } from "@/const/vocab-types.constant";

// Every primitive in every variant and state, for checking the theme by eye
// and with the keyboard. Development only (app/dev/ui/page.tsx).

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-3">
    <h2 className="m-0 text-base leading-[22px] font-extrabold">{title}</h2>
    <div className="flex flex-wrap items-center gap-3">{children}</div>
  </section>
);

const MoreIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const UiGallery = () => {
  const [pills, setPills] = useState({ a: true, b: false });
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [picked, setPicked] = useState("");

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 md:px-8">
      <div className="flex flex-col gap-2">
        <SectionLabel tone="green">DEV · PRIMITIVE</SectionLabel>
        <h1 className="m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] md:text-[30px] md:leading-9">
          Lompat · biru laut
        </h1>
        <PageHeading>PageHeading (h2)</PageHeading>
        <Lead>
          Semua komponen di components/ui dengan setiap varian dan state. Coba
          navigasi pakai Tab, Enter, panah, dan Esc.
        </Lead>
      </div>

      <Section title="Button · varian (md)">
        <Button variant="green">Utama</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="danger">Hapus</Button>
        <Button variant="green" disabled>
          Nonaktif
        </Button>
      </Section>
      <Section title="Button · ukuran">
        <Button variant="green" size="sm">
          Kecil
        </Button>
        <Button variant="outline" size="sm">
          Tandai hafal
        </Button>
        <Button variant="green" size="md">
          Buka kosakata →
        </Button>
        <Button variant="green" size="lg">
          Masuk
        </Button>
      </Section>

      <Section title="Card · tone">
        {(["line", "ink", "done", "greenBg", "redBg", "dashed"] as const).map(
          (tone) => (
            <Card key={tone} tone={tone} className="w-[260px]">
              <span className="text-[12.5px] font-extrabold tracking-[0.07em] text-ink-2 uppercase">
                {tone}
              </span>
              <span className="text-[15px] leading-[22px]">
                Pelajari 25 kata baru dari Minggu 3.
              </span>
            </Card>
          ),
        )}
      </Section>

      <Section title="Pill">
        <Pill
          on={pills.a}
          check
          onClick={() => setPills((p) => ({ ...p, a: !p.a }))}
        >
          Terjemahan
        </Pill>
        <Pill
          on={pills.b}
          check
          onClick={() => setPills((p) => ({ ...p, b: !p.b }))}
        >
          Sembunyikan baris You
        </Pill>
        <Pill size="sm" on>
          Rumus 2
        </Pill>
        <Pill size="sm">Rumus 3</Pill>
        <Pill size="sm" disabled>
          Nonaktif
        </Pill>
      </Section>

      <Section title="TextButton">
        <TextButton>+ kalimatku</TextButton>
        <TextButton tone="green">tanya AI</TextButton>
        <TextButton tone="red">hapus</TextButton>
      </Section>

      <Section title="IconButton · SpeakButton">
        <IconButton aria-label="Lainnya">
          <MoreIcon />
        </IconButton>
        <IconButton aria-label="Lainnya (aktif)" active>
          <MoreIcon />
        </IconButton>
        <IconButton aria-label="Nonaktif" disabled>
          <MoreIcon />
        </IconButton>
        <SpeakButton text="look forward to" />
        <SpeakButton text="run out of" size={28} icon={14} />
      </Section>

      <Section title="TypeBadge · SectionLabel">
        {Object.keys(TYPES).map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
        <SectionLabel>RUMUS AKTIF</SectionLabel>
        <SectionLabel tone="green">YOU · GILIRANMU</SectionLabel>
        <SectionLabel tone="red">✕ JEBAKAN</SectionLabel>
      </Section>

      <Section title="Input · Select · FieldLabel">
        <FieldLabel label="Kalimatku" className="w-[280px]">
          <Input placeholder="Tulis satu kalimat…" />
        </FieldLabel>
        <FieldLabel label="Token akses" className="w-[280px]">
          <Input
            defaultValue="ge_salah"
            className="font-mono"
            error="Token tidak dikenal. Periksa lagi."
          />
        </FieldLabel>
        <FieldLabel label="Nonaktif" className="w-[280px]">
          <Input disabled placeholder="Memeriksa…" />
        </FieldLabel>
        <FieldLabel label="Level" className="w-[280px]">
          <Select defaultValue="pre">
            <option value="beginner">Pemula</option>
            <option value="pre">Pre-intermediate</option>
          </Select>
        </FieldLabel>
      </Section>

      <Section title="ProgressBar">
        <ProgressBar pct={40} label="86 dari 214 hafal" className="w-[360px]" />
        <ProgressBar
          pct={100}
          tone="mint"
          label="selesai"
          className="w-[360px]"
        />
      </Section>

      <Section title="Modal · Sheet · Menu">
        <Button variant="outline" onClick={() => setModal(true)}>
          Buka modal
        </Button>
        <Button variant="outline" onClick={() => setSheet(true)}>
          Buka lembar
        </Button>
        <Menu
          label="Menu akun"
          button={(p) => (
            <IconButton aria-label="Menu akun" {...p}>
              <MoreIcon />
            </IconButton>
          )}
        >
          <Menu.Item onSelect={() => setPicked("Ekspor")}>
            Ekspor progres
          </Menu.Item>
          <Menu.Item onSelect={() => setPicked("Impor")}>
            Impor progres
          </Menu.Item>
          <Menu.Item
            onSelect={() => setPicked("Suara")}
            hint="Google US English"
          >
            Pilih suara
          </Menu.Item>
          <Menu.Separator />
          <Menu.Item tone="bad" onSelect={() => setPicked("Keluar")}>
            Keluar
          </Menu.Item>
        </Menu>
        {picked && (
          <span className="text-sm text-ink-2">Dipilih: {picked}</span>
        )}
      </Section>

      {modal && (
        <Modal label="Contoh modal" onClose={() => setModal(false)}>
          <Card pad="lg">
            <SectionLabel>MODAL</SectionLabel>
            <span className="text-xl font-black">Soal 7 / 20</span>
            <Input placeholder="Ketik jawaban…" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(false)}>
                Tutup
              </Button>
              <Button variant="green" onClick={() => setModal(false)}>
                Soal berikutnya
              </Button>
            </div>
          </Card>
        </Modal>
      )}
      {sheet && (
        <Sheet label="Lainnya" onClose={() => setSheet(false)}>
          {[
            "Kesalahan umum",
            "Panduan grammar",
            "Pelafalan",
            "Cheat sheet",
          ].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSheet(false)}
              className="flex min-h-11 items-center rounded-md px-3 text-left font-extrabold focus-ring hover:bg-sunken"
            >
              {m}
            </button>
          ))}
        </Sheet>
      )}
    </main>
  );
};

export default UiGallery;
