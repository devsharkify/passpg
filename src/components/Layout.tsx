import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // close menu on route change
  useState(() => { setOpen(false); });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          <Brand />

          {/* desktop nav */}
          <nav className="ml-auto hidden lg:flex items-center gap-1">
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

          {/* hamburger — mobile only */}
          <button
            onClick={() => setOpen(o => !o)}
            className="lg:hidden ml-auto flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-slate-100 transition"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-slate-700 transition-all duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* mobile dropdown */}
        {open && (
          <div className="lg:hidden border-t border-slate-100 bg-white shadow-lg">
            <nav className="mx-auto max-w-6xl px-4 py-3 grid grid-cols-2 gap-1">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }>
                  <Icon name={n.icon} className="w-4 h-4 shrink-0" />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        Dr. Saranya Prep - built from previous-year NEET PG patterns. Study material for exam preparation; verify clinical decisions against standard texts.
      </footer>
    </div>
  );
}
