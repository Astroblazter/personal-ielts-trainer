import { useMemo } from 'react';
import { TrendingUp, Target, Flame, CheckCircle2 } from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { computeStats } from '@/engine/learning';
import { getTopicById } from '@/data/grammarTopics';
import { SectionTitle, StatCard, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

export default function ProgressPage() {
  const { attempts, sessions, mistakes, loading } = useTrainerData();

  const stats = useMemo(
    () => computeStats(attempts, sessions, mistakes),
    [attempts, sessions, mistakes],
  );

  if (loading) {
    return <div className="py-12 text-center text-muted">{t('common.loading')}</div>;
  }

  const maxDayCount = Math.max(...stats.exercisesByDay.map((d) => d.count), 1);

  return (
    <div>
      <SectionTitle title={t('progress.title')} subtitle={t('progress.subtitle')} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Illustration
          name="progress"
          size="inline"
          alt="A small tree growing on a hill"
          className="shrink-0"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('progress.totalExercises')}
          value={stats.totalExercisesCompleted}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label={t('dashboard.accuracy')}
          value={`${stats.overallAccuracy}%`}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          label={t('progress.streak')}
          value={`${stats.streak} ${t('dashboard.days')}`}
          icon={<Flame className="h-5 w-5" />}
        />
        <StatCard
          label={t('progress.reviewSuccess')}
          value={`${stats.reviewSuccessRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <div className="mt-6 card p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          {t('progress.sevenDays')}
        </h3>
        <div className="flex items-end justify-between gap-2">
          {stats.exercisesByDay.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-end justify-center" style={{ height: '120px' }}>
                <div
                  className="w-full max-w-[40px] rounded-t-md bg-primary transition-all"
                  style={{
                    height: `${Math.max((day.count / maxDayCount) * 100, 4)}%`,
                    opacity: day.count === 0 ? 0.2 : 1,
                  }}
                  title={`${day.count} (${day.correct} ${t('common.correct')})`}
                />
              </div>
              <span className="text-xs text-muted">
                {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span className="text-xs font-medium">{day.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('progress.byTopic')}
          </h3>
          {stats.accuracyByTopic.length === 0 ? (
            <p className="text-sm text-muted">{t('common.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {stats.accuracyByTopic
                .sort((a, b) => a.accuracy - b.accuracy)
                .map((item) => {
                  const topic = getTopicById(item.topicId);
                  return (
                    <li key={item.topicId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate">{topic?.titleRu ?? item.topicId}</span>
                        <span className="ml-2 shrink-0 font-medium">
                          {item.accuracy}% ({item.correct}/{item.total})
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
                        <div
                          className={`h-full rounded-full ${
                            item.accuracy >= 70
                              ? 'bg-success'
                              : item.accuracy >= 40
                                ? 'bg-warning'
                                : 'bg-error'
                          }`}
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('progress.frequentErrors')}
          </h3>
          {stats.mostFrequentErrors.length === 0 ? (
            <p className="text-sm text-muted">{t('common.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {stats.mostFrequentErrors.slice(0, 8).map((e) => (
                <li key={e.category} className="flex items-center justify-between text-sm">
                  <span>{t(`errorCategory.${e.category}`)}</span>
                  <span className="font-medium">{e.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-muted">
          {t('progress.disclaimer')}
        </div>
      </div>
    </div>
  );
}
