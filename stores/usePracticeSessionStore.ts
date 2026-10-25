import { create } from "zustand";

import { load, save, STORAGE_KEYS } from "@/lib/helpers/storage.helper";
import type {
  PracticeSession,
  PracticeStage,
} from "@/lib/types/ask-practice.types";

// Sesi latihan yang sedang berjalan (soal, nomor, jawaban, isian, skor) per rumus/set, plus set terakhir
// yang dipilih per topik grammar. Disimpan supaya pindah tab, pindah set, atau refresh tidak mengulang sesi;
// sesi hanya hilang kalau user memulai tahap baru, menutup layar selesai, atau reset progres.

export interface RuleSession {
  stage: PracticeStage;
  P: PracticeSession | null;
}

interface Saved {
  sessions: Record<string, RuleSession>;
  sets: Record<string, string>;
}

interface PracticeSessionState extends Saved {
  setSession: (
    rule: string,
    stage: PracticeStage,
    P: PracticeSession | null,
  ) => void;
  clearSession: (rule: string) => void;
  setTopicSet: (topic: string, id: string) => void;
  hydrate: () => void;
}

const STAGES: PracticeStage[] = ["mc", "order", "type"];

// Data tersimpan bisa rusak / dari versi lama: buang sesi yang bentuknya tidak valid.
const validSession = (x: unknown): x is RuleSession => {
  const s = x as RuleSession;
  if (!s || !STAGES.includes(s.stage)) return false;
  if (s.P === null) return true;
  const P = s.P;
  return (
    !!P &&
    STAGES.includes(P.stage) &&
    Array.isArray(P.qs) &&
    P.qs.length > 0 &&
    Number.isInteger(P.i) &&
    P.i >= 0 &&
    P.i < P.qs.length &&
    Array.isArray(P.built) &&
    typeof P.typed === "string"
  );
};

const loadSaved = (): Saved => {
  const raw = load<Partial<Saved>>(STORAGE_KEYS.practiceSession, {});
  const sessions: Record<string, RuleSession> = {};
  for (const [rule, s] of Object.entries(raw.sessions || {}))
    if (validSession(s)) sessions[rule] = s;
  const sets: Record<string, string> = {};
  for (const [topic, id] of Object.entries(raw.sets || {}))
    if (typeof id === "string") sets[topic] = id;
  return { sessions, sets };
};

const persist = ({ sessions, sets }: Saved) =>
  save(STORAGE_KEYS.practiceSession, { sessions, sets });

export const usePracticeSessionStore = create<PracticeSessionState>((set) => ({
  ...loadSaved(),
  hydrate: () => set(loadSaved()),

  setSession: (rule, stage, P) =>
    set((s) => {
      const next = {
        sessions: { ...s.sessions, [rule]: { stage, P } },
        sets: s.sets,
      };
      persist(next);
      return next;
    }),

  clearSession: (rule) =>
    set((s) => {
      const sessions = { ...s.sessions };
      delete sessions[rule];
      const next = { sessions, sets: s.sets };
      persist(next);
      return next;
    }),

  setTopicSet: (topic, id) =>
    set((s) => {
      const next = { sessions: s.sessions, sets: { ...s.sets, [topic]: id } };
      persist(next);
      return next;
    }),
}));
