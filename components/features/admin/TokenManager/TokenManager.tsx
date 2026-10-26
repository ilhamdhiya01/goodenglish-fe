"use client";

import classNames from "classnames";
import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
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

import CreatedTokenNotice from "../CreatedTokenNotice";
import TokenForm from "../TokenForm";
import TokenRowMenu from "../TokenRowMenu";
import TokenSummaryPanel from "../TokenSummaryPanel";

const STATUS: Record<AccessTokenItem["status"], [string, string]> = {
  active: ["Aktif", "bg-green-bg2 text-green-deep"],
  revoked: ["Nonaktif", "bg-red-bg text-red-deep"],
  expired: ["Kedaluwarsa", "bg-track text-muted"],
};

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

const CONFIRM: Partial<Record<TokenAction, string>> = {
  revoke: "Nonaktifkan token ini? Semua perangkatnya langsung keluar.",
  reset:
    "Keluarkan semua perangkat yang memakai token ini? Progresnya tetap aman.",
  delete:
    "Hapus token ini beserta SELURUH progres belajarnya? Tidak bisa dibatalkan.",
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
    (id: string, action: TokenAction) => {
      const msg = CONFIRM[action];
      if (msg && !window.confirm(msg)) return;
      handleAction({ id, action });
      if (action === "delete" && summaryOf?.id === id) setSummaryOf(null);
    },
    [handleAction, summaryOf],
  );

  const regenerate = useCallback(
    async (t: AccessTokenItem) => {
      if (
        !window.confirm(
          `Buat token baru untuk ${t.label}? Token lama langsung tidak berlaku dan semua perangkatnya keluar. Progres tetap aman.`,
        )
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

      {mode === "create" ? (
        <TokenForm
          title="TOKEN BARU"
          submitLabel="Buat token"
          isSubmitting={isCreating}
          onSubmit={(v) => void onCreate(v)}
          onCancel={() => setMode("none")}
        />
      ) : editing ? (
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
          }}
          onSubmit={(v) => void onEdit(v)}
          onCancel={() => setMode("none")}
        />
      ) : (
        <Button
          variant="green"
          className="self-start"
          onClick={() => setMode("create")}
        >
          + Buat token
        </Button>
      )}

      {summaryOf && (
        <TokenSummaryPanel
          id={summaryOf.id}
          label={summaryOf.label}
          onClose={() => setSummaryOf(null)}
        />
      )}

      <Card tone="line" pad="sm" className="overflow-x-auto">
        {isLoading ? (
          <span className="p-2 font-mono text-xs text-muted">Memuat…</span>
        ) : isError ? (
          <span className="p-2 text-sm text-red">
            Gagal memuat daftar token.
          </span>
        ) : (
          <table className="w-full min-w-[920px] border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="font-mono text-[11px] tracking-[0.06em] text-muted">
                {[
                  "PEMILIK",
                  "AKSES",
                  "PERANGKAT",
                  "KEDALUWARSA",
                  "TERAKHIR DIPAKAI",
                  "STATUS",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="border-b-[1.5px] border-line px-2.5 py-2 font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => {
                const busy =
                  (isActing && actingOn?.id === t.id) ||
                  (isRegenerating && regeneratingId === t.id);
                return (
                  <tr
                    key={t.id}
                    className={classNames("align-top", { "opacity-50": busy })}
                  >
                    <td className="border-b border-hairline px-2.5 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">
                          {t.label}
                          {t.role === "admin" && (
                            <span className="ml-1.5 rounded bg-ink px-1.5 py-px font-mono text-[10.5px] text-paper">
                              ADMIN
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[11.5px] text-faint">
                          {t.tokenPrefix}…
                        </span>
                      </div>
                    </td>
                    <td className="max-w-[300px] border-b border-hairline px-2.5 py-2.5 text-ink-3">
                      <div>{menuLabels(t)}</div>
                      <div className="text-[12.5px] text-muted">
                        {levelLabels(t)}
                      </div>
                    </td>
                    <td className="border-b border-hairline px-2.5 py-2.5 font-mono tabular-nums">
                      {t.activeDevices} / {t.maxDevices}
                    </td>
                    <td className="border-b border-hairline px-2.5 py-2.5">
                      {t.expiresAt ? formatDate(t.expiresAt) : "—"}
                    </td>
                    <td className="border-b border-hairline px-2.5 py-2.5 text-muted">
                      {t.lastUsedAt ? formatDateTime(t.lastUsedAt) : "belum"}
                    </td>
                    <td className="border-b border-hairline px-2.5 py-2.5">
                      <span
                        className={classNames(
                          "rounded px-2 py-0.5 font-mono text-[11px]",
                          STATUS[t.status][1],
                        )}
                      >
                        {STATUS[t.status][0]}
                      </span>
                    </td>
                    <td className="border-b border-hairline px-2.5 py-2.5">
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
