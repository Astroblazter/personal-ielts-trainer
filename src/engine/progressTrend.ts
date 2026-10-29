import type { AttemptRecord, TopicId } from '@/types';

/** Minimum number of answers in a topic before "before / after" is shown. */
export const MIN_TOPIC_ATTEMPTS = 6;
const MAX_TOPIC_WINDOW = 10;
/** Same for all topics together. */
export const MIN_OVERALL_ATTEMPTS = 10;
const MAX_OVERALL_WINDOW = 20;

export interface Trend {
  /** Number of answers in each of the two groups. */
  window: number;
  /** Accuracy (percent) of the first `window` answers. */
  before: number;
  /** Accuracy (percent) of the latest `window` answers. */
  after: number;
  delta: number;
}

export interface TopicTrend extends Trend {
  topicId: TopicId;
  total: number;
}

export interface TopicTrends {
  trends: TopicTrend[];
  /** Topics with answers, but too few to compare. */
  notEnough: { topicId: TopicId; total: number }[];
}

function percent(rows: AttemptRecord[]): number {
  return Math.round((rows.filter((a) => a.correct).length / rows.length) * 100);
}

/**
 * Compares the first answers with the latest ones (two separate groups of equal
 * size, at most `maxWindow` each). Needs at least `min` answers.
 */
function compare(sorted: AttemptRecord[], min: number, maxWindow: number): Trend | null {
  if (sorted.length < min) return null;
  const window = Math.min(maxWindow, Math.floor(sorted.length / 2));
  const before = percent(sorted.slice(0, window));
  const after = percent(sorted.slice(-window));
  return { window, before, after, delta: after - before };
}

function byTime(a: AttemptRecord, b: AttemptRecord): number {
  return a.createdAt - b.createdAt;
}

export function topicTrends(attempts: AttemptRecord[]): TopicTrends {
  const groups = new Map<TopicId, AttemptRecord[]>();
  for (const a of attempts) {
    const list = groups.get(a.topicId) ?? [];
    list.push(a);
    groups.set(a.topicId, list);
  }
  const trends: TopicTrend[] = [];
  const notEnough: TopicTrends['notEnough'] = [];
  for (const [topicId, list] of groups) {
    const trend = compare([...list].sort(byTime), MIN_TOPIC_ATTEMPTS, MAX_TOPIC_WINDOW);
    if (trend) trends.push({ topicId, total: list.length, ...trend });
    else notEnough.push({ topicId, total: list.length });
  }
  return { trends, notEnough };
}

export function overallTrend(attempts: AttemptRecord[]): Trend | null {
  return compare([...attempts].sort(byTime), MIN_OVERALL_ATTEMPTS, MAX_OVERALL_WINDOW);
}
