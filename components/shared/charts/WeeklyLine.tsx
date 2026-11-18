import React from "react";

import { dayShort } from "./chart-utils";

const W = 360;
const H = 150;
const LEFT = 38;
const BOTTOM = 26;
const TOP = 18;

// A percentage per week (0–100) as one 2px line with markers; weeks without
// data leave a gap. Gridlines at 0 / 50 / 100 %.
const WeeklyLine = ({
  points,
  title,
  detail,
}: {
  points: { week: number; pct: number | null; note?: string }[];
  title: string;
  /** Under the chart, e.g. the review counts. */
  detail?: React.ReactNode;
}) => {
  const slot = (W - LEFT) / points.length;
  const xOf = (i: number) => LEFT + i * slot + slot / 2;
  const yOf = (pct: number) => TOP + ((H - BOTTOM - TOP) * (100 - pct)) / 100;
  const segs: string[] = [];
  let cur = "";
  points.forEach((p, i) => {
    if (p.pct === null) {
      if (cur) segs.push(cur);
      cur = "";
      return;
    }
    cur += `${cur ? "L" : "M"}${xOf(i)},${yOf(p.pct)} `;
  });
  if (cur) segs.push(cur);
  const lastIdx = points.map((p) => p.pct !== null).lastIndexOf(true);
  return (
    <figure className="m-0 flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={title}
      >
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line
              x1={LEFT}
              x2={W}
              y1={yOf(g)}
              y2={yOf(g)}
              className="stroke-line"
              strokeWidth={1}
            />
            <text
              x={LEFT - 6}
              y={yOf(g) + 3}
              textAnchor="end"
              className="fill-ink-2 text-[11.5px] font-bold"
            >
              {g}%
            </text>
          </g>
        ))}
        {segs.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            className="stroke-accent"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
        {points.map((p, i) => (
          <g key={p.week}>
            {p.pct !== null && (
              <circle
                cx={xOf(i)}
                cy={yOf(p.pct)}
                r={4}
                className="fill-accent stroke-surface"
                strokeWidth={2}
              >
                <title>
                  Minggu {dayShort(p.week)}: {p.pct}%
                  {p.note ? ` · ${p.note}` : ""}
                </title>
              </circle>
            )}
            {i === lastIdx && p.pct !== null && (
              <text
                x={xOf(i)}
                y={yOf(p.pct) - 8}
                textAnchor="middle"
                className="fill-ink text-[12.5px] font-extrabold"
              >
                {p.pct}%
              </text>
            )}
            {i % 3 === (points.length - 1) % 3 && (
              <text
                x={i === points.length - 1 ? W : xOf(i)}
                y={H - 6}
                textAnchor={i === points.length - 1 ? "end" : "middle"}
                className="fill-ink-2 text-[11.5px] font-bold"
              >
                {dayShort(p.week)}
              </text>
            )}
          </g>
        ))}
      </svg>
      {detail}
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.week}>
              <th scope="row">Minggu mulai {dayShort(p.week)}</th>
              <td>
                {p.pct === null ? "tidak ada data" : `${p.pct}%`}
                {p.note ? ` (${p.note})` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default WeeklyLine;
