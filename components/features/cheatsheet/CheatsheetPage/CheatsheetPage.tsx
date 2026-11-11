"use client";

import classNames from "classnames";
import React from "react";

import Card from "@/components/ui/card";
import Pill from "@/components/ui/pill";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { CHEAT_SECTIONS, type CheatBlock } from "@/const/cheatsheet.constant";

// **tebal** dan *miring* → elemen. Isi tebal boleh berisi *miring*, dan isi
// miring boleh berisi **tebal** (kalimat contoh dengan kata kerja ditebalkan:
// *The shirts **are made** in Bandung.*). Bintang penutup miring tidak boleh
// diikuti bintang lain, supaya `**` di dalamnya tidak dianggap penutup.
const RICH_PARTS = /(\*\*.+?\*\*|\*(?:[^*]|\*\*[^*]+?\*\*)+?\*(?!\*))/g;

const Rich = ({ text }: { text: string }) => (
  <>
    {text.split(RICH_PARTS).map((p, k) =>
      p.startsWith("**") ? (
        <b key={k} className="font-semibold text-ink">
          <Rich text={p.slice(2, -2)} />
        </b>
      ) : p.startsWith("*") && p.length > 1 ? (
        <i key={k} className="font-serif">
          <Rich text={p.slice(1, -1)} />
        </i>
      ) : (
        <React.Fragment key={k}>{p}</React.Fragment>
      ),
    )}
  </>
);

const Block = ({ b, ruleNo }: { b: CheatBlock; ruleNo: number }) => {
  switch (b.kind) {
    case "rule":
      return (
        <div className="flex flex-col gap-2 border-t border-hairline pt-3.5 first:border-t-0 first:pt-0">
          <span className="text-[15.5px] leading-[1.4] font-bold text-ink">
            Aturan {ruleNo}. {b.title}
          </span>
          <span className="text-sm leading-[1.55] text-pretty text-ink-2">
            <span className="text-muted">Kenapa: </span>
            <Rich text={b.why} />
          </span>
          <div className="flex flex-wrap gap-1.5">
            {b.ok.map((ex) => {
              const [s, note] = ex.split("|");
              return (
                <span
                  key={ex}
                  className="inline-flex items-center gap-2 rounded-full border border-green-line bg-green-bg py-1 pr-1 pl-3"
                >
                  <span className="text-green">✓</span>
                  <i className="font-serif text-[15px] text-ink">{s}</i>
                  {note && <span className="text-xs text-muted">({note})</span>}
                  <SpeakButton size={22} icon={11} text={s} />
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5 empty:hidden">
            {b.bad.map((ex) => (
              <span
                key={ex}
                className="inline-flex items-center gap-2 rounded-full border border-red-line bg-red-bg px-3 py-1"
              >
                <span className="text-red">✕</span>
                <i className="font-serif text-[15px] text-red-deep line-through decoration-red/50">
                  {ex}
                </i>
              </span>
            ))}
          </div>
          {b.check && (
            <span className="text-xs leading-[1.5] text-pretty text-muted">
              <span className="font-mono tracking-[0.06em] text-green">
                CEK CEPAT ·{" "}
              </span>
              <Rich text={b.check} />
            </span>
          )}
        </div>
      );
    case "p":
      return (
        <p className="m-0 text-sm leading-[1.6] text-pretty text-ink-2">
          <Rich text={b.text} />
        </p>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <div className="flex flex-col gap-1.5">
          {b.title && (
            <span className="text-[14.5px] font-bold text-ink">
              <Rich text={b.title} />
            </span>
          )}
          <Tag
            className={classNames(
              "m-0 flex flex-col gap-1.5 pl-5 text-sm leading-[1.6] text-pretty text-ink-2 marker:text-faint",
              b.ordered ? "list-decimal" : "list-disc",
            )}
          >
            {b.items.map((it) => (
              <li key={it}>
                <Rich text={it} />
              </li>
            ))}
          </Tag>
        </div>
      );
    }
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px] leading-[1.45]">
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th
                    key={h}
                    className="border-b-[1.5px] border-line bg-sand px-3 py-2 font-mono text-[11px] font-normal tracking-[0.06em] text-muted uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row) => (
                <tr key={row.join("|")} className="align-top">
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={classNames(
                        "border-b border-hairline px-3 py-2.5",
                        b.en?.includes(c) && "font-serif text-[15px] italic",
                        b.wrong === c
                          ? "text-red-deep"
                          : b.en?.includes(c)
                            ? "text-ink"
                            : "text-ink-2",
                      )}
                    >
                      <Rich text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "tip":
      return (
        <div className="flex flex-col gap-1 rounded-lg border border-green-line bg-green-bg px-4 py-3">
          <SectionLabel tone="green">{b.label.toUpperCase()}</SectionLabel>
          <span className="text-sm leading-[1.55] text-pretty text-green-deep">
            <Rich text={b.text} />
          </span>
        </div>
      );
    case "phrases":
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
          {b.items.map((p) => (
            <div
              key={p}
              className="flex items-center justify-between gap-2 rounded-lg border border-line bg-card px-3 py-2"
            >
              <i className="font-serif text-[15px] text-ink">{p}</i>
              <SpeakButton size={24} icon={12} text={p.replace(/…/g, "")} />
            </div>
          ))}
        </div>
      );
  }
};

const scrollTo = (id: string) =>
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });

// Halaman "Cheat sheet": ringkasan aturan inti (aturan → kenapa → contoh) dalam
// satu halaman, dengan daftar isi untuk lompat ke bagian.
const CheatsheetPage = React.memo(() => {
  let ruleNo = 0;
  return (
    <section className="flex flex-col gap-5.5">
      <div className="flex flex-wrap gap-1.5">
        {CHEAT_SECTIONS.map((s, i) => (
          <Pill key={s.id} size="sm" onClick={() => scrollTo(s.id)}>
            {i + 1}. {s.title}
          </Pill>
        ))}
      </div>

      {CHEAT_SECTIONS.map((s, i) => (
        <Card
          key={s.id}
          id={s.id}
          tone="line"
          pad="lg"
          className="scroll-mt-4 gap-4"
        >
          <h3 className="m-0 text-[22px] leading-tight font-bold tracking-[-0.015em]">
            {i + 1}. {s.title}
          </h3>
          {s.blocks.map((b, k) => (
            <Block
              key={k}
              b={b}
              ruleNo={b.kind === "rule" ? ++ruleNo : ruleNo}
            />
          ))}
        </Card>
      ))}
    </section>
  );
});

CheatsheetPage.displayName = "CheatsheetPage";

export default CheatsheetPage;
