import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question, MockRecord, QuestionTime } from '../lib/types';
import { planSections, scoreTest, MARKS } from '../lib/examEngine';
import { recordAnswer, saveMock } from '../lib/storage';
import { Icon, SubjectChip, ProgressBar } from './ui';

const LETTERS = ['A', 'B', 'C', 'D'];

function isImageStyle(q: Question): boolean {
  const stem = q.stem.toLowerCase();
  return q.tags.some(t => ['image','image-based','radiology-image','ecg','histology','photograph'].includes(t))
    || /\b(image|shown in|photograph|figure|x-ray|xray|ct scan|mri|ultrasound|ecg|eeg|histology)\b/.test(stem);
}

function fmt(sec: number) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export default function MockRunner({
  questions, title, durationSec, sectional, onExit,
}: { questions: Question[]; title: string; durationSec: number; sectional: boolean; onExit: () => void }) {
  const plan = useMemo(() => (sectional ? planSections(questions.length) : null), [sectional, questions.length]);
  const size = plan?.sectionSize ?? questions.length;
  const sectionCount = plan?.sectionCount ?? 1;

  const [section, setSection] = useState(0);
  const [current, setCurrent] = useState(0);
  const [resp, setResp] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(sectional ? plan!.sectionSeconds : durationSec);
  const [phase, setPhase] = useState<'running' | 'result'>('running');
  const [showWrongOnly, setShowWrongOnly] = useState(true);

  // time tracking
  const startedAt = useRef(Date.now());
  const qStartRef = useRef(Date.now());
  const clickTsRef = useRef(0);
  const finalized = useRef(false);
  const [questionTimes, setQuestionTimes] = useState<QuestionTime[]>([]);

  // confidence modal
  const [pendingChosen, setPendingChosen] = useState<number | null>(null);
  const [showConf, setShowConf] = useState(false);

  const secStart = section * size;
  const secEnd = Math.min(secStart + size, questions.length);

  // reset question timer on navigation
  useEffect(() => { qStartRef.current = Date.now(); }, [current]);

  // countdown
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // expiry handling
  useEffect(() => {
    if (phase !== 'running' || timeLeft > 0) return;
    if (sectional && section < sectionCount - 1) {
      const next = section + 1;
      setSection(next);
      setCurrent(next * size);
      setTimeLeft(plan!.sectionSeconds);
    } else {
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  function finalize() {
    if (finalized.current) return;
    finalized.current = true;
    const responses: Record<number, number | null> = {};
    questions.forEach((_, i) => { responses[i] = resp[i] ?? null; });
    const s = scoreTest(questions, responses);
    const perSubject: Record<string, { total: number; correct: number }> = {};
    questions.forEach((q, i) => {
      const ps = (perSubject[q.subject] ||= { total: 0, correct: 0 });
      ps.total++;
      if (resp[i] !== undefined) {
        recordAnswer(q.id, resp[i], resp[i] === q.answer);
        if (resp[i] === q.answer) ps.correct++;
      }
    });
    const rec: MockRecord = {
      id: 'm' + startedAt.current,
      title, date: Date.now(), total: questions.length,
      attempted: s.attempted, correct: s.correct, wrong: s.wrong,
      score: s.score, maxScore: s.maxScore,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      perSubject,
      questionTimes,
    };
    saveMock(rec);
    setPhase('result');
  }

  function advanceSection() {
    if (section < sectionCount - 1) {
      const next = section + 1;
      setSection(next);
      setCurrent(next * size);
      setTimeLeft(plan!.sectionSeconds);
    } else {
      finalize();
    }
  }

  function pick(opt: number) {
    // show confidence modal instead of committing immediately
    clickTsRef.current = Date.now();
    setPendingChosen(opt);
    setShowConf(true);
  }

  function pickConfidence(c: 'sure' | 'unsure' | 'guess') {
    if (pendingChosen === null) return;
    const q = questions[current];
    const timeMs = clickTsRef.current - qStartRef.current;
    const correct = pendingChosen === q.answer;
    setQuestionTimes(prev => {
      const without = prev.filter(t => t.qi !== current);
      return [...without, { qi: current, subject: q.subject, timeMs, chosen: pendingChosen, correct, confidence: c }];
    });
    setResp(r => ({ ...r, [current]: pendingChosen }));
    setPendingChosen(null);
    setShowConf(false);
  }

  function toggleFlag() {
    setFlagged((f) => { const n = new Set(f); n.has(current) ? n.delete(current) : n.add(current); return n; });
  }

  if (phase === 'result') {
    return <Result questions={questions} resp={resp} title={title} onExit={onExit}
      showWrongOnly={showWrongOnly} setShowWrongOnly={setShowWrongOnly}
      durationSec={Math.round((Date.now() - startedAt.current) / 1000)}
      questionTimes={questionTimes} />;
  }

  const q = questions[current];
  const chosen = resp[current];
  const answeredInSection = Array.from({ length: secEnd - secStart }, (_, k) => resp[secStart + k] !== undefined).filter(Boolean).length;
  const lowTime = timeLeft <= 60;

  return (
    <div className="max-w-5xl mx-auto">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="min-w-0">
          <div className="font-bold text-ink truncate">{title}</div>
          <div className="text-xs text-slate-500">
            {sectional ? `Section ${section + 1} of ${sectionCount} - no return once submitted` : 'Single timed section'}
          </div>
        </div>
        <div className={`ml-auto flex items-center gap-2 rounded-xl px-3 py-2 font-bold tabular-nums ${
          lowTime ? 'bg-rose-100 text-rose-700 animate-pop' : 'bg-slate-900 text-white'}`}>
          <Icon name="clock" className="w-4 h-4" /> {fmt(timeLeft)}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr,260px] gap-5">
        {/* question column */}
        <div>
          <div className="card p-5 sm:p-6 animate-fadeUp" key={q.id}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip bg-slate-900 text-white">Q{current + 1}</span>
                <SubjectChip subject={q.subject} />
                {(q as any).source === 'prev-year' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">Real Paper</span>}
                {(q as any).source === 'pred-2026' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-violet-100 text-violet-700">Predicted 2026</span>}
                {(q as any).source === 'gap-fill' && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-slate-100 text-slate-500">Gap Fill</span>}
                {(q as any).is_repeat && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-amber-100 text-amber-700">Repeat ×{(q as any).repeat_count}</span>}
                {isImageStyle(q) && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide bg-sky-100 text-sky-700">Image-Style</span>}
              </div>
              <button onClick={toggleFlag}
                className={`btn-ghost !px-3 !py-2 ${flagged.has(current) ? '!text-amber-600 !border-amber-300 bg-amber-50' : ''}`}>
                <Icon name="flag" className="w-4 h-4" /> {flagged.has(current) ? 'Flagged' : 'Flag'}
              </button>
            </div>
            {q.imageUrl && (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={q.imageUrl} alt="Question image" className="w-full object-contain max-h-72" loading="lazy" />
              </div>
            )}
            <p className="text-lg font-semibold text-ink leading-relaxed">{q.stem}</p>
            <div className="mt-4 space-y-2.5">
              {q.options.map((opt, i) => {
                const committed = chosen === i;
                const isPending = showConf && pendingChosen === i;
                const sel = committed || isPending;
                return (
                  <button key={i} onClick={() => !showConf && pick(i)}
                    disabled={showConf && !isPending}
                    className={`w-full text-left flex items-start gap-3 rounded-xl border-2 px-4 py-3 transition ${
                      sel ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/40'} ${
                      showConf && !isPending ? 'opacity-50 cursor-default' : ''}`}>
                    <span className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg text-sm font-bold ${
                      sel ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{LETTERS[i]}</span>
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

            {chosen !== undefined && !showConf && (
              <button className="text-xs text-slate-400 mt-3 hover:text-rose-500"
                onClick={() => setResp((r) => { const n = { ...r }; delete n[current]; return n; })}>
                Clear response
              </button>
            )}
          </div>

          {/* nav */}
          <div className="flex items-center justify-between gap-3 mt-4">
            <button className="btn-ghost" disabled={current <= secStart} onClick={() => setCurrent((c) => c - 1)}>
              <Icon name="left" className="w-4 h-4" /> Prev
            </button>
            {current < secEnd - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent((c) => c + 1)}>Next <Icon name="right" className="w-4 h-4" /></button>
            ) : (
              <button className="btn-primary" onClick={advanceSection}>
                {section < sectionCount - 1 ? 'Submit section' : 'Submit test'} <Icon name="check" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* palette */}
        <div className="card p-4 h-max lg:sticky lg:top-20">
          <div className="flex items-center justify-between mb-2">
            <span className="label-faint">Question palette</span>
            <span className="text-xs font-semibold text-slate-500">{answeredInSection}/{secEnd - secStart}</span>
          </div>
          <ProgressBar pct={(secEnd - secStart) ? answeredInSection / (secEnd - secStart) : 0} className="mb-3" />
          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto scroll-thin pr-1">
            {questions.map((_, i) => {
              const sIdx = Math.floor(i / size);
              const inActive = sIdx === section;
              const locked = sectional && sIdx < section;
              const future = sectional && sIdx > section;
              const answered = resp[i] !== undefined;
              const isFlag = flagged.has(i);
              let cls = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
              if (answered) cls = 'bg-brand-600 text-white';
              if (isFlag) cls = 'bg-amber-400 text-white';
              if (i === current) cls = 'ring-2 ring-brand-500 ' + (answered ? 'bg-brand-600 text-white' : 'bg-white text-brand-700');
              if (locked) cls = 'bg-slate-50 text-slate-300';
              if (future) cls = 'bg-slate-50 text-slate-300';
              return (
                <button key={i} disabled={!inActive && sectional}
                  onClick={() => inActive || !sectional ? setCurrent(i) : null}
                  className={`aspect-square rounded-lg text-xs font-bold transition ${cls} disabled:cursor-not-allowed`}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <Legend color="bg-brand-600" label="Answered" />
            <Legend color="bg-amber-400" label="Flagged" />
            <Legend color="bg-slate-100" label="Unseen" />
          </div>
          <button className="btn-ghost w-full mt-4 !text-rose-600 hover:!border-rose-300" onClick={finalize}>
            End & submit now
          </button>
          <button className="text-xs text-slate-400 w-full mt-2 hover:text-slate-600" onClick={onExit}>Abandon test</button>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-5">
        Marking: +{MARKS.correct} correct, {MARKS.incorrect} wrong, {MARKS.unattempted} unattempted
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><span className={`w-3 h-3 rounded ${color}`} />{label}</span>;
}

function Result({
  questions, resp, title, onExit, durationSec, showWrongOnly, setShowWrongOnly, questionTimes,
}: {
  questions: Question[]; resp: Record<number, number>; title: string; onExit: () => void;
  durationSec: number; showWrongOnly: boolean; setShowWrongOnly: (b: boolean) => void;
  questionTimes: QuestionTime[];
}) {
  const responses: Record<number, number | null> = {};
  questions.forEach((_, i) => { responses[i] = resp[i] ?? null; });
  const s = scoreTest(questions, responses);
  const acc = s.attempted ? Math.round((s.correct / s.attempted) * 100) : 0;
  const projectedPaper = Math.round((s.correct / questions.length) * 800);

  const perSubject: Record<string, { total: number; correct: number; attempted: number }> = {};
  questions.forEach((q, i) => {
    const ps = (perSubject[q.subject] ||= { total: 0, correct: 0, attempted: 0 });
    ps.total++;
    if (resp[i] !== undefined) { ps.attempted++; if (resp[i] === q.answer) ps.correct++; }
  });

  // time × outcome grouped by subject
  const timeBySubj: Record<string, { times: number[]; correct: number; total: number; confident: number; sureWrong: number }> = {};
  for (const t of questionTimes) {
    const d = (timeBySubj[t.subject] ||= { times: [], correct: 0, total: 0, confident: 0, sureWrong: 0 });
    d.times.push(t.timeMs);
    d.total++;
    if (t.correct) d.correct++;
    if (t.confidence === 'sure') { d.confident++; if (!t.correct) d.sureWrong++; }
  }
  const totalSureWrong = questionTimes.filter(t => t.confidence === 'sure' && !t.correct).length;

  const reviewList = questions.map((q, i) => ({ q, i })).filter(({ q, i }) =>
    !showWrongOnly || resp[i] === undefined || resp[i] !== q.answer);

  return (
    <div className="max-w-3xl mx-auto animate-fadeUp">
      <div className="card p-6 sm:p-8">
        <div className="text-center">
          <div className="label-faint">Test report</div>
          <h2 className="text-2xl font-extrabold mt-1">{title}</h2>
          <div className="mt-5 inline-flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-brand-700">{s.score}</span>
            <span className="text-xl font-bold text-slate-400">/ {s.maxScore}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">net score (+4/−1) · projected <b>{projectedPaper}</b>/800 on full paper</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <Mini label="Correct" value={s.correct} tone="good" />
          <Mini label="Wrong" value={s.wrong} tone="bad" />
          <Mini label="Attempted" value={`${s.attempted}/${questions.length}`} />
          <Mini label="Accuracy" value={`${acc}%`} tone={acc >= 50 ? 'good' : 'warn'} />
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">Time taken: {fmt(durationSec)}</p>
      </div>

      <div className="card p-5 mt-5">
        <h3 className="font-bold text-ink mb-3">Subject-wise performance</h3>
        <div className="space-y-2.5">
          {Object.entries(perSubject).sort((a, b) => b[1].total - a[1].total).map(([subj, v]) => {
            const p = v.attempted ? v.correct / v.attempted : 0;
            return (
              <div key={subj} className="flex items-center gap-3">
                <div className="w-44 shrink-0"><SubjectChip subject={subj} /></div>
                <ProgressBar pct={p} className="flex-1" />
                <span className="text-xs font-semibold text-slate-500 tabular-nums w-20 text-right">{v.correct}/{v.attempted || 0} of {v.total}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time × Outcome debrief */}
      {questionTimes.length > 0 && (
        <div className="card p-5 mt-5">
          <h3 className="font-bold text-ink mb-3">Time × Outcome</h3>
          {totalSureWrong > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              ⚠ {totalSureWrong} question{totalSureWrong > 1 ? 's' : ''} marked <b>Sure</b> but answered wrong — review these first
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2">Subject</th>
                  <th className="pb-2 text-right">Avg time</th>
                  <th className="pb-2 text-right">Accuracy</th>
                  <th className="pb-2 text-right">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(timeBySubj)
                  .sort((a, b) => {
                    const avgA = a[1].times.reduce((s, t) => s + t, 0) / a[1].times.length;
                    const avgB = b[1].times.reduce((s, t) => s + t, 0) / b[1].times.length;
                    return avgB - avgA;
                  })
                  .map(([subj, d]) => {
                    const avgS = d.times.reduce((s, t) => s + t, 0) / d.times.length / 1000;
                    const acc = d.correct / d.total;
                    const verdict = avgS < 45 && acc > 0.7
                      ? { label: 'Efficient ✓', cls: 'text-emerald-600' }
                      : avgS > 90 && acc < 0.6
                      ? { label: 'Double Loss ✗', cls: 'text-rose-600' }
                      : avgS > 90
                      ? { label: 'Slow', cls: 'text-amber-600' }
                      : { label: 'OK', cls: 'text-slate-400' };
                    return (
                      <tr key={subj} className="border-b border-slate-50">
                        <td className="py-2 text-xs">{subj}</td>
                        <td className="py-2 text-right text-xs tabular-nums">{avgS.toFixed(0)}s</td>
                        <td className="py-2 text-right text-xs tabular-nums">{Math.round(acc * 100)}%</td>
                        <td className={`py-2 text-right text-xs font-semibold ${verdict.cls}`}>{verdict.label}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            &lt;45s + &gt;70% = Efficient · &gt;90s + &lt;60% = Double Loss · Confidence logged for {questionTimes.filter(t => t.confidence).length}/{questionTimes.length} answered
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-6 mb-3">
        <h3 className="font-bold text-ink">Solutions</h3>
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input type="checkbox" checked={showWrongOnly} onChange={(e) => setShowWrongOnly(e.target.checked)} className="accent-brand-600" />
          Wrong / skipped only
        </label>
      </div>
      <div className="space-y-3">
        {reviewList.map(({ q, i }) => {
          const chosen = resp[i];
          const skipped = chosen === undefined;
          const correct = chosen === q.answer;
          const qt = questionTimes.find(t => t.qi === i);
          return (
            <div key={q.id} className="card p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="chip bg-slate-900 text-white">Q{i + 1}</span>
                <SubjectChip subject={q.subject} />
                <span className={`chip ${correct ? 'bg-emerald-100 text-emerald-700' : skipped ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700'}`}>
                  {correct ? 'Correct' : skipped ? 'Skipped' : 'Wrong'}
                </span>
                {qt?.confidence && (
                  <span className={`chip text-[10px] ${qt.confidence === 'sure' ? 'bg-brand-100 text-brand-700' : qt.confidence === 'guess' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                    {qt.confidence === 'sure' ? '✓ Sure' : qt.confidence === 'unsure' ? '~ Unsure' : '? Guess'}
                  </span>
                )}
                {qt && <span className="text-[10px] text-slate-400 tabular-nums">{(qt.timeMs / 1000).toFixed(0)}s</span>}
              </div>
              <p className="font-medium text-ink">{q.stem}</p>
              <div className="mt-2 text-sm space-y-1">
                {!skipped && !correct && <p className="text-rose-600">Your answer: {LETTERS[chosen]}. {q.options[chosen]}</p>}
                <p className="text-emerald-700">Correct: {LETTERS[q.answer]}. {q.options[q.answer]}</p>
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{q.explanation}</p>
              {q.highYield && <p className="text-xs text-brand-700 font-semibold mt-2">Key: {q.highYield}</p>}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-3 mt-7">
        <button className="btn-primary" onClick={onExit}>Back to tests</button>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string | number; tone?: 'good' | 'bad' | 'warn' }) {
  const c = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : tone === 'warn' ? 'text-amber-600' : 'text-ink';
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
      <div className={`text-xl font-extrabold ${c}`}>{value}</div>
      <div className="label-faint mt-0.5">{label}</div>
    </div>
  );
}
