import { useEffect, useMemo, useState } from 'react';
import type { Question } from '../lib/types';
import { recordAnswer, toggleBookmark, isBookmarked } from '../lib/storage';
import { Icon, SubjectChip, DifficultyBadge, ProgressBar } from './ui';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function PracticeRunner({
  questions, title, onExit,
}: { questions: Question[]; title: string; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [resp, setResp] = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);
  const [bm, setBm] = useState(false);

  const q = questions[idx];
  const chosen = resp[idx];
  const revealed = chosen !== undefined;

  useEffect(() => { setBm(isBookmarked(q.id)); }, [q.id]);

  const answeredCount = Object.keys(resp).length;
  const correctCount = useMemo(
    () => Object.entries(resp).filter(([i, c]) => questions[+i].answer === c).length,
    [resp, questions],
  );

  function pick(opt: number) {
    if (revealed) return;
    const correct = opt === q.answer;
    setResp((r) => ({ ...r, [idx]: opt }));
    recordAnswer(q.id, opt, correct);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (['1', '2', '3', '4'].includes(e.key)) pick(+e.key - 1);
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(questions.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    const wrong = questions.filter((qq, i) => resp[i] !== undefined && resp[i] !== qq.answer);
    const acc = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;
    return (
      <div className="max-w-3xl mx-auto animate-fadeUp">
        <div className="card p-6 sm:p-8 text-center">
          <div className="label-faint">Practice complete</div>
          <h2 className="text-2xl font-extrabold mt-1">{title}</h2>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Stat label="Answered" value={`${answeredCount}/${questions.length}`} />
            <Stat label="Correct" value={`${correctCount}`} tone="good" />
            <Stat label="Accuracy" value={`${acc}%`} tone={acc >= 60 ? 'good' : 'warn'} />
          </div>
          <div className="flex gap-3 justify-center mt-7">
            <button className="btn-ghost" onClick={() => { setIdx(0); setResp({}); setDone(false); }}>
              <Icon name="reset" className="w-4 h-4" /> Restart
            </button>
            <button className="btn-primary" onClick={onExit}>Back</button>
          </div>
        </div>
        {wrong.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-ink mb-3">Review your {wrong.length} mistake{wrong.length > 1 ? 's' : ''}</h3>
            <div className="space-y-3">
              {wrong.map((qq) => (
                <div key={qq.id} className="card p-4">
                  <div className="flex gap-2 mb-2"><SubjectChip subject={qq.subject} /><DifficultyBadge d={qq.difficulty} /></div>
                  <p className="font-medium text-ink">{qq.stem}</p>
                  <p className="text-sm mt-2 text-emerald-700"><b>Correct:</b> {LETTERS[qq.answer]}. {qq.options[qq.answer]}</p>
                  <p className="text-sm mt-1 text-slate-600">{qq.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* top bar */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onExit} className="btn-ghost !px-3"><Icon name="left" className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink truncate">{title}</span>
            <span className="text-slate-500 tabular-nums">{idx + 1} / {questions.length}</span>
          </div>
          <ProgressBar pct={(idx + 1) / questions.length} className="mt-1.5" />
        </div>
        <button onClick={() => setBm(toggleBookmark(q.id))}
          className={`btn-ghost !px-3 ${bm ? '!text-brand-600 !border-brand-300' : ''}`} title="Bookmark">
          <Icon name={bm ? 'bookmarkFill' : 'bookmark'} className="w-4 h-4" />
        </button>
      </div>

      {/* question */}
      <div className="card p-5 sm:p-6 animate-fadeUp" key={q.id}>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SubjectChip subject={q.subject} />
          <DifficultyBadge d={q.difficulty} />
          <span className="chip bg-slate-100 text-slate-500">{q.topic}</span>
        </div>
        <p className="text-lg font-semibold text-ink leading-relaxed">{q.stem}</p>

        <div className="mt-4 space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer;
            const isChosen = chosen === i;
            let cls = 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40';
            if (revealed) {
              if (isCorrect) cls = 'border-emerald-400 bg-emerald-50';
              else if (isChosen) cls = 'border-rose-400 bg-rose-50';
              else cls = 'border-slate-200 opacity-70';
            }
            return (
              <button key={i} disabled={revealed} onClick={() => pick(i)}
                className={`w-full text-left flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${cls}`}>
                <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg text-sm font-bold ${
                  revealed && isCorrect ? 'bg-emerald-500 text-white'
                  : revealed && isChosen ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-600'}`}>
                  {revealed && isCorrect ? <Icon name="check" className="w-4 h-4" />
                    : revealed && isChosen ? <Icon name="x" className="w-4 h-4" />
                    : LETTERS[i]}
                </span>
                <span className="pt-0.5 text-ink">{opt}</span>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 animate-fadeUp">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="spark" className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-bold text-brand-700">High-yield</span>
            </div>
            <p className="text-sm font-medium text-ink">{q.highYield}</p>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{q.explanation}</p>
            {q.pyqNote && <p className="text-xs text-slate-400 mt-2 italic">PYQ insight: {q.pyqNote}</p>}
          </div>
        )}
      </div>

      {/* bottom bar */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button className="btn-ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
          <Icon name="left" className="w-4 h-4" /> Prev
        </button>
        <span className="text-sm text-slate-500 tabular-nums">
          <b className="text-emerald-600">{correctCount}</b> correct of {answeredCount} answered
        </span>
        {idx === questions.length - 1 ? (
          <button className="btn-primary" onClick={() => setDone(true)}>Finish</button>
        ) : (
          <button className="btn-primary" onClick={() => setIdx((i) => i + 1)}>
            Next <Icon name="right" className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' }) {
  const c = tone === 'good' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : 'text-ink';
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <div className={`text-2xl font-extrabold ${c}`}>{value}</div>
      <div className="label-faint mt-1">{label}</div>
    </div>
  );
}
