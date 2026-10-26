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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row
