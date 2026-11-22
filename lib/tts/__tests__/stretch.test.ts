import { describe, expect, it } from "vitest";

import { stretch } from "../stretch";

const RATE = 24000;
const sine = (hz: number, sec: number) =>
  Float32Array.from({ length: Math.round(RATE * sec) }, (_, i) =>
    Math.sin((2 * Math.PI * hz * i) / RATE),
  );
// Frequency from zero crossings, away from the edges.
const pitchOf = (x: Float32Array) => {
  const from = Math.round(x.length * 0.1);
  const to = Math.round(x.length * 0.9);
  let n = 0;
  for (let i = from + 1; i < to; i++) if (x[i - 1] < 0 !== x[i] < 0) n++;
  return n / 2 / ((to - from) / RATE);
};

describe("stretch (slower, same pitch)", () => {
  it("leaves audio alone when it isn't slowed down", () => {
    const x = sine(220, 0.5);
    expect(stretch(x, 1, RATE)).toBe(x);
  });

  it("makes it longer by the factor", () => {
    const x = sine(220, 1);
    expect(stretch(x, 1.25, RATE).length).toBe(Math.round(x.length * 1.25));
  });

  it("keeps the pitch (no deep, dragged voice)", () => {
    const y = stretch(sine(220, 1), 1.4, RATE);
    expect(Math.abs(pitchOf(y) - 220)).toBeLessThan(220 * 0.03);
  });

  it("keeps the loudness (frames join in phase, no gaps or doubling)", () => {
    const y = stretch(sine(220, 1), 1.4, RATE);
    const mid = y.subarray(RATE * 0.1, y.length - RATE * 0.1);
    let peak = 0;
    for (const v of mid) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeGreaterThan(0.95);
    expect(peak).toBeLessThan(1.05);
  });
});
