import type { Exercise } from '@/types';

export type CheckOutcome = 'correct' | 'incorrect' | 'needs_review';

export interface CheckResult {
  outcome: CheckOutcome;
  userAnswer: string;
  suggestedCorrection: string;
  detail?: string;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
}

function normalizeLoose(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function checkMultipleChoice(
  exercise: Exercise,
  selectedOptionId: string,
): CheckResult {
  if (exercise.data.type !== 'multiple_choice') {
    return { outcome: 'incorrect', userAnswer: selectedOptionId, suggestedCorrection: '' };
  }
  const correctId = exercise.data.correctOptionId;
  const correct = selectedOptionId === correctId;
  const option = exercise.data.options.find((o) => o.id === selectedOptionId);
  const correctOption = exercise.data.options.find((o) => o.id === correctId);
  return {
    outcome: correct ? 'correct' : 'incorrect',
    userAnswer: option?.text ?? selectedOptionId,
    suggestedCorrection: correctOption?.text ?? '',
  };
}

export function checkFillBlank(
  exercise: Exercise,
  answer: string,
): CheckResult {
  if (exercise.data.type !== 'fill_blank') {
    return { outcome: 'incorrect', userAnswer: answer, suggestedCorrection: '' };
  }
  const user = normalize(answer);
  const accepted = exercise.data.acceptedAnswers.map(normalize);
  const correct = accepted.includes(user);
  return {
    outcome: correct ? 'correct' : 'incorrect',
    userAnswer: answer,
    suggestedCorrection: exercise.data.acceptedAnswers[0],
    detail: correct
      ? undefined
      : `Принимаются: ${exercise.data.acceptedAnswers.join(', ')}`,
  };
}

export function checkFindError(
  exercise: Exercise,
  selectedSegmentIndex: number,
  correctionText: string,
): CheckResult {
  if (exercise.data.type !== 'find_error') {
    return { outcome: 'incorrect', userAnswer: '', suggestedCorrection: '' };
  }
  const segOk = selectedSegmentIndex === exercise.data.errorSegmentIndex;
  const userCorr = normalizeLoose(correctionText);
  const targetCorr = normalizeLoose(exercise.data.correction);
  const corrOk = userCorr.length > 0 && userCorr === targetCorr;
  const userAnswer = `Сегмент ${selectedSegmentIndex + 1} → "${correctionText}"`;
  if (segOk && corrOk) {
    return { outcome: 'correct', userAnswer, suggestedCorrection: exercise.data.correction };
  }
  if (segOk && !corrOk) {
    return {
      outcome: 'incorrect',
      userAnswer,
      suggestedCorrection: exercise.data.correction,
      detail: 'Сегмент найден верно, но исправление не совпадает.',
    };
  }
  if (!segOk && corrOk) {
    return {
      outcome: 'incorrect',
      userAnswer,
      suggestedCorrection: exercise.data.correction,
      detail: `Неверный сегмент. Правильный — №${exercise.data.errorSegmentIndex + 1}.`,
    };
  }
  return {
    outcome: 'incorrect',
    userAnswer,
    suggestedCorrection: exercise.data.correction,
    detail: `Ошибочный сегмент — №${exercise.data.errorSegmentIndex + 1} («${exercise.data.correction}»).`,
  };
}

// Rule-based checker for free-text sentence exercises.
// It does NOT understand natural English. It checks for supported target patterns.
export function checkWriteSentence(
  exercise: Exercise,
  answer: string,
): CheckResult {
  if (exercise.data.type !== 'write_sentence') {
    return { outcome: 'incorrect', userAnswer: answer, suggestedCorrection: '' };
  }
  const user = normalize(answer);
  if (user.length === 0) {
    return {
      outcome: 'incorrect',
      userAnswer: answer,
      suggestedCorrection: '',
      detail: 'Ответ пустой.',
    };
  }
  const patterns = exercise.data.acceptedPatterns.map((p) => normalize(p));
  const matched = patterns.some((p) => user.includes(p));

  const targetWords = exercise.data.targetWords;
  const hasTargetWords = targetWords.every((tw) =>
    user.includes(normalize(tw)),
  );

  if (matched && hasTargetWords) {
    return {
      outcome: 'correct',
      userAnswer: answer,
      suggestedCorrection: exercise.exampleEn,
    };
  }

  // Ambiguous: has some target words but no full pattern match.
  if (hasTargetWords && !matched) {
    return {
      outcome: 'needs_review',
      userAnswer: answer,
      suggestedCorrection: exercise.exampleEn,
      detail:
        'Не удалось надёжно проверить ответ. Целевые слова найдены, но ожидаемый шаблон не распознан. Можно отметить «Мой ответ может быть верным».',
    };
  }

  return {
    outcome: 'incorrect',
    userAnswer: answer,
    suggestedCorrection: exercise.exampleEn,
    detail: 'Ответ не содержит ожидаемых элементов.',
  };
}

export function checkExercise(
  exercise: Exercise,
  answer: unknown,
  correctionText?: string,
): CheckResult {
  switch (exercise.type) {
    case 'multiple_choice':
      return checkMultipleChoice(exercise, answer as string);
    case 'fill_blank':
      return checkFillBlank(exercise, answer as string);
    case 'find_error':
      return checkFindError(exercise, answer as number, correctionText ?? '');
    case 'write_sentence':
      return checkWriteSentence(exercise, answer as string);
    default:
      return { outcome: 'incorrect', userAnswer: '', suggestedCorrection: '' };
  }
}
