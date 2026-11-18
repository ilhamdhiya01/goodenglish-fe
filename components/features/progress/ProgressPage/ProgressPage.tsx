"use client";

import React, { useMemo, useSyncExternalStore } from "react";

import Lead from "@/components/ui/lead";
import PageHeading from "@/components/ui/page-heading";
import { buildProgressReport } from "@/lib/helpers/progress-report.helper";
import {
  getProgressSnapshot,
  snapshotVersion,
  subscribeSnapshot,
  today,
} from "@/lib/helpers/storage.helper";
import { useAccessStore } from "@/stores/useAccessStore";

import ProgressReport from "../ProgressReport";

// "Progres" (learner): the report from this device's progress docs, kept
// live as they change.
const ProgressPage = () => {
  const version = useSyncExternalStore(
    subscribeSnapshot,
    snapshotVersion,
    () => 0,
  );
  const menus = useAccessStore((s) => s.session?.menus);
  const report = useMemo(
    () => buildProgressReport(getProgressSnapshot(), { today: today(), menus }),
    // Recomputed whenever a progress doc changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, menus],
  );
  return (
    <section className="flex max-w-[960px] flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <PageHeading>Progres</PageHeading>
        <Lead>
          Kemajuanmu dari minggu ke minggu, dan apa yang sebaiknya dilatih
          berikutnya.
        </Lead>
      </div>
      <ProgressReport report={report} />
    </section>
  );
};

export default ProgressPage;
