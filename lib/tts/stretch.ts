// Slows speech down without lowering its pitch (WSOLA: overlapping 30 ms
// frames taken from the input at a slower pace, each shifted a little to
// line up with the previous one so they join without echo or clicks).
// Kokoro itself mumbles a sound before the first word when asked for a very
// slow pace ("It sounds nice…"), so slow lines are made at a clean pace and
// stretched here.

/** `x` made `factor` times longer (factor > 1), same pitch. */
export const stretch = (
  x: Float32Array,
  factor: number,
  rate: number,
): Float32Array => {
  if (factor <= 1) return x;
  const N = 2 * Math.round(rate * 0.015); // frame: 30 ms
  const Hs = N / 2; // output step: frames overlap by half
  const Ha = Hs / factor; // input step: smaller, so the output is longer
  const tol = Math.round(rate * 0.01); // search ±10 ms for the best fit
  const win = Float32Array.from(
    { length: N },
    (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N),
  );
  const at = (i: number) => (i >= 0 && i < x.length ? x[i] : 0);
  const outLen = Math.round(x.length * factor);
  const frames = Math.ceil(outLen / Hs) + 1;
  const y = new Float32Array(frames * Hs + N);
  let prev = 0;
  for (let k = 0; k < frames; k++) {
    let best = Math.round(k * Ha);
    if (k > 0) {
      // Where the previous frame would naturally continue: pick the input
      // spot near the ideal one that looks most like it.
      const ideal = best;
      const next = prev + Hs;
      let bestScore = -Infinity;
      for (let d = -tol; d <= tol; d++) {
        // Every second sample is enough to find the fit, at half the cost.
        let s = 0;
        for (let i = 0; i < Hs; i += 2) s += at(next + i) * at(ideal + d + i);
        if (s > bestScore) {
          bestScore = s;
          best = ideal + d;
        }
      }
    }
    const o = k * Hs;
    for (let i = 0; i < N; i++) y[o + i] += at(best + i) * win[i];
    prev = best;
  }
  return y.slice(0, outLen);
};
