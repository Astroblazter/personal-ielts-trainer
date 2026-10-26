import { useCallback, useRef } from 'react';
import { addAttempt, findMistakeByExerciseId } from '@/data/db';
import { topicIdToCategory } from '@/hooks/useTrainerData';
import type { CheckResult } from '@/engine/checker';
import type { AttemptRecord, Exercise, MistakeEntry } from '@/types';

const DAY_MS = 86_400_000;

type RecordAttempt = (
  a: Omit<AttemptRecord, 'id' | 'createdAt'>,
  opts?: { addToMistakes?: boolean },
) => Promise<AttemptRecord>;

/**
 * Saves answers given in ExercisePlayer.
 *
 * ExercisePlayer calls its onAnswered callback once when the answer is checked,
 * and then AGAIN with the same result object when the user presses
 * "Add to mistakes" or "My answer may be correct". The second kind of call is a
 * follow-up to the attempt already saved, so it must not create a new attempt.
 *
 * Returns the attempt as it is stored after the call, or null if nothing was saved.
 */
export function useAnswerRecorder(
  source: AttemptRecord['source'],
  recordAttempt: RecordAttempt,
  upsertMistake: (m: MistakeEntry) => Promise<void>,
  refresh: () => Promise<void>,
) {
  const lastResultRef = useRef<CheckResult | null>(null);
  const lastAttemptRef = useRef<AttemptRecord | null>(null);

  return useCallback(
    async (
      exercise: Exercise,
      result: CheckResult,
      addToMistakes: boolean,
      flagged: boolean,
      questionStartedAt: number,
    ): Promise<AttemptRecord | null> => {
      // Follow-up button pressed for the answer just given.
      if (lastResultRef.current === result) {
        const saved = lastAttemptRef.current;
        if (!saved) return null;

        if (flagged && !saved.correct) {
          const fixed: AttemptRecord = { ...saved, correct: true };
          lastAttemptRef.current = fixed;
          await addAttempt(fixed); // put() by id: updates the stored attempt
          await refresh();
        }

        if (addToMistakes && !flagged && !saved.correct) {
          const existing = await findMistakeByExerciseId(exercise.id);
          if (!existing) {
            const now = Date.now();
            await upsertMistake({
              id: `mis-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
              exerciseId: exercise.id,
              topicId: exercise.topicId,
              category: topicIdToCategory(exercise.topicId),
              questionEn: '',
              userAnswer: saved.userAnswer,
              suggestedCorrection: saved.suggestedCorrection,
              explanationRu: '',
              createdAt: now,
              attempts: 1,
              status: 'active',
              nextReviewAt: now + DAY_MS,
              reviewIntervalDays: 1,
            });
          }
        }
        return lastAttemptRef.current;
      }

      // A new answer: record exactly one attempt.
      lastResultRef.current = result;
      lastAttemptRef.current = null;
      const isCorrect = result.outcome === 'correct';
      const saved = await recordAttempt(
        {
          exerciseId: exercise.id,
          topicId: exercise.topicId,
          type: exercise.type,
          correct: isCorrect,
          userAnswer: result.userAnswer,
          suggestedCorrection: result.suggestedCorrection,
          timeSpentMs: Date.now() - questionStartedAt,
          source,
        },
        { addToMistakes: addToMistakes && !isCorrect },
      );
      lastAttemptRef.current = saved;
      return saved;
    },
    [source, recordAttempt, upsertMistake, refresh],
  );
}
