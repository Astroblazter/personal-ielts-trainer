import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  FlaskConical,
  AlertCircle,
  BookOpen,
  BookText,
  Headphones,
  PenLine,
  Mic,
  ClipboardCheck,
  TrendingUp,
  Target,
  ListChecks,
  Settings,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
}

function navItems(): NavItem[] {
  return [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, enabled: true },
    { to: '/lesson', label: t('nav.dailyLesson'), icon: CalendarCheck, enabled: true },
    { to: '/grammar', label: t('nav.grammarLab'), icon: FlaskConical, enabled: true },
    { to: '/mistakes', label: t('nav.myMistakes'), icon: AlertCircle, enabled: true },
    { to: '/vocabulary', label: t('nav.vocabulary'), icon: BookOpen, enabled: true },
    { to: '/reading', label: t('nav.reading'), icon: BookText, enabled: true },
    { to: '/listening', label: t('nav.listening'), icon: Headphones, enabled: true },
    { to: '/writing', label: t('nav.writing'), icon: PenLine, enabled: true },
    { to: '/speaking', label: t('nav.speaking'), icon: Mic, enabled: true },
    { to: '/mock', label: t('nav.mockExam'), icon: ClipboardCheck, enabled: true },
    { to: '/progress', label: t('nav.progress'), icon: TrendingUp, enabled: true },
    { to: '/diagnostic', label: t('nav.diagnostic'), icon: Target, enabled: true },
    { to: '/plan', label: t('nav.plan'), icon: ListChecks, enabled: true },
    { to: '/settings', label: t('nav.settings'), icon: Settings, enabled: true },
  ];
}

export function AppLayout() {
  const { preferences } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const items = navItems();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[rgb(var(--color-bg))]">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold">{t('appTitle')}</span>
        </div>
        <button
          className="btn-ghost btn"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] transition-transform duration-200 md:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-5 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--color-primary-soft))]">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{t('appTitle')}</p>
                <p className="truncate text-xs text-muted">{t('appSubtitle')}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-[rgb(var(--color-primary-soft))] font-medium text-primary'
                        : 'text-muted hover:bg-[rgb(var(--color-surface-2))] hover:text-[rgb(var(--color-text))]'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {!item.enabled && (
                    <span className="ml-auto rounded-full bg-[rgb(var(--color-surface-2))] px-1.5 py-0.5 text-[10px] uppercase text-muted">
                      soon
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-[rgb(var(--color-border))] px-5 py-3 text-xs text-muted">
              <p>IELTS target: {preferences.targetIeltsScore.toFixed(1)}</p>
              <p className="mt-0.5">
                {t('settings.dailyGoal')}: {preferences.dailyGoalMinutes} {t('dashboard.minutes')}
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={closeMobile}
            aria-hidden
          />
        )}

        {/* Main content */}
        <main className="min-h-screen flex-1 md:ml-64">
          <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
