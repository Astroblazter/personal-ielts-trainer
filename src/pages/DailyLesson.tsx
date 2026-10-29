import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useAnswerRecorder } from '@/hooks/useAnswerRecorder';
import { GRAMMAR_EXERCISES, getExerciseById, getExercisesByTopic } from '@/data/exercises';
import { selectDailyLesson, todayKey } from '@/engine/learning';
import { lessonFocus } from '@/engine/studyPlan';
import { levelIndex } from '@/engine/diagnostic';
import { getTopicById } from '@/data/grammarTopics';
import { getLessonState, saveLessonState, clearLessonState } from '@/data/db';
import type { CheckResult } from '@/engine/checker';
import type { DailyLessonState, Exercise, TopicId } from '@/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { SectionTitle, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

type Phase = 'idle' | 'playing' | 'paused' | 'completed';

export default function DailyLesson() {
  const navigate = useNavigate();
  const { attempts, mistakes, diagnostic, profile, recordAttempt, recordSession, upsertMistake, refresh } =
    useTrainerData();
  const [state, setState] = useState<DailyLessonState | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [lessonExercises, setLessonExercises] = useState<Exercise[]>([]);
  const recordAnswer = useAnswerRecorder('daily_lesson', recordAttempt, upsertMistake, refresh);

  // When the current exercise was shown (reset on every new exercise and on resume).
  const questionStartRef = useRef<number>(Date.now());

  const today = useMemo(() => todayKey(), []);

  // Topics of the current study-plan week (null without a diagnostic or after the plan).
  const focus = useMemo(() => {
    const latest = [...diagnostic].sort((a, b) => b.takenAt - a.takenAt)[0];
    return lessonFocus({
      diagnosticAt: latest ? latest.takenAt : null,
      attempts,
      overall: profile.currentLevel,
      now: Date.now(),
      exercisesOf: (topicId) => getExercisesByTopic(topicId),
      levelOf: (id) => {
        const ex = getExerciseById(id);
        return ex ? levelIndex(ex.difficulty) : undefined;
      },
    });
  }, [diagnostic, attempts, profile.currentLevel]);
  const focusNote = focus
    ? t('lesson.focusNote', {
        week: focus.week,
        topics: focus.topicIds.map((id) => getTopicById(id as TopicId)?.titleRu ?? id).join(', '),
      })
    : null;
  const currentIndex = state?.currentIndex;

  // Correct answers = latest answer per exercise that is marked correct.
  const correctCount = state ? Object.values(state.answers).filter((a) => a.correct).length : 0;

  useEffect(() => {
    if (phase === 'playing') questionStartRef.current = Date.now();
  }, [phase, currentIndex]);

  const loadState = useCallback(async () => {
    const saved = await getLessonState();
    if (saved && saved.date === today) {
      setState(saved);
      const exercises = saved.exerciseIds
        .map((id) => getExerciseById(id))
        .filter((e): e is Exercise => e !== undefined);
      setLessonExercises(exercises);
      if (saved.completedAt) {
        setPhase('completed');
      } else if (saved.currentIndex < exercises.length) {
        setPhase('paused');
      }
    }
  }, [today]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const startNew = useCallback(async () => {
    const selected = selectDailyLesson(GRAMMAR_EXERCISES, attempts, mistakes, 10, focus);
    const exerciseIds = selected.map((e) => e.id);
    const now = Date.now();
    const fresh: DailyLessonState = {
      date: today,
      exerciseIds,
      currentIndex: 0,
      answers: {},
      startedAt: now,
    };
    setLessonExercises(selected);
    setState(fresh);
    setPhase('playing');
    await saveLessonState(fresh);
  }, [attempts, mistakes, today, focus]);

  const handleAnswered = useCallback(
    async (result: CheckResult, addToMistakes: boolean, flagged: boolean) => {
      if (!state) return;
      const exercise = lessonExercises[state.currentIndex];
      if (!exercise) return;
      const saved = await recordAnswer(exercise, result, addToMistakes, flagged, questionStartRef.current);
      if (!saved) return;
      const updated: DailyLessonState = {
        ...state,
        answers: { ...state.answers, [exercise.id]: saved },
      };
      setState(updated);
      await saveLessonState(updated);
    },
    [state, lessonExercises, recordAnswer],
  );

  const advance = useCallback(async () => {
    if (!state) return;
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= lessonExercises.length) {
      const completedAt = Date.now();
      const finalState: DailyLessonState = {
        ...state,
        currentIndex: nextIndex,
        completedAt,
      };
      setState(finalState);
      await saveLessonState(finalState);
      setPhase('completed');
      await recordSession({
        startedAt: state.startedAt,
        completedAt,
        exercisesCompleted: lessonExercises.length,
        correctCount,
        timeSpentMs: completedAt - state.startedAt,
      });
    } else {
      const updated: DailyLessonState = { ...state, currentIndex: nextIndex };
      setState(updated);
      await saveLessonState(updated);
    }
  }, [state, lessonExercises, correctCount, recordSession]);

  const pause = () => setPhase('paused');
  const resume = () => setPhase('playing');

  const restart = useCallback(async () => {
    await clearLessonState();
    setState(null);
    setPhase('idle');
    setLessonExercises([]);
  }, []);

  if (phase === 'idle' && !state) {
    return (
      <div>
        <SectionTitle title={t('lesson.title')} subtitle={t('lesson.noLesson')} />
        <EmptyState title={t('lesson.noLesson')}>
          <Illustration name="lesson" size="inline" alt="A cozy desk ready for a morning lesson" className="mt-2" />
          <button className="btn btn-primary mt-2" onClick={startNew}>
            <Play className="h-4 w-4" />
            {t('lesson.startNew')}
          </button>
          {focusNote && <span className="mt-3 block text-xs">{focusNote}</span>}
        </EmptyState>
      </div>
    );
  }

  if (!state) return null;

  if (phase === 'paused') {
    return (
      <div>
        <SectionTitle title={t('lesson.title')} subtitle={t('lesson.paused')} />
        <div className="card p-6 text-center">
          <p className="text-sm text-muted">
            {t('lesson.progress')} {state.currentIndex + 1} {t('lesson.of')} {lessonExercises.length}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button className="btn btn-primary" onClick={resume}>
              <Play className="h-4 w-4" />
              {t('lesson.resume')}
            </button>
            <button className="btn btn-ghost" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'completed') {
    const total = lessonExercises.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const timeMin = Math.round(((state.completedAt ?? Date.now()) - state.startedAt) / 60000);
    return (
      <div>
        <SectionTitle title={t('lesson.title')} subtitle={t('lesson.completed')} />
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <h2 className="text-xl font-semibold">{t('lesson.summary')}</h2>
          </div>
          <div className="mt-4 flex justify-center">
            <Illustration name="lessonComplete" size="inline" alt="Lesson completed" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-semibold">{accuracy}%</p>
              <p className="mt-1 text-xs text-muted">{t('lesson.accuracy')}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">{correctCount}/{total}</p>
              <p className="mt-1 text-xs text-muted">{t('lesson.correctCount')}</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">{timeMin}m</p>
              <p className="mt-1 text-xs text-muted">{t('lesson.time')}</p>
            </div>
          </div>
          {focusNote && <p className="mt-4 text-xs text-muted">{focusNote}</p>}
          <div className="mt-6 flex gap-2">
            <button className="btn btn-primary" onClick={startNew}>
              <Play className="h-4 w-4" />
              {t('lesson.startNew')}
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/progress')}>
              {t('nav.progress')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // playing
  const current = lessonExercises[state.currentIndex];
  if (!current) {
    return (
      <div>
        <SectionTitle title={t('lesson.title')} />
        <EmptyState title={t('lesson.noLesson')}>
          <button className="btn btn-primary mt-2" onClick={startNew}>
            {t('lesson.startNew')}
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title={t('lesson.title')}
        subtitle={`${t('lesson.progress')} ${state.currentIndex + 1} ${t('lesson.of')} ${lessonExercises.length}`}
        action={
          <button className="btn btn-ghost" onClick={pause}>
            <Pause className="h-4 w-4" />
            {t('lesson.pause')}
          </button>
        }
      />

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((state.currentIndex) / lessonExercises.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <ExercisePlayer
          key={current.id}
          exercise={current}
          source="daily_lesson"
          onAnswered={handleAnswered}
          onAdvance={advance}
          showAdvance
          advanceLabel={
            state.currentIndex + 1 >= lessonExercises.length
              ? t('lesson.finish')
              : t('common.next')
          }
        />
      </div>
    </div>
  );
}
