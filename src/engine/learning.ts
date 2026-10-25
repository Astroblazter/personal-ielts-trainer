import type {
  AttemptRecord,
  MistakeEntry,
  ProgressStats,
  SessionRecord,
  TopicId,
  Exercise,
} from '@/types';
import { GRAMMAR_TOPICS } from '@/data/grammarTopics';

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

// Select exercises for a daily lesson: a deterministic mixture.
// 40% due review mistakes + weakest topics, 60% new/mixed material.
export function selectDailyLesson(
  allExercises: Exercise[],
  attempts: AttemptRecord[],
  mistakes: MistakeEntry[],
  targetCount = 10,
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
  pool.sort((a, b) => stableHash(a.id + today) - stableHash(b.id + today));

  const reviewCount = Math.max(1, Math.round(targetCount * 0.4));
  const picked: Exercise[] = [];
  const pickedIds = new Set<string>();

  // First: due mistakes and weak topics
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
