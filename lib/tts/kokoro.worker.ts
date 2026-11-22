/// <reference lib="webworker" />
// Kokoro TTS (PROTOTYPE) in a worker, so loading the ±90 MB model and
// generating audio never freeze the page. kokoro-js downloads the model from
// Hugging Face once and keeps it in the browser's Cache Storage.
import { KokoroTTS } from "kokoro-js";

import type { KokoroIn, KokoroOut } from "./kokoro.types";
import { stretch } from "./stretch";

const MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
// Slowest pace Kokoro speaks cleanly (tested: at 0.6 and 0.7 it adds a
// sound before the first word, which Whisper hears as "It" / "And"; at 0.8
// none).
const CLEAN_SPEED = 0.8;

const post = (msg: KokoroOut, transfer: Transferable[] = []) =>
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg, transfer);

let tts: Promise<KokoroTTS> | null = null;

const load = () => {
  if (tts) return tts;
  // WebGPU is much faster and wants full precision; the WASM fallback uses
  // the 8-bit model (smaller download, fast enough on a laptop CPU).
  const gpu = "gpu" in navigator;
  let last = -1;
  tts = KokoroTTS.from_pretrained(MODEL, {
    device: gpu ? "webgpu" : "wasm",
    dtype: gpu ? "fp32" : "q8",
    progress_callback: (p) => {
      // Only the model file: the small config/tokenizer files would make
      // the bar jump back to 0 several times.
      if (p.status !== "progress" || !p.file.endsWith(".onnx")) return;
      const pct = Math.floor(p.progress);
      if (pct !== last) post({ type: "progress", pct: (last = pct) });
    },
  }).then(
    (t) => {
      post({ type: "ready", device: gpu ? "webgpu" : "wasm" });
      return t;
    },
    (err: unknown) => {
      tts = null;
      throw err;
    },
  );
  return tts;
};

self.onmessage = async (e: MessageEvent<KokoroIn>) => {
  const msg = e.data;
  try {
    const t = await load();
    if (msg.type !== "speak") return;
    // Below CLEAN_SPEED Kokoro mumbles before the first word, so a slower
    // line is made at CLEAN_SPEED and stretched (pitch kept) to its pace.
    const made = Math.max(msg.speed, CLEAN_SPEED);
    const audio = await t.generate(msg.text, {
      voice: msg.voice as never,
      speed: made,
    });
    const data = stretch(
      audio.audio as Float32Array,
      made / msg.speed,
      audio.sampling_rate,
    );
    post({ type: "audio", id: msg.id, rate: audio.sampling_rate, data }, [
      data.buffer,
    ]);
  } catch (err) {
    post({
      type: "error",
      id: msg.type === "speak" ? msg.id : undefined,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
