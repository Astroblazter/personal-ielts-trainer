import { useCallback, useMemo, useState } from 'react';
import { Trash2, Check, Play } from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useAnswerRecorder } from '@/hooks/useAnswerRecorder';
import type { CheckResult } from '@/engine/checker';
import { getExerciseById } from '@/data/exercises';
import { getTopicById } from '@/data/grammarTopics';
import type { MistakeEntry, Exercise } from '@/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { SectionTitle, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

type Filter = 'active' | 'understood' | 'archived' | 'all';

const DAY_MS = 86_400_000;
// A mistake marked as understood is only re-checked after this many days.
const UNDERSTOOD_REVIEW_DAYS = 30;

export default function MyMistakes() {
  const { mistakes, setMistakeStatus, removeMistake, recordAttempt, upsertMistake, refresh } = useTrainerData();
  const recordAnswer = useAnswerRecorder('mistake_retry', recordAttempt, upsertMistake, refresh);
  const [filter, setFilter] = useState<Filter>('active');
  const [practiceQueue, setPracticeQueue] = useState<Exercise[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceStartTime, setPracticeStartTime] = useState(0);

  const filtered = useMemo(() => {
    const sorted = [...mistakes].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === 'all') return sorted;
    return sorted.filter((m) => m.status === filter);
  }, [mistakes, filter]);

  const dueForReview = useMemo(
    () => mistakes.filter((m) => m.status !== 'archived' && m.nextReviewAt <= Date.now()),
    [mistakes],
  );

  const markUnderstood = useCallback(
    (m: MistakeEntry) =>
      upsertMistake({
        ...m,
        status: 'understood',
        nextReviewAt: Date.now() + UNDERSTOOD_REVIEW_DAYS * DAY_MS,
        reviewIntervalDays: UNDERSTOOD_REVIEW_DAYS,
      }),
    [upsertMistake],
  );

  const startPractice = useCallback(() => {
    const exercises = dueForReview
      .map((m) => getExerciseById(m.exerciseId))
      .filter((e): e is Exercise => e !== undefined);
    if (exercises.length === 0) return;
    setPracticeQueue(exercises);
    setPracticeIndex(0);
    setPracticeStartTime(Date.now());
  }, [dueForReview]);

  const handlePracticeAnswered = useCallback(
    async (result: CheckResult, addToMistakes: boolean, flagged: boolean) => {
      const exercise = practiceQueue[practiceIndex];
      if (!exercise) return;
      await recordAnswer(exercise, result, addToMistakes, flagged, practiceStartTime);
    },
    [practiceQueue, practiceIndex, practiceStartTime, recordAnswer],
  );

  const advancePractice = useCallback(() => {
    setPracticeIndex((i) => i + 1);
    setPracticeStartTime(Date.now());
  }, []);

  if (practiceQueue.length > 0) {
    const current = practiceQueue[practiceIndex];
    if (current) {
      return (
        <div>
          <SectionTitle
            title={t('mistakes.practiceSet')}
            subtitle={`${practiceIndex + 1} / ${practiceQueue.length}`}
          />
          <div className="card p-6">
            <ExercisePlayer
              key={current.id}
              exercise={current}
              source="mistake_retry"
              onAnswered={handlePracticeAnswered}
              onAdvance={advancePractice}
              showAdvance
              advanceLabel={
                practiceIndex + 1 >= practiceQueue.length
                  ? t('common.complete')
                  : t('common.next')
              }
            />
            {practiceIndex + 1 >= practiceQueue.length && (
              <div className="mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setPracticeQueue([]);
                    setPracticeIndex(0);
                  }}
                >
                  {t('mistakes.title')}
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    setPracticeQueue([]);
    setPracticeIndex(0);
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'active', label: t('mistakes.active') },
    { key: 'understood', label: t('mistakes.understood') },
    { key: 'archived', label: t('mistakes.archived') },
    { key: 'all', label: t('common.all') },
  ];

  return (
    <div>
      <SectionTitle
        title={t('mistakes.title')}
        subtitle={t('mistakes.subtitle')}
        action={
          dueForReview.length > 0 && (
            <button className="btn btn-primary" onClick={startPractice}>
              <Play className="h-4 w-4" />
              {t('mistakes.practiceSet')} ({dueForReview.length})
            </button>
          )
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Illustration
          name="mistakes"
          size="inline"
          alt="Fixing mistakes in a notebook"
          className="shrink-0"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={undefined}
          title={t('mistakes.noMistakes')}
        >
          <Illustration
            name="emptyMistakes"
            size="inline"
            alt="No mistakes — notebook closed"
            className="mt-2"
          />
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {filtered.map((m: MistakeEntry) => {
            const exercise = getExerciseById(m.exerciseId);
            const topic = getTopicById(m.topicId);
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-neutral">
                        {t(`errorCategory.${m.category}`)}
                      </span>
                      {topic && (
                        <span className="badge badge-primary">{topic.titleRu}</span>
                      )}
                      <span className="text-xs text-muted">
                        {t('mistakes.attempts')}: {m.attempts}
                      </span>
                    </div>
                    {exercise && (
                      <p className="mt-2 text-sm font-medium">{exercise.questionEn}</p>
                    )}
                    <p className="mt-1 text-sm text-muted">
                      <span className="text-error">{m.userAnswer}</span>
                      {' → '}
                      <span className="text-success">{m.suggestedCorrection}</span>
                    </p>
                    {(m.explanationRu || exercise?.explanationRu) && (
                      <p className="mt-1 text-xs text-muted">{m.explanationRu || exercise?.explanationRu}</p>
                    )}
                    {m.status !== 'archived' && (
                      <p className="mt-1 text-xs text-muted">
                        {t('mistakes.nextReview')}:{' '}
                        {m.nextReviewAt <= Date.now()
                          ? t('mistakes.dueNow')
                          : new Date(m.nextReviewAt).toLocaleDateString()}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {t('mistakes.dateOfMistake')}: {new Date(m.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {m.status !== 'understood' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => markUnderstood(m)}
                    >
                      <Check className="h-4 w-4" />
                      {t('mistakes.markUnderstood')}
                    </button>
                  )}
                  {m.status !== 'archived' && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => setMistakeStatus(m.id, 'archived')}
                    >
                      {t('mistakes.archived')}
                    </button>
                  )}
                  <button
                    className="btn btn-ghost text-error"
                    onClick={() => removeMistake(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('mistakes.remove')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
