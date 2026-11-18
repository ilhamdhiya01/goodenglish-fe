"use client";

import React from "react";

import FieldLabel from "@/components/ui/field-label";
import Pill from "@/components/ui/pill";
import Select from "@/components/ui/select";
import { speak } from "@/lib/helpers/speech.helper";
import { KOKORO_SPEEDS, KOKORO_VOICES } from "@/lib/tts/kokoro.types";
import { useTtsStore } from "@/stores/useTtsStore";

const SAMPLE = "Hello! I usually take the bus to the office.";

// Body of the "Suara pengucap" dialog: the Kokoro voice, its speed and status.
export const VoiceFields = () => {
  const voice = useTtsStore((s) => s.voice);
  const setVoice = useTtsStore((s) => s.setVoice);
  const speed = useTtsStore((s) => s.speed);
  const setSpeed = useTtsStore((s) => s.setSpeed);
  const status = useTtsStore((s) => s.status);
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

      <div className="flex flex-col gap-1.5">
        <span id="tts-speed" className="text-[13px] font-extrabold text-ink-2">
          Kecepatan bicara
        </span>
        <div
          role="group"
          aria-labelledby="tts-speed"
          className="flex flex-wrap gap-2"
        >
          {KOKORO_SPEEDS.map(([v, label]) => (
            <Pill
              key={v}
              size="sm"
              on={speed === v}
              onClick={() => {
                setSpeed(v);
                speak(SAMPLE);
              }}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      {status === "loading" && (
        <span className="text-[13.5px] font-bold text-ink-2">
          Suara AI sedang disiapkan…
        </span>
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
        sekali (±90 MB) lalu tersimpan di browser. Memilih suara atau kecepatan
        akan memutar contoh.
      </span>
    </>
  );
};
