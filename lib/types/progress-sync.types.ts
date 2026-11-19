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
  | "search_scope"
  | "roleplay"
  | "mistakes"
  | "listening"
  | "reading"
  | "exam"
  | "activity";

export type ProgressMap = Partial<Record<ProgressKey, unknown>>;

/** Version (ms) of each progress document on the server. */
export type ProgressVersions = Partial<Record<ProgressKey, number>>;

/** GET /me/progress?withVersions=1 */
export interface ProgressWithVersions {
  docs: ProgressMap;
  versions: ProgressVersions;
}

/** GET /me/progress/:key — data null and version null: no document yet. */
export interface ProgressDocResponse {
  data: unknown;
  version: number | null;
}
