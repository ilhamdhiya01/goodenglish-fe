"use client";

import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { LuEllipsis } from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import { Tests } from "@/components/features/tests";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import IconButton from "@/components/ui/icon-button";
import Menu from "@/components/ui/menu";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import TextButton from "@/components/ui/text-button";
import { NAMA_HARI, RENCANA } from "@/const/rencana.config";
import { useShellData } from "@/lib/hooks/useShellData";
import type { StatusLangkah } from "@/lib/rencana/evaluasi";
import { laporAktivitas } from "@/lib/rencana/lapor";
import { useRencana } from "@/lib/rencana/useRencana";
import type { LevelId } from "@/lib/types/session.types";
import { confirmDialog } from "@/stores/useConfirmStore";
import { useLevelStore } from "@/stores/useLevelStore";
import { usePlanStore } from "@/stores/usePlanStore";

import CheckpointCard from "../CheckpointCard";
import PakaiKalimat from "../PakaiKalimat";

// A read-only count shaped like a Pill ("Hari ini 2/4", "Streak 5 hari").
const Stat = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex min-h-[34px] items-center gap-1 rounded-full border-2 border-line bg-surface px-3.5 text-[13px] font-extrabold whitespace-nowrap text-ink-2">
    {children}
  </span>
);

// Number bubble of a step: ✓ when done, filled blue when it's its turn.
const StepNo = ({
  no,
  state,
}: {
  no: number;
  state: "done" | "now" | "next";
}) => (
  <span
    aria-hidden
    className={classNames(
      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-black",
      state === "done"
        ? "bg-ok-bg text-ok"
        : state === "now"
          ? "bg-accent text-on-accent"
          : "bg-chip text-ink-2",
    )}
  >
    {state === "done" ? "✓" : no}
  </span>
);

const goTo = (l: StatusLangkah, push: (href: string) => void) => {
  if (l.tautan.startsWith("#")) {
    document
      .getElementById(l.tautan.slice(1))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  push(l.tautan);
};

// Rencana: today's steps (from the activity log, never from opening a
// page), the duration, streak, the weekly checkpoint (Saturday–Monday) and
// the end-of-level exam as a recommendation.
const PlanPage = React.memo(() => {
  const router = useRouter();
  const { data, level } = useShellData();
  const { hari, checkpoint, streak, durasi, minggu, kunci, T } = useRencana();
  const setWeek = useLevelStore((s) => s.setWeek);
  const setDurasi = usePlanStore((s) => s.setDurasi);
  const setMinggu = usePlanStore((s) => s.setMinggu);
  const plan = data.plan;
  const row = plan[minggu.minggu - 1];
  const next = hari.berikutnya;
  const pakai = hari.langkah.find((l) => l.aksi === "pakai_kalimat");
  const pakaiSudah =
    pakai?.progres?.n ?? (pakai?.selesai ? RENCANA.kalimatHarian : 0);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex max-w-[760px] min-w-0 flex-col gap-1.5">
          <SectionLabel>
            {NAMA_HARI[hari.hari]} · Minggu {minggu.minggu}
          </SectionLabel>
          <h2 className="m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] text-ink md:text-[30px] md:leading-9">
            {row?.[1] ?? `Minggu ${minggu.minggu}`}
          </h2>
          {row?.[2] && (
            <span className="text-sm font-bold text-ink-2">{row[2]}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Stat>
            Hari ini{" "}
            <b className="text-ink tabular-nums">
              {hari.selesai}/{hari.jumlah}
            </b>
          </Stat>
          <Stat>
            Streak <b className="text-ink tabular-nums">{streak}</b> hari
          </Stat>
          <Menu
            label="Menu rencana"
            button={(p) => (
              <IconButton aria-label="Menu rencana" title="Menu rencana" {...p}>
                <LuEllipsis aria-hidden size={18} />
              </IconButton>
            )}
          >
            <Menu.Item
              onSelect={() =>
                void confirmDialog({
                  title: "Mulai ulang minggu ini?",
                  message:
                    "Checkpoint minggu ini dihitung lagi dari hari ini. Streak dan riwayat tidak dihapus.",
                  confirmLabel: "Mulai ulang",
                }).then(
                  (ok) =>
                    ok && setMinggu(kunci, { mulai: T, lulus: undefined }),
                )
              }
            >
              Mulai ulang minggu ini
            </Menu.Item>
          </Menu>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <FieldLabel label="Pindah minggu" className="w-full max-w-[420px]">
          <Select
            value={minggu.minggu}
            onChange={(e) => setWeek(+e.target.value)}
          >
            {plan.map(([w, title]) => (
              <option key={w} value={w}>
                Minggu {w} · {title}
              </option>
            ))}
          </Select>
        </FieldLabel>
        {!hari.akhirPekan && (
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-2 p-0 text-[13px] font-extrabold text-ink-2">
              Berapa lama hari ini?
            </legend>
            <div className="flex flex-wrap gap-2">
              {RENCANA.durasi.map((d) => (
                <Pill key={d} on={durasi === d} onClick={() => setDurasi(d)}>
                  {d} menit
                </Pill>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      {!next ? (
        <Card tone="greenBg" className="flex-row items-center gap-4">
          <Jalak mood="bangga" />
          <span className="text-[15px] leading-[22px] font-bold text-ink">
            Selesai untuk hari ini. Sampai besok.
          </span>
        </Card>
      ) : (
        <Button
          variant="green"
          size="lg"
          className="self-start"
          onClick={() => goTo(next, router.push)}
        >
          Lanjut: {next.judul} →
        </Button>
      )}

      <div className="grid items-start gap-5 @min-[56rem]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <ol
            aria-label="Langkah hari ini"
            className="m-0 flex list-none flex-col gap-3 p-0"
          >
            {hari.langkah.map((l, i) => {
              const state = l.selesai ? "done" : l === next ? "now" : "next";
              return (
                <li key={l.id}>
                  <Card
                    tone={
                      state === "done"
                        ? "done"
                        : state === "now"
                          ? "ink"
                          : "line"
                    }
                    className="gap-2.5"
                  >
                    <div className="flex items-center gap-3.5">
                      <StepNo no={i + 1} state={state} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-base leading-[22px] font-extrabold text-ink">
                          {l.judul}
                          {l.progres && !l.selesai && (
                            <span className="font-bold text-ink-2 tabular-nums">
                              {" "}
                              · {l.progres.n}/{l.progres.dari}
                            </span>
                          )}
                        </span>
                        <span className="text-[13.5px] leading-[19px] text-ink-2">
                          {l.isi}
                        </span>
                      </div>
                      {l.selesai ? (
                        <span className="shrink-0 text-sm font-extrabold text-ok">
                          Selesai
                        </span>
                      ) : (
                        <Button
                          variant={state === "now" ? "green" : "outline"}
                          size="sm"
                          className="shrink-0"
                          onClick={() => goTo(l, router.push)}
                        >
                          Buka →
                        </Button>
                      )}
                    </div>
                    {!l.selesai && (l.alternatif || l.bolehLewati) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pl-[54px]">
                        {l.alternatif && (
                          <Link
                            href={l.alternatif.tautan}
                            className="text-[13px] font-extrabold text-accent-edge focus-ring hover:underline"
                          >
                            {l.alternatif.judul} →
                          </Link>
                        )}
                        {l.bolehLewati && (
                          <TextButton
                            onClick={() =>
                              laporAktivitas("langkah_dilewati", {
                                data: { langkah: l.id },
                              })
                            }
                          >
                            Semua kata minggu ini sudah ditandai · lewati
                          </TextButton>
                        )}
                      </div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ol>
          {/* Stays after the step is done, so the results remain visible
              and more sentences can be checked. */}
          {pakai && (
            <PakaiKalimat level={level as LevelId} sudah={pakaiSudah} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {checkpoint.tampil && (
            <CheckpointCard
              cp={checkpoint}
              minggu={minggu.minggu}
              adaBerikutnya={minggu.minggu < plan.length}
              onPindah={() => setWeek(minggu.minggu + 1)}
            />
          )}
          <Tests.ExamCard />
        </div>
      </div>
    </section>
  );
});

PlanPage.displayName = "PlanPage";

export default PlanPage;
