import type { AttemptRecord, TopicId } from '@/types';

export const DAY_MS = 86_400_000;

let counter = 0;

export function attempt(
  topicId: TopicId,
  correct: boolean,
  createdAt: number,
  extra: Partial<AttemptRecord> = {},
): AttemptRecord {
  counter += 1;
  return {
    id: `test-${counter}`,
    exerciseId: `ex-${counter}`,
    topicId,
    type: 'multiple_choice',
    correct,
    userAnswer: '',
    suggestedCorrection: '',
    timeSpentMs: 1000,
    createdAt,
    source: 'grammar_lab',
    ...extra,
  };
}

/** Attempts of one topic from a string like "1101": 1 = correct, 0 = wrong, one per second. */
export function attemptsFrom(topicId: TopicId, pattern: string, start = 1_000_000): AttemptRecord[] {
  return [...pattern].map((c, i) => attempt(topicId, c === '1', start + i * 1000));
}

/** Small deterministic random generator, so tests do not depend on Math.random. */
export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
