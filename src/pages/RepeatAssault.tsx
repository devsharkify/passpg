import { useState, useEffect, useRef } from 'react';
import { QUESTIONS } from '../lib/data';
import { recordRepeatAttempt, getRepeatMasteryStats } from '../lib/storage';
import { Icon, SubjectChip } from '../components/ui';

const REPEATS = [...QUESTIONS]
  .filter(q => q.is_repeat)
  .sort((a, b) => (b.repeat_count || 0) - (a.repeat_count || 0));

const REPEAT_IDS = REPEATS.map(q => q.id);
const LETTERS = ['A', 'B', 'C', 'D'];

export default function RepeatAssault() {
  const [mode, setMode] = useState<'menu' | 'drill' | 'done'>('menu');
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [stats, setStats] = useState(() => getRepeatMasteryStats(REPEAT_IDS));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = REPEATS[idx];
  const timerSecs = q ? ((q.repeat_count || 0) >= 4 ? 10 : 15) : 15;

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  useEffect(() => {
    if (mode !== 'drill' || chosen !== null) return;
    setTimeLeft(timerSecs);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearTimer(); advance(false); return 0; }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, mode]);

  function advance(correct: boolean) {
    clearTimer();
    if (q) recordRepeatAttempt(q.id, correct);
    const next = [...results, correct];
    setResults(next);
    if (idx + 1 >= REPEATS.length) {
      setStats(getRepeatMasteryStats(REPEAT_IDS));
      setMode('done');
    } else {
      setTimeout(() => { setIdx(i => i + 1); setChosen(null); }, 700);
    }
  }

  function pick(i: number) {
    if (chosen !== null) return;
    clearTimer();
    setChosen(i);
    setTimeout(() => advance(i === q.answer), 700);
  }

  function startDrill() {
    setIdx(0); setChosen(null); setResults([]);
    setMode('drill');
  }

  function backToMenu() {
    clearTimer();
    setMode('menu'); setIdx(0); setChosen(null); setResults([]);
    setStats(getRepeatMasteryStats(REPEAT_IDS));
  }

  if (mode === 'menu') {
    const pct = stats.total ? Math.round(stats.mastered / stats.total * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-ink mb-2">Repeat Assault</h1>
          <p className="text-slate-500">Questions that appeared 2+ times in NEET PG history. Guaranteed marks — drill until mastered.</p>
        </div>

        <div className="card p-6 mb-5">
          <div className="flex items-end justify-between mb-2">
            <span className="text-sm font-semibold text-slate-500">Repeat Mastery</span>
            <span className="text-2xl font-extrabold text-brand-700">
              {stats.mastered} <span className="text-base font-normal text-slate-400">/ {stats.total}</span>
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: pct + '%' }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">Mastered = answered correctly on 3+ separate calendar days</p>
        </div>

        <div className="card p-4 mb-6 text-sm text-slate-500">
          <b className="text-ink">Timer rules:</b> Repeat ×4 or more = 10 seconds. Repeat ×2–3 = 15 seconds.
          Time out = marked wrong. No explanations during drill.
        </div>

        <button onClick={startDrill} className="w-full btn-primary py-4 text-lg font-bold rounded-2xl">
          Start Assault ({REPEATS.length} questions)
        </button>
      </div>
    );
  }

  if (mode === 'done') {
    const correct = results.filter(Boolean).length;
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-ink mb-2">Session Done</h2>
        <p className="text-slate-500 mb-6">{correct} / {results.length} correct</p>
        <div className="card p-6 mb-6">
          <div className="text-4xl font-extrabold text-brand-700 mb-1">
            {Math.round(correct / results.length * 100)}%
          </div>
          <div className="text-sm text-slate-400 mb-4">Session accuracy</div>
          <div className="text-sm text-slate-500">
            Repeat Mastery: <b className="text-ink">{stats.mastered} / {stats.total}</b>
          </div>
        </div>
        <button onClick={backToMenu} className="btn-primary px-8 py-3 rounded-xl">Back to Menu</button>
      </div>
    );
  }

  // DRILL MODE
  const isRevealed = chosen !== null;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">Q {idx + 1} / {REPEATS.length}</span>
        <span className={`text-2xl font-extrabold tabular-nums ${timeLeft <= 5 ? 'text-rose-600 animate-pop' : 'text-brand-600'}`}>
          {timeLeft}s
        </span>
        <button onClick={() => setMode('done')} className="text-xs text-slate-400 hover:text-slate-600">End session</button>
      </div>
      <div className="card p-5 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <SubjectChip subject={q.subject} />
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-amber-100 text-amber-700">
            Repeat ×{q.repeat_count}
          </span>
        </div>
        <p className="text-lg font-semibold text-ink leading-relaxed">{q.stem}</p>
      </div>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isChosen = chosen === i;
          let cls = 'border-slate-200 hover:border-brand-300 cursor-pointer';
          if (isRevealed) {
            cls = isCorrect ? 'border-emerald-400 bg-emerald-50' : isChosen ? 'border-rose-400 bg-rose-50' : 'border-slate-200 opacity-50';
          }
          return (
            <button key={i} disabled={isRevealed} onClick={() => pick(i)}
              className={`w-full text-left flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${cls}`}>
              <span className="shrink-0 w-6 h-6 grid place-items-center rounded-md bg-slate-100 text-sm font-bold text-slate-600">{LETTERS[i]}</span>
              <span className="text-sm text-ink">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* spacer so content isn't hidden on small screens */}
      <div className="h-8" />
    </div>
  );
}
