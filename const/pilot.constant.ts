// Every threshold of the Pre-intermediate pilot in one place
// (GOODENGLISH_PILOT_SPEC.md, section 9). Values are starting points to be
// tuned after about four weeks of data. The backend has its own copy for the
// values it needs: goodenglish-be src/common/pilot.config.ts.

export const PILOT = {
  /** Learning day of a token without its own time zone. */
  defaultTimeZone: "Asia/Jakarta",
  /** Ulang: cards per day before "lanjut" (the rest move to tomorrow). */
  reviewDailyLimit: 20,
  /** Ulang: every n-th word card is typed instead of self-graded. */
  typedEvery: 3,
  /** Blok Ulang with nothing due: a quiz of this many questions instead. */
  b1QuizSize: 5,
  /** Blok Kata: words that passed the check today. */
  wordsToTick: 6,
  /** Admin target of core words per level and week. */
  coreWordsTarget: 24,
  /** A card counts as "hafal" once it passed a review this many days apart. */
  knownGapDays: 14,
  /** Bacaan done: right answers out of 5. */
  readingPass: 4,
  /** Dengar & jawab done: share of right answers (2 of 3). */
  listenPassRate: 2 / 3,
  /** Dikte passed: share of words right. */
  dictationPassRate: 0.8,
  /** Blok Bentuk: answers on the week's grammar topic today. */
  grammarToTick: 10,
  /** Blok Pakai: Kalimatku sentences checked by AI today. */
  sentencesToTick: 3,
  /** Checkpoint grammar: typed-stage accuracy and minimum answers. */
  checkpointGrammarRate: 0.8,
  checkpointGrammarMin: 10,
  /** Checkpoint word test: this week + two weeks ago, pass mark. */
  checkpointWordsThisWeek: 15,
  checkpointWordsOlder: 5,
  checkpointWordsPass: 16,
  /** Checkpoint passes with this many of 4, the real task included. */
  checkpointPassCount: 3,
  /** Main peran turns: full / short practice. */
  roleplayFullTurns: 12,
  roleplayShortTurns: 6,
  /** Real task: key phrases used at least. */
  realTaskMinPhrases: 3,
  /** Real task summary length in words. */
  summaryMinWords: 60,
  summaryMaxWords: 100,
  /** Kesalahan umum quiz: questions per session. */
  errorsQuizSize: 10,
  /** Levels where the Tahap C daily path is on. */
  pilotLevels: ["pre"] as readonly string[],
} as const;

/**
 * Week → grammar topic for Blok Bentuk on "Bertanya" days, filled in by the
 * admin ("level|week" → topic id: whb, irr, prep, bedo, tense, thit, conj,
 * r). Weeks without an entry use Bertanya ("r"). Replaced by the admin
 * mapping on the server in urutan 8.
 */
export const GRAMMAR_WEEK_TOPIC: Record<string, string> = {};

/** Topic of the Bertanya practice (sets "r1".."r4"). */
export const ASK_TOPIC = "r";
