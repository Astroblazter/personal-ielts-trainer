import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAR_EXERCISES, getExerciseById, getExercisesByTopic } from '@/data/exercises';
import { levelIndex } from '@/engine/diagnostic';
import { dateKey } from '@/engine/learning';
import {
  EXERCISES_PER_TOPIC,
  buildPlan,
  currentWeekIndex,
  lessonFocus,
  levelLabel,
  orderFromLevel,
  rankTopics,
  recommendedStartLevel,
  targetAccuracy,
  weekProgress,
} from '@/engine/studyPlan';
import type { AttemptRecord, MistakeEntry, SessionRecord, TopicId } from '@/types';
import { DAY_MS, attempt } from './helpers.ts';

const levelOf = (id: string) => {
  const ex = getExerciseById(id);
  return ex ? levelIndex(ex.difficulty) : undefined;
};
// 1 October 2026, 15:00 local time
const DIAGNOSTIC_AT = new Date(2026, 9, 1, 15, 0).getTime();

/** Diagnostic answers: weak in articles, modals, conditionals; strong elsewhere. */
function diagnosticAttempts(): AttemptRecord[] {
  const weak = new Set<string>(['articles', 'modals', 'conditionals']);
  const topics = [...new Set(GRAMMAR_EXERCISES.map((e) => e.topicId))];
  return topics.flatMap((topic) =>
    [0, 1].map((i) => attempt(topic, !weak.has(topic), DIAGNOSTIC_AT - 3_600_000 + i, { source: 'diagnostic' })),
  );
}

test('rankTopics puts the weakest topics first', () => {
  const ranked = rankTopics(diagnosticAttempts(), DIAGNOSTIC_AT);
  assert.deepEqual(new Set(ranked.slice(0, 3)), new Set(['articles', 'modals', 'conditionals']));
  assert.equal(ranked.length, 15);
});

test('rankTopics treats a topic without answers as unknown, not as the weakest', () => {
  const ranked = rankTopics(
    [attempt('articles', false, 1), attempt('articles', false, 2), attempt('modals', true, 3), attempt('modals', true, 4)],
    10,
  );
  assert.equal(ranked[0], 'articles');
  assert.ok(ranked.indexOf('modals') > ranked.indexOf('conditionals')); // strong topic after unknown ones
});

test('rankTopics ignores answers given after the cutoff', () => {
  const before = rankTopics([attempt('articles', false, 1), attempt('articles', false, 2)], 10);
  const later = rankTopics(
    [attempt('articles', false, 1), attempt('articles', false, 2), ...[3, 4, 5, 6].map((i) => attempt('articles', true, 100 + i))],
    10,
  );
  assert.deepEqual(later, before);
});

test('plan: four consecutive weeks of seven days starting on the diagnostic day', () => {
  const plan = buildPlan(DIAGNOSTIC_AT, diagnosticAttempts(), DIAGNOSTIC_AT + DAY_MS);
  assert.equal(plan.length, 4);
  assert.equal(dateKey(new Date(plan[0].start)), '2026-10-01');
  assert.equal(dateKey(new Date(plan[0].end - 1)), '2026-10-07');
  assert.equal(dateKey(new Date(plan[3].end - 1)), '2026-10-28');
  for (let i = 0; i < 3; i++) assert.equal(plan[i].end, plan[i + 1].start);
});

test('plan: weeks 1-3 take three different topics each, the weakest first; week 4 is live', () => {
  const plan = buildPlan(DIAGNOSTIC_AT, diagnosticAttempts(), DIAGNOSTIC_AT + DAY_MS);
  assert.ok(plan.every((w) => w.topicIds.length === 3));
  const fixed = plan.slice(0, 3).flatMap((w) => w.topicIds);
  assert.equal(new Set(fixed).size, 9);
  assert.deepEqual(new Set(plan[0].topicIds), new Set(['articles', 'modals', 'conditionals']));
  assert.deepEqual(plan.map((w) => w.live), [false, false, false, true]);
});

test('plan: weeks 1-3 do not change when you practise, week 4 does', () => {
  const base = diagnosticAttempts();
  const now = DIAGNOSTIC_AT + 2 * DAY_MS;
  const practice = Array.from({ length: 12 }, (_, i) => attempt('articles', true, DIAGNOSTIC_AT + DAY_MS + i));
  const before = buildPlan(DIAGNOSTIC_AT, base, now);
  const after = buildPlan(DIAGNOSTIC_AT, [...base, ...practice], now);
  for (let i = 0; i < 3; i++) assert.deepEqual(after[i].topicIds, before[i].topicIds);
  assert.ok(before[3].topicIds.includes('articles'));
  assert.ok(!after[3].topicIds.includes('articles')); // now strong enough to leave the review week
});

test('currentWeekIndex: before the plan, in a week, after the plan', () => {
  const plan = buildPlan(DIAGNOSTIC_AT, [], DIAGNOSTIC_AT);
  assert.equal(currentWeekIndex(plan, DIAGNOSTIC_AT - 2 * DAY_MS), 0);
  assert.equal(currentWeekIndex(plan, DIAGNOSTIC_AT), 1);
  assert.equal(currentWeekIndex(plan, DIAGNOSTIC_AT + 8 * DAY_MS), 2);
  assert.equal(currentWeekIndex(plan, DIAGNOSTIC_AT + 27 * DAY_MS), 4);
  assert.equal(currentWeekIndex(plan, DIAGNOSTIC_AT + 40 * DAY_MS), 5);
});

test('target accuracy depends on the level', () => {
  assert.deepEqual((['not_assessed', 'A2', 'B1', 'B1+', 'B2'] as const).map(targetAccuracy), [70, 70, 70, 80, 80]);
});

const noSessions: SessionRecord[] = [];
const noMistakes: MistakeEntry[] = [];

test('week progress: a topic is done after enough answers with enough accuracy', () => {
  const plan = buildPlan(DIAGNOSTIC_AT, diagnosticAttempts(), DIAGNOSTIC_AT);
  const week = plan[0];
  const now = DIAGNOSTIC_AT + DAY_MS;
  const topic = week.topicIds[0];
  const answers = (correct: number, total: number) =>
    Array.from({ length: total }, (_, i) => attempt(topic, i < correct, DIAGNOSTIC_AT + DAY_MS + i));

  const done = weekProgress(week, 'B1', answers(9, EXERCISES_PER_TOPIC), noSessions, noMistakes, now).topics[0];
  assert.equal(done.done, true);
  assert.equal(done.accuracy, 90);

  const tooFew = weekProgress(week, 'B1', answers(5, 5), noSessions, noMistakes, now).topics[0];
  assert.equal(tooFew.done, false);
  const tooInaccurate = weekProgress(week, 'B1', answers(5, EXERCISES_PER_TOPIC), noSessions, noMistakes, now).topics[0];
  assert.equal(tooInaccurate.done, false);
  // 75% is enough for B1 (70%) but not for B2 (80%)
  assert.equal(weekProgress(week, 'B1', answers(15, 20), noSessions, noMistakes, now).topics[0].done, true);
  assert.equal(weekProgress(week, 'B2', answers(15, 20), noSessions, noMistakes, now).topics[0].done, false);
  assert.equal(weekProgress(week, 'B1', [], noSessions, noMistakes, now).topics[0].accuracy, null);
});

test('week progress does not count diagnostic answers or answers from other weeks', () => {
  const plan = buildPlan(DIAGNOSTIC_AT, diagnosticAttempts(), DIAGNOSTIC_AT);
  const week = plan[1];
  const topic = week.topicIds[0];
  const attempts = [
    ...Array.from({ length: 10 }, (_, i) => attempt(topic, true, week.start + i, { source: 'diagnostic' })),
    ...Array.from({ length: 10 }, (_, i) => attempt(topic, true, week.start - DAY_MS + i)), // week before
    ...Array.from({ length: 3 }, (_, i) => attempt(topic, true, week.start + DAY_MS + i)),
  ];
  const progress = weekProgress(week, 'B1', attempts, noSessions, noMistakes, week.start + 2 * DAY_MS);
  assert.equal(progress.topics[0].attempts, 3);
});

test('week progress: state, lessons and active mistakes of the week', () => {
  const plan = buildPlan(DIAGNOSTIC_AT, diagnosticAttempts(), DIAGNOSTIC_AT);
  const week = plan[0];
  const sessions: SessionRecord[] = ['2026-10-01', '2026-10-03', '2026-10-09'].map((date) => ({
    date,
    startedAt: 0,
    completedAt: 0,
    exercisesCompleted: 10,
    correctCount: 8,
    timeSpentMs: 1,
  }));
  const mistake = (topicId: TopicId, status: MistakeEntry['status']) => ({ id: `${topicId}-${status}`, topicId, status }) as MistakeEntry;
  const mistakes = [mistake(week.topicIds[0], 'active'), mistake(week.topicIds[0], 'understood'), mistake('word_order', 'active')];

  const progress = weekProgress(week, 'B1', [], sessions, mistakes, DIAGNOSTIC_AT + DAY_MS);
  assert.equal(progress.state, 'current');
  assert.equal(progress.lessonsDone, 2); // the lesson of 9 October belongs to week 2
  assert.equal(progress.activeMistakes, 1);
  assert.equal(weekProgress(plan[2], 'B1', [], sessions, mistakes, DIAGNOSTIC_AT).state, 'upcoming');
  assert.equal(weekProgress(week, 'B1', [], sessions, mistakes, DIAGNOSTIC_AT + 10 * DAY_MS).state, 'past');
});

function answered(topicId: TopicId, level: number, correct: boolean): AttemptRecord {
  const ex = getExercisesByTopic(topicId).find((e) => levelIndex(e.difficulty) === level);
  assert.ok(ex, `${topicId} has a level ${level} exercise`);
  return attempt(topicId, correct, 1, { exerciseId: ex.id });
}

function recommended(topicId: TopicId, attempts: AttemptRecord[], overall: Parameters<typeof recommendedStartLevel>[0]['overall']) {
  return levelLabel(
    recommendedStartLevel({
      attempts,
      topicId,
      overall,
      levelOf,
      availableLevels: getExercisesByTopic(topicId).map((e) => levelIndex(e.difficulty)),
    }),
  );
}

test('recommended start level: no answers use the overall level, no correct answers the easiest', () => {
  assert.equal(recommended('articles', [], 'B1+'), 'B1+');
  assert.equal(recommended('articles', [], 'not_assessed'), 'B1');
  assert.equal(recommended('articles', [answered('articles', 1, false), answered('articles', 2, false)], 'B1'), 'A2');
});

test('recommended start level: hardest correct level, one step up when accuracy is at least 70%', () => {
  assert.equal(recommended('articles', [answered('articles', 1, true)], 'B1'), 'B1+');
  assert.equal(recommended('articles', [answered('articles', 1, true), answered('articles', 3, false)], 'B1'), 'B1');
  assert.equal(recommended('articles', [answered('articles', 3, true)], 'B1'), 'B2'); // cannot go above B2
});

test('recommended level always lies inside the levels the topic has', () => {
  for (const topic of new Set(GRAMMAR_EXERCISES.map((e) => e.topicId))) {
    const levels = getExercisesByTopic(topic).map((e) => levelIndex(e.difficulty));
    for (const overall of ['not_assessed', 'A2', 'B1', 'B1+', 'B2'] as const) {
      const level = recommendedStartLevel({ attempts: [], topicId: topic, overall, levelOf, availableLevels: levels });
      assert.ok(level >= Math.min(...levels) && level <= Math.max(...levels), `${topic} ${overall}`);
    }
  }
});

test('orderFromLevel: the start level and harder first, then easier ones; nothing lost', () => {
  const exercises = getExercisesByTopic('articles');
  const levels = (start: number) => orderFromLevel(exercises, start).map((e) => levelIndex(e.difficulty));
  const fromB1plus = levels(2);
  const firstEasier = fromB1plus.findIndex((l) => l < 2);
  assert.ok(fromB1plus.slice(0, firstEasier).every((l, i, a) => i === 0 || a[i - 1] <= l)); // upwards
  assert.ok(fromB1plus.slice(firstEasier).every((l, i, a) => i === 0 || a[i - 1] >= l)); // then downwards
  assert.equal(fromB1plus[0], 2);
  const ordered = orderFromLevel(exercises, 0);
  assert.equal(ordered.length, exercises.length);
  assert.equal(new Set(ordered.map((e) => e.id)).size, exercises.length);
});

test('lessonFocus: the topics of the current week with start levels; null without a diagnostic or after the plan', () => {
  const base = {
    attempts: diagnosticAttempts(),
    overall: 'B1' as const,
    exercisesOf: getExercisesByTopic,
    levelOf,
  };
  const focus = lessonFocus({ ...base, diagnosticAt: DIAGNOSTIC_AT, now: DIAGNOSTIC_AT + DAY_MS });
  assert.ok(focus);
  assert.equal(focus.week, 1);
  assert.equal(focus.topicIds.length, 3);
  for (const id of focus.topicIds) assert.equal(typeof focus.startLevels[id], 'number');
  assert.equal(lessonFocus({ ...base, diagnosticAt: null, now: DIAGNOSTIC_AT }), null);
  assert.equal(lessonFocus({ ...base, diagnosticAt: DIAGNOSTIC_AT, now: DIAGNOSTIC_AT + 40 * DAY_MS }), null);
  assert.equal(lessonFocus({ ...base, diagnosticAt: DIAGNOSTIC_AT, now: DIAGNOSTIC_AT - 2 * DAY_MS }), null);
});
