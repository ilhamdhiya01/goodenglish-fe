"use client";

import type { AxiosError } from "axios";
import React, { useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import TextButton from "@/components/ui/text-button";
import { accessErrorText, AI_MODELS_WARNINGS } from "@/const/access.constant";
import { formatDateTime } from "@/lib/helpers/date.helper";
import { useAiSettings } from "@/lib/hooks/admin/useAiSettings";
import type { AiModels, AiSettings } from "@/lib/types/ai-settings.types";
import type { ErrorResponse } from "@/lib/types/api.types";

type Hook = ReturnType<typeof useAiSettings>;

const HINT = "text-[12.5px] leading-[18px] font-semibold text-ink-2";
// Names from the server setup, in the body font (mono is for access tokens).
const CODE = "rounded-sm bg-surface px-1 font-sans font-extrabold";

const KeyStatus = ({ s }: { s: AiSettings }) =>
  !s.hasKey ? (
    <span className="text-sm font-bold text-bad">
      Belum ada API key — Tanya AI nonaktif untuk semua pengguna.
    </span>
  ) : s.keyReadable ? (
    <span className="text-sm font-bold text-ok">
      Key tersimpan · …{s.last4} — Tanya AI aktif.
    </span>
  ) : (
    <span className="text-sm font-bold text-bad">
      Key tersimpan (…{s.last4}) tapi tidak bisa dibaca server, kemungkinan
      ENCRYPTION_KEY berubah. Masukkan key lagi.
    </span>
  );

// The form itself; remounted (key) after each save so it starts from the
// stored values again.
const Form = ({ s, hook }: { s: AiSettings; hook: Hook }) => {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(s.model);
  const [preview, setPreview] = useState<AiModels | null>(null);
  const [keyError, setKeyError] = useState("");

  const typedKey = apiKey.trim();
  const list = preview ?? hook.models;
  // The saved model stays selectable even if Google no longer lists it.
  const options = list?.models.some((m) => m.id === model)
    ? list.models
    : [{ id: model, label: model }, ...(list?.models ?? [])];
  const dirty = !!typedKey || model !== s.model;
  const canSave = dirty && (!typedKey || s.encryptionReady) && !hook.isSaving;

  const loadModels = async () => {
    setKeyError("");
    try {
      const res = await hook.handlePreview(typedKey);
      setPreview(res.data);
    } catch (err) {
      setKeyError(accessErrorText((err as AxiosError<ErrorResponse>).message));
    }
  };

  const save = async () => {
    setKeyError("");
    try {
      await hook.handleSave({ apiKey: typedKey || undefined, model });
    } catch (err) {
      setKeyError(accessErrorText((err as AxiosError<ErrorResponse>).message));
    }
  };

  return (
    <Card tone="line" pad="lg" className="gap-4">
      <SectionLabel tone="green">GOOGLE GEMINI · TANYA AI</SectionLabel>
      <KeyStatus s={s} />

      {!s.encryptionReady && (
        <Card tone="redBg" pad="sm">
          <span className="text-[13.5px] leading-5 font-semibold text-bad-edge">
            <b className="font-extrabold">ENCRYPTION_KEY</b> belum di-set di{" "}
            <code className={CODE}>.env</code> server, jadi API key belum bisa
            disimpan. Isi dengan hasil{" "}
            <code className={CODE}>openssl rand -hex 32</code>, lalu restart
            backend.
          </span>
        </Card>
      )}

      <FieldLabel label={s.hasKey ? "Ganti API key (opsional)" : "API key"}>
        <Input
          type="password"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setPreview(null);
            setKeyError("");
          }}
          placeholder={
            s.hasKey
              ? `Tersimpan (…${s.last4}) — isi untuk mengganti`
              : "Tempel API key dari aistudio.google.com/apikey"
          }
          error={keyError || undefined}
        />
      </FieldLabel>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <FieldLabel label="Model">
              <Select value={model} onChange={(e) => setModel(e.target.value)}>
                {options.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label === m.id ? m.id : `${m.label} · ${m.id}`}
                  </option>
                ))}
              </Select>
            </FieldLabel>
          </div>
          {typedKey && !preview && (
            <Button
              variant="outline"
              disabled={hook.isPreviewing}
              onClick={() => void loadModels()}
            >
              {hook.isPreviewing ? "Mengecek…" : "Muat model dari key ini"}
            </Button>
          )}
        </div>
        <span className={HINT}>
          {hook.isLoadingModels && !list
            ? "Memuat daftar model dari Google…"
            : list?.source === "live"
              ? preview
                ? `${list.models.length} model tersedia untuk key yang baru diketik.`
                : `${list.models.length} model tersedia untuk key tersimpan.`
              : (AI_MODELS_WARNINGS[list?.warning ?? ""] ??
                "Daftar model bawaan.")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="green" disabled={!canSave} onClick={() => void save()}>
          {hook.isSaving
            ? typedKey
              ? "Mengecek key…"
              : "Menyimpan…"
            : "Simpan"}
        </Button>
        {s.hasKey && (
          <TextButton
            tone="red"
            className="hit-44"
            disabled={hook.isRemoving}
            onClick={() => {
              if (
                window.confirm(
                  "Hapus API key? Tanya AI langsung nonaktif untuk semua pengguna.",
                )
              )
                void hook.handleRemoveKey().catch(() => {});
            }}
          >
            Hapus key
          </TextButton>
        )}
        {s.updatedAt && (
          <span className={HINT}>
            Terakhir diubah {s.updatedBy ? `oleh ${s.updatedBy} · ` : ""}
            {formatDateTime(s.updatedAt)}
          </span>
        )}
      </div>
      <span className={HINT}>
        Key dicek ke Google sebelum disimpan, lalu disimpan terenkripsi di
        database. Perubahan langsung berlaku tanpa restart.
      </span>
    </Card>
  );
};

// Admin › Tanya AI: the Gemini key and model, saved in the DB instead of .env.
const AiSettingsCard = React.memo(() => {
  const hook = useAiSettings();
  if (hook.isLoading)
    return <span className="text-[13px] font-bold text-ink-2">Memuat…</span>;
  if (hook.isError || !hook.settings)
    return (
      <span className="text-sm font-bold text-bad">
        Gagal memuat pengaturan Tanya AI.
      </span>
    );
  return (
    <Form
      key={`${hook.settings.updatedAt}|${hook.settings.hasKey}`}
      s={hook.settings}
      hook={hook}
    />
  );
});

AiSettingsCard.displayName = "AiSettingsCard";

export default AiSettingsCard;
