import { useState } from 'react';
import { SUBJECTS } from '../lib/data';
import { buildGrandTest, buildQuickTest, buildSubjectTest, planSections } from '../lib/examEngine';
import { getMocks } from '../lib/storage';
import type { Question } from '../lib/types';
import MockRunner from '../components/MockRunner';
import { Icon, PageHeader, SubjectChip } from '../components/ui';

interface RunCfg { questions: Question[]; title: string; durationSec: number; sectional: boolean }

export default function Mock() {
  const [run, setRun] = useState<RunCfg | null>(null);
  const [pickSubject, setPickSubject] = useState(false);
  const mocks = getMocks();

  function startGrand() {
    const qs = buildGrandTest();
    const plan = planSections(qs.length);
    setRun({ questions: qs, title: `Grand Test - ${qs.length} Qs`, durationSec: plan.sectionSeconds * plan.sectionCount, sectional: true });
  }
  function startQuick() {
    const qs = buildQuickTest(25);
    setRun({ questions: qs, title: 'Quick Test - 25 Qs', durationSec: 30 * 60, sectional: false });
  }
  function startSubject(subject: string) {
    const all = buildSubjectTest(subject);
    const qs = all.slice(0, Math.min(all.length, 30));
    setRun({ questions: qs, title: `${subject} Test`, durationSec: qs.length * 60, sectional: false });
  }

  if (run) return <MockRunner {...run} onExit={() => { setRun(null); setPickSubject(false); }} />;

  return (
    <div>
      <PageHeader title="Mock Tests" subtitle="Exam-faithful timing with negative marking. Train under pressure before the real day." />

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        {/* Grand test */}
        <div className="card p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-brand-50" />
          <div className="relative">
            <div className="chip bg-brand-100 text-brand-700 mb-3"><Icon name="shield" className="w-3.5 h-3.5" /> Most exam-like</div>
            <h2 className="text-xl font-extrabold text-ink">Grand Test (full-length)</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              A blueprint-weighted paper of ~200 questions in 5 time-bound sections of 42 minutes each, exactly like NEET PG 2024+. No going back once a section closes.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 text-xs">
              <span className="chip bg-slate-100 text-slate-600">5 sections x 42 min</span>
              <span className="chip bg-slate-100 text-slate-600">Blueprint-weighted</span>
              <span className="chip bg-slate-100 text-slate-600">+4 / -1 marking</span>
            </div>
            <button className="btn-primary mt-5" onClick={startGrand}><Icon name="play" className="w-4 h-4" /> Begin grand test</button>
          </div>
        </div>

        {/* Quick test */}
        <div className="card p-6 flex flex-col">
          <div className="chip bg-amber-100 text-amber-700 mb-3 w-max"><Icon name="clock" className="w-3.5 h-3.5" /> 30 min</div>
          <h2 className="text-xl font-extrabold text-ink">Quick Test</h2>
          <p className="text-sm text-slate-500 mt-1">25 mixed questions, single timer. Perfect for a daily warm-up.</p>
          <button className="btn-ghost mt-auto" onClick={startQuick}>Start quick test <Icon name="right" className="w-4 h-4" /></button>
        </div>
      </div>

      {/* subject-wise */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink">Subject-wise test</h2>
            <p className="text-sm text-slate-500">Timed drill on a single subject (up to 30 Qs, 1 min each).</p>
          </div>
          <button className="btn-soft" onClick={() => setPickSubject((v) => !v)}>
            {pickSubject ? 'Hide' : 'Choose subject'} <Icon name={pickSubject ? 'left' : 'right'} className="w-4 h-4" />
          </button>
        </div>
        {pickSubject && (
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4 animate-fadeUp">
            {SUBJECTS.map((s) => (
              <button key={s.subject} onClick={() => startSubject(s.subject)}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/40 transition text-left">
                <SubjectChip subject={s.subject} />
                <span className="text-xs text-slate-400">{Math.min(s.count, 30)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* history */}
      <h2 className="font-bold text-ink mb-3">Your test history</h2>
      {mocks.length === 0 ? (
        <div className="card p-8 text-center text-slate-400">
          <Icon name="test" className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No tests yet. Your scores and trends will appear here.
        </div>
      ) : (
        <div className="space-y-2.5">
          {mocks.map((m) => {
            const acc = m.attempted ? Math.round((m.correct / m.attempted) * 100) : 0;
            return (
              <div key={m.id} className="card p-4 flex items-center gap-4">
                <div className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-700 font-extrabold tabular-nums text-sm">
                  {acc}%
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-ink truncate">{m.title}</div>
                  <div className="text-xs text-slate-400">{new Date(m.date).toLocaleString()} - {m.attempted}/{m.total} attempted</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold text-brand-700 tabular-nums">{m.score}<span className="text-slate-300 text-sm">/{m.maxScore}</span></div>
                  <div className="text-xs text-emerald-600">{m.correct} right - <span className="text-rose-500">{m.wrong} wrong</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
