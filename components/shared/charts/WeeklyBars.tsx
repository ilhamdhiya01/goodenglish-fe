import React from "react";

import { dayShort } from "./chart-utils";

const W = 360;
const H = 150;
const BOTTOM = 26;
const TOP = 20;

// One value per week (Monday dates), thin bars with rounded tops anchored
// on the baseline; the latest and the highest week are labeled.
const WeeklyBars = ({
  points,
  title,
  unit,
}: {
  points: { week: number; value: number }[];
  title: string;
  /** "kata", "review" … for labels and the hidden table. */
  unit: string;
}) => {
  const max = Math.max(1, ...points.map((p) => p.value));
  const slot = W / points.length;
  const bw = Math.min(18, slot * 0.55);
  const peak = points.reduce(
    (b, p, i) => (p.value > points[b].value ? i : b),
    0,
  );
  return (
    <figure className="m-0 flex flex-col gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={title}
      >
        <line
          x1={0}
          x2={W}
          y1={H - BOTTOM}
          y2={H - BOTTOM}
          className="stroke-line"
          strokeWidth={1}
        />
        {points.map((p, i) => {
          const bh = ((H - BOTTOM - TOP) * p.value) / max;
          const x = i * slot + (slot - bw) / 2;
          const y = H - BOTTOM - bh;
          const label = p.value > 0 && (i === points.length - 1 || i === peak);
          return (
            <g key={p.week}>
              {p.value > 0 && (
                <path
                  d={`M${x},${H - BOTTOM} V${y + 4} Q${x},${y} ${x + 4},${y} H${x + bw - 4} Q${x + bw},${y} ${x + bw},${y + 4} V${H - BOTTOM} Z`}
                  className="fill-accent"
                >
                  <title>
                    Minggu {dayShort(p.week)}: {p.value} {unit}
                  </title>
                </path>
              )}
              {label && (
                <text
                  x={x + bw / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-ink text-[12.5px] font-extrabold"
                >
                  {p.value}
                </text>
              )}
              {i % 3 === (points.length - 1) % 3 && (
                <text
                  x={i === points.length - 1 ? W : i * slot + slot / 2}
                  y={H - 6}
                  textAnchor={i === points.length - 1 ? "end" : "middle"}
                  className="fill-ink-2 text-[11.5px] font-bold"
                >
                  {dayShort(p.week)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.week}>
              <th scope="row">Minggu mulai {dayShort(p.week)}</th>
              <td>
                {p.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

export default WeeklyBars;
