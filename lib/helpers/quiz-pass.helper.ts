// "Tes cepat" pass mark, kept apart from quiz.helper (which loads the word
// content) so the plan and the progress report can use it cheaply.

/** Passed: at least 80% right (16 of 20; fewer questions, same share). */
export const quizPassMark = (total: number) => Math.ceil(0.8 * total);
export const quizPassed = (score: number, total: number) =>
  total > 0 && score >= quizPassMark(total);
