import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'home' as const, end: true },
  { to: '/practice', label: 'Practice', icon: 'cards' as const },
  { to: '/mock', label: 'Mocks', icon: 'test' as const },
  { to: '/prediction', label: '2026 Predictions', icon: 'spark' as const },
  { to: '/repeat-assault', label: 'Repeats', icon: 'target' as const },
  { to: '/blitz', label: 'Blitz', icon: 'spark' as const },
  { to: '/revision', label: 'Revision', icon: 'book' as const },
  { to: '/pattern', label: 'Pattern', icon: 'chart' as const },
];

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-sm">
        <Icon name="pulse" className="w-5 h-5" />
      </span>
      <span className="leading-none">
        <span className="block font-extrabold text-ink tracking-tight">Dr. Saranya Prep</span>
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-600">NEET PG Mastery</span>
      </span>
    </NavLink>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <Brand />
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto scroll-thin">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-ink hover:bg-slate-100'
                  }`
                }>
                <Icon name={n.icon} className="w-4 h-4 shrink-0" />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        Dr. Saranya Prep - built from previous-year NEET PG patterns. Study material for exam preparation; verify clinical decisions against standard texts.
      </footer>
    </div>
  );
}
