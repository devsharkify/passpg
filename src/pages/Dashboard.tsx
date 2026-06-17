import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QUESTIONS, SUBJECTS, TOTAL_QUESTIONS, META, CARDS } from '../lib/data';
import { computeStats, getBookmarks, getMocks, getLastPracticeBySubject, getSRSDueCount } from '../lib/storage';
import { Icon, Ring, ProgressBar, SubjectChip } from '../components/ui';

const qSubject: Record<string, string> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.subject]));

const SUBJECT_WEIGHTS: Record<string, number> = {
  'Medicine': 23, 'Surgery': 19, 'Obstetrics & Gynaecology': 17, 'Pharmacology': 15,
  'Pathology': 15, 'Social and Preventive Medicine': 13, 'Microbiology': 11, 'Pediatrics': 11,
  'Anatomy': 9, 'Physiology': 9, 'Ophthalmology': 7, 'ENT': 7, 'Biochemistry': 7,
  'Orthopedics': 7, 'Dermatology': 6, 'Psychiatry': 6, 'Forensic Medicine': 6,
  'Anaesthesia': 5, 'Radiology': 5,
};

export default function Dashboard() {
  const nav = useNavigate();
  const stats = useMemo(() => computeStats(qSubject), []);
  const bookmarks = getBookmarks();
  const mocks = getMocks();
  const srsDue = getSRSDueCount();
  const lastPractice = getLastPracticeBySubject();
  const examDate = '2026-08-30';
  const daysLeft = Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000);

  // exam proximity phase
  const examPhase =
    daysLeft > 45 ? { label: 'Learning Phase', msg: 'Practice broadly. Drill repeats daily.', color: 'emerald' }
    : daysLeft > 21 ? { label: 'Consolidation Phase', msg: '3 mocks/week. Clear SRS queue daily.', color: 'amber' }
    : daysLeft > 7 ? { label: 'Revision Phase', msg: 'No new topics. Revision + Repeat Assault only.', color: 'orange' }
    : { label: 'Exam Eve', msg: 'Stop learning. Drill mastered content only.', color: 'rose' };

  // neglected subjects (not practiced in threshold days)
  const neglectMs = daysLeft > 30 ? 7 * 86400000 : 4 * 86400000;
  const neglected = Object.entries(lastPractice)
    .filter(([, ts]) => Date.now() - ts > neglectMs)
    .map(([s]) => s);

  // weighted danger score: (1 - accuracy) × subject_weight
  const weak = Object.entries(stats.bySubject)
    .filter(([, s]) => s.attempted >= 3)
    .map(([subj, s]) => ({
      subj,
      acc: s.correct / s.attempted,
      attempted: s.attempted,
      danger: (1 - s.correct / s.attempted) * (SUBJECT_WEIGHTS[subj] || 5),
    }))
    .sort((a, b) => b.danger - a.danger)
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

      {/* alerts row */}
      <div className="space-y-2">
        {/* exam phase banner */}
        <div className={`card p-3 flex items-center gap-3 border-l-4 border-${examPhase.color}-500 bg-${examPhase.color}-50`}>
          <span className={`text-xs font-bold uppercase text-${examPhase.color}-700`}>{examPhase.label}</span>
          <span className="text-xs text-slate-500">{examPhase.msg}</span>
        </div>

        {/* SRS queue */}
        {srsDue > 0 && (
          <Link to="/practice" className="card p-3 flex items-center gap-3 bg-violet-50 border-violet-200 hover:border-violet-400 transition">
            <Icon name="target" className="w-5 h-5 text-violet-600 shrink-0" />
            <span className="font-semibold text-violet-700 text-sm">{srsDue} questions due for spaced review</span>
            <span className="ml-auto text-xs text-violet-500 shrink-0">Practice →</span>
          </Link>
        )}

        {/* neglect alert */}
        {neglected.length > 0 && (
          <div className="card p-3 bg-rose-50 border-rose-200">
            <span className="text-xs font-bold text-rose-600">NOT PRACTICED: </span>
            <span className="text-xs text-rose-700">
              {neglected.slice(0, 4).join(', ')}{neglected.length > 4 ? ` +${neglected.length - 4} more` : ''} — over {daysLeft > 30 ? '7' : '4'} days ago
            </span>
          </div>
        )}
      </div>

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

          {/* danger-ranked weak areas */}
          <section className="card p-6">
            <h2 className="font-bold text-ink mb-1">Where you stand</h2>
            <p className="text-sm text-slate-500 mb-4">Ranked by expected marks lost (accuracy × paper weight).</p>
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
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold tabular-nums text-slate-600">{Math.round(w.acc * 100)}%</div>
                      <div className="text-[10px] text-rose-500">−{w.danger.toFixed(1)} marks</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* quick-access drills */}
          <section>
            <h2 className="font-bold text-ink mb-3">Quick drills</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/repeat-assault" className="card p-5 hover:border-amber-300 transition flex items-center gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-amber-400 text-white shrink-0">
                  <Icon name="target" className="w-6 h-6" />
                </span>
                <div>
                  <div className="font-bold text-ink">Repeat Assault</div>
                  <div className="text-sm text-slate-500">Drill guaranteed marks</div>
                </div>
              </Link>
              <Link to="/blitz" className="card p-5 hover:border-violet-300 transition flex items-center gap-4">
                <span className="grid place-items-center w-12 h-12 rounded-xl bg-violet-500 text-white shrink-0">
                  <Icon name="spark" className="w-6 h-6" />
                </span>
                <div>
                  <div className="font-bold text-ink">PSM + Pharma Blitz</div>
                  <div className="text-sm text-slate-500">20-second rapid-fire</div>
                </div>
              </Link>
            </div>
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
