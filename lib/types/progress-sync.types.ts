// Server progress documents, keyed like the former localStorage keys.
export type ProgressKey =
  | "known"
  | "srs"
  | "own"
  | "custom"
  | "done"
  | "level"
  | "weeks"
  | "askprac"
  | "plan"
  | "practice_session"
  | "flip"
  | "search_scope";

export type ProgressMap = Partial<Record<ProgressKey, unknown>>;
