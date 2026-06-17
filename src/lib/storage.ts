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
export function recordAnswer(qid: string, chosen: number, correct: boolean) {
  const a = getAnswers();
  a[qid] = { chosen, correct, ts: Date.now() };
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
