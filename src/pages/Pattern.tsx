import { META, SUBJECTS } from '../lib/data';
import { Icon, PageHeader, SubjectChip } from '../components/ui';

export default function Pattern() {
  const maxW = Math.max(...META.weightage.map((w) => w.questions));
  const weightBySubject = new Map(META.weightage.map((w) => [w.subject, w]));

  return (
    <div className="space-y-7">
      <PageHeader title="Exam Pattern & Strategy"
        subtitle="The blueprint, the marking, and how a 30-year coaching head tells a fresh MBBS grad to attack it." />

      {/* overview cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewStat value={String(META.exam.totalQuestions)} label="Questions" />
        <OverviewStat value={String(META.exam.totalMarks)} label="Total marks" />
        <OverviewStat value={`${META.exam.durationMinutes} min`} label="Duration" />
        <OverviewStat value={`+${META.exam.marking.correct} / ${META.exam.marking.incorrect}`} label="Marking" />
      </section>

      {/* format facts */}
      <section className="card p-6">
        <h2 className="font-bold text-ink mb-4 flex items-center gap-2"><Icon name="clock" className="w-5 h-5 text-brand-600" /> How the paper runs</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <FactBlock title="Time-bound sections" body={META.exam.sectional} />
          <FactBlock title="Image-based questions" body={META.exam.imageQuestions} />
          <FactBlock title="Mode" body={META.exam.mode} />
          <FactBlock title="Purpose" body={META.exam.purpose} />
        </div>
        <div className="mt-5">
          <div className="label-faint mb-2">Recent changes you must know</div>
          <ul className="space-y-1.5">
            {META.exam.changes.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-600"><Icon name="spark" className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* weightage chart */}
      <section className="card p-6">
        <h2 className="font-bold text-ink mb-1 flex items-center gap-2"><Icon name="chart" className="w-5 h-5 text-brand-600" /> Subject weightage</h2>
        <p className="text-sm text-slate-500 mb-5">{META.weightageNote}</p>
        <div className="space-y-2">
          {META.weightage.map((w) => {
            const have = SUBJECTS.find((s) => s.subject === w.subject)?.count ?? 0;
            return (
              <div key={w.subject} className="flex items-center gap-3">
                <div className="w-48 shrink-0"><SubjectChip subject={w.subject} /></div>
                <div className="flex-1 h-7 rounded-lg bg-slate-100 relative overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-end pr-2"
                    style={{ width: `${(w.questions / maxW) * 100}%` }}>
                    <span className="text-xs font-bold text-white">{w.questions}</span>
                  </div>
                </div>
                <span className="w-24 text-right text-xs text-slate-400 shrink-0">{have} in bank</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* strategy */}
      <section className="card p-6">
        <h2 className="font-bold text-ink mb-4 flex items-center gap-2"><Icon name="target" className="w-5 h-5 text-brand-600" /> The 30-year coach's game plan</h2>
        <ol className="space-y-3">
          {META.strategy.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-brand-50 text-brand-700 font-bold text-sm">{i + 1}</span>
              <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{s}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* repeated themes */}
      <section className="card p-6">
        <h2 className="font-bold text-ink mb-1 flex items-center gap-2"><Icon name="spark" className="w-5 h-5 text-brand-600" /> The most-repeated themes</h2>
        <p className="text-sm text-slate-500 mb-4">If you know these cold, you have already banked a chunk of the paper.</p>
        <div className="flex flex-wrap gap-2">
          {META.repeatedThemes.map((t, i) => (
            <span key={i} className="chip bg-slate-100 text-slate-700">{t}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="text-2xl sm:text-3xl font-extrabold text-brand-700">{value}</div>
      <div className="label-faint mt-1">{label}</div>
    </div>
  );
}
function FactBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      <div className="font-semibold text-ink mb-1">{title}</div>
      <p className="text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
