import type { Question } from './types';
import { QUESTIONS, META, questionsBySubject } from './data';

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sample<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** A quick mixed test of n questions drawn from the whole bank. */
export function buildQuickTest(n = 25): Question[] {
  return sample(QUESTIONS, n);
}

/** A single-subject set (optionally limited). */
export function buildSubjectTest(subject: string, n?: number): Question[] {
  const pool = shuffle(questionsBySubject(subject));
  return n ? pool.slice(0, n) : pool;
}

/**
 * Full-length grand test built to mirror the NBEMS blueprint:
 * pulls the blueprint number of questions from each subject (capped by availability).
 */
export function buildGrandTest(): Question[] {
  const picked: Question[] = [];
  for (const w of META.weightage) {
    const pool = questionsBySubject(w.subject);
    picked.push(...sample(pool, Math.min(w.questions, pool.length)));
  }
  return shuffle(picked);
}

/** Sectional config used by the timed engine (5 sections x 42 min in the real exam). */
export interface SectionPlan {
  sectionSize: number;
  sectionSeconds: number;
  sectionCount: number;
}
export function planSections(total: number): SectionPlan {
  // Mirror the real exam ratio: 40 questions / 42 minutes per section.
  const sectionSize = 40;
  const sectionSeconds = 42 * 60;
  const sectionCount = Math.max(1, Math.ceil(total / sectionSize));
  return { sectionSize, sectionSeconds, sectionCount };
}

export const MARKS = META.exam.marking; // { correct, incorrect, unattempted }

export function scoreTest(
  questions: Question[],
  responses: Record<number, number | null>,
): { correct: number; wrong: number; attempted: number; score: number; maxScore: number } {
  let correct = 0, wrong = 0, attempted = 0;
  questions.forEach((q, i) => {
    const r = responses[i];
    if (r === null || r === undefined) return;
    attempted++;
    if (r === q.answer) correct++;
    else wrong++;
  });
  const score = correct * MARKS.correct + wrong * MARKS.incorrect;
  return { correct, wrong, attempted, score, maxScore: questions.length * MARKS.correct };
}
