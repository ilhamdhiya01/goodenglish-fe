"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Modal from "@/components/ui/modal";
import { LEVEL_OPTIONS, MENU_OPTIONS } from "@/const/access.constant";
import { formatDate, formatDateTime } from "@/lib/helpers/date.helper";
import { useCreateToken } from "@/lib/hooks/admin/useCreateToken";
import { useRegenerateToken } from "@/lib/hooks/admin/useRegenerateToken";
import {
  type TokenAction,
  useTokenAction,
} from "@/lib/hooks/admin/useTokenAction";
import { useTokenList } from "@/lib/hooks/admin/useTokenList";
import { useUpdateToken } from "@/lib/hooks/admin/useUpdateToken";
import type { AccessTokenItem, TokenFormValues } from "@/lib/types/admin.types";
import { confirmDialog, type ConfirmOptions } from "@/stores/useConfirmStore";

import CreatedTokenNotice from "../CreatedTokenNotice";
import TokenForm from "../TokenForm";
import TokenRowMenu from "../TokenRowMenu";
import TokenSummaryPanel from "../TokenSummaryPanel";

// [word, mark, colour]: the mark keeps the state readable without colour.
const STATUS: Record<AccessTokenItem["status"], [string, string, string]> = {
  active: ["Aktif", "●", "text-ok"],
  revoked: ["Nonaktif", "○", "text-ink-2"],
  expired: ["Kedaluwarsa", "✕", "text-bad"],
};

const HEADS = [
  "PEMILIK",
  "AKSES",
  "PERANGKAT",
  "KEDALUWARSA",
  "TERAKHIR DIPAKAI",
  "STATUS",
  "",
];

// From 700px a table; below it each row is a card of "label  value" lines.
// Same markup either way, only the CSS changes.
const TD =
  "md:border-b-2 md:border-line md:px-3 md:py-2.5 max-md:flex max-md:items-baseline max-md:gap-3";

// The column name in front of a value, phones only (the table has a header).
const CellLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="w-[120px] shrink-0 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase md:hidden">
    {children}
  </span>
);

const menuLabels = (t: AccessTokenItem) =>
  t.role === "admin"
    ? "Semua menu"
    : MENU_OPTIONS.filter((m) => t.menus.includes(m.id))
        .map((m) => m.label)
        .join(", ");

const levelLabels = (t: AccessTokenItem) =>
  t.role === "admin"
    ? "Semua level"
    : LEVEL_OPTIONS.filter((l) => t.levels.includes(l.id))
        .map((l) => l.label)
        .join(", ");

const aiLabel = (t: AccessTokenItem) =>
  t.role !== "admin" && !t.menus.includes("ai")
    ? null
    : t.aiDailyLimit === null
      ? "Tanya AI: tanpa batas"
      : `Tanya AI: ${t.aiDailyLimit}/hari`;

const roleplayLabel = (t: AccessTokenItem) =>
  t.role !== "admin" && !t.menus.includes("roleplay")
    ? null
    : t.roleplayDailyLimit === null || t.roleplayDailyLimit === undefined
      ? "Main peran: tanpa batas"
      : `Main peran: ${t.roleplayDailyLimit} sesi/hari`;

const CONFIRM: Partial<Record<TokenAction, ConfirmOptions>> = {
  revoke: {
    title: "Nonaktifkan token ini?",
    message: "Semua perangkatnya langsung keluar.",
    confirmLabel: "Nonaktifkan",
    tone: "danger",
  },
  reset: {
    title: "Reset perangkat?",
    message:
      "Semua perangkat yang memakai token ini akan keluar. Progresnya tetap aman.",
    confirmLabel: "Reset perangkat",
  },
  delete: {
    title: "Hapus token ini?",
    message:
      "Token beserta SELURUH progres belajarnya dihapus. Tidak bisa dibatalkan.",
    confirmLabel: "Hapus",
    tone: "danger",
  },
};

const TokenManager = React.memo(() => {
  const { tokens, isLoading, isError } = useTokenList();
  const { handleCreate, isCreating } = useCreateToken();
  const { handleUpdate, isUpdating } = useUpdateToken();
  const { handleAction, isActing, actingOn } = useTokenAction();
  const { handleRegenerate, isRegenerating, regeneratingId } =
    useRegenerateToken();

  const [mode, setMode] = useState<"none" | "create" | string>("none");
  const [created, setCreated] = useState<{
    label: string;
    token: string;
    variant: "created" | "regenerated";
  } | null>(null);
  const [summaryOf, setSummaryOf] = useState<AccessTokenItem | null>(null);
  const editing = tokens.find((t) => t.id === mode) ?? null;
  // Stable so Modal's Escape listener isn't re-attached on every render.
  const closeForm = useCallback(() => setMode("none"), []);
  const closeSummary = useCallback(() => setSummaryOf(null), []);

  const onCreate = useCallback(
    async (values: TokenFormValues) => {
      const res = await handleCreate(values);
      setCreated({
        label: res.data.item.label,
        token: res.data.token,
        variant: "created",
      });
      setMode("none");
    },
    [handleCreate],
  );

  const onEdit = useCallback(
    async (values: TokenFormValues) => {
      if (!editing) return;
      await handleUpdate({ id: editing.id, values });
      setMode("none");
    },
    [editing, handleUpdate],
  );

  const run = useCallback(
    async (id: string, action: TokenAction) => {
      const ask = CONFIRM[action];
      if (ask && !(await confirmDialog(ask))) return;
      handleAction({ id, action });
      if (action === "delete" && summaryOf?.id === id) setSummaryOf(null);
    },
    [handleAction, summaryOf],
  );

  const regenerate = useCallback(
    async (t: AccessTokenItem) => {
      if (
        !(await confirmDialog({
          title: `Buat ulang token ${t.label}?`,
          message:
            "Token lama langsung tidak berlaku dan semua perangkatnya keluar. Progres tetap aman.",
          confirmLabel: "Buat ulang",
        }))
      )
        return;
      try {
        const res = await handleRegenerate(t.id);
        setCreated({
          label: res.data.item.label,
          token: res.data.token,
          variant: "regenerated",
        });
      } catch {
        // Error toast is shown by useRegenerateToken.
      }
    },
    [handleRegenerate],
  );

  return (
    <section className="flex flex-col gap-5">
      {created && (
        <CreatedTokenNotice
          label={created.label}
          token={created.token}
          variant={created.variant}
          onClose={() => setCreated(null)}
        />
      )}

      <Button
        variant="green"
        className="self-start"
        onClick={() => setMode("create")}
      >
        + Buat token
      </Button>

      {mode === "create" && (
        <Modal label="Token baru" size="lg" onClose={closeForm}>
          <TokenForm
            title="TOKEN BARU"
            submitLabel="Buat token"
            isSubmitting={isCreating}
            onSubmit={(v) => void onCreate(v)}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {editing && (
        <Modal
          label={`Ubah token ${editing.label}`}
          size="lg"
          onClose={closeForm}
        >
          <TokenForm
            key={editing.id}
            title={`UBAH · ${editing.label.toUpperCase()}`}
            submitLabel="Simpan"
            isSubmitting={isUpdating}
            initialValues={{
              label: editing.label,
              role: editing.role,
              menus: editing.menus,
              levels: editing.levels,
              maxDevices: editing.maxDevices,
              expiresAt: editing.expiresAt,
              aiDailyLimit: editing.aiDailyLimit,
              roleplayDailyLimit: editing.roleplayDailyLimit,
            }}
            onSubmit={(v) => void onEdit(v)}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {summaryOf && (
        <Modal label={`Progres ${summaryOf.label}`} onClose={closeSummary}>
          <TokenSummaryPanel
            id={summaryOf.id}
            label={summaryOf.label}
            onClose={closeSummary}
          />
        </Modal>
      )}

      <Card
        tone="line"
        pad="sm"
        className="max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none"
      >
        {isLoading ? (
          <span className="p-2 text-[13px] font-bold text-ink-2">Memuat…</span>
        ) : isError ? (
          <span className="p-2 text-sm font-bold text-bad">
            Gagal memuat daftar token.
          </span>
        ) : (
          <table className="w-full border-collapse text-left text-sm max-md:block">
            <thead className="max-md:hidden">
              <tr>
                {HEADS.map((h) => (
                  <th
                    key={h}
                    className="border-b-2 border-line px-3 py-2.5 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="max-md:flex max-md:flex-col max-md:gap-3">
              {tokens.map((t) => {
                const busy =
                  (isActing && actingOn?.id === t.id) ||
                  (isRegenerating && regeneratingId === t.id);
                const [word, mark, tone] = STATUS[t.status];
                return (
                  <tr
                    key={t.id}
                    aria-busy={busy || undefined}
                    className={classNames(
                      "align-top md:h-11",
                      "max-md:relative max-md:flex max-md:flex-col max-md:gap-2 max-md:rounded-xl max-md:border-2 max-md:border-line max-md:p-4 max-md:edge-card",
                      busy ? "bg-sunken" : "max-md:bg-surface",
                    )}
                  >
                    <td className={classNames(TD, "max-md:pr-12")}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-ink">
                          {t.label}
                          {t.role === "admin" && (
                            <span className="ml-1.5 rounded-sm bg-accent-tint px-1.5 py-px align-[1px] text-[11.5px] font-extrabold text-accent-edge">
                              ADMIN
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-xs text-ink-2">
                          {t.tokenPrefix}…
                        </span>
                      </div>
                    </td>
                    <td className={classNames(TD, "md:max-w-[300px]")}>
                      <CellLabel>{HEADS[1]}</CellLabel>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="text-ink">{menuLabels(t)}</div>
                        <div className="text-[13px] text-ink-2">
                          {levelLabels(t)}
                        </div>
                        {aiLabel(t) && (
                          <div className="text-[13px] font-bold text-accent-edge">
                            {aiLabel(t)}
                          </div>
                        )}
                        {roleplayLabel(t) && (
                          <div className="text-[13px] font-bold text-accent-edge">
                            {roleplayLabel(t)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={classNames(TD, "tabular-nums")}>
                      <CellLabel>{HEADS[2]}</CellLabel>
                      <span>
                        {t.activeDevices} / {t.maxDevices}
                      </span>
                    </td>
                    <td className={TD}>
                      <CellLabel>{HEADS[3]}</CellLabel>
                      <span>{t.expiresAt ? formatDate(t.expiresAt) : "—"}</span>
                    </td>
                    <td className={classNames(TD, "text-ink-2")}>
                      <CellLabel>{HEADS[4]}</CellLabel>
                      <span>
                        {t.lastUsedAt ? formatDateTime(t.lastUsedAt) : "belum"}
                      </span>
                    </td>
                    <td className={TD}>
                      <CellLabel>{HEADS[5]}</CellLabel>
                      <span
                        className={classNames(
                          "inline-flex items-baseline gap-1.5 font-extrabold whitespace-nowrap",
                          tone,
                        )}
                      >
                        <span aria-hidden>{mark}</span>
                        <span>{word}</span>
                      </span>
                    </td>
                    <td className="max-md:absolute max-md:top-3 max-md:right-3 md:border-b-2 md:border-line md:px-3 md:py-1">
                      <div className="flex justify-end">
                        <TokenRowMenu
                          disabled={busy}
                          groups={[
                            [
                              {
                                label: "Lihat progres",
                                onSelect: () => setSummaryOf(t),
                              },
                              { label: "Ubah", onSelect: () => setMode(t.id) },
                            ],
                            [
                              {
                                label: "Reset perangkat",
                                disabled: t.activeDevices === 0,
                                onSelect: () => run(t.id, "reset"),
                              },
                              {
                                label: "Buat ulang token",
                                onSelect: () => void regenerate(t),
                              },
                              t.status === "revoked"
                                ? {
                                    label: "Aktifkan",
                                    onSelect: () => run(t.id, "activate"),
                                  }
                                : {
                                    label: "Nonaktifkan",
                                    tone: "red",
                                    onSelect: () => run(t.id, "revoke"),
                                  },
                            ],
                            [
                              {
                                label: "Hapus",
                                tone: "red",
                                onSelect: () => run(t.id, "delete"),
                              },
                            ],
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
});

TokenManager.displayName = "TokenManager";

export default TokenManager;
