import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useCallback, useRef, useState } from "react";

import { accessErrorText } from "@/const/access.constant";
import { speak, stopSpeaking } from "@/lib/helpers/speech.helper";
import type { ErrorResponse } from "@/lib/types/api.types";
import type { MistakeInput } from "@/lib/types/mistake.types";
import type {
  RoleplayContext,
  RoleplayLine,
  RoleplayRecord,
  RoleplaySummary,
} from "@/lib/types/roleplay.types";
import type { Scenario } from "@/lib/types/scenario.types";
import type { LevelId } from "@/lib/types/session.types";
import {
  askRoleplayHelp,
  finishRoleplay,
  sendRoleplayTurn,
  startRoleplay,
  transcribeRoleplay,
} from "@/services/roleplay.service";
import { useMistakeStore } from "@/stores/useMistakeStore";
import { useRoleplayStore } from "@/stores/useRoleplayStore";

import { roleplayKeys } from "./useRoleplayUsage";

export const MAX_TURNS = 12;

export type RoleplayPhase = "setup" | "talking" | "summary";
/** What is waiting on the server right now. */
export type RoleplayPending = "start" | "turn" | "help" | "finish" | null;
type RetryKind = Exclude<RoleplayPending, null> | "transcribe";

export interface RoleplayError {
  message: string;
  /** What "Coba lagi" repeats. */
  retry: RetryKind | null;
  /** No response at all: offline or server down. */
  offline: boolean;
}

const OFFLINE =
  "Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi. Percakapanmu tetap aman.";

export const toError = (
  err: unknown,
  retry: RoleplayError["retry"],
): RoleplayError => {
  const e = err as AxiosError<ErrorResponse>;
  if (e.code === "ECONNABORTED")
    return { message: accessErrorText("stt_timeout"), retry, offline: false };
  if (!e.response) return { message: OFFLINE, retry, offline: true };
  // nginx / multer refuse oversized uploads with a bare 413.
  const code =
    e.response.data?.errors?.[0]?.message ??
    (e.response.status === 413 ? "stt_too_large" : e.message);
  // These can't be fixed by trying the same thing again.
  const final = [
    "roleplay_quota_exceeded",
    "roleplay_not_allowed",
    "roleplay_session_expired",
    "roleplay_session_not_found",
    "roleplay_turn_limit",
    "roleplay_help_limit",
    "roleplay_transcribe_limit",
    // Sending the same recording again won't help: record again instead.
    "stt_no_speech",
    "stt_too_long",
    "stt_too_large",
    "stt_bad_audio",
    "roleplay_ended",
    "ai_not_allowed",
  ].includes(code);
  return {
    message: accessErrorText(code),
    retry: final ? null : retry,
    offline: false,
  };
};

/** The request context for a scenario: what the AI needs to play it. */
export const roleplayContext = (
  sc: Scenario,
  level: LevelId,
  phrases: string[],
): RoleplayContext => ({
  level,
  title: sc.title,
  where: sc.where,
  roleAi: sc.roleplay!.roleAi,
  roleUser: sc.roleplay!.roleUser,
  mission: sc.roleplay!.mission,
  steps: sc.roleplay!.steps.map((s) => s.en),
  phrases: phrases.slice(0, 6),
});

/** Corrections of a summary as "Buku kesalahanku" entries. */
export const mistakesOf = (
  summary: RoleplaySummary,
  level: LevelId,
  sessionId?: string,
): MistakeInput[] =>
  summary.corrections.map((c) => ({
    source: "Main peran",
    wrong: c.original,
    correct: c.corrected,
    explanation_id: c.explanation,
    category: c.category,
    level,
    ...(sessionId ? { refId: sessionId } : {}),
  }));

interface Options {
  scenario: Scenario;
  level: LevelId;
  week: number;
  phrases: string[];
  /** Speed for the AI's lines (Pilih suara); "Lebih pelan" goes below it. */
  speed: number;
}

export const useRoleplaySession = ({
  scenario,
  level,
  week,
  phrases,
  speed,
}: Options) => {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<RoleplayPhase>("setup");
  const [pending, setPending] = useState<RoleplayPending>(null);
  const [error, setError] = useState<RoleplayError | null>(null);
  const [transcript, setTranscript] = useState<RoleplayLine[]>([]);
  const [stepsDone, setStepsDone] = useState<number[]>([]);
  const [missionComplete, setMissionComplete] = useState(false);
  const [suggestions, setSuggestions] = useState<{ en: string; id: string }[]>(
    [],
  );
  const [helpLeft, setHelpLeft] = useState<number | null>(null);
  const [summary, setSummary] = useState<RoleplaySummary | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const session = useRef<{ id: string; startedAt: number } | null>(null);
  // Always the latest transcript, for callbacks that outlive a render.
  const lines = useRef<RoleplayLine[]>([]);
  const setLines = useCallback((l: RoleplayLine[]) => {
    lines.current = l;
    setTranscript(l);
  }, []);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const userTurns = transcript.filter((l) => l.role === "user").length;
  const lastAi = [...transcript].reverse().find((l) => l.role === "ai")?.text;

  const say = useCallback(
    (text: string, slower = false) =>
      speak(text, { speed: slower ? Math.max(0.5, speed * 0.75) : speed }),
    [speed],
  );

  const finish = useCallback(async () => {
    const s = session.current;
    if (!s) return;
    stopSpeaking();
    setError(null);
    setPending("finish");
    try {
      const durationSec = Math.round((Date.now() - s.startedAt) / 1000);
      const res = await finishRoleplay(s.id, lines.current, durationSec);
      const sum = res.data;
      const startedAt = new Date(s.startedAt).toISOString();
      const record: RoleplayRecord = {
        id: s.id,
        scenarioId: scenario.id,
        level,
        week,
        startedAt,
        durationSec: sum.durationSec,
        userTurns: sum.userTurns,
        missionComplete: sum.missionComplete,
        stepsDone: sum.stepsDone,
        transcript: lines.current,
        summary: sum,
      };
      useRoleplayStore.getState().add(record);
      useMistakeStore.getState().addMany(mistakesOf(sum, level, record.id));
      setSummary(sum);
      setStepsDone(sum.stepsDone);
      setMissionComplete(sum.missionComplete);
      setPhase("summary");
    } catch (err) {
      setError(toError(err, "finish"));
    } finally {
      setPending(null);
    }
  }, [scenario.id, level, week]);

  const start = useCallback(async () => {
    setError(null);
    setPending("start");
    try {
      const res = await startRoleplay({
        scenarioId: scenario.id,
        context: roleplayContext(scenario, level, phrases),
      });
      const now = Date.now();
      session.current = { id: res.data.id, startedAt: now };
      setStartedAt(now);
      setRemaining(res.data.remaining);
      setLines([{ role: "ai", text: res.data.reply }]);
      setStepsDone([]);
      setMissionComplete(false);
      setSuggestions([]);
      setHelpLeft(null);
      setSummary(null);
      setPhase("talking");
      say(res.data.reply);
    } catch (err) {
      setError(toError(err, "start"));
    } finally {
      setPending(null);
      void qc.invalidateQueries({ queryKey: roleplayKeys.usage });
    }
  }, [scenario, level, phrases, say, qc, setLines]);

  // Sends the transcript as it is (ending with the learner's line).
  const runTurn = useCallback(async () => {
    const s = session.current;
    if (!s) return;
    setError(null);
    setPending("turn");
    try {
      const res = await sendRoleplayTurn(s.id, lines.current);
      const t = res.data;
      setLines([...lines.current, { role: "ai", text: t.reply }]);
      setStepsDone(t.stepsDone);
      setMissionComplete(t.missionComplete);
      say(t.reply);
      setPending(null);
      // The mission is done or the turns are used up: straight to the summary.
      if (t.missionComplete || t.turnsLeft <= 0) await finish();
    } catch (err) {
      setError(toError(err, "turn"));
      setPending(null);
    }
  }, [say, finish, setLines]);

  /** The learner's answer (spoken or typed). Kept even if the call fails. */
  const send = useCallback(
    async (text: string) => {
      const clean = text.trim().slice(0, 600);
      if (!clean || pending || !session.current) return;
      setSuggestions([]);
      setLines([...lines.current, { role: "user", text: clean }]);
      await runTurn();
    },
    [pending, runTurn, setLines],
  );

  const help = useCallback(async () => {
    const s = session.current;
    if (!s || pending) return;
    setError(null);
    setPending("help");
    try {
      const res = await askRoleplayHelp(s.id, lines.current);
      setSuggestions(res.data.suggestions);
      setHelpLeft(res.data.helpLeft);
    } catch (err) {
      setError(toError(err, "help"));
    } finally {
      setPending(null);
    }
  }, [pending]);

  const retry = useCallback(() => {
    const r = error?.retry;
    if (r === "start") void start();
    else if (r === "turn") void runTurn();
    else if (r === "help") void help();
    else if (r === "finish") void finish();
  }, [error, start, runTurn, help, finish]);

  /** "Selesai": summarise, or just leave if the learner never answered. */
  const end = useCallback(async () => {
    if (userTurns === 0) {
      stopSpeaking();
      session.current = null;
      setLines([]);
      setPhase("setup");
      return;
    }
    await finish();
  }, [userTurns, finish, setLines]);

  /** Back to the setup screen for another round. */
  const reset = useCallback(() => {
    stopSpeaking();
    session.current = null;
    setLines([]);
    setStepsDone([]);
    setMissionComplete(false);
    setSuggestions([]);
    setSummary(null);
    setError(null);
    setPhase("setup");
  }, [setLines]);

  return {
    phase,
    pending,
    error,
    transcript,
    stepsDone,
    missionComplete,
    userTurns,
    turnsLeft: MAX_TURNS - userTurns,
    lastAi,
    suggestions,
    helpLeft,
    summary,
    remaining,
    startedAt,
    start,
    send,
    help,
    end,
    retry,
    reset,
    replay: useCallback(
      (slower = false) => lastAi && say(lastAi, slower),
      [lastAi, say],
    ),
    dismissError: useCallback(() => setError(null), []),
    /** Whisper writes down a spoken answer; throws a RoleplayError. */
    transcribe: useCallback(
      async (
        audio: Blob,
        fileName: string,
        language: "en" | "id",
      ): Promise<string> => {
        const s = session.current;
        if (!s) return "";
        try {
          const res = await transcribeRoleplay(s.id, audio, fileName, language);
          return res.data.text;
        } catch (err) {
          throw toError(err, "transcribe");
        }
      },
      [],
    ),
  };
};
