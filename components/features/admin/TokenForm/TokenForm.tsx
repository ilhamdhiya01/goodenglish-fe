"use client";

import React, { useCallback, useState } from "react";

import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import FieldLabel from "@/components/ui/field-label";
import Input from "@/components/ui/input";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
import TextButton from "@/components/ui/text-button";
import { LEVEL_OPTIONS, MENU_OPTIONS } from "@/const/access.constant";
import type { TokenFormValues } from "@/lib/types/admin.types";
import type { LevelId, MenuId } from "@/lib/types/session.types";

const DEFAULT_VALUES: TokenFormValues = {
  label: "",
  role: "learner",
  // Tanya AI costs per question, so it's opt-in per learner.
  menus: MENU_OPTIONS.map((m) => m.id).filter((id) => id !== "ai"),
  levels: ["beginner"],
  maxDevices: 2,
  expiresAt: null,
  aiDailyLimit: 30,
};

const AI_LIMIT_MAX = 10000;

interface TokenFormProps {
  title: string;
  initialValues?: TokenFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: TokenFormValues) => void;
  onCancel: () => void;
}

const toggle = <T,>(list: T[], v: T) =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

const TokenForm = React.memo(
  ({
    title,
    initialValues,
    submitLabel,
    isSubmitting,
    onSubmit,
    onCancel,
  }: TokenFormProps) => {
    const [values, setValues] = useState<TokenFormValues>(
      initialValues ?? DEFAULT_VALUES,
    );
    // Remembered so unticking "Tanpa batas" brings the old number back.
    const [lastLimit, setLastLimit] = useState(values.aiDailyLimit ?? 30);
    const isAdmin = values.role === "admin";
    const hasAi = isAdmin || values.menus.includes("ai");
    const unlimited = values.aiDailyLimit === null;
    // "Tanya AI" is the floating chat, not a page: a learner needs a tab too.
    const canSubmit =
      values.label.trim().length > 0 &&
      (isAdmin ||
        (values.menus.some((m) => m !== "ai") && values.levels.length > 0));

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ ...values, label: values.label.trim() });
      },
      [canSubmit, onSubmit, values],
    );

    return (
      <Card tone="ink" pad="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SectionLabel tone="green">{title}</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
            <FieldLabel label="Nama / label pemilik">
              <Input
                value={values.label}
                maxLength={100}
                placeholder="mis. Budi · kelas A"
                onChange={(e) =>
                  setValues({ ...values, label: e.target.value })
                }
              />
            </FieldLabel>
            <FieldLabel label="Peran">
              <Select
                value={values.role}
                onChange={(e) =>
                  setValues({
                    ...values,
                    role: e.target.value as TokenFormValues["role"],
                  })
                }
              >
                <option value="learner">Pelajar</option>
                <option value="admin">Admin</option>
              </Select>
            </FieldLabel>
            <FieldLabel label="Maks. perangkat">
              <Input
                type="number"
                min={1}
                max={20}
                value={values.maxDevices}
                onChange={(e) =>
                  setValues({
                    ...values,
                    maxDevices: Math.max(1, Math.min(20, +e.target.value || 1)),
                  })
                }
              />
            </FieldLabel>
            <FieldLabel label="Kedaluwarsa (opsional)">
              <Input
                type="date"
                value={values.expiresAt?.slice(0, 10) ?? ""}
                onChange={(e) =>
                  setValues({
                    ...values,
                    // End of the chosen day, local time.
                    expiresAt: e.target.value
                      ? new Date(`${e.target.value}T23:59:59`).toISOString()
                      : null,
                  })
                }
              />
            </FieldLabel>
          </div>

          {isAdmin ? (
            <span className="text-[13.5px] text-muted">
              Admin otomatis bisa membuka semua menu, semua level, dan dashboard
              ini.
            </span>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">
                  Menu yang boleh dibuka
                </span>
                <div className="flex flex-wrap gap-2">
                  {MENU_OPTIONS.map((m) => (
                    <Pill
                      key={m.id}
                      size="sm"
                      on={values.menus.includes(m.id)}
                      onClick={() =>
                        setValues({
                          ...values,
                          menus: toggle<MenuId>(values.menus, m.id),
                        })
                      }
                    >
                      {m.label}
                    </Pill>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">
                  Level yang boleh dibuka
                </span>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_OPTIONS.map((l) => (
                    <Pill
                      key={l.id}
                      size="sm"
                      tone="green"
                      on={values.levels.includes(l.id)}
                      onClick={() =>
                        setValues({
                          ...values,
                          levels: toggle<LevelId>(values.levels, l.id),
                        })
                      }
                    >
                      {l.label}
                    </Pill>
                  ))}
                </div>
              </div>
            </>
          )}

          {hasAi && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">
                Batas Tanya AI per hari
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-28">
                  <Input
                    type="number"
                    min={0}
                    max={AI_LIMIT_MAX}
                    disabled={unlimited}
                    value={unlimited ? "" : (values.aiDailyLimit ?? "")}
                    placeholder="∞"
                    onChange={(e) => {
                      const n = Math.max(
                        0,
                        Math.min(
                          AI_LIMIT_MAX,
                          Math.floor(+e.target.value) || 0,
                        ),
                      );
                      setLastLimit(n);
                      setValues({ ...values, aiDailyLimit: n });
                    }}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink">
                  <input
                    type="checkbox"
                    checked={unlimited}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        aiDailyLimit: e.target.checked ? null : lastLimit,
                      })
                    }
                    className="h-4 w-4 accent-green"
                  />
                  Tanpa batas
                </label>
              </div>
              <span className="text-xs text-faint">
                Jumlah pertanyaan + cek kalimat per hari. 0 = tidak bisa
                bertanya. Dihitung ulang tiap tengah malam WIB.
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              type="submit"
              variant="green"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Menyimpan…" : submitLabel}
            </Button>
            <TextButton onClick={onCancel}>Batal</TextButton>
          </div>
        </form>
      </Card>
    );
  },
);

TokenForm.displayName = "TokenForm";

export default TokenForm;
