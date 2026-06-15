import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './ui';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'home' as const, end: true },
  { to: '/practice', label: 'Practice', icon: 'cards' as const },
  { to: '/mock', label: 'Mock Tests', icon: 'test' as const },
  { to: '/revision', label: 'Rapid Revision', icon: 'book' as const },
  { to: '/pattern', label: 'Exam Pattern', icon: 'chart' as const },
];

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-600 text-white shadow-sm">
        <Icon name="pulse" className="w-5 h-5" />
      </span>
      <span className="leading-none">
        <span className="block font-extrabold text-ink tracking-tight">PassPG</span>
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
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-ink hover:bg-slate-100'
                  }`
                }>
                <Icon name={n.icon} className="w-[18px] h-[18px]" />
                <span className="hidden sm:inline">{n.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        PassPG - built from previous-year NEET PG patterns. Study material for exam preparation; verify clinical decisions against standard texts.
      </footer>
    </div>
  );
}
