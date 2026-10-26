import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, CheckCircle2, RotateCcw, ArrowRight } from 'lucide-react';
import { useTrainerData, topicIdToCategory } from '@/hooks/useTrainerData';
import { GRAMMAR_EXERCISES, getExerciseById } from '@/data/exercises';
import { selectDailyLesson, todayKey } from '@/engine/learning';
import {
  getLessonState,
  saveLessonState,
  clearLessonState,
  addAttempt,
  findMistakeByExerciseId,
} from '@/data/db';
import type { CheckResult } from '@/engine/checker';
import type { DailyLessonState, Exercise, AttemptRecord, MistakeEntry } from '@/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { SectionTitle, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

type Phase = 'idle' | 'playing' | 'paused' | 'completed';

const DAY_MS = 86_400_000;

export default function DailyLesson() {
  const navigate = useNavigate();
  const { attempts, mistakes, recordAttempt, recordSession, upsertMistake, refresh } = useTrainerData();
  const [state, setState] = useState<DailyLessonState | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [lessonExercises, setLessonExercises] = useState<Exercise[]>([]);

  // When the current exercise was shown (reset on every new exercise and on resume).
  const questionStartRef = useRef<number>(Date.now());
  // The result/attempt of the answer just given, used to tell a follow-up
  // button ("Add to mistakes", "My answer may be correct") from a new answer.
  const lastResultRef = useRef<CheckResult | null>(null);
  const lastAttemptRef = useRef<AttemptRecord | null>(null);

  const today = useMemo(() => todayKey(), []);
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
    const selected = selectDailyLesson(GRAMMAR_EXERCISES, attempts, mistakes, 10);
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
  }, [attempts, mistakes, today]);

  const handleAnswered = useCallback(
    async (result: CheckResult, addToMistakes: boolean, flagged: boolean) => {
      if (!state) return;
      const exercise = lessonExercises[state.currentIndex];
      if (!exercise) return;

      // ExercisePlayer re-sends the SAME result object when the user presses
      // "Add to mistakes" or "My answer may be correct". That is a follow-up
      // to the attempt already saved, not a new attempt.
      if (lastResultRef.current === result) {
        const saved = lastAttemptRef.current;
        if (!saved) return;
        if (flagged && !saved.correct) {
          const fixed: AttemptRecord = { ...saved, correct: true };
          lastAttemptRef.current = fixed;
          await addAttempt(fixed); // put() by id: updates the stored attempt
          await refresh();
          const updated: DailyLessonState = {
            ...state,
            answers: { ...state.answers, [exercise.id]: fixed },
          };
          setState(updated);
          await saveLessonState(updated);
        }
        if (addToMistakes && !flagged && !saved.correct) {
          const existing = await findMistakeByExerciseId(exercise.id);
          if (!existing) {
            const now = Date.now();
            const entry: MistakeEntry = {
              id: `mis-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
              exerciseId: exercise.id,
              topicId: exercise.topicId,
              category: topicIdToCategory(exercise.topicId),
              questionEn: '',
              userAnswer: saved.userAnswer,
              suggestedCorrection: saved.suggestedCorrection,
              explanationRu: '',
              createdAt: now,
