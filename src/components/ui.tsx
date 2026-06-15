import type { ReactNode } from 'react';
import { subjectColor } from '../lib/data';
import type { Difficulty } from '../lib/types';

type IconName =
  | 'home' | 'cards' | 'test' | 'book' | 'chart' | 'bookmark' | 'bookmarkFill'
  | 'check' | 'x' | 'clock' | 'flag' | 'left' | 'right' | 'play' | 'target'
  | 'spark' | 'shield' | 'reset' | 'list' | 'pulse';

const PATHS: Record<IconName, ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  cards: <><rect x="3" y="5" width="14" height="11" rx="2" /><path d="M7 19h12a2 2 0 0 0 2-2V9" /></>,
  test: <><path d="M9 11l3 3 8-8" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  book: <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM18 3v18" />,
  chart: <path d="M4 20V6m6 14V4m6 16v-8m4 8H4" />,
  bookmark: <path d="M6 4h12v16l-6-4-6 4z" />,
  bookmarkFill: <path d="M6 4h12v16l-6-4-6 4z" fill="currentColor" stroke="none" />,
  check: <path d="M5 12l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flag: <path d="M5 21V4h11l-1.5 3.5L16 11H5" />,
  left: <path d="M14 6l-6 6 6 6" />,
  right: <path d="M10 6l6 6-6 6" />,
  play: <path d="M7 5l11 7-11 7z" fill="currentColor" stroke="none" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  spark: <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />,
  shield: <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />,
  reset: <path d="M4 4v6h6M20 20v-6h-6M5 14a8 8 0 0 0 14 1M19 10A8 8 0 0 0 5 9" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
};

export function Icon({ name, className = 'w-5 h-5' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {PATHS[name]}
    </svg>
  );
}

export function SubjectChip({ subject, className = '' }: { subject: string; className?: string }) {
  return <span className={`chip ${subjectColor(subject)} ${className}`}>{subject}</span>;
}

const DIFF: Record<Difficulty, { label: string; cls: string }> = {
  easy: { label: 'Easy', cls: 'bg-emerald-100 text-emerald-700' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700' },
  hard: { label: 'Hard', cls: 'bg-rose-100 text-rose-700' },
};
export function DifficultyBadge({ d }: { d: Difficulty }) {
  const x = DIFF[d];
  return <span className={`chip ${x.cls}`}>{x.label}</span>;
}

export function Ring({ pct, size = 64, stroke = 7, children }: { pct: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#0d9488" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <span className="absolute text-sm font-bold text-ink">{children}</span>
    </div>
  );
}

export function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div className={`h-2 rounded-full bg-slate-200 overflow-hidden ${className}`}>
      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, transition: 'width .4s ease' }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1 text-sm sm:text-base">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
