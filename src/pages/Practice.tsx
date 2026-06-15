import { useState } from 'react';
import { QUESTIONS, SUBJECTS, TIERS } from '../lib/data';
import { shuffle } from '../lib/examEngine';
import { getBookmarks } from '../lib/storage';
import type { Question, Difficulty } from '../lib/types';
import PracticeRunner from '../components/PracticeRunner';
import { Icon, PageHeader, SubjectChip } from '../components/ui';

type Diff = 'all' | Difficulty;

export default function Practice() {
  const [diff, setDiff] = useState<Diff>('all');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [run, setRun] = useState<{ questions: Question[]; title: string } | null>(null);

  function build(subject: string | null, title: string) {
    const bm = new Set(getBookmarks());
    let pool = QUESTIONS.filter((q) => (subject ? q.subject === subject : true));
    if (diff !== 'all') pool = pool.filter((q) => q.difficulty === diff);
    if (bookmarkedOnly) pool = pool.filter((q) => bm.has(q.id));
    if (pool.length === 0) return;
    setRun({ questions: shuffle(pool), title });
  }

  if (run) return <PracticeRunner questions={run.questions} title={run.title} onExit={() => setRun(null)} />;

  const bmCount = getBookmarks().length;

  return (
    <div>
      <PageHeader title="Practice" subtitle="Learn with instant explanations. Every question is modelled on previous-year NEET PG patterns." />

      {/* filters */}
      <div className="card p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="label-faint">Difficulty</span>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(['all', 'easy', 'medium', 'hard'] as Diff[]).map((d) => (
              <button key={d} onClick={() => setDiff(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold capitalize transition ${
                  diff === d ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-ink'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
          <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)} className="accent-brand-600 w-4 h-4" />
          Bookmarked only ({bmCount})
        </label>
      </div>

      {/* quick starts */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <button onClick={() => build(null, 'Mixed practice')}
          className="card p-5 text-left hover:border-brand-300 transition flex items-center gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-600 text-white"><Icon name="spark" className="w-6 h-6" /></span>
          <div>
            <div className="font-bold text-ink">Mixed practice</div>
            <div className="text-sm text-slate-500">All subjects, shuffled, instant feedback</div>
          </div>
        </button>
        <button onClick={() => { setBookmarkedOnly(true); build(null, 'Bookmarked questions'); }}
          disabled={bmCount === 0}
          className="card p-5 text-left hover:border-brand-300 transition flex items-center gap-4 disabled:opacity-50">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-amber-400 text-white"><Icon name="bookmarkFill" className="w-6 h-6" /></span>
          <div>
            <div className="font-bold text-ink">Revisit bookmarks</div>
            <div className="text-sm text-slate-500">{bmCount} saved question{bmCount === 1 ? '' : 's'}</div>
          </div>
        </button>
      </div>

      {/* subjects by tier */}
      {TIERS.map((tier) => {
        const subs = SUBJECTS.filter((s) => s.tier === tier);
        if (subs.length === 0) return null;
        return (
          <div key={tier} className="mb-7">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">{tier}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subs.map((s) => (
                <button key={s.subject} onClick={() => build(s.subject, s.subject)}
                  className="card p-4 text-left hover:border-brand-300 hover:-translate-y-0.5 transition group">
                  <div className="flex items-center justify-between">
                    <SubjectChip subject={s.subject} />
                    <Icon name="right" className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-ink">{s.count}</span>
                    <span className="text-xs text-slate-400">questions</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">~{s.weight} in the real paper</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
