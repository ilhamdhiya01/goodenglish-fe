"use client";

import { useRouter } from "next/navigation";
import React, { useId, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuDownload,
  LuKeyRound,
  LuLogOut,
  LuSmartphone,
  LuUpload,
  LuVolume2,
} from "react-icons/lu";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Modal from "@/components/ui/modal";
import Select from "@/components/ui/select";
import {
  exportProgress,
  importProgressFile,
} from "@/lib/helpers/progress-export.helper";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useInstallPrompt } from "@/lib/hooks/useInstallPrompt";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/routes";
import { useAccessStore } from "@/stores/useAccessStore";
import { useVoiceStore } from "@/stores/useVoiceStore";

export interface AccountAction {
  id: string;
  label: string;
  icon: IconType;
  onSelect: () => void;
  tone?: "default" | "bad";
  disabled?: boolean;
}

const voiceLabel = (v: SpeechSynthesisVoice) =>
  v.name
    .replace(/^Microsoft |^Google /, "")
    .replace(/ Online \(Natural\)/, " (Natural)");

// The device/account actions that used to be icons in the header: install,
// export, import, voice, admin dashboard, sign out. Shown in the ⋯ menu on
// a computer and in the "Lainnya" sheet on a phone. `extras` (the hidden
// file input and the voice dialog) must be rendered once by the caller.
export const useAccountActions = () => {
  const router = useRouter();
  const voices = useVoiceStore((s) => s.list);
  const current = useVoiceStore((s) => s.current);
  const selectVoice = useVoiceStore((s) => s.select);
  const isAdmin = useAccessStore((s) => s.session?.role === "admin");
  const { handleLogout, isLoggingOut } = useLogout();
  const { canInstall, install } = useInstallPrompt();
  const fileId = useId();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const actions = (
    [
      canInstall && {
        id: "install",
        label: "Install aplikasi",
        icon: LuSmartphone,
        onSelect: () => void install(),
      },
      {
        id: "export",
        label: "Ekspor progres",
        icon: LuDownload,
        onSelect: exportProgress,
      },
      {
        id: "import",
        label: "Impor progres",
        icon: LuUpload,
        onSelect: () => document.getElementById(fileId)?.click(),
      },
      voices.length > 0 && {
        id: "voice",
        label: "Pilih suara",
        icon: LuVolume2,
        onSelect: () => setVoiceOpen(true),
      },
      isAdmin && {
        id: "admin",
        label: "Dashboard admin",
        icon: LuKeyRound,
        onSelect: () => router.push(ROUTES.ADMIN_TOKENS),
      },
      {
        id: "logout",
        label: "Keluar",
        icon: LuLogOut,
        tone: "bad" as const,
        disabled: isLoggingOut,
        onSelect: () => handleLogout(),
      },
    ] as (AccountAction | false)[]
  ).filter((a): a is AccountAction => !!a);

  const extras = (
    <>
      <input
        id={fileId}
        type="file"
        accept=".json,application/json"
        aria-label="Impor progres dari file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f)
            importProgressFile(f, (msg) =>
              msg.startsWith("Progres diimpor")
                ? toast.success(msg)
                : toast.error(msg),
            );
          e.target.value = "";
        }}
      />
      {voiceOpen && (
        <Modal label="Suara pengucap" onClose={() => setVoiceOpen(false)}>
          <Card pad="lg">
            <span className="text-xl leading-[26px] font-black">
              Suara pengucap
            </span>
            <FieldLabel label="Suara">
              <Select
                value={current}
                onChange={(e) => selectVoice(e.target.value)}
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {voiceLabel(v) + " · " + v.lang}
                  </option>
                ))}
              </Select>
            </FieldLabel>
            <span className="text-[13.5px] leading-[19px] text-ink-2">
              Memilih suara akan memutar contoh. Suara &quot;Natural&quot;
              terdengar paling alami.
            </span>
            <Button
              variant="outline"
              className="self-end"
              onClick={() => setVoiceOpen(false)}
            >
              Selesai
            </Button>
          </Card>
        </Modal>
      )}
    </>
  );

  return { actions, extras };
};
