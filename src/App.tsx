import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { AppLayout } from '@/components/AppLayout';
import { Loading } from '@/components/Loading';
import { initDb } from '@/data/db';
import { t } from '@/i18n';
import Dashboard from '@/pages/Dashboard';
import DailyLesson from '@/pages/DailyLesson';
import GrammarLab from '@/pages/GrammarLab';
import MyMistakes from '@/pages/MyMistakes';
import Vocabulary from '@/pages/Vocabulary';
import ProgressPage from '@/pages/Progress';
import Settings from '@/pages/Settings';
import Diagnostic from '@/pages/Diagnostic';
import Reading from '@/pages/Reading';
import Listening from '@/pages/Listening';
import Writing from '@/pages/Writing';
import Speaking from '@/pages/Speaking';
import MockExam from '@/pages/MockExam';

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDb()
      .then(() => setDbReady(true))
      .catch((e) => {
        console.error('DB init failed', e);
        setDbReady(true);
      });
  }, []);

  return (
    <AppProvider>
      {!dbReady ? (
        <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--color-bg))]">
          <Loading label={t('common.loadingData')} />
        </div>
      ) : (
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lesson" element={<DailyLesson />} />
              <Route path="/grammar" element={<GrammarLab />} />
              <Route path="/mistakes" element={<MyMistakes />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/reading" element={<Reading />} />
              <Route path="/listening" element={<Listening />} />
              <Route path="/writing" element={<Writing />} />
              <Route path="/speaking" element={<Speaking />} />
              <Route path="/mock" element={<MockExam />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </AppProvider>
  );
}
