"use client";

import classNames from "classnames";
import React, { useEffect, useState } from "react";

import Correction from "@/components/shared/patterns/correction";
import ListItem from "@/components/shared/patterns/list-item";
import Card from "@/components/ui/card";
import SectionLabel from "@/components/ui/section-label";
import Select from "@/components/ui/select";
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
        <b key={k} className="font-extrabold text-ink">
          <Rich text={p.slice(2, -2)} />
        </b>
      ) : p.startsWith("*") && p.length > 1 ? (
        <i key={k}>
          <Rich text={p.slice(1, -1)} />
        </i>
      ) : (
        <React.Fragment key={k}>{p}</React.Fragment>
      ),
    )}
  </>
);

// ✕ line for a wrong example without a paired right one (same look as the
// wrong line of Correction).
const Wrong = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-baseline gap-2 text-[15px] leading-[22px]">
    <span aria-hidden className="w-4 shrink-0 font-black text-bad">
      ✕
    </span>
    <s className="font-semibold text-ink-2 decoration-bad decoration-2">
      <span className="sr-only">Salah: </span>
      {children}
    </s>
  </div>
);

const Block = ({ b, ruleNo }: { b: CheatBlock; ruleNo: number }) => {
  switch (b.kind) {
    case "rule":
      return (
        <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-line pt-4 first:border-t-0 first:pt-0">
          <span className="text-base leading-[22px] font-black text-ink">
            Aturan {ruleNo}. {b.title}
          </span>
          <span className="text-sm leading-5 text-pretty text-ink-2">
            <span className="font-extrabold">Kenapa: </span>
            <Rich text={b.why} />
          </span>
          <div className="flex flex-col gap-1.5">
            {b.ok.map((ex) => {
              const [s, note] = ex.split("|");
              return (
                <Correction
                  key={ex}
                  speak={s}
                  right={
                    <>
                      {s}
                      {note && (
                        <span className="ml-1.5 text-[13px] font-semibold text-ink-2">
                          ({note})
                        </span>
                      )}
                    </>
                  }
                />
              );
            })}
            {b.bad.map((ex) => (
              <Wrong key={ex}>{ex}</Wrong>
            ))}
          </div>
          {b.check && (
            <p className="m-0 rounded-lg bg-sunken px-3.5 py-2.5 text-[13.5px] leading-5 text-pretty text-ink-2">
              <SectionLabel tone="green">CEK CEPAT · </SectionLabel>
              <Rich text={b.check} />
            </p>
          )}
        </div>
      );
    case "p":
      return (
        <p className="m-0 text-sm leading-[22px] text-pretty text-ink-2">
          <Rich text={b.text} />
        </p>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <div className="flex flex-col gap-1.5">
          {b.title && (
            <span className="text-[15px] leading-[22px] font-extrabold text-ink">
              <Rich text={b.title} />
            </span>
          )}
          <Tag
            className={classNames(
              "m-0 flex flex-col gap-1.5 pl-5 text-sm leading-[22px] text-pretty text-ink-2 marker:font-extrabold marker:text-ink-3",
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
    case "table": {
      // In a table with a wrong column, the other English columns are the
      // right versions.
      const isRight = (c: number) =>
        b.wrong != null && c !== b.wrong && !!b.en?.includes(c);
      return (
        <div className="overflow-x-auto rounded-lg border-2 border-line">
          <table className="w-full min-w-[560px] border-collapse text-left text-[13.5px] leading-5">
            <thead>
              <tr>
                {b.head.map((h, c) => (
                  <th
                    key={h}
                    className="border-b-2 border-line bg-sunken px-3 py-2 text-[12.5px] leading-[18px] font-extrabold tracking-[0.07em] text-ink-3 uppercase"
                  >
                    {b.wrong === c && (
                      <span aria-hidden className="mr-1 font-black text-bad">
                        ✕
                      </span>
                    )}
                    {isRight(c) && (
                      <span aria-hidden className="mr-1 font-black text-ok">
                        ✓
                      </span>
                    )}
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row) => (
                <tr
                  key={row.join("|")}
                  className="border-b-2 border-line align-top last:border-b-0"
                >
                  {row.map((cell, c) => (
                    <td
                      key={c}
                      className={classNames(
                        "px-3 py-2.5",
                        b.wrong === c
                          ? "font-semibold text-ink-2 line-through decoration-bad decoration-2"
                          : b.en?.includes(c)
                            ? "text-[15px] leading-[22px] font-bold text-ink"
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
    }
    case "tip":
      return (
        <Card tone="greenBg" className="gap-1">
          <SectionLabel tone="ok">{b.label.toUpperCase()}</SectionLabel>
          <span className="text-sm leading-[22px] text-pretty text-ink">
            <Rich text={b.text} />
          </span>
        </Card>
      );
    case "phrases":
      return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
          {b.items.map((p) => (
            <div
              key={p}
              className="flex items-center justify-between gap-2 rounded-lg border-2 border-line bg-surface py-2 pr-2 pl-3"
            >
              <span className="text-[15px] leading-[22px] font-bold text-ink">
                {p}
              </span>
              <SpeakButton size={28} icon={13} text={p.replace(/…/g, "")} />
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
  // The part being read, for the contents list / select. Follows scrolling:
  // the first part crossing a band near the top of the viewport.
  const [active, setActive] = useState(CHEAT_SECTIONS[0].id);
  useEffect(() => {
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
        const first = CHEAT_SECTIONS.find((s) => seen.get(s.id));
        if (first) setActive(first.id);
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );
    CHEAT_SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  // /cheatsheet#tense (e.g. "Pelajari aturannya" in Buku kesalahanku): the
  // page renders after the shell loads, so the browser's own jump misses it.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id || !document.getElementById(id)) return;
    const t = setTimeout(
      () => document.getElementById(id)?.scrollIntoView({ block: "start" }),
      50,
    );
    return () => clearTimeout(t);
  }, []);

  let ruleNo = 0;
  return (
    // Flex on phones so the sticky select is bounded by the whole page, not a grid row.
    <section className="flex flex-col gap-5 md:grid md:grid-cols-[230px_minmax(0,1fr)] md:items-start">
      {/* Phone: a sticky "Isi" select under the top bar; wider screens: the list of parts. */}
      <label className="sticky top-[var(--shell-top,0px)] z-20 -mx-4 flex items-center gap-2.5 border-b-2 border-line bg-paper px-4 py-2.5 text-[13px] font-extrabold text-ink-2 md:hidden">
        Isi
        <Select value={active} onChange={(e) => scrollTo(e.target.value)}>
          {CHEAT_SECTIONS.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.title}
            </option>
          ))}
        </Select>
      </label>
      <nav
        aria-label="Isi cheat sheet"
        className="hidden max-h-[calc(100dvh-var(--shell-top)-48px)] flex-col gap-1 overflow-y-auto rounded-xl border-2 border-line bg-surface p-2 md:sticky md:top-[calc(var(--shell-top)+24px)] md:flex"
      >
        {CHEAT_SECTIONS.map((s, i) => (
          <ListItem
            key={s.id}
            active={s.id === active}
            onClick={() => scrollTo(s.id)}
          >
            {i + 1}. {s.title}
          </ListItem>
        ))}
      </nav>

      <div className="flex max-w-[720px] min-w-0 flex-col gap-5">
        {CHEAT_SECTIONS.map((s, i) => (
          <Card
            key={s.id}
            id={s.id}
            pad="lg"
            className="scroll-mt-[calc(var(--shell-top,0px)+76px)] gap-4 md:scroll-mt-[calc(var(--shell-top)+24px)]"
          >
            <h3 className="m-0 text-xl leading-[26px] font-black tracking-[-0.01em] text-ink">
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
      </div>
    </section>
  );
});

CheatsheetPage.displayName = "CheatsheetPage";

export default CheatsheetPage;
