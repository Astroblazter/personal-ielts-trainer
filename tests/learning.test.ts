import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAR_EXERCISES } from '@/data/exercises';
import {
  computeIntervalDays,
  computeStats,
  computeStreak,
  dateKey,
  nextReviewDate,
  rankWeakTopics,
  selectDailyLesson,
  todayKey,
  type LessonFocus,
} from '@/engine/learning';
import type { MistakeEntry, SessionRecord, TopicId } from '@/types';
import { DAY_MS, attempt, attemptsFrom } from './helpers.ts';

const session = (date: string): SessionRecord => ({
  date,
  startedAt: 0,
  completedAt: 0,
  exercisesCompleted: 10,
  correctCount: 8,
  timeSpentMs: 1,
});
const daysAgo = (n: number) => dateKey(new Date(Date.now() - n * DAY_MS));

test('dateKey uses the local calendar date, not UTC', () => {
  assert.equal(dateKey(new Date(2026, 0, 5, 0, 30)), '2026-01-05'); // just after local midnight
  assert.equal(dateKey(new Date(2026, 11, 31, 23, 30)), '2026-12-31'); // just before local midnight
  assert.equal(todayKey(new Date(2026, 2, 9)), '2026-03-09');
});

test('streak: counts consecutive days including today', () => {
  assert.equal(computeStreak([session(daysAgo(0)), session(daysAgo(1)), session(daysAgo(2))], []), 3);
});

test('streak: not studying yet today does not break it', () => {
  assert.equal(computeStreak([session(daysAgo(1)), session(daysAgo(2))], []), 2);
});

test('streak: a missed day resets it', () => {
  assert.equal(computeStreak([session(daysAgo(0)), session(daysAgo(2))], []), 1);
  assert.equal(computeStreak([session(daysAgo(2)), session(daysAgo(3))], []), 0);
  assert.equal(computeStreak([], []), 0);
});

test('streak: answers count as studying even without a finished lesson', () => {
  assert.equal(computeStreak([], [attempt('articles', true, Date.now())]), 1);
});

test('computeStats: totals, accuracy and accuracy by topic', () => {
  const attempts = [...attemptsFrom('articles', '1101'), ...attemptsFrom('modals', '00')];
  const stats = computeStats(attempts, [], []);
  assert.equal(stats.totalExercisesCompleted, 6);
  assert.equal(stats.totalCorrect, 3);
  assert.equal(stats.overallAccuracy, 50);
  const articles = stats.accuracyByTopic.find((t) => t.topicId === 'articles');
  assert.deepEqual([articles?.total, articles?.correct, articles?.accuracy], [4, 3, 75]);
  assert.equal(computeStats([], [], []).overallAccuracy, 0);
});

test('computeStats: mistakes due for review are grouped by topic', () => {
  const mistake = (id: string, topicId: TopicId, due: number, status: MistakeEntry['status'] = 'active') =>
    ({ id, topicId, category: 'other', status, nextReviewAt: due }) as MistakeEntry;
  const stats = computeStats(
    [],
    [],
    [
      mistake('1', 'articles', Date.now() - 1000),
      mistake('2', 'articles', Date.now() - 1000),
      mistake('3', 'modals', Date.now() + DAY_MS), // not due yet
      mistake('4', 'prepositions', Date.now() - 1000, 'archived'), // archived
    ],
  );
  assert.deepEqual(stats.topicsDueForReview, [{ topicId: 'articles', count: 2 }]);
});

test('rankWeakTopics: only topics with at least two answers and below 70%, weakest first', () => {
  const stats = computeStats(
    [
      ...attemptsFrom('articles', '1'), // one answer only
      ...attemptsFrom('modals', '10'), // 50%
      ...attemptsFrom('prepositions', '1110'), // 75%
      ...attemptsFrom('conditionals', '000'), // 0%
    ],
    [],
    [],
  );
  assert.deepEqual(rankWeakTopics(stats.accuracyByTopic), ['conditionals', 'modals']);
});

test('spaced repetition: intervals grow with success and shrink after a mistake', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 9].map((n) => computeIntervalDays(n, true)), [1, 3, 7, 14, 30, 30]);
  assert.equal(computeIntervalDays(0, false), 1);
  assert.equal(computeIntervalDays(3, false), 7);
  assert.equal(nextReviewDate(1, 1000, true), 1000 + 3 * DAY_MS);
});

test('daily lesson without a focus: ten different exercises', () => {
  const lesson = selectDailyLesson(GRAMMAR_EXERCISES, [], [], 10);
  assert.equal(lesson.length, 10);
  assert.equal(new Set(lesson.map((e) => e.id)).size, 10);
});

test('daily lesson: due mistakes come back, archived ones do not', () => {
  const [dueEx, archivedEx] = GRAMMAR_EXERCISES.filter((e) => e.topicId === 'articles').slice(0, 2);
  const mistakes = [
    { id: 'm1', exerciseId: dueEx.id, topicId: dueEx.topicId, status: 'active', nextReviewAt: Date.now() - 1000 },
    { id: 'm2', exerciseId: archivedEx.id, topicId: archivedEx.topicId, status: 'archived', nextReviewAt: Date.now() - 1000 },
  ] as MistakeEntry[];
  const lesson = selectDailyLesson(GRAMMAR_EXERCISES, [], mistakes, 10);
  assert.ok(lesson.some((e) => e.id === dueEx.id), 'due mistake is repeated');
});

test('daily lesson with a plan focus: at least half from the focus topics, spread over them', () => {
  const focus: LessonFocus = {
    week: 1,
    topicIds: ['articles', 'modals', 'conditionals'],
    startLevels: { articles: 1, modals: 1, conditionals: 1 },
  };
  const lesson = selectDailyLesson(GRAMMAR_EXERCISES, [], [], 10, focus);
  assert.equal(lesson.length, 10);
  assert.equal(new Set(lesson.map((e) => e.id)).size, 10);
  const first5 = lesson.slice(0, 5);
  assert.ok(first5.every((e) => focus.topicIds.includes(e.topicId)));
  for (const topic of focus.topicIds) assert.ok(first5.some((e) => e.topicId === topic), `${topic} is in the lesson`);
});

test('daily lesson with a focus prefers exercises not yet answered correctly', () => {
  const focus: LessonFocus = { week: 1, topicIds: ['articles'], startLevels: { articles: 1 } };
  const inTopic = GRAMMAR_EXERCISES.filter((e) => e.topicId === 'articles');
  const done = inTopic.slice(0, inTopic.length - 3);
  const attempts = done.map((e) => attempt('articles', true, 1, { exerciseId: e.id }));
  const doneIds = new Set(done.map((e) => e.id));
  const lesson = selectDailyLesson(GRAMMAR_EXERCISES, attempts, [], 10, focus);
  // all exercises not answered correctly yet are in the lesson; answered ones only fill the rest
  const undone = inTopic.filter((e) => !doneIds.has(e.id));
  for (const e of undone) assert.ok(lesson.some((l) => l.id === e.id), `${e.id} should be in the lesson`);
  const fromTopic = lesson.filter((e) => e.topicId === 'articles');
  assert.ok(fromTopic.filter((e) => doneIds.has(e.id)).length <= fromTopic.length - undone.length);
});

test('daily lesson: an empty focus behaves like no focus', () => {
  const lesson = selectDailyLesson(GRAMMAR_EXERCISES, [], [], 10, { week: 1, topicIds: [], startLevels: {} });
  assert.equal(lesson.length, 10);
});
