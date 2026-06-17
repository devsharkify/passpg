export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
  highYield: string;
  pyqNote: string;
  tags: string[];
  source?: 'prev-year' | 'gap-fill' | 'pred-2026';
  year_est?: string;
  is_repeat?: boolean;
  repeat_count?: number;
}

export interface Card {
  id: string;
  subject: string;
  title: string;
  kind: 'table' | 'points';
  headers: string[];
  rows: string[][];
  points: string[];
}

export interface WeightRow {
  subject: string;
  questions: number;
  tier: string;
}

export interface MockRecord {
  id: string;
  title: string;
  date: number;
  total: number;
  attempted: number;
  correct: number;
  wrong: number;
  score: number;
  maxScore: number;
  durationSec: number;
  perSubject: Record<string, { total: number; correct: number }>;
}

export interface AnswerRecord {
  chosen: number;
  correct: boolean;
  ts: number;
}
