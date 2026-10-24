import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Preferences } from '@/types';
import { getPreferences, savePreferences } from '@/data/db';
import { getLang, setLang, type Lang } from '@/i18n';

interface AppContextValue {
  preferences: Preferences;
  setPreferences: (p: Partial<Preferences>) => Promise<void>;
  lang: Lang;
  effectiveTheme: 'light' | 'dark';
  ready: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [preferences, setPrefs] = useState<Preferences | null>(null);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    let active = true;
    getPreferences().then((p) => {
      if (!active) return;
      setPrefs(p);
      setLang(p.interfaceLanguage);
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => {
      active = false;
      mq.removeEventListener('change', handler);
    };
  }, []);

  const setPreferences = useCallback(async (p: Partial<Preferences>) => {
    const base = preferences ?? ({} as Preferences);
    const next = { ...base, ...p } as Preferences;
    await savePreferences(next);
    setPrefs(next);
    setLang(next.interfaceLanguage);
  }, [preferences]);

  const effectiveTheme: 'light' | 'dark' =
    preferences?.theme === 'dark' || (preferences?.theme === 'system' && systemDark)
      ? 'dark'
      : 'light';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
    document.documentElement.lang = preferences?.interfaceLanguage ?? 'ru';
  }, [effectiveTheme, preferences?.interfaceLanguage]);

  const ready = preferences !== null;
  const value = useMemo<AppContextValue>(
    () => ({
      preferences: preferences ?? {
        theme: 'system',
        interfaceLanguage: 'ru',
        dailyGoalMinutes: 20,
        targetIeltsScore: 6.0,
      },
      setPreferences,
      lang: getLang(),
      effectiveTheme,
      ready,
    }),
    [preferences, setPreferences, effectiveTheme, ready],
  );

  // keep lang in sync when preferences load
  useEffect(() => {
    if (preferences) setLang(preferences.interfaceLanguage);
  }, [preferences]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
