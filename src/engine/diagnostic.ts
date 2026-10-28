import type { AssessmentLevel, Difficulty, Exercise, TopicId } from '@/types';

/** Number of questions in one diagnostic run (about 6-8 minutes). */
export const DIAGNOSTIC_LENGTH = 24;

/** The first answers are used to find the right level and are not used for the estimate. */
const WARMUP = 4;

export const LEVEL_LABELS: AssessmentLevel[] = ['A2', 'B1', 'B1+', 'B2'];
const DIFFICULTIES: Difficulty[] = ['A2', 'B1', 'B1+', 'B2'];
const START_LEVEL = 1; // B1
/** One level of distance counts as much as asking this many extra questions on a topic. */
const LEVEL_WEIGHT = 3;
const TOP_LEVEL = LEVEL_LABELS.length - 1;

export interface DiagnosticAnswer {
  exerciseId: string;
  topicId: TopicId;
  /** 0 = A2, 1 = B1, 2 = B1+, 3 = B2 */
  level: number;
  correct: boolean;
}

export function levelIndex(d: Difficulty): number {
  const i = DIFFICULTIES.indexOf(d);
  return i === -1 ? TOP_LEVEL : i; // 'IELTS' counts as the top level
}

/** Exercises that can be checked exactly (free writing is only checked by patterns). */
export function diagnosticPool(all: Exercise[]): Exercise[] {
  return all.filter((e) => e.type !== 'write_sentence');
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Staircase: one level up after a correct answer, one level down after a mistake. */
export function targetLevel(answers: DiagnosticAnswer[]): number {
  const last = answers[answers.length - 1];
  if (!last) return START_LEVEL;
  return clamp(last.level + (last.correct ? 1 : -1), 0, TOP_LEVEL);
}

/**
 * Picks the next question. The level is matched first (staircase target); among
 * exercises of a similar level, topics asked less often are preferred, so the
 * test covers many topics without distorting the level.
 */
export function pickNextExercise(
  pool: Exercise[],
  answers: DiagnosticAnswer[],
  rng: () => number = Math.random,
): Exercise | null {
  const used = new Set(answers.map((a) => a.exerciseId));
  const remaining = pool.filter((e) => !used.has(e.id));
  if (remaining.length === 0) return null;

  const asked = new Map<string, number>();
  answers.forEach((a) => asked.set(a.topicId, (asked.get(a.topicId) ?? 0) + 1));

  const target = targetLevel(answers);
  const cost = (e: Exercise) =>
    Math.abs(levelIndex(e.difficulty) - target) * LEVEL_WEIGHT + (asked.get(e.topicId) ?? 0);
  const best = Math.min(...remaining.map(cost));
  const choices = remaining.filter((e) => cost(e) === best);
  return choices[Math.floor(rng() * choices.length)];
}

/** Average level of the questions the staircase settled on, after the warm-up. */
export function estimateLevel(answers: DiagnosticAnswer[]): { score: number; level: AssessmentLevel } {
  if (answers.length === 0) return { score: START_LEVEL, level: LEVEL_LABELS[START_LEVEL] };
  const used = answers.length > WARMUP + 4 ? answers.slice(WARMUP) : answers;
  const score = used.reduce((sum, a) => sum + a.level, 0) / used.length;
  return { score, level: LEVEL_LABELS[clamp(Math.round(score), 0, TOP_LEVEL)] };
}

export interface DiagnosticSummary {
  perTopic: Record<string, { correct: number; total: number }>;
  perLevel: { level: AssessmentLevel; correct: number; total: number }[];
}

export function summarize(answers: DiagnosticAnswer[]): DiagnosticSummary {
  const perTopic: DiagnosticSummary['perTopic'] = {};
  const levels = LEVEL_LABELS.map((level) => ({ level, correct: 0, total: 0 }));
  for (const a of answers) {
    const entry = perTopic[a.topicId] ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (a.correct) entry.correct += 1;
    perTopic[a.topicId] = entry;
    levels[a.level].total += 1;
    if (a.correct) levels[a.level].correct += 1;
  }
  return { perTopic, perLevel: levels.filter((l) => l.total > 0) };
}
