"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import React, { useMemo, useState } from "react";

import Card from "@/components/ui/card";
import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import { accessErrorText, LEVEL_OPTIONS } from "@/const/access.constant";
import { TOPIK_BAWAAN, TOPIK_HALAMAN } from "@/const/rencana.config";
import { VOCAB_SCEN } from "@/lib/content";
import { levelData } from "@/lib/helpers/level-data.helper";
import { skenarioBergilir } from "@/lib/rencana/useRencana";
import { toast } from "@/lib/toast";
import type { ErrorResponse } from "@/lib/types/api.types";
import { GRAMMAR_SUBS } from "@/lib/types/grammar.types";
import type { Scenario } from "@/lib/types/scenario.types";
import type { LevelId } from "@/lib/types/session.types";
import { getAdminPetaMinggu, putPetaMinggu } from "@/services/rencana.service";

const SC = VOCAB_SCEN as Scenario[];
const topikLabel = (t: string) =>
  GRAMMAR_SUBS.find((s) => s.id === TOPIK_HALAMAN[t])?.label ?? t;

// Admin › Kelola › Peta minggu: the grammar topic and the scenario each week
// of a level practises in Rencana. Empty = the default (Bertanya; the
// level's scenarios in turn). Only existing topics and scenarios are offered.
const PetaMingguManager = () => {
  const qc = useQueryClient();
  const [level, setLevel] = useState<LevelId>("pre");
  const weeks = useMemo(() => levelData(level, []).plan, [level]);
  const scenarios = SC.filter((s) => s.level === level);
  const key = ["rencana", "admin-minggu", level] as const;
  const list = useQuery({
    queryKey: key,
    queryFn: () => getAdminPetaMinggu(level),
    select: (r) => r.data ?? [],
  });
  const save = useMutation({
    mutationFn: putPetaMinggu,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["rencana"] });
      toast.success("Peta minggu disimpan");
    },
    onError: (e: AxiosError<ErrorResponse>) =>
      toast.error(accessErrorText(e.message)),
  });
  const rowOf = (w: number) => list.data?.find((r) => r.week === w);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex max-w-[760px] flex-col gap-1.5">
        <PageHeading>Peta minggu</PageHeading>
        <Lead>
          Topik grammar (langkah Bentuk dan checkpoint) dan skenario (Masuk
          Rabu, Pakai Rabu–Kamis, tugas nyata) untuk tiap minggu. Kosong =
          bawaan: Bertanya, dan skenario level ini secara bergilir.
        </Lead>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Level">
        {LEVEL_OPTIONS.map((l) => (
          <Pill key={l.id} on={level === l.id} onClick={() => setLevel(l.id)}>
            {l.label}
          </Pill>
        ))}
      </div>
      <Card className="gap-0 p-0">
        {list.isLoading ? (
          <span className="p-4 text-[13px] font-bold text-ink-2">Memuat…</span>
        ) : list.isError ? (
          <span className="p-4 text-sm font-bold text-bad">
            Gagal memuat peta minggu.
          </span>
        ) : (
          <ul aria-label="Minggu" className="m-0 flex list-none flex-col p-0">
            {weeks.map(([w, title]) => {
              const row = rowOf(w);
              return (
                <li
                  key={w}
                  className="grid items-center gap-2 border-b-2 border-line px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_220px_220px]"
                >
                  <span className="flex flex-col">
                    <SectionLabel>MINGGU {w}</SectionLabel>
                    <span className="text-sm font-bold text-ink">{title}</span>
                  </span>
                  <Select
                    aria-label={`Topik grammar minggu ${w}`}
                    value={row?.grammarTopic ?? ""}
                    onChange={(e) =>
                      save.mutate({
                        level,
                        week: w,
                        grammarTopic: e.target.value || null,
                      })
                    }
                  >
                    <option value="">
                      Bawaan · {topikLabel(TOPIK_BAWAAN)}
                    </option>
                    {Object.keys(TOPIK_HALAMAN).map((t) => (
                      <option key={t} value={t}>
                        {topikLabel(t)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    aria-label={`Skenario minggu ${w}`}
                    value={row?.scenarioId ?? ""}
                    onChange={(e) =>
                      save.mutate({
                        level,
                        week: w,
                        scenarioId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">
                      Bergilir ·{" "}
                      {SC.find((s) => s.id === skenarioBergilir(level, w))
                        ?.title ?? "—"}
                    </option>
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </Select>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
};

export default PetaMingguManager;
