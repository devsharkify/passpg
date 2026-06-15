import questionsJson from '../data/questions.json';
import notesJson from '../data/notes.json';
import metaJson from '../data/examMeta.json';
import type { Question, Card, WeightRow } from './types';

export const QUESTIONS = questionsJson as Question[];
export const CARDS = notesJson as Card[];
export const META = metaJson as {
  exam: {
    fullName: string; body: string; purpose: string;
    totalQuestions: number; totalMarks: number; durationMinutes: number;
    mode: string; marking: { correct: number; incorrect: number; unattempted: number };
    sectional: string; imageQuestions: string; changes: string[];
  };
  weightageNote: string;
  weightage: WeightRow[];
  strategy: string[];
  repeatedThemes: string[];
};

// Subject order follows the exam blueprint (tier then weight)
const WEIGHT_ORDER = new Map(META.weightage.map((w, i) => [w.subject, i]));

export interface SubjectInfo {
  subject: string;
  count: number;
  tier: string;
  weight: number;
}

export const SUBJECTS: SubjectInfo[] = (() => {
  const counts: Record<string, number> = {};
  for (const q of QUESTIONS) counts[q.subject] = (counts[q.subject] || 0) + 1;
  return Object.keys(counts)
    .map((s) => {
      const w = META.weightage.find((x) => x.subject === s);
      return { subject: s, count: counts[s], tier: w?.tier || 'Clinical (Part C)', weight: w?.questions || 0 };
    })
    .sort((a, b) => (WEIGHT_ORDER.get(a.subject) ?? 99) - (WEIGHT_ORDER.get(b.subject) ?? 99));
})();

export const TIERS = ['Pre-clinical (Part A)', 'Para-clinical (Part B)', 'Clinical (Part C)'];

export function questionsBySubject(subject: string): Question[] {
  return QUESTIONS.filter((q) => q.subject === subject);
}

export function cardsBySubject(subject: string): Card[] {
  return CARDS.filter((c) => c.subject === subject);
}

export const TOTAL_QUESTIONS = QUESTIONS.length;

// Short subject color accent for chips (deterministic by subject)
const PALETTE = [
  'bg-teal-100 text-teal-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700', 'bg-cyan-100 text-cyan-700', 'bg-fuchsia-100 text-fuchsia-700',
  'bg-lime-100 text-lime-700', 'bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700',
];
export function subjectColor(subject: string): string {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
