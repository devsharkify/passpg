import { useMemo, useState } from 'react';
import { CARDS } from '../lib/data';
import type { Card } from '../lib/types';
import { Icon, PageHeader, SubjectChip } from '../components/ui';

export default function Revision() {
  const [subject, setSubject] = useState<string>('All');
  const [query, setQuery] = useState('');

  const subjects = useMemo(() => ['All', ...Array.from(new Set(CARDS.map((c) => c.subject)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CARDS.filter((c) => {
      if (subject !== 'All' && c.subject !== subject) return false;
      if (!q) return true;
      const hay = (c.title + ' ' + c.points.join(' ') + ' ' + c.rows.flat().join(' ')).toLowerCase();
      return hay.includes(q);
    });
  }, [subject, query]);

  return (
    <div>
      <PageHeader title="Rapid Revision" subtitle="The dense, repeated-every-year tables and one-liners. Skim these the night before." />

      <div className="card p-4 mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Icon name="list" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tables and one-liners..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scroll-thin pb-1">
          {subjects.map((s) => (
            <button key={s} onClick={() => setSubject(s)}
              className={`chip whitespace-nowrap transition ${subject === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No cards match your search.</div>
      ) : (
        <div className="columns-1 lg:columns-2 gap-5 [column-fill:_balance]">
          {filtered.map((c) => <RevCard key={c.id} card={c} />)}
        </div>
      )}
    </div>
  );
}

function RevCard({ card }: { card: Card }) {
  return (
    <div className="card p-5 mb-5 break-inside-avoid animate-fadeUp">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-ink leading-snug">{card.title}</h3>
        <SubjectChip subject={card.subject} />
      </div>
      {card.kind === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                {card.headers.map((h, i) => <th key={i} className="px-3 py-2 font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {card.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-3 py-2 align-top ${j === 0 ? 'font-semibold text-ink' : 'text-slate-600'}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {card.points.map((p, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
