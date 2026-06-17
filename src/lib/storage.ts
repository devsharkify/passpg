import type { AnswerRecord, MockRecord } from './types';

const P = 'drsaranya.v1.';
const K = {
  answers: P + 'answers',
  bookmarks: P + 'bookmarks',
  mocks: P + 'mocks',
  settings: P + 'settings',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore quota */ }
}

// ---- Answers (practice history) ----
export type AnswerMap = Record<string, AnswerRecord>;
export function getAnswers(): AnswerMap { return read<AnswerMap>(K.answers, {}); }
export function recordAnswer(
  qid: string, chosen: number, correct: boolean,
  opts?: { confidence?: 'sure' | 'unsure' | 'guess'; rootCause?: 'never-knew' | 'forgot' | 'confuser' | 'careless' }
) {
  const a = getAnswers();
  a[qid] = { chosen, correct, ts: Date.now(), ...opts };
  write(K.answers, a);
}
export function getAnswer(qid: string): AnswerRecord | undefined { return getAnswers()[qid]; }

// ---- Bookmarks ----
export function getBookmarks(): string[] { return read<string[]>(K.bookmarks, []); }
export function isBookmarked(qid: string): boolean { return getBookmarks().includes(qid); }
export function toggleBookmark(qid: string): boolean {
  const b = getBookmarks();
  const i = b.indexOf(qid);
  if (i >= 0) { b.splice(i, 1); write(K.bookmarks, b); return false; }
  b.push(qid); write(K.bookmarks, b); return true;
}

// ---- Mock history ----
export function getMocks(): MockRecord[] {
  return read<MockRecord[]>(K.mocks, []).sort((a, b) => b.date - a.date);
}
export function saveMock(rec: MockRecord) {
  const m = read<MockRecord[]>(K.mocks, []);
  m.push(rec);
  write(K.mocks, m);
}

// ---- Settings ----
export interface Settings { examDate: string; }
export function getSettings(): Settings { return read<Settings>(K.settings, { examDate: '' }); }
export function setSettings(s: Settings) { write(K.settings, s); }

// ---- Stats ----
export interface SubjectStat { attempted: number; correct: number }
export interface Stats {
  attempted: number;
  correct: number;
  accuracy: number;
  bySubject: Record<string, SubjectStat>;
}
export function computeStats(questionSubject: Record<string, string>): Stats {
  const answers = getAnswers();
  const bySubject: Record<string, SubjectStat> = {};
  let attempted = 0, correct = 0;
  for (const [qid, rec] of Object.entries(answers)) {
    const subj = questionSubject[qid];
    if (!subj) continue;
    attempted++;
    if (rec.correct) correct++;
    const s = (bySubject[subj] ||= { attempted: 0, correct: 0 });
    s.attempted++;
    if (rec.correct) s.correct++;
  }
  return { attempted, correct, accuracy: attempted ? correct / attempted : 0, bySubject };
}

export function resetAll() {
  [K.answers, K.bookmarks, K.mocks].forEach((k) => localStorage.removeItem(k));
}

// ── Repeat mastery ──────────────────────────────────────────────────────────
export function getRepeatMastery(): Record<string, string[]> {
  return read<Record<string, string[]>>(P + 'repeatMastery', {});
}
export function recordRepeatAttempt(qid: string, correct: boolean): void {
  if (!correct) return;
  const m = getRepeatMastery();
  const today = new Date().toISOString().slice(0, 10);
  if (!m[qid]) m[qid] = [];
  if (!m[qid].includes(today)) { m[qid].push(today); write(P + 'repeatMastery', m); }
}
export function isRepeatMastered(qid: string): boolean {
  return (getRepeatMastery()[qid] || []).length >= 3;
}
export function getRepeatMasteryStats(qids: string[]): { mastered: number; total: number } {
  const m = getRepeatMastery();
  return { mastered: qids.filter(id => (m[id] || []).length >= 3).length, total: qids.length };
}

// ── Last-practice tracking ───────────────────────────────────────────────────
export function getLastPracticeBySubject(): Record<string, number> {
  return read<Record<string, number>>(P + 'lastPractice', {});
}
export function updateLastPractice(subject: string): void {
  const lp = getLastPracticeBySubject();
  lp[subject] = Date.now();
  write(P + 'lastPractice', lp);
}

// ── Spaced repetition (SM-2 simplified) ─────────────────────────────────────
interface SRSEntry { nextReview: string; intervalDays: number; streak: number; }
function getSRSSchedule(): Record<string, SRSEntry> {
  return read<Record<string, SRSEntry>>(P + 'srs', {});
}
export function scheduleSRS(qid: string, correct: boolean): void {
  const INTERVALS = [1, 3, 7, 14, 30, 60];
  const sched = getSRSSchedule();
  const e = sched[qid] || { intervalDays: 1, streak: 0, nextReview: '' };
  const streak = correct ? Math.min(e.streak + 1, INTERVALS.length - 1) : 0;
  const days = INTERVALS[streak];
  const next = new Date();
  next.setDate(next.getDate() + days);
  sched[qid] = { nextReview: next.toISOString().slice(0, 10), intervalDays: days, streak };
  write(P + 'srs', sched);
}
export function getSRSDueCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  return Object.values(getSRSSchedule()).filter(e => e.nextReview <= today).length;
}
export function getSRSDueIds(): string[] {
  const today = new Date().toISOString().slice(0, 10);
  return Object.entries(getSRSSchedule()).filter(([, e]) => e.nextReview <= today).map(([id]) => id);
}

// ── False-confidence stats ───────────────────────────────────────────────────
export function getFalseConfidenceBySubject(questionSubject: Record<string, string>): Record<string, number> {
  const answers = getAnswers();
  const out: Record<string, number> = {};
  for (const [qid, rec] of Object.entries(answers)) {
    if (rec.confidence === 'sure' && !rec.correct) {
      const s = questionSubject[qid];
      if (s) out[s] = (out[s] || 0) + 1;
    }
  }
  return out;
}
