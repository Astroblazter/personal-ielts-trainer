import { useCallback, useRef, useState } from 'react';
import { Download, Upload, Sun, Moon, Monitor } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { exportBackup, importBackup, validateBackup, type BackupData, type ImportMode } from '@/data/db';
import { SectionTitle } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

export default function Settings() {
  const { preferences, setPreferences } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importErr, setImportErr] = useState(false);

  const handleExport = useCallback(async () => {
    const data = await exportBackup();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-trainer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImportFile = useCallback(
    async (file: File, mode: ImportMode) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!validateBackup(parsed)) {
          setImportErr(true);
          setImportMsg(t('settings.importError'));
          return;
        }
        const confirmMsg = mode === 'overwrite' ? t('settings.confirmOverwrite') : t('settings.confirmMerge');
        if (!window.confirm(confirmMsg)) return;
        await importBackup(parsed as BackupData, mode);
        setImportErr(false);
        setImportMsg(t('settings.importSuccess'));
      } catch {
        setImportErr(true);
        setImportMsg(t('settings.importError'));
      }
    },
    [],
  );

  const themes = [
    { key: 'light' as const, label: t('settings.light'), icon: Sun },
    { key: 'dark' as const, label: t('settings.dark'), icon: Moon },
    { key: 'system' as const, label: t('settings.system'), icon: Monitor },
  ];

  return (
    <div>
      <SectionTitle title={t('settings.title')} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Illustration
          name="settings"
          size="inline"
          alt="A calm desk with tea and a notebook"
          className="shrink-0"
        />
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('settings.appearance')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">{t('settings.theme')}</label>
              <div className="flex gap-2">
                {themes.map((th) => (
                  <button
                    key={th.key}
                    onClick={() => setPreferences({ theme: th.key })}
                    className={`btn ${preferences.theme === th.key ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <th.icon className="h-4 w-4" />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">{t('settings.language')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreferences({ interfaceLanguage: 'ru' })}
                  className={`btn ${preferences.interfaceLanguage === 'ru' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {t('settings.russian')}
                </button>
                <button
                  onClick={() => setPreferences({ interfaceLanguage: 'en' })}
                  className={`btn ${preferences.interfaceLanguage === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {t('settings.english')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Learning */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('settings.learning')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('settings.dailyGoal')}
              </label>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={preferences.dailyGoalMinutes}
                onChange={(e) =>
                  setPreferences({ dailyGoalMinutes: Number(e.target.value) })
                }
                className="w-full accent-[rgb(var(--color-primary))]"
              />
              <p className="mt-1 text-sm text-muted">
                {preferences.dailyGoalMinutes} {t('dashboard.minutes')}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t('settings.targetScore')}
              </label>
              <input
                type="range"
                min={4.5}
                max={9}
                step={0.5}
                value={preferences.targetIeltsScore}
                onChange={(e) =>
                  setPreferences({ targetIeltsScore: Number(e.target.value) })
                }
                className="w-full accent-[rgb(var(--color-primary))]"
              />
              <p className="mt-1 text-sm text-muted">
                {preferences.targetIeltsScore.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('settings.data')}
          </h2>
          <p className="mb-4 text-sm text-muted">{t('settings.dataStoredLocally')}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download className="h-4 w-4" />
              {t('settings.export')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file, 'merge');
                e.target.value = '';
              }}
            />
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {t('settings.importMerge')}
            </button>
          </div>
          {importMsg && (
            <p className={`mt-3 text-sm ${importErr ? 'text-error' : 'text-success'}`}>
              {importMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
