import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
  GraduationCap,
  Target,
  Clock,
  Flame,
  TrendingUp,
  AlertCircle,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useApp } from '@/context/AppContext';
import { computeStats } from '@/engine/learning';
import { GRAMMAR_TOPICS, getTopicById } from '@/data/grammarTopics';
import { t } from '@/i18n';
import { SectionTitle, StatCard, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';

export default function Dashboard() {
  const { preferences } = useApp();
  const { attempts, mistakes, sessions, profile, loading } = useTrainerData();

  const stats = useMemo(
    () => computeStats(attempts, sessions, mistakes),
    [attempts, sessions, mistakes],
  );

  if (loading) {
    return <div className="py-12 text-center text-muted">{t('common.loading')}</div>;
  }

  const notAssessed = profile.currentLevel === 'not_assessed';
  const hasActivity = attempts.length > 0 || sessions.length > 0;
  const frequentErrors = stats.mostFrequentErrors.slice(0, 3);

  return (
    <div>
      <div className="mb-6 grid items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Personal IELTS Trainer</h1>
          <p className="mt-1 text-sm text-muted">Small steps, big progress!</p>
        </div>
        <Illustration
          name="hero"
          size="page"
          alt="English village with traveler ready to explore"
          className="hidden sm:block"
        />
      </div>

      {notAssessed && !hasActivity && (
        <div className="card mb-6 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--color-primary-soft))]">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{t('dashboard.welcomeTitle')}</h2>
              <p className="mt-1 text-sm text-muted">{t('dashboard.welcomeText')}</p>
              <Link to="/diagnostic" className="btn btn-primary mt-4">
                {t('dashboard.startDiagnostic')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.level')}
          value={
            notAssessed ? t('dashboard.notAssessed') : profile.currentLevel
          }
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label={t('dashboard.targetScore')}
          value={preferences.targetIeltsScore.toFixed(1)}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label={t('dashboard.dailyGoal')}
          value={`${preferences.dailyGoalMinutes} ${t('dashboard.minutes')}`}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label={t('dashboard.streak')}
          value={`${stats.streak} ${t('dashboard.days')}`}
          icon={<Flame className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('dashboard.completedExercises')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-semibold">{stats.totalExercisesCompleted}</p>
              <p className="mt-1 text-xs text-muted">{t('dashboard.completedExercises')}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">{stats.overallAccuracy}%</p>
              <p className="mt-1 text-xs text-muted">{t('dashboard.accuracy')}</p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-2 text-sm font-medium">{t('dashboard.topicsDue')}</h4>
            {stats.topicsDueForReview.length === 0 ? (
              <p className="text-sm text-muted">{t('common.empty')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topicsDueForReview.slice(0, 6).map((td) => {
                  const topic = getTopicById(td.topicId);
                  return (
                    <span
                      key={td.topicId}
                      className="badge badge-warning"
                    >
                      {topic?.titleRu ?? td.topicId} ({td.count})
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('dashboard.frequentErrors')}
          </h3>
          {frequentErrors.length === 0 ? (
            <p className="text-sm text-muted">{t('common.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {frequentErrors.map((e) => (
                <li key={e.category} className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-error" />
                  <span className="text-sm">{t(`errorCategory.${e.category}`)}</span>
                  <span className="ml-auto text-sm font-medium">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link to="/lesson" className="card group flex items-center gap-4 p-5 transition-colors hover:border-[rgb(var(--color-primary))]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgb(var(--color-primary-soft))]">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{t('nav.dailyLesson')}</p>
            <p className="text-sm text-muted">{t('dashboard.continueLearning')}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1" />
        </Link>
        <Link to="/progress" className="card group flex items-center gap-4 p-5 transition-colors hover:border-[rgb(var(--color-primary))]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgb(var(--color-primary-soft))]">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{t('nav.progress')}</p>
            <p className="text-sm text-muted">{t('progress.subtitle')}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {!hasActivity && !notAssessed && (
        <div className="mt-6">
          <EmptyState title={t('dashboard.noActivity')} />
        </div>
      )}

      {hasActivity && (
        <div className="mt-6 card p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('dashboard.recommendation')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.topicsDueForReview.length > 0 ? (
              stats.topicsDueForReview.slice(0, 4).map((td) => {
                const topic = getTopicById(td.topicId);
                return (
                  <Link
                    key={td.topicId}
                    to="/grammar"
                    className="badge badge-primary"
                  >
                    {topic?.titleRu ?? td.topicId}
                  </Link>
                );
              })
            ) : (
              <Link to="/lesson" className="btn btn-secondary">
                {t('nav.dailyLesson')}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-muted">
        {t('progress.disclaimer')}
      </div>
    </div>
  );
}
