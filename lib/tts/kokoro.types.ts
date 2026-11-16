// Messages between the page and lib/tts/kokoro.worker.ts.
export type KokoroIn =
  | { type: "load" }
  | { type: "speak"; id: number; text: string; voice: string; speed: number };

export type KokoroOut =
  | { type: "progress"; pct: number }
  | { type: "ready"; device: "webgpu" | "wasm" }
  | { type: "audio"; id: number; rate: number; data: Float32Array }
  | { type: "error"; id?: number; message: string };

// The better-graded voices (kokoro-js grades A … F), US and UK.
export const KOKORO_VOICES = [
  ["af_heart", "Heart · wanita · US"],
  ["af_bella", "Bella · wanita · US"],
  ["af_nicole", "Nicole · wanita · US (lembut)"],
  ["am_michael", "Michael · pria · US"],
  ["am_fenrir", "Fenrir · pria · US"],
  ["am_puck", "Puck · pria · US"],
  ["bf_emma", "Emma · wanita · UK"],
  ["bm_george", "George · pria · UK"],
] as const;
