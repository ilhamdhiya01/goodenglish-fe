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
  menus: MENU_OPTIONS.map((m) => m.id),
  levels: ["beginner"],
  maxDevices: 2,
  expiresAt: null,
};

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
    const isAdmin = values.role === "admin";
    const canSubmit =
      values.label.trim().length > 0 &&
      (isAdmin || (values.menus.length > 0 && values.levels.length > 0));

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
