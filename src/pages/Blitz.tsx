import { useState, useEffect, useRef } from 'react';
import { QUESTIONS } from '../lib/data';
import { shuffle } from '../lib/examEngine';
import { Icon, SubjectChip } from '../components/ui';

const BLITZ_SUBJECTS = ['Social and Preventive Medicine', 'Pharmacology'];
const POOL = QUESTIONS.filter(q => BLITZ_SUBJECTS.includes(q.subject));
const LETTERS = ['A', 'B', 'C', 'D'];

export default function Blitz() {
  const [mode, setMode] = useState<'menu' | 'drill' | 'done'>('menu');
  const [queue, setQueue] = useState<typeof POOL>([]);
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [chosen, setChosen] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const startTsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = queue[idx];

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  useEffect(() => {
    if (mode !== 'drill' || chosen !== null) return;
    setTimeLeft(20);
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

  function start() {
    const q = shuffle([...POOL]);
    setQueue(q);
    setIdx(0); setChosen(null); setResults([]);
    startTsRef.current = Date.now();
    setMode('drill');
  }

  function advance(correct: boolean) {
    clearTimer();
    const next = [...results, correct];
    setResults(next);
    if (idx + 1 >= queue.length) { setMode('done'); return; }
    setTimeout(() => { setIdx(i => i + 1); setChosen(null); }, 500);
  }

  function pick(i: number) {
    if (chosen !== null || !q) return;
    clearTimer();
    setChosen(i);
    setTimeout(() => advance(i === q.answer), 500);
  }

  if (mode === 'menu') return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-ink mb-2">PSM + Pharma Blitz</h1>
      <p className="text-slate-500 mb-8">20 seconds per question. No explanations. Pure pattern drilling. Daily 15-minute ritual.</p>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-3xl font-extrabold text-brand-700">
            {POOL.filter(q => q.subject === 'Social and Preventive Medicine').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">PSM questions</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-extrabold text-brand-700">
            {POOL.filter(q => q.subject === 'Pharmacology').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pharmacology questions</div>
        </div>
      </div>
      <button onClick={start} className="w-full btn-primary py-4 text-lg font-bold rounded-2xl">
        Start Blitz ({POOL.length} questions)
      </button>
    </div>
  );

  if (mode === 'done') {
    const correct = results.filter(Boolean).length;
    const elapsedMin = (Date.now() - startTsRef.current) / 60000;
    const qpm = elapsedMin > 0 ? (results.length / elapsedMin).toFixed(1) : '—';
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-ink mb-2">Blitz Complete</h2>
        <div className="card p-6 mb-6">
          <div className="text-4xl font-extrabold text-brand-700 mb-1">{correct}/{results.length}</div>
          <div className="text-sm text-slate-400 mb-4">{Math.round(correct / results.length * 100)}% accuracy</div>
          <div className="text-lg font-semibold text-ink">
            {qpm} <span className="text-sm font-normal text-slate-400">questions/min</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={start} className="btn-primary px-6 py-2 rounded-xl">Go Again</button>
          <button onClick={() => setMode('menu')} className="btn-ghost px-6 py-2 rounded-xl">Done</button>
        </div>
      </div>
    );
  }

  if (!q) return null;
  const isRevealed = chosen !== null;
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <SubjectChip subject={q.subject} />
        <span className={`text-3xl font-extrabold tabular-nums ${timeLeft <= 5 ? 'text-rose-600 animate-pop' : 'text-brand-600'}`}>
          {timeLeft}
        </span>
        <button onClick={() => setMode('done')} className="text-xs text-slate-400 hover:text-slate-600">End</button>
      </div>
      <div className="card p-5 mb-4">
        <p className="text-lg font-semibold text-ink leading-relaxed">{q.stem}</p>
      </div>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isChosen = chosen === i;
          let cls = 'border-slate-200 hover:border-brand-300 cursor-pointer';
          if (isRevealed) cls = isCorrect ? 'border-emerald-400 bg-emerald-50' : isChosen ? 'border-rose-400 bg-rose-50' : 'border-slate-200 opacity-50';
          return (
            <button key={i} disabled={isRevealed} onClick={() => pick(i)}
              className={`w-full text-left flex items-center gap-3 rounded-xl border-2 px-4 py-2.5 transition ${cls}`}>
              <span className="shrink-0 w-6 h-6 grid place-items-center rounded-md bg-slate-100 text-sm font-bold text-slate-600">{LETTERS[i]}</span>
              <span className="text-sm text-ink">{opt}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-center text-xs text-slate-400">{idx + 1} / {queue.length}</div>
    </div>
  );
}
