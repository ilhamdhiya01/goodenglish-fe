import { useTtsStore } from "@/stores/useTtsStore";

import type { KokoroIn, KokoroOut } from "./kokoro.types";

// Page side of Kokoro TTS, the only voice of the app. The worker (and the
// ±90 MB model it downloads once into Cache Storage) starts on first use or
// on the background preload (TtsBootstrap).

let worker: Worker | null = null;
let nextId = 1;
const waiting = new Map<
  number,
  { resolve: (a: AudioBuffer) => void; reject: (e: Error) => void }
>();

// Resolves when the model is loaded; replaced after a failed load so the
// next attempt starts over.
let ready: Promise<void> | null = null;
let markReady: (() => void) | null = null;
let markFailed: ((e: Error) => void) | null = null;

// Generated audio per voice+text: a replay is instant.
const cache = new Map<string, AudioBuffer>();
const CACHE_MAX = 200;

let ctx: AudioContext | null = null;
const audioCtx = () => (ctx ??= new AudioContext());

const fail = (message: string) => {
  useTtsStore.setState({ status: "error", error: message });
  markFailed?.(new Error(message));
  ready = null;
  waiting.forEach((w) => w.reject(new Error(message)));
  waiting.clear();
};

const ensureWorker = (): Worker => {
  if (worker) return worker;
  const store = useTtsStore.setState;
  worker = new Worker(new URL("./kokoro.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (e: MessageEvent<KokoroOut>) => {
    const m = e.data;
    if (m.type === "progress") store({ progress: m.pct });
    else if (m.type === "ready") {
      store({ status: "ready", progress: 100, device: m.device, error: "" });
      markReady?.();
    } else if (m.type === "audio") {
      const buf = audioCtx().createBuffer(1, m.data.length, m.rate);
      buf.copyToChannel(new Float32Array(m.data), 0);
      waiting.get(m.id)?.resolve(buf);
      waiting.delete(m.id);
    } else if (m.type === "error") {
      if (m.id === undefined) return fail(m.message);
      waiting.get(m.id)?.reject(new Error(m.message));
      waiting.delete(m.id);
    }
  };
  worker.onerror = (e) => {
    fail(e.message || "Worker gagal dimuat.");
    worker?.terminate();
    worker = null;
  };
  return worker;
};

/** Load the model (once). Resolves when it can speak. */
export const loadKokoro = (): Promise<void> => {
  if (ready) return ready;
  ready = new Promise<void>((resolve, reject) => {
    markReady = resolve;
    markFailed = reject;
  });
  // Callers that don't await it must not trip "unhandled rejection".
  ready.catch(() => {});
  useTtsStore.setState({ status: "loading", progress: 0, error: "" });
  ensureWorker().postMessage({ type: "load" } satisfies KokoroIn);
  return ready;
};

export const generate = async (
  text: string,
  voice = useTtsStore.getState().voice,
  speed = useTtsStore.getState().speed,
): Promise<AudioBuffer> => {
  const key = voice + "|" + speed + "|" + text;
  const hit = cache.get(key);
  if (hit) return hit;
  await loadKokoro();
  const id = nextId++;
  const buf = await new Promise<AudioBuffer>((resolve, reject) => {
    waiting.set(id, { resolve, reject });
    ensureWorker().postMessage({
      type: "speak",
      id,
      text,
      voice,
      speed,
    } satisfies KokoroIn);
  });
  cache.set(key, buf);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  return buf;
};

let current: { src: AudioBufferSourceNode; done: () => void } | null = null;
let request = 0;

/**
 * Stop the voice and suspend its audio output until the next line. On
 * Safari (iOS especially) a running AudioContext keeps the audio session in
 * playback mode, and speech recognition then hears only silence. kokoroSay
 * resumes it on the next line.
 */
export const releaseAudio = () => {
  stopKokoro();
  if (ctx && ctx.state === "running") void ctx.suspend();
};

/** Stop what is playing and drop anything still being prepared. */
export const stopKokoro = () => {
  request++;
  const c = current;
  current = null;
  if (!c) return;
  try {
    c.src.stop();
  } catch {
    /* already stopped */
  }
  c.done();
};

/**
 * Speak one text. onStart fires when sound begins. Resolves when playback
 * ends, or right away (false) if a newer call took over first; rejects if
 * the model or the audio can't be made.
 */
export const kokoroSay = async (
  text: string,
  onStart?: () => void,
  // Overrides the chosen speed for this line (Main peran's "Lebih pelan").
  speed?: number,
): Promise<boolean> => {
  stopKokoro();
  const mine = request;
  // Unlock audio now, inside the click: after the await below the browser
  // (Safari especially) no longer counts it as a user gesture.
  const ac = audioCtx();
  if (ac.state === "suspended") void ac.resume();
  const buf = await generate(text, undefined, speed);
  if (mine !== request) return false;
  if (ac.state === "suspended") await ac.resume();
  return new Promise<boolean>((resolve) => {
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    const done = () => resolve(mine === request);
    src.onended = () => {
      if (current?.src === src) current = null;
      done();
    };
    current = { src, done };
    src.start();
    onStart?.();
  });
};
