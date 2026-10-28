import type { AssessmentLevel, AttemptRecord, MistakeEntry, SessionRecord, TopicId } from '@/types';
import { dateKey } from '@/engine/learning';

export const PLAN_WEEKS = 4;
/** Exercises to complete per topic of the week. */
export const EXERCISES_PER_TOPIC = 10;
/** Daily lessons to complete per week. */
export const LESSONS_PER_WEEK = 5;
const TOPICS_PER_WEEK = 3;

// Prior used for topics with few or no answers: a topic with 1-2 answers must
// not look 100% weak or 100% strong.
const PRIOR_ACCURACY = 0.6;
const PRIOR_WEIGHT = 2;

/** Order of topics when weakness is equal: basics first. */
const FOUNDATION_ORDER: TopicId[] = [
  'present_simple_vs_continuous',
  'past_simple_vs_present_perfect',
  'past_simple_vs_past_continuous',
  'future_forms',
  'articles',
  'prepositions',
  'subject_verb_agreement',
  'word_order',
  'questions_negatives',
  'countable_uncountable',
  'modals',
  'comparatives_superlatives',
  'gerunds_infinitives',
  'conditionals',
  'sentence_structure',
];

export interface PlanWeek {
  index: number; // 1..4
  start: number; // ms, local midnight
  end: number; // ms, exclusive
  topicIds: TopicId[];
  /** Week 4 is chosen from the current results, weeks 1-3 are fixed by the diagnostic. */
  live: boolean;
}

export interface TopicProgress {
  topicId: TopicId;
  attempts: number;
  correct: number;
  accuracy: number | null; // percent, null if no answers yet
  done: boolean;
}

export interface WeekProgress {
  state: 'upcoming' | 'current' | 'past';
  topics: TopicProgress[];
  lessonsDone: number;
  activeMistakes: number;
  completed: boolean;
}

export function targetAccuracy(level: AssessmentLevel): number {
  return level === 'B1+' || level === 'B2' ? 80 : 70;
}

function weakness(topicId: TopicId, attempts: AttemptRecord[], cutoff: number): number {
  const rows = attempts.filter((a) => a.topicId === topicId && a.createdAt <= cutoff);
  const correct = rows.filter((a) => a.correct).length;
  const accuracy = (correct + PRIOR_ACCURACY * PRIOR_WEIGHT) / (rows.length + PRIOR_WEIGHT);
  return 1 - accuracy;
}

/** Topics from weakest to strongest as of `cutoff`; ties are broken by the basics-first order. */
export function rankTopics(attempts: AttemptRecord[], cutoff: number): TopicId[] {
  return FOUNDATION_ORDER.map((id, order) => ({ id, order, w: weakness(id, attempts, cutoff) }))
    .sort((a, b) => b.w - a.w || a.order - b.order)
    .map((x) => x.id);
}

function addDays(ms: number, days: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime();
}

export function buildPlan(diagnosticAt: number, attempts: AttemptRecord[], now: number): PlanWeek[] {
  const d = new Date(diagnosticAt);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const baseline = rankTopics(attempts, diagnosticAt);
  const current = rankTopics(attempts, now);
  const weeks: PlanWeek[] = [];
  for (let i = 1; i <= PLAN_WEEKS; i++) {
    const live = i === PLAN_WEEKS;
    const source = live ? current : baseline;
    const from = live ? 0 : (i - 1) * TOPICS_PER_WEEK;
    weeks.push({
      index: i,
      start: addDays(start, (i - 1) * 7),
      end: addDays(start, i * 7),
      topicIds: source.slice(from, from + TOPICS_PER_WEEK),
      live,
    });
  }
  return weeks;
}

/** 0 = before the plan, 1..4 = that week, 5 = after the plan. */
export function currentWeekIndex(plan: PlanWeek[], now: number): number {
  if (now < plan[0].start) return 0;
  const week = plan.find((w) => now >= w.start && now < w.end);
  return week ? week.index : PLAN_WEEKS + 1;
}

export function weekProgress(
  week: PlanWeek,
  level: AssessmentLevel,
  attempts: AttemptRecord[],
  sessions: SessionRecord[],
  mistakes: MistakeEntry[],
  now: number,
): WeekProgress {
  const target = targetAccuracy(level);
  // Diagnostic answers are the starting point of the plan, not work done on it.
  const inWeek = attempts.filter(
    (a) => a.source !== 'diagnostic' && a.createdAt >= week.start && a.createdAt < week.end,
  );
  const topics: TopicProgress[] = week.topicIds.map((topicId) => {
    const rows = inWeek.filter((a) => a.topicId === topicId);
    const correct = rows.filter((a) => a.correct).length;
    const accuracy = rows.length > 0 ? Math.round((correct / rows.length) * 100) : null;
    return {
      topicId,
      attempts: rows.length,
      correct,
      accuracy,
      done: rows.length >= EXERCISES_PER_TOPIC && accuracy !== null && accuracy >= target,
    };
  });
  const firstDay = dateKey(new Date(week.start));
  const lastDay = dateKey(new Date(week.end - 1));
  const lessonsDone = sessions.filter((s) => s.date >= firstDay && s.date <= lastDay).length;
  const activeMistakes = mistakes.filter(
    (m) => m.status === 'active' && week.topicIds.includes(m.topicId),
  ).length;
  return {
    state: now < week.start ? 'upcoming' : now >= week.end ? 'past' : 'current',
    topics,
    lessonsDone,
    activeMistakes,
    completed: topics.length > 0 && topics.every((t) => t.done),
  };
}
