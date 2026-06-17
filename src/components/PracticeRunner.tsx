import { useEffect, useMemo, useState } from 'react';
import type { Question } from '../lib/types';
import { recordAnswer, toggleBookmark, isBookmarked, scheduleSRS, updateLastPractice } from '../lib/storage';
import { Icon, SubjectChip, DifficultyBadge, ProgressBar } from './ui';

const LETTERS = ['A', 'B', 'C', 'D'];

const ROOT_CAUSE_OPTIONS = [
  ['never-knew', 'Never knew this'],
  ['forgot', 'Knew but forgot'],
  ['confuser', 'Confuser trap'],
  ['careless', 'Careless / misread'],
] as const;

function isImageStyle(q: Question): boolean {
  const stem = q.stem.toLowerCase();
  return q.tags.some(t => ['image','image-based','radiology-image','ecg','histology','photograph'].includes(t))
    || /\b(image|shown in|photograph|figure|x-ray|xray|ct scan|mri|ultrasound|ecg|eeg|histology)\b/.test(stem);
}

export default function PracticeRunner({
  questions, title, onExit,
}: { questions: Question[]; title: string; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [resp, setResp] = useState<Record<number, number>>({});
  const [confidence, setConfidence] = useState<Record<number, 'sure' | 'unsure' | 'guess'>>({});
  const [rootCauses, setRootCauses] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);
  const [bm, setBm] = useState(false);

  // confidence modal state
  const [pendingChoice, setPendingChoice] = useState<number | null>(null);
  const [showConf, setShowConf] = useState(false);

  const q = questions[idx];
  const chosen = resp[idx];
  const revealed = chosen !== undefined;
  const conf = confidence[idx];
  const rootCause = rootCauses[idx];
  const isWrong = revealed && chosen !== q.answer;

  useEffect(() => { setBm(isBookmarked(q.id)); }, [q.id]);

  const answeredCount = Object.keys(resp).length;
  const correctCount = useMemo(
    () => Object.entries(resp).filter(([i, c]) => questions[+i].answer === c).length,
    [resp, questions],
  );

  function pick(opt: number) {
    if (revealed) return;
    setPendingChoice(opt);
    setShowConf(true);
  }

  function pickConfidence(c: 'sure' | 'unsure' | 'guess') {
    if (pendingChoice === null) return;
    const correct = pendingChoice === q.answer;
    setResp(r => ({ ...r, [idx]: pendingChoice }));
    setConfidence(cv => ({ ...cv, [idx]: c }));
    setShowConf(false);
    setPendingChoice(null);
    recordAnswer(q.id, pendingChoice, correct, { confidence: c });
    scheduleSRS(q.id, correct);
    updateLastPractice(q.subject);
  }

  function pickRootCause(rc: string) {
    setRootCauses(r => ({ ...r, [idx]: rc }));
    recordAnswer(q.id, chosen, false, { confidence: conf, rootCause: rc as any });
  }

  function advance(dir: 1 | -1) {
    setShowConf(false);
    setPendingChoice(null);
    setIdx(i => Math.max(0, Math.min(questions.length - 1, i + dir)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done) return;
      if (['1', '2', '3', '4'].includes(e.key) && !showConf) pick(+e.key - 1);
      if (e.key === 'ArrowRight') advance(1);
      if (e.key === 'ArrowLeft') advance(-1);
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
            <button className="btn-ghost" onClick={() => { setIdx(0); setResp({}); setConfidence({}); setRootCauses({}); setDone(false); }}>
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
          {(q as any).source === 'prev-year' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">Real Paper</span>}
          {(q as any).source === 'pred-2026' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-violet-100 text-violet-700">Predicted 2026</span>}
          {(q as any).source === 'gap-fill' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-slate-100 text-slate-500">Gap Fill</span>}
          {(q as any).is_repeat && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-amber-100 text-amber-700">Repeat ×{(q as any).repeat_count}</span>}
          {isImageStyle(q) && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-sky-100 text-sky-700">Image-Style</span>}
        </div>
        {q.imageUrl && (
          <div className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={q.imageUrl} alt="Question image" className="w-full object-contain max-h-72" loading="lazy" />
          </div>
        )}
        <p className="text-lg font-semibold text-ink leading-relaxed">{q.stem}</p>

        <div className="mt-4 space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.answer;
            const isChosen = chosen === i;
            const isPending = showConf && pendingChoice === i;
            let cls = 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40';
            if (revealed) {
              if (isCorrect) cls = 'border-emerald-400 bg-emerald-50';
              else if (isChosen) cls = 'border-rose-400 bg-rose-50';
              else cls = 'border-slate-200 opacity-70';
            } else if (isPending) {
              cls = 'border-brand-500 bg-brand-50';
            } else if (showConf) {
              cls = 'border-slate-200 opacity-50 cursor-default';
            }
            return (
              <button key={i} disabled={revealed || (showConf && !isPending)} onClick={() => pick(i)}
                className={`w-full text-left flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${cls}`}>
                <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg text-sm font-bold ${
                  revealed && isCorrect ? 'bg-emerald-500 text-white'
                  : revealed && isChosen ? 'bg-rose-500 text-white'
                  : isPending ? 'bg-brand-600 text-white'
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

        {/* confidence modal */}
        {showConf && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fadeUp">
            <p className="text-sm font-semibold text-slate-600 mb-3 text-center">How confident were you?</p>
            <div className="flex gap-2 justify-center">
              {(['sure', 'unsure', 'guess'] as const).map(c => (
                <button key={c} onClick={() => pickConfidence(c)}
                  className="px-4 py-2 rounded-lg text-sm font-bold border-2 border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition">
                  {c === 'sure' ? '✓ Sure' : c === 'unsure' ? '~ Unsure' : '? Guess'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* explanation */}
        {revealed && (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 animate-fadeUp">
            {conf && (
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                  conf === 'sure' && isWrong ? 'bg-rose-100 text-rose-700'
                  : conf === 'sure' ? 'bg-emerald-100 text-emerald-700'
                  : conf === 'unsure' ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'}`}>
                  {conf === 'sure' && isWrong ? '⚠ Sure but Wrong' : conf === 'sure' ? '✓ Sure' : conf === 'unsure' ? '~ Unsure' : '? Guess'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1.5">
              <Icon name="spark" className="w-4 h-4 text-brand-600" />
              <span className="text-sm font-bold text-brand-700">High-yield</span>
            </div>
            <p className="text-sm font-medium text-ink">{q.highYield}</p>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">{q.explanation}</p>
            {q.pyqNote && <p className="text-xs text-slate-400 mt-2 italic">PYQ insight: {q.pyqNote}</p>}
          </div>
        )}

        {/* root cause selector (wrong answers only) */}
        {isWrong && !rootCause && (
          <div className="mt-3 p-4 rounded-xl bg-rose-50 border border-rose-100 animate-fadeUp">
            <p className="text-xs font-bold text-rose-600 uppercase mb-2">Why did you get this wrong?</p>
            <div className="grid grid-cols-2 gap-2">
              {ROOT_CAUSE_OPTIONS.map(([key, label]) => (
                <button key={key} onClick={() => pickRootCause(key)}
                  className="text-xs px-3 py-2 rounded-lg border border-rose-200 hover:bg-rose-100 text-rose-700 text-left transition">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        {isWrong && rootCause && (
          <p className="mt-2 text-xs text-slate-400">
            Logged: {ROOT_CAUSE_OPTIONS.find(([k]) => k === rootCause)?.[1] ?? rootCause}
          </p>
        )}
      </div>

      {/* bottom bar */}
      <div className="flex items-center justify-between gap-3 mt-4">
        <button className="btn-ghost" disabled={idx === 0} onClick={() => advance(-1)}>
          <Icon name="left" className="w-4 h-4" /> Prev
        </button>
        <span className="text-sm text-slate-500 tabular-nums">
          <b className="text-emerald-600">{correctCount}</b> correct of {answeredCount} answered
        </span>
        {idx === questions.length - 1 ? (
          <button className="btn-primary" onClick={() => setDone(true)}>Finish</button>
        ) : (
          <button className="btn-primary" onClick={() => advance(1)}>
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
