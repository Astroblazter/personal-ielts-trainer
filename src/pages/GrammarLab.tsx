import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, FlaskConical } from 'lucide-react';
import { GRAMMAR_TOPICS } from '@/data/grammarTopics';
import { getExercisesByTopic } from '@/data/exercises';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useAnswerRecorder } from '@/hooks/useAnswerRecorder';
import type { CheckResult } from '@/engine/checker';
import type { Exercise } from '@/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { SectionTitle, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

export default function GrammarLab() {
  const { recordAttempt, upsertMistake, refresh } = useTrainerData();
  const recordAnswer = useAnswerRecorder('grammar_lab', recordAttempt, upsertMistake, refresh);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [exerciseQueue, setExerciseQueue] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const topicExercises = useMemo(() => {
    if (!selectedTopicId) return [];
    return getExercisesByTopic(selectedTopicId);
  }, [selectedTopicId]);

  const selectTopic = useCallback(
    (topicId: string) => {
      setSelectedTopicId(topicId);
      const exercises = getExercisesByTopic(topicId);
      setExerciseQueue(exercises);
      setCurrentIndex(0);
      setStartTime(Date.now());
    },
    [],
  );

  const backToTopics = () => {
    setSelectedTopicId(null);
    setExerciseQueue([]);
    setCurrentIndex(0);
  };

  const handleAnswered = useCallback(
    async (result: CheckResult, addToMistakes: boolean, flagged: boolean) => {
      const exercise = exerciseQueue[currentIndex];
      if (!exercise) return;
      await recordAnswer(exercise, result, addToMistakes, flagged, startTime);
    },
    [exerciseQueue, currentIndex, startTime, recordAnswer],
  );

  const advance = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setStartTime(Date.now());
  }, []);

  if (!selectedTopicId) {
    return (
      <div>
        <SectionTitle title={t('grammar.title')} subtitle={t('grammar.subtitle')} />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration
            name="grammar"
            size="inline"
            alt="Building sentences with word cards"
            className="shrink-0"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GRAMMAR_TOPICS.map((topic) => {
            const count = getExercisesByTopic(topic.id).length;
            return (
              <button
                key={topic.id}
                onClick={() => selectTopic(topic.id)}
                className="card group p-4 text-left transition-colors hover:border-[rgb(var(--color-primary))]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-primary-soft))]">
                    <FlaskConical className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{topic.titleRu}</p>
                    <p className="truncate text-xs text-muted">{count} {t('grammar.exercises')}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted">{topic.shortDescriptionRu}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const current = exerciseQueue[currentIndex];
  const topic = GRAMMAR_TOPICS.find((tp) => tp.id === selectedTopicId);

  if (!current) {
    return (
      <div>
        <SectionTitle title={topic?.titleRu ?? ''} subtitle={t('grammar.noExercises')} />
        <EmptyState title={t('grammar.noExercises')}>
          <button className="btn btn-secondary mt-2" onClick={backToTopics}>
            <ArrowLeft className="h-4 w-4" />
            {t('grammar.chooseTopic')}
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title={topic?.titleRu ?? ''}
        subtitle={`${t('lesson.progress')} ${currentIndex + 1} ${t('lesson.of')} ${exerciseQueue.length}`}
        action={
          <button className="btn btn-ghost" onClick={backToTopics}>
            <ArrowLeft className="h-4 w-4" />
            {t('grammar.chooseTopic')}
          </button>
        }
      />

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(currentIndex / exerciseQueue.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <ExercisePlayer
          key={current.id}
          exercise={current}
          source="grammar_lab"
          onAnswered={handleAnswered}
          onAdvance={advance}
          showAdvance
          advanceLabel={
            currentIndex + 1
