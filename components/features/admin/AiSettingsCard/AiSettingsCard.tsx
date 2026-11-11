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

const KeyStatus = ({ s }: { s: AiSettings }) =>
  !s.hasKey ? (
    <span className="text-[13px] text-red">
      Belum ada API key — Tanya AI nonaktif untuk semua pengguna.
    </span>
  ) : s.keyReadable ? (
    <span className="text-[13px] text-green">
      Key tersimpan · …{s.last4} — Tanya AI aktif.
    </span>
  ) : (
    <span className="text-[13px] text-red">
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
    <Card tone="ink" pad="lg" className="gap-4">
      <SectionLabel tone="green">GOOGLE GEMINI · TANYA AI</SectionLabel>
      <KeyStatus s={s} />

      {!s.encryptionReady && (
        <div className="rounded-lg border border-red-line bg-red-bg px-3 py-2.5 text-[13px] text-red-deep">
          <b>ENCRYPTION_KEY</b> belum di-set di <code>.env</code> server, jadi
          API key belum bisa disimpan. Isi dengan hasil{" "}
          <code>openssl rand -hex 32</code>, lalu restart backend.
        </div>
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
          className="font-mono"
        />
      </FieldLabel>
      {keyError && <span className="text-[13px] text-red">{keyError}</span>}

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
              size="sm"
              disabled={hook.isPreviewing}
              onClick={() => void loadModels()}
            >
              {hook.isPreviewing ? "Mengecek…" : "Muat model dari key ini"}
            </Button>
          )}
        </div>
        <span className="text-xs text-faint">
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
          <span className="text-xs text-muted">
            Terakhir diubah {s.updatedBy ? `oleh ${s.updatedBy} · ` : ""}
            {formatDateTime(s.updatedAt)}
          </span>
        )}
      </div>
      <span className="text-xs text-faint">
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
    return <span className="font-mono text-xs text-muted">Memuat…</span>;
  if (hook.isError || !hook.settings)
    return (
      <span className="text-sm text-red">
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
