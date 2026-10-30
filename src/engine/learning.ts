import type {
  AttemptRecord,
  MistakeEntry,
  ProgressStats,
  SessionRecord,
  TopicId,
  Exercise,
} from '@/types';
import { GRAMMAR_TOPICS } from '@/data/grammarTopics';
import { levelIndex } from '@/engine/diagnostic';

// Local calendar date (YYYY-MM-DD). toISOString() would give the UTC date,
// which shifts the day for users east/west of UTC around midnight.
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(d: Date = new Date()): string {
  return dateKey(d);
}

const DAY_MS = 86_400_000;

export function computeStreak(
  sessions: SessionRecord[],
  attempts: AttemptRecord[],
): number {
  const days = new Set<string>();
  sessions.forEach((s) => days.add(s.date));
  attempts.forEach((a) => days.add(dateKey(new Date(a.createdAt))));
  let streak = 0;
  let cursor = new Date();
  // No study yet today does not break the streak: count back from yesterday.
  if (!days.has(dateKey(cursor))) cursor = new Date(cursor.getTime() - DAY_MS);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

export function computeStats(
  attempts: AttemptRecord[],
  sessions: SessionRecord[],
  mistakes: MistakeEntry[],
): ProgressStats {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  const streak = computeStreak(sessions, attempts);

  const lastStudyTs = attempts.length
    ? Math.max(...attempts.map((a) => a.createdAt))
    : sessions.length
      ? Math.max(...sessions.map((s) => s.completedAt))
      : null;
  const lastStudyDate = lastStudyTs ? dateKey(new Date(lastStudyTs)) : null;

  const sevenDaysAgo = Date.now() - 7 * DAY_MS;
  const recentAttempts = attempts.filter((a) => a.createdAt >= sevenDaysAgo);
  const byDay = new Map<string, { count: number; correct: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - i * DAY_MS);
    byDay.set(dateKey(d), { count: 0, correct: 0 });
  }
  recentAttempts.forEach((a) => {
    const key = dateKey(new Date(a.createdAt));
    const entry = byDay.get(key);
    if (entry) {
      entry.count += 1;
      if (a.correct) entry.correct += 1;
    }
  });
  const exercisesByDay = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topicMap = new Map<TopicId, { total: number; correct: number }>();
  attempts.forEach((a) => {
    const e = topicMap.get(a.topicId) ?? { total: 0, correct: 0 };
    e.total += 1;
    if (a.correct) e.correct += 1;
    topicMap.set(a.topicId, e);
  });
  const accuracyByTopic = GRAMMAR_TOPICS.map((t) => {
    const e = topicMap.get(t.id) ?? { total: 0, correct: 0 };
    return {
      topicId: t.id,
      total: e.total,
      correct: e.correct,
      accuracy: e.total === 0 ? 0 : Math.round((e.correct / e.total) * 100),
    };
  }).filter((x) => x.total > 0);

  const errorCounts = new Map<string, number>();
  mistakes.forEach((m) => {
    errorCounts.set(m.category, (errorCounts.get(m.category) ?? 0) + 1);
  });
  const mostFrequentErrors = Array.from(errorCounts.entries())
    .map(([category, count]) => ({ category: category as ProgressStats['mostFrequentErrors'][number]['category'], count }))
    .sort((a, b) => b.count - a.count);

  const dueMistakes = mistakes.filter((m) => m.status !== 'archived' && m.nextReviewAt <= Date.now());
  const dueByTopic = new Map<TopicId, number>();
  dueMistakes.forEach((m) => dueByTopic.set(m.topicId, (dueByTopic.get(m.topicId) ?? 0) + 1));
  const topicsDueForReview = Array.from(dueByTopic.entries())
    .map(([topicId, count]) => ({ topicId, count }))
    .sort((a, b) => b.count - a.count);

  const reviewAttempts = attempts.filter((a) => a.source === 'mistake_retry');
  const reviewSuccess = reviewAttempts.length
    ? Math.round((reviewAttempts.filter((a) => a.correct).length / reviewAttempts.length) * 100)
    : 0;

  return {
    totalExercisesCompleted: total,
    totalCorrect: correct,
    overallAccuracy: accuracy,
    streak,
    lastStudyDate,
    exercisesByDay,
    accuracyByTopic,
    mostFrequentErrors,
    topicsDueForReview,
    reviewSuccessRate: reviewSuccess,
  };
}

// Spaced repetition: 1, 3, 7, 14 days, extended on success.
const INTERVALS = [1, 3, 7, 14, 30];

export function nextReviewDate(attempts: number, lastTs: number, success: boolean): number {
  const idx = Math.min(attempts, INTERVALS.length - 1);
  const baseDays = success ? INTERVALS[idx] : Math.max(1, Math.floor(INTERVALS[idx] / 2));
  return lastTs + baseDays * DAY_MS;
}

export function computeIntervalDays(attempts: number, success: boolean): number {
  const idx = Math.min(attempts, INTERVALS.length - 1);
  return success ? INTERVALS[idx] : Math.max(1, Math.floor(INTERVALS[idx] / 2));
}

// ── Mistakes notebook: closing and re-opening a mistake ──────────────────

/** A mistake is closed ("understood") after this many correct answers in a row. */
export const MASTERY_STREAK = 3;
/** A closed mistake is only checked again after this many days. */
export const MASTERED_REVIEW_DAYS = 30;

/** Number of correct answers in a row at the end of the history (by time). */
export function correctStreak(history: AttemptRecord[]): number {
  const sorted = [...history].sort((a, b) => a.createdAt - b.createdAt);
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0 && sorted[i].correct; i--) streak += 1;
  return streak;
}

/**
 * The mistake after a CORRECT answer. `history` holds all answers to this
 * exercise, including the one just given.
 * - the next review moves further away (1, 3, 7, 14, 30 days as the streak grows);
 * - after MASTERY_STREAK correct answers in a row the mistake becomes "understood";
 * - a mistake already marked "understood" stays closed and is checked again in 30 days;
 * - an archived mistake is left alone.
 */
export function advanceMistake(mistake: MistakeEntry, history: AttemptRecord[], now: number): MistakeEntry {
  if (mistake.status === 'archived') return mistake;
  const streak = correctStreak(history);
  const mastered = mistake.status === 'understood' || streak >= MASTERY_STREAK;
  const days = mastered ? MASTERED_REVIEW_DAYS : computeIntervalDays(streak, true);
  return {
    ...mistake,
    status: mastered ? 'understood' : mistake.status,
    nextReviewAt: now + days * DAY_MS,
    reviewIntervalDays: days,
  };
}

export interface MistakeDetails {
  exerciseId: string;
  topicId: TopicId;
  category: MistakeEntry['category'];
  userAnswer: string;
  suggestedCorrection: string;
}

/**
 * The mistake after a WRONG answer: a new entry, or the existing one counted
 * again, re-opened ("active") and due for review soon (the wrong-answer interval).
 */
export function registerMistake(
  existing: MistakeEntry | undefined,
  details: MistakeDetails,
  now: number,
  newId: string,
): MistakeEntry {
  const attempts = (existing?.attempts ?? 0) + 1;
  const interval = computeIntervalDays(attempts, false);
  const latest = {
    userAnswer: details.userAnswer,
    suggestedCorrection: details.suggestedCorrection,
    attempts,
    status: 'active' as const,
    nextReviewAt: now + interval * DAY_MS,
    reviewIntervalDays: interval,
  };
  if (existing) return { ...existing, ...latest };
  return {
    id: newId,
    exerciseId: details.exerciseId,
    topicId: details.topicId,
    category: details.category,
    questionEn: '',
    explanationRu: '',
    createdAt: now,
    ...latest,
  };
}

// Determine topics that are weakest (lowest accuracy with attempts).
export function rankWeakTopics(
  accuracyByTopic: { topicId: TopicId; total: number; correct: number; accuracy: number }[],
): TopicId[] {
  // A topic is weak only if accuracy is below 70% after at least 2 attempts.
  return [...accuracyByTopic]
    .filter((t) => t.total >= 2 && t.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((t) => t.topicId);
}

/** Topics a lesson should concentrate on (the current week of the study plan). */
export interface LessonFocus {
  week: number;
  topicIds: TopicId[];
  /** Level (0 = A2 ... 3 = B2) to start each focus topic with. */
  startLevels: Partial<Record<TopicId, number>>;
}

/**
 * Focus exercises: half of the lesson, spread evenly over the focus topics.
 * Inside a topic, exercises not yet answered correctly come first, then the
 * ones closest to the recommended start level.
 */
function pickFocusExercises(
  pool: Exercise[],
  focus: LessonFocus,
  attempts: AttemptRecord[],
  count: number,
  order: (e: Exercise) => number,
): Exercise[] {
  const correctBefore = new Map<string, number>();
  attempts.forEach((a) => {
    if (a.correct) correctBefore.set(a.exerciseId, (correctBefore.get(a.exerciseId) ?? 0) + 1);
  });
  const queues = focus.topicIds.map((topicId) => {
    const start = focus.startLevels[topicId] ?? 1;
    return pool
      .filter((e) => e.topicId === topicId)
      .sort(
        (a, b) =>
          (correctBefore.get(a.id) ?? 0) - (correctBefore.get(b.id) ?? 0) ||
          Math.abs(levelIndex(a.difficulty) - start) - Math.abs(levelIndex(b.difficulty) - start) ||
          order(a) - order(b),
      );
  });
  const out: Exercise[] = [];
  for (let i = 0; out.length < count && queues.some((q) => q.length > 0); i++) {
    const next = queues[i % queues.length].shift();
    if (next) out.push(next);
  }
  return out;
}

// Select exercises for a daily lesson: a deterministic mixture.
// Without a focus: 40% due review mistakes + weakest topics, 60% new/mixed material.
// With a focus (topics of the current plan week): 50% focus topics, 20% review, rest mixed.
export function selectDailyLesson(
  allExercises: Exercise[],
  attempts: AttemptRecord[],
  mistakes: MistakeEntry[],
  targetCount = 10,
  focus?: LessonFocus | null,
): Exercise[] {
  const reviewedExerciseIds = new Set(attempts.map((a) => a.exerciseId));
  const dueMistakeExerciseIds = new Set(
    mistakes
      .filter((m) => m.status !== 'archived' && m.nextReviewAt <= Date.now())
      .map((m) => m.exerciseId),
  );
  const stats = computeStats(attempts, [], mistakes);
  const weakTopics = rankWeakTopics(stats.accuracyByTopic);

  const pool = [...allExercises];
  // Deterministic shuffle by hash of id + date so sequence varies by day.
  const today = todayKey();
  const order = (e: Exercise) => stableHash(e.id + today);
  pool.sort((a, b) => order(a) - order(b));

  const picked: Exercise[] = [];
  const pickedIds = new Set<string>();

  // First (with a focus): exercises from the topics of the current plan week
  if (focus && focus.topicIds.length > 0) {
    const focusCount = Math.round(targetCount * 0.5);
    for (const ex of pickFocusExercises(pool, focus, attempts, focusCount, order)) {
      picked.push(ex);
      pickedIds.add(ex.id);
    }
  }

  const reviewShare = focus && focus.topicIds.length > 0 ? 0.2 : 0.4;
  const reviewCount = picked.length + Math.max(1, Math.round(targetCount * reviewShare));

  // Then: due mistakes and weak topics
  for (const ex of pool) {
    if (picked.length >= reviewCount) break;
    if (pickedIds.has(ex.id)) continue;
    if (dueMistakeExerciseIds.has(ex.id) || weakTopics.includes(ex.topicId)) {
      picked.push(ex);
      pickedIds.add(ex.id);
    }
  }
  // Then: new/unseen exercises + variety of topics
  const usedTopics = new Set(picked.map((e) => e.topicId));
  for (const ex of pool) {
    if (picked.length >= targetCount) break;
    if (pickedIds.has(ex.id)) continue;
    if (!reviewedExerciseIds.has(ex.id) || picked.length < reviewCount + 2) {
      if (!usedTopics.has(ex.topicId) || picked.length >= targetCount - 2) {
        picked.push(ex);
        pickedIds.add(ex.id);
        usedTopics.add(ex.topicId);
      }
    }
  }
  // Fill remainder with any remaining
  for (const ex of pool) {
    if (picked.length >= targetCount) break;
    if (pickedIds.has(ex.id)) continue;
    picked.push(ex);
    pickedIds.add(ex.id);
  }
  return picked.slice(0, targetCount);
}

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
