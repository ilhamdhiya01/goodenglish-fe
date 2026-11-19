import React from "react";

import Jalak from "@/components/brand/Jalak";
import WordTile from "@/components/shared/patterns/word-tile";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import { speak } from "@/lib/helpers/speech.helper";
import { useInsecurePage } from "@/lib/hooks/useVoiceRecorder";
import { KOKORO_SPEEDS } from "@/lib/tts/kokoro.types";
import type { RoleplayUsage } from "@/lib/types/roleplay.types";
import type { Scenario } from "@/lib/types/scenario.types";
import { useTtsStore } from "@/stores/useTtsStore";

import MissionSteps from "../MissionSteps";

interface RoleplaySetupProps {
  scenario: Scenario;
  /** Key phrases to show: [en, id]. */
  phrases: [string, string][];
  usage?: RoleplayUsage;
  showText: boolean;
  onShowText: (on: boolean) => void;
  /** The page can record the mic (MediaRecorder, https); else typing only. */
  canRecord: boolean;
  online: boolean;
  starting: boolean;
  onStart: () => void;
}

const quotaText = (u?: RoleplayUsage) =>
  !u
    ? "Memeriksa jatah sesi…"
    : u.limit === null
      ? "Jatah sesi hari ini: tanpa batas."
      : `Sisa ${Math.max(0, u.limit - u.used)} dari ${u.limit} sesi hari ini. Sesi baru terhitung setelah kamu bicara 3 kali.`;

// Before the session: the mission, both roles, a few key phrases and the
// options (show the AI's words, voice speed). The speed is the same setting
// as Pilih suara, so changing it here changes it there too.
const RoleplaySetup = ({
  scenario,
  phrases,
  usage,
  showText,
  onShowText,
  canRecord,
  online,
  starting,
  onStart,
}: RoleplaySetupProps) => {
  const rp = scenario.roleplay!;
  const speed = useTtsStore((s) => s.speed);
  const setSpeed = useTtsStore((s) => s.setSpeed);
  const insecure = useInsecurePage();
  const quotaOut = !!usage && usage.limit !== null && usage.used >= usage.limit;

  return (
    <div className="flex flex-col gap-4">
      <Card tone="ink" pad="lg" className="gap-3">
        <SectionLabel tone="green">MISIMU</SectionLabel>
        <p className="m-0 text-lg leading-6 font-black text-ink">
          {rp.missionId}
        </p>
        <MissionSteps steps={rp.steps} done={[]} />
        <span className="text-[13px] leading-[18px] text-ink-2">
          Langkah tercentang sendiri saat kamu melakukannya di percakapan.
          Selama sesi AI tidak mengoreksi; koreksi muncul di rangkuman akhir.
          Jadi bicara saja, salah itu wajar.
        </span>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="gap-1.5">
          <SectionLabel>AI BERPERAN SEBAGAI</SectionLabel>
          <span className="text-[15px] leading-[21px] font-bold text-ink">
            {rp.roleAi}
          </span>
        </Card>
        <Card className="gap-1.5">
          <SectionLabel tone="green">KAMU BERPERAN SEBAGAI</SectionLabel>
          <span className="text-[15px] leading-[21px] font-bold text-ink">
            {rp.roleUser}
          </span>
        </Card>
      </div>

      {phrases.length > 0 && (
        <Card className="gap-3">
          <SectionLabel tone="green">FRASA KUNCI · COBA PAKAI</SectionLabel>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {phrases.map(([en, id]) => (
              <li key={en} className="flex flex-wrap items-center gap-2.5">
                <WordTile title={`Dengarkan "${en}"`} onClick={() => speak(en)}>
                  {en}
                </WordTile>
                <span className="text-[13.5px] text-ink-2">{id}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="gap-3">
        <SectionLabel>PENGATURAN</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <Pill
            size="sm"
            check
            on={showText}
            onClick={() => onShowText(!showText)}
          >
            Tampilkan teks ucapan AI
          </Pill>
        </div>
        <fieldset className="m-0 min-w-0 border-0 p-0">
          <legend className="mb-2 p-0 text-[13px] font-extrabold text-ink-2">
            Kecepatan suara AI (sama dengan Pilih suara)
          </legend>
          <div className="flex flex-wrap gap-2">
            {KOKORO_SPEEDS.map(([v, label]) => (
              <Pill
                key={v}
                size="sm"
                on={speed === v}
                onClick={() => setSpeed(v)}
              >
                {label}
              </Pill>
            ))}
          </div>
        </fieldset>
        {canRecord ? (
          <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
            Jawab dengan suara: tekan mikrofon, bicara, lalu tekan lagi. Pilih
            EN kalau menjawab dalam bahasa Inggris, ID kalau bahasa Indonesia.
            Ucapanmu dituliskan apa adanya (kesalahannya tidak dibetulkan) dan
            bisa kamu perbaiki sebelum dikirim.
          </span>
        ) : insecure ? (
          <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
            Mic tidak tersedia karena halaman ini dibuka lewat http://. Browser
            hanya mengizinkan mikrofon di alamat https:// (atau localhost).
            Tetap bisa main peran dengan mengetik.
          </span>
        ) : (
          <span className="text-[13px] leading-[18px] font-semibold text-ink-2">
            Browser ini belum bisa merekam suara. Tidak apa-apa: kamu tetap bisa
            main peran dengan mengetik jawaban. Untuk bicara langsung, buka
            lewat Chrome atau Safari versi terbaru.
          </span>
        )}
      </Card>

      {!online && (
        <Card tone="dashed" pad="sm" className="flex-row items-center gap-3">
          <Jalak mood="sedih" />
          <span className="text-[13.5px] leading-[19px] font-bold text-ink-2">
            Kamu sedang offline. Main peran butuh internet untuk bicara dengan
            AI.
          </span>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="green"
          size="lg"
          disabled={starting || quotaOut || !online}
          onClick={onStart}
        >
          {starting ? "Menyiapkan…" : "Mulai main peran"}
        </Button>
        <span className="text-[13.5px] font-bold text-ink-2" aria-live="polite">
          {quotaOut
            ? "Jatah sesi hari ini sudah habis. Coba lagi besok, ya."
            : quotaText(usage)}
        </span>
      </div>
    </div>
  );
};

export default RoleplaySetup;
