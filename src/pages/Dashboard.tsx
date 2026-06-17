import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUESTIONS, SUBJECTS, TOTAL_QUESTIONS, META, CARDS } from '../lib/data';
import { computeStats, getBookmarks, getMocks } from '../lib/storage';
import { Icon, Ring, ProgressBar, SubjectChip } from '../components/ui';

const qSubject: Record<string, string> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.subject]));

export default function Dashboard() {
  const nav = useNavigate();
  const stats = useMemo(() => computeStats(qSubject), []);
  const bookmarks = getBookmarks();
  const mocks = getMocks();
  const examDate = '2026-08-30';
  const daysLeft = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);

  // weakest attempted subjects (need >=3 attempts to rank)
  const weak = Object.entries(stats.bySubject)
    .filter(([, s]) => s.attempted >= 3)
    .map(([subj, s]) => ({ subj, acc: s.correct / s.attempted, attempted: s.attempted }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 4);

  return (
    <div className="space-y-7">
      {/* hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-teal-500 text-white p-7 sm:p-9 shadow-card">
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute right-24 bottom-0 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 chip bg-white/15 text-white mb-3">
            <Icon name="shield" className="w-3.5 h-3.5" /> Built from previous-year patterns
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl leading-tight">
            From MBBS to MD/MS, one pattern-perfect question at a time.
          </h1>
          <p className="text-white/80 mt-2 max-w-xl">
            {TOTAL_QUESTIONS} high-yield NEET PG questions across all 19 subjects, weighted to the real blueprint, every answer explained like a 30-year coaching head would.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="btn bg-white text-brand-700 hover:bg-brand-50 font-bold" onClick={() => nav('/mock')}>
              <Icon name="play" className="w-4 h-4" /> Start a mock test
            </button>
            <button className="btn bg-white/15 text-white hover:bg-white/25" onClick={() => nav('/practice')}>
              <Icon name="cards" className="w-4 h-4" /> Practice by subject
            </button>
          </div>
        </div>
      </section>

      {/* stat strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <Ring pct={stats.accuracy}>{Math.round(stats.accuracy * 100)}%</Ring>
          <div>
            <div className="text-2xl font-extrabold text-ink">{stats.correct}/{stats.attempted || 0}</div>
            <div className="label-faint mt-0.5">Correct so far</div>
          </div>
        </div>
        <StatBox icon="list" value={TOTAL_QUESTIONS} label="Questions in bank" onClick={() => nav('/practice')} />
        <StatBox icon="bookmark" value={bookmarks.length} label="Bookmarked" onClick={() => nav('/practice')} />
        <StatBox icon="test" value={mocks.length} label="Mocks taken" onClick={() => nav('/mock')} />
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* left: countdown + weak areas */}
        <div className="lg:col-span-2 space-y-6">
          {/* countdown */}
          <section className="card p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-bold text-ink flex items-center gap-2"><Icon name="target" className="w-5 h-5 text-brand-600" /> Your exam countdown</h2>
                <p className="text-sm text-slate-500 mt-1">NEET PG 2026 — August 30, 2026</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-extrabold text-brand-700 tabular-nums">{daysLeft}</div>
                <div className="label-faint">days to go</div>
              </div>
            </div>
          </section>

          {/* weak areas */}
          <section className="card p-6">
            <h2 className="font-bold text-ink mb-1">Where you stand</h2>
            <p className="text-sm text-slate-500 mb-4">Your lowest-accuracy subjects so far. Attack these first.</p>
            {weak.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Icon name="chart" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Answer a few questions to unlock your performance map.
                <div className="mt-4"><button className="btn-soft" onClick={() => nav('/practice')}>Start practising</button></div>
              </div>
            ) : (
              <div className="space-y-3">
                {weak.map((w) => (
                  <button key={w.subj} onClick={() => nav('/practice')} className="w-full flex items-center gap-3 group">
                    <div className="w-44 shrink-0 text-left"><SubjectChip subject={w.subj} /></div>
                    <ProgressBar pct={w.acc} className="flex-1" />
                    <span className="w-12 text-right text-sm font-bold tabular-nums text-slate-600">{Math.round(w.acc * 100)}%</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* right: blueprint snapshot + recent mocks */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-bold text-ink flex items-center gap-2 mb-1"><Icon name="chart" className="w-5 h-5 text-brand-600" /> The paper</h2>
            <p className="text-sm text-slate-500 mb-4">{META.exam.totalQuestions} Qs - {META.exam.totalMarks} marks - {META.exam.durationMinutes} min</p>
            <ul className="space-y-2 text-sm">
              <Fact k="Format" v="5 sections x 42 min (time-bound)" />
              <Fact k="Marking" v={`+${META.exam.marking.correct} / ${META.exam.marking.incorrect} / ${META.exam.marking.unattempted}`} />
              <Fact k="Image Qs" v="~18-25% of the paper" />
              <Fact k="Revision cards" v={`${CARDS.length} high-yield tables`} />
            </ul>
            <button className="btn-ghost w-full mt-4" onClick={() => nav('/pattern')}>See full blueprint <Icon name="right" className="w-4 h-4" /></button>
          </section>

          <section className="card p-6">
            <h2 className="font-bold text-ink mb-3">Recent mocks</h2>
            {mocks.length === 0 ? (
              <p className="text-sm text-slate-400">No mocks yet. <button className="text-brand-600 font-semibold" onClick={() => nav('/mock')}>Take your first.</button></p>
            ) : (
              <div className="space-y-2.5">
                {mocks.slice(0, 4).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">{m.title}</div>
                      <div className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-brand-700 tabular-nums">{m.score}/{m.maxScore}</div>
                      <div className="text-xs text-slate-400">{m.correct}/{m.attempted} correct</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label, onClick }: { icon: 'list' | 'bookmark' | 'test'; value: number; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-5 text-left hover:border-brand-300 transition">
      <div className="flex items-center gap-2 text-brand-600"><Icon name={icon} className="w-5 h-5" /></div>
      <div className="text-2xl font-extrabold text-ink mt-2">{value}</div>
      <div className="label-faint mt-0.5">{label}</div>
    </button>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className="font-semibold text-ink text-right">{v}</span>
    </li>
  );
}
