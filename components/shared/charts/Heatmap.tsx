import React from "react";

import { dayLong, dayShort } from "./chart-utils";

// Sequential, one hue: 0 = track, 1–3 = light → dark blue.
const FILL = [
  "fill-track",
  "fill-accent-line",
  "fill-accent",
  "fill-accent-edge",
];
const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const CELL = 14;
const GAP = 3;
const LEFT = 30;
const TOP = 18;

// Kalender aktivitas: one column per week (Monday on top), one cell per
// day, color = blocks of Rencana done (0–3). `days` starts on a Monday.
const Heatmap = ({
  days,
  title,
}: {
  days: { day: number; blocks: number }[];
  title: string;
}) => {
  const weeks = Math.ceil(days.length / 7);
  const w = LEFT + weeks * (CELL + GAP);
  const h = TOP + 7 * (CELL + GAP);
  return (
    <figure className="m-0 flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full max-w-[420px]"
        role="img"
        aria-label={title}
      >
        {DAYS.map((d, i) =>
          i % 2 === 0 ? (
            <text
              key={d}
              x={0}
              y={TOP + i * (CELL + GAP) + CELL - 3}
              className="fill-ink-2 text-[9px] font-bold"
            >
              {d}
            </text>
          ) : null,
        )}
        {Array.from({ length: weeks }, (_, c) =>
          c % 3 === 0 && days[c * 7] ? (
            <text
              key={c}
              x={LEFT + c * (CELL + GAP)}
              y={10}
              className="fill-ink-2 text-[9px] font-bold"
            >
              {dayShort(days[c * 7].day)}
            </text>
          ) : null,
        )}
        {days.map((d, i) => (
          <rect
            key={d.day}
            x={LEFT + Math.floor(i / 7) * (CELL + GAP)}
            y={TOP + (i % 7) * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={3}
            className={FILL[d.blocks]}
          >
            <title>
              {dayLong(d.day)}: {d.blocks} dari 3 blok Rencana
            </title>
          </rect>
        ))}
      </svg>
      <figcaption className="flex items-center gap-1.5 text-[12px] font-bold text-ink-2">
        0 blok
        {FILL.map((f) => (
          <svg key={f} width={12} height={12} aria-hidden>
            <rect width={12} height={12} rx={3} className={f} />
          </svg>
        ))}
        3 blok
      </figcaption>
    </figure>
  );
};

export default Heatmap;
