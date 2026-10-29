import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, FlaskConical, RotateCcw } from 'lucide-react';
import { GRAMMAR_TOPICS } from '@/data/grammarTopics';
import { getExercisesByTopic } from '@/data/exercises';
import { topicDescription } from '@/data/localize';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useAnswerRecorder } from '@/hooks/useAnswerRecorder';
import type { CheckResult } from '@/engine/checker';
import { levelLabel, orderFromLevel } from '@/engine/studyPlan';
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
  // Latest result per exercise in the current run of the topic.
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  // Level the exercise order starts from (set when opened from the study plan).
  const [startLevel, setStartLevel] = useState<number | null>(null);
  const [params, setParams] = useSearchParams();

  const topicExercises = useMemo(() => {
    if (!selectedTopicId) return [];
    return getExercisesByTopic(selectedTopicId);
  }, [selectedTopicId]);

  const selectTopic = useCallback((topicId: string, level?: number) => {
    setSelectedTopicId(topicId);
    const exercises = getExercisesByTopic(topicId);
    setExerciseQueue(level === undefined ? exercises : orderFromLevel(exercises, level));
    setStartLevel(level ?? null);
    setCurrentIndex(0);
    setStartTime(Date.now());
    setAnswers({});
  }, []);

  // Deep link from the study plan: /grammar?topic=<id>&level=<0..3>
  useEffect(() => {
    const topicId = params.get('topic');
    if (!topicId) return;
    if (GRAMMAR_TOPICS.some((tp) => tp.id === topicId)) {
      const raw = params.get('level');
      const level = raw !== null && raw !== '' ? Number(raw) : NaN;
      selectTopic(topicId, Number.isInteger(level) && level >= 0 && level <= 3 ? level : undefined);
    }
    setParams({}, { replace: true });
  }, [params, setParams, selectTopic]);

  const backToTopics = () => {
    setSelectedTopicId(null);
    setExerciseQueue([]);
    setCurrentIndex(0);
    setAnswers({});
    setStartLevel(null);
  };

  const handleAnswered = useCallback(
    async (result: CheckResult, addToMistakes: boolean, flagged: boolean) => {
      const exercise = exerciseQueue[currentIndex];
      if (!exercise) return;
      const saved = await recordAnswer(exercise, result, addToMistakes, flagged, startTime);
      if (saved) setAnswers((prev) => ({ ...prev, [exercise.id]: saved.correct }));
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
                <p className="mt-3 line-clamp-2 text-xs text-muted">{topicDescription(topic)}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const current = exerciseQueue[currentIndex];
  const topic = GRAMMAR_TOPICS.find((tp) => tp.id === selectedTopicId);

  if (exerciseQueue.length > 0 && currentIndex >= exerciseQueue.length) {
    const correct = Object.values(answers).filter(Boolean).length;
    return (
      <div>
        <SectionTitle title={topic?.titleRu ?? ''} subtitle={t('grammar.topicDone')} />
        <div className="card p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <h2 className="mt-3 text-xl font-semibold">{t('grammar.topicDone')}</h2>
          <p className="mt-2 text-sm text-muted">
            {t('grammar.topicScore', { correct, total: exerciseQueue.length })}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn btn-primary" onClick={() => selectTopic(selectedTopicId, startLevel ?? undefined)}>
              <RotateCcw className="h-4 w-4" />
              {t('grammar.again')}
            </button>
            <button className="btn btn-secondary" onClick={backToTopics}>
              <ArrowLeft className="h-4 w-4" />
              {t('grammar.chooseTopic')}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {startLevel !== null && (
        <p className="mb-2 text-xs text-muted">
          {t('grammar.startingFrom', { level: levelLabel(startLevel) })}
        </p>
      )}

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
            currentIndex + 1 >= exerciseQueue.length
              ? t('common.complete')
              : t('common.next')
          }
        />
        {currentIndex + 1 >= exerciseQueue.length && (
          <div className="mt-4 flex gap-2">
            <button className="btn btn-secondary" onClick={backToTopics}>
              <ArrowLeft className="h-4 w-4" />
              {t('grammar.chooseTopic')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
