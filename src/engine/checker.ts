import type { Exercise } from '@/types';
import { t } from '@/i18n';

export type CheckOutcome = 'correct' | 'incorrect' | 'needs_review';

export interface CheckResult {
  outcome: CheckOutcome;
  userAnswer: string;
  suggestedCorrection: string;
  detail?: string;
  /** Answer is counted as incorrect, but looks like a typo in an otherwise right answer. */
  nearMiss?: boolean;
}

// Phones often insert typographic quotes (’ “ ”); treat them as plain ' and ".
function unifyQuotes(s: string): string {
  return s.replace(/[\u2018\u2019\u02BC`]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function normalize(s: string): string {
  return unifyQuotes(s).trim().toLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
}

// ── Typo detection ────────────────────────────────────────────────────────
// A typo is a single wrong, missing, extra or swapped letter inside a word.
// Changes at the END of a word (-s, -ed, -ing, a different last letter) and
// short words are NOT typos: they are usually grammar mistakes (melt/melts, a/an).

function oneEditApart(a: string, b: string): boolean {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // one letter replaced
    return i + 1 < a.length && a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // two letters swapped
  }
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1); // one letter missing or extra
}

function isEndingChange(a: string, b: string): boolean {
  if (a.length !== b.length) return a.startsWith(b) || b.startsWith(a);
  return a.slice(0, -1) === b.slice(0, -1);
}

function isTypoOfWord(user: string, target: string): boolean {
  return target.length >= 4 && oneEditApart(user, target) && !isEndingChange(user, target);
}

/** True if `user` equals one of `accepted` except for a single typo in one word. */
function isNearMiss(user: string, accepted: string[]): boolean {
  const userWords = user.split(' ');
  return accepted.some((target) => {
    const targetWords = target.split(' ');
    if (targetWords.length !== userWords.length) return false;
    const different = targetWords
      .map((w, i) => [userWords[i], w] as const)
      .filter(([u, w]) => u !== w);
    return different.length === 1 && isTypoOfWord(different[0][0], different[0][1]);
  });
}

/** Compares a typed word or phrase with the accepted ones: correct, a typo away ("near"), or wrong. */
export function matchText(user: string, accepted: string[]): 'correct' | 'near' | 'wrong' {
  const typed = normalize(user);
  const options = accepted.map(normalize);
  if (options.includes(typed)) return 'correct';
  return isNearMiss(typed, options) ? 'near' : 'wrong';
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
  const nearMiss = !correct && isNearMiss(user, accepted);
  return {
    outcome: correct ? 'correct' : 'incorrect',
    userAnswer: answer,
    suggestedCorrection: exercise.data.acceptedAnswers[0],
    nearMiss: nearMiss || undefined,
    detail: correct
      ? undefined
      : nearMiss
        ? t('checker.typoHint')
        : t('checker.accepted', { answers: exercise.data.acceptedAnswers.join(', ') }),
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
  // Trailing punctuation (e.g. a full stop) is ignored, like in the other exercise types.
  const userCorr = normalize(correctionText);
  const targetCorr = normalize(exercise.data.correction);
  const corrOk = userCorr.length > 0 && userCorr === targetCorr;
  const userAnswer = `#${selectedSegmentIndex + 1} → "${correctionText}"`;
  if (segOk && corrOk) {
    return { outcome: 'correct', userAnswer, suggestedCorrection: exercise.data.correction };
  }
  if (segOk && !corrOk) {
    const nearMiss = isNearMiss(userCorr, [targetCorr]);
    return {
      outcome: 'incorrect',
      userAnswer,
      suggestedCorrection: exercise.data.correction,
      nearMiss: nearMiss || undefined,
      detail: nearMiss ? t('checker.typoHint') : t('checker.segmentOkFixWrong'),
    };
  }
  if (!segOk && corrOk) {
    return {
      outcome: 'incorrect',
      userAnswer,
      suggestedCorrection: exercise.data.correction,
      detail: t('checker.wrongSegment', { n: exercise.data.errorSegmentIndex + 1 }),
    };
  }
  return {
    outcome: 'incorrect',
    userAnswer,
    suggestedCorrection: exercise.data.correction,
    detail: t('checker.errorSegment', {
      n: exercise.data.errorSegmentIndex + 1,
      correction: exercise.data.correction,
    }),
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
      detail: t('checker.empty'),
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
      detail: t('checker.needsReview'),
    };
  }

  return {
    outcome: 'incorrect',
    userAnswer: answer,
    suggestedCorrection: exercise.exampleEn,
    detail: t('checker.missingElements'),
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
