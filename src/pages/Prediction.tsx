import { useState } from 'react';
import { QUESTIONS, SUBJECTS } from '../lib/data';
import { shuffle } from '../lib/examEngine';
import type { Question } from '../lib/types';
import PracticeRunner from '../components/PracticeRunner';
import { Icon, PageHeader, SubjectChip } from '../components/ui';

const PRED_QUESTIONS = QUESTIONS.filter((q) => q.source === 'pred-2026');

const CLUSTERS = [
  { key: 'nobel', label: 'Nobel Prize Topics', desc: '2021–2024 Nobel lag (3yr rule) — miRNA, mRNA pseudouridine, TRP channels', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { key: 'drugs', label: 'New Drugs', desc: 'Casgevy, nirsevimab, cefiderocol, CAR-T, andexanet alfa', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { key: 'guidelines', label: 'Guideline Updates', desc: 'ADA 2024 SGLT2i, BPaL XDR-TB, ACC/AHA quadruple HF, HPV NIP India', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'india', label: 'India Events', desc: 'Nipah Kerala 2024, HMPV, NFHS-5 stats, national program numerics', color: 'bg-amber-50 border-amber-200 text-amber-700' },
];

const CLUSTER_SUBJECTS: Record<string, string[]> = {
  nobel: ['Physiology', 'Biochemistry', 'Pharmacology'],
  drugs: ['Pharmacology'],
  guidelines: ['Medicine', 'Social and Preventive Medicine'],
  india: ['Microbiology', 'Social and Preventive Medicine'],
};

export default function Prediction() {
  const [run, setRun] = useState<{ questions: Question[]; title: string } | null>(null);

  function drillAll() {
    setRun({ questions: shuffle(PRED_QUESTIONS), title: '2026 Predictions — All 446' });
  }

  function drillSubject(subject: string) {
    const pool = PRED_QUESTIONS.filter((q) => q.subject === subject);
    if (pool.length) setRun({ questions: shuffle(pool), title: `2026 Predictions — ${subject}` });
  }

  function drillCluster(key: string) {
    const subjects = CLUSTER_SUBJECTS[key];
    const pool = PRED_QUESTIONS.filter((q) => subjects.includes(q.subject));
    if (pool.length) setRun({ questions: shuffle(pool), title: `2026 Predictions — ${CLUSTERS.find(c => c.key === key)?.label}` });
  }

  if (run) return <PracticeRunner questions={run.questions} title={run.title} onExit={() => setRun(null)} />;

  const bySubject: Record<string, number> = {};
  for (const q of PRED_QUESTIONS) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;

  return (
    <div>
      <PageHeader
        title="2026 Predictions"
        subtitle={`${PRED_QUESTIONS.length} AI-generated questions on topics most likely in NEET PG 2026 — Nobel lag, new drugs, updated guidelines, India events.`}
      />

      {/* confidence banner */}
      <div className="rounded-2xl bg-violet-600 text-white p-5 mb-8 flex items-start gap-4">
        <Icon name="spark" className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold mb-1">How this works</div>
          <p className="text-sm text-violet-100 leading-relaxed">
            NEET PG follows predictable patterns: Nobel Prize topics appear 2–3 years later, new drugs 1–2 years after approval, guideline changes within 1 year. These 446 questions target exactly those windows for the 2026 exam.
          </p>
        </div>
      </div>

      {/* drill all */}
      <button onClick={drillAll}
        className="w-full card p-5 text-left hover:border-brand-300 transition flex items-center gap-4 mb-8">
        <span className="grid place-items-center w-12 h-12 rounded-xl bg-violet-600 text-white shrink-0">
          <Icon name="spark" className="w-6 h-6" />
        </span>
        <div className="flex-1">
          <div className="font-bold text-ink">Drill all 446 predictions</div>
          <div className="text-sm text-slate-500">Shuffled across all subjects — best for full coverage</div>
        </div>
        <Icon name="right" className="w-5 h-5 text-slate-300" />
      </button>

      {/* clusters */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">By Topic Cluster</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {CLUSTERS.map((c) => {
          const count = (CLUSTER_SUBJECTS[c.key] || []).reduce((n, s) => n + (bySubject[s] || 0), 0);
          return (
            <button key={c.key} onClick={() => drillCluster(c.key)}
              className={`rounded-2xl border-2 p-4 text-left hover:opacity-80 transition ${c.color}`}>
              <div className="font-bold mb-1">{c.label}</div>
              <div className="text-xs mb-2 opacity-75">{c.desc}</div>
              <div className="text-xs font-semibold">~{count} questions</div>
            </button>
          );
        })}
      </div>

      {/* by subject */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">By Subject</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUBJECTS.filter((s) => bySubject[s.subject]).map((s) => (
          <button key={s.subject} onClick={() => drillSubject(s.subject)}
            className="card p-4 text-left hover:border-violet-300 hover:-translate-y-0.5 transition group">
            <div className="flex items-center justify-between">
              <SubjectChip subject={s.subject} />
              <Icon name="right" className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition" />
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-ink">{bySubject[s.subject]}</span>
              <span className="text-xs text-slate-400">predicted questions</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
