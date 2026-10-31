import type { ReviewStatus, VocabWord } from '@/types';

const DAY_MS = 86_400_000;

/** Days until the next review for each box (stage). Stage 0 = review again right away. */
export const STAGE_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_STAGE = STAGE_INTERVAL_DAYS.length - 1;

/** Words in one practice session, and how many of them may be brand new. */
export const SESSION_SIZE = 10;
export const MAX_NEW_PER_SESSION = 5;

export type WordExercise = 'flashcard' | 'translate' | 'recall' | 'gap';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Box of a word; words saved before the boxes existed are placed by their correct answers. */
export function stageOf(word: VocabWord): number {
  if (typeof word.stage === 'number') return clamp(Math.round(word.stage), 0, MAX_STAGE);
  return clamp(word.correctCount, 0, 3);
}

export function isNewWord(word: VocabWord): boolean {
  return stageOf(word) === 0 && word.correctCount + word.incorrectCount === 0;
}

export function statusOfStage(stage: number, reviewedBefore: boolean): ReviewStatus {
  if (stage >= MAX_STAGE) return 'mastered';
  if (stage >= 3) return 'review';
  if (stage >= 1 || reviewedBefore) return 'learning';
  return 'new';
}

/**
 * The word after one review.
 * - correct: one box up, the next review moves further away (1, 3, 7, 14, 30 days);
 * - wrong: two boxes down, the word comes back soon (box 0 = right away).
 */
export function reviewWord(word: VocabWord, correct: boolean, now: number): VocabWord {
  const stage = stageOf(word);
  const next = correct ? Math.min(MAX_STAGE, stage + 1) : Math.max(0, stage - 2);
  return {
    ...word,
    stage: next,
    correctCount: word.correctCount + (correct ? 1 : 0),
    incorrectCount: word.incorrectCount + (correct ? 0 : 1),
    reviewStatus: statusOfStage(next, true),
    nextReviewAt: now + STAGE_INTERVAL_DAYS[next] * DAY_MS,
  };
}

export function dueWords(words: VocabWord[], now: number): VocabWord[] {
  return words.filter((w) => w.nextReviewAt <= now);
}

/** Time of the nearest review after `now`, or null if nothing is planned. */
export function nextReviewTime(words: VocabWord[], now: number): number | null {
  const later = words.map((w) => w.nextReviewAt).filter((t) => t > now);
  return later.length > 0 ? Math.min(...later) : null;
}

/**
 * Words for one session: the most overdue words first, then new words (at most
 * MAX_NEW_PER_SESSION), so that a session never turns into a pile of new material.
 */
export function buildSession(
  words: VocabWord[],
  now: number,
  options: { theme?: string; size?: number } = {},
): VocabWord[] {
  const size = options.size ?? SESSION_SIZE;
  const due = dueWords(words, now).filter((w) => !options.theme || w.theme === options.theme);
  const fresh = due
    .filter(isNewWord)
    .sort((a, b) => a.id.localeCompare(b.id));
  const learning = due
    .filter((w) => !isNewWord(w))
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt || stageOf(a) - stageOf(b) || a.id.localeCompare(b.id));
  const newCount = Math.min(MAX_NEW_PER_SESSION, fresh.length, size);
  const reviewCount = Math.min(learning.length, size - newCount);
  return [...learning.slice(0, reviewCount), ...fresh.slice(0, newCount)];
}

/** Kind of exercise for a word: from showing the card to writing it in a sentence. */
export function exerciseFor(word: VocabWord, gapAvailable: boolean): WordExercise {
  const stage = stageOf(word);
  if (stage === 0) return 'flashcard';
  if (stage === 1) return 'translate';
  if (stage === 2) return 'recall';
  return gapAvailable ? 'gap' : 'recall';
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface Gap {
  /** The example sentence with the word replaced by ___ */
  text: string;
  /** The word as written in the sentence (for example "achieved") */
  answer: string;
  /** Answers that count as correct: the form in the sentence and the dictionary form. */
  accepted: string[];
}

/** The example sentence with the word cut out, or null if the word cannot be found in it. */
export function findGap(word: VocabWord): Gap | null {
  const match = new RegExp(`\\b${escapeRegExp(word.word)}[a-z]*`, 'i').exec(word.exampleEn);
  if (!match) return null;
  const answer = match[0];
  return {
    text: `${word.exampleEn.slice(0, match.index)}___${word.exampleEn.slice(match.index + answer.length)}`,
    answer,
    accepted: [...new Set([answer, word.word])],
  };
}

/** Hint for writing a word from memory: the first letter and the length. */
export function firstLetterHint(word: string): string {
  return `${word[0]}${'·'.repeat(Math.max(0, word.length - 1))} (${word.length})`;
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** The right translation and up to `count - 1` wrong ones, words of the same theme first. */
export function translationOptions(
  word: VocabWord,
  all: VocabWord[],
  rng: () => number = Math.random,
  count = 4,
): string[] {
  const others = all.filter((w) => w.id !== word.id && w.translationRu !== word.translationRu);
  const sameTheme = shuffle(others.filter((w) => w.theme && w.theme === word.theme), rng);
  const rest = shuffle(others.filter((w) => !(w.theme && w.theme === word.theme)), rng);
  const wrong: string[] = [];
  for (const w of [...sameTheme, ...rest]) {
    if (wrong.length >= count - 1) break;
    if (!wrong.includes(w.translationRu)) wrong.push(w.translationRu);
  }
  return shuffle([word.translationRu, ...wrong], rng);
}
