"use client";

import React from "react";

import FieldLabel from "@/components/ui/field-label";
import ProgressBar from "@/components/ui/progress-bar";
import Select from "@/components/ui/select";
import { speak } from "@/lib/helpers/speech.helper";
import { KOKORO_VOICES } from "@/lib/tts/kokoro.types";
import { useTtsStore } from "@/stores/useTtsStore";

const SAMPLE = "Hello! I usually take the bus to the office.";

// Body of the "Suara pengucap" dialog: the Kokoro voice and its status.
export const VoiceFields = () => {
  const voice = useTtsStore((s) => s.voice);
  const setVoice = useTtsStore((s) => s.setVoice);
  const status = useTtsStore((s) => s.status);
  const progress = useTtsStore((s) => s.progress);
  const device = useTtsStore((s) => s.device);

  return (
    <>
      <FieldLabel label="Suara">
        <Select
          value={voice}
          onChange={(e) => {
            setVoice(e.target.value);
            speak(SAMPLE);
          }}
        >
          {KOKORO_VOICES.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
      </FieldLabel>

      {status === "loading" && (
        <ProgressBar
          pct={progress}
          label={`Mengunduh suara AI… ${progress}%`}
        />
      )}
      {status === "ready" && (
        <span className="text-[13.5px] font-bold text-ok">
          ✓ Siap · dibuat di perangkat ini (
          {device === "webgpu" ? "GPU" : "CPU"})
        </span>
      )}
      {status === "error" && (
        <span className="text-[13.5px] font-bold text-bad">
          Suara gagal dimuat. Periksa koneksi, lalu putar contoh lagi.
        </span>
      )}

      <span className="text-[13.5px] leading-[19px] text-ink-2">
        Suara AI yang mirip manusia, dibuat langsung di perangkatmu. Diunduh
        sekali (±90 MB) lalu tersimpan di browser. Memilih suara akan memutar
        contoh.
      </span>
    </>
  );
};
