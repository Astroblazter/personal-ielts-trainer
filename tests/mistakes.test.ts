import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTERED_REVIEW_DAYS,
  MASTERY_STREAK,
  advanceMistake,
  correctStreak,
  registerMistake,
} from '@/engine/learning';
import type { AttemptRecord, MistakeEntry } from '@/types';
import { DAY_MS, attempt } from './helpers.ts';

const NOW = 1_800_000_000_000;

/** Answers to one exercise from a pattern like "0111": 1 = correct, 0 = wrong, one per minute. */
function history(pattern: string): AttemptRecord[] {
  return [...pattern].map((c, i) => attempt('articles', c === '1', 1000 + i * 60_000, { exerciseId: 'art-001' }));
}

const details = {
  exerciseId: 'art-001',
  topicId: 'articles' as const,
  category: 'articles' as const,
  userAnswer: 'a',
  suggestedCorrection: 'an',
};

function open(status: MistakeEntry['status'] = 'active'): MistakeEntry {
  return { ...registerMistake(undefined, details, NOW - DAY_MS, 'm1'), status };
}

test('the rule: three correct answers in a row close a mistake, closed ones are re-checked in 30 days', () => {
  assert.equal(MASTERY_STREAK, 3);
  assert.equal(MASTERED_REVIEW_DAYS, 30);
});

test('correctStreak counts correct answers at the end of the history', () => {
  assert.equal(correctStreak([]), 0);
  assert.equal(correctStreak(history('0')), 0);
  assert.equal(correctStreak(history('110')), 0);
  assert.equal(correctStreak(history('011')), 2);
  assert.equal(correctStreak(history('0111')), 3);
  assert.equal(correctStreak(history('1111')), 4);
});

test('correctStreak goes by time, not by the order of the list', () => {
  assert.equal(correctStreak([...history('0111')].reverse()), 3);
  assert.equal(correctStreak([...history('1110')].reverse()), 0);
});

test('first correct answer: still active, review in 3 days', () => {
  const moved = advanceMistake(open(), history('01'), NOW);
  assert.equal(moved.status, 'active');
  assert.equal(moved.reviewIntervalDays, 3);
  assert.equal(moved.nextReviewAt, NOW + 3 * DAY_MS);
});

test('second correct answer in a row: still active, review in 7 days', () => {
  const moved = advanceMistake(open(), history('011'), NOW);
  assert.equal(moved.status, 'active');
  assert.equal(moved.reviewIntervalDays, 7);
  assert.equal(moved.nextReviewAt, NOW + 7 * DAY_MS);
});

test('third correct answer in a row: the mistake is closed, next check in 30 days', () => {
  const moved = advanceMistake(open(), history('0111'), NOW);
  assert.equal(moved.status, 'understood');
  assert.equal(moved.reviewIntervalDays, 30);
  assert.equal(moved.nextReviewAt, NOW + 30 * DAY_MS);
});

test('a wrong answer in between starts the count again', () => {
  const moved = advanceMistake(open(), history('0110' + '1'), NOW); // 1,1 then wrong, then one correct
  assert.equal(moved.status, 'active');
  assert.equal(moved.reviewIntervalDays, 3);
});

test('a mistake marked understood by hand stays closed after a correct answer', () => {
  const manual = { ...open('understood'), nextReviewAt: NOW + 30 * DAY_MS };
  const moved = advanceMistake(manual, history('01'), NOW);
  assert.equal(moved.status, 'understood');
  assert.equal(moved.nextReviewAt, NOW + 30 * DAY_MS); // not pulled back to 3 days
});

test('an archived mistake is left alone', () => {
  const archived = open('archived');
  assert.deepEqual(advanceMistake(archived, history('0111'), NOW), archived);
});

test('advanceMistake does not change the mistake it was given', () => {
  const original = open();
  const copy = structuredClone(original);
  advanceMistake(original, history('0111'), NOW);
  assert.deepEqual(original, copy);
});

test('a new wrong answer creates an active mistake due for review tomorrow', () => {
  const created = registerMistake(undefined, details, NOW, 'new-id');
  assert.equal(created.id, 'new-id');
  assert.equal(created.status, 'active');
  assert.equal(created.attempts, 1);
  assert.equal(created.createdAt, NOW);
  assert.equal(created.nextReviewAt, NOW + DAY_MS);
  assert.equal(created.reviewIntervalDays, 1);
  assert.equal(created.userAnswer, 'a');
  assert.equal(created.suggestedCorrection, 'an');
  assert.equal(created.category, 'articles');
});

test('a repeated wrong answer re-opens a closed mistake and counts it again', () => {
  const closed: MistakeEntry = { ...open(), status: 'understood', attempts: 2, nextReviewAt: NOW + 30 * DAY_MS };
  const again = registerMistake(closed, { ...details, userAnswer: 'the' }, NOW, 'ignored-id');
  assert.equal(again.id, closed.id); // same entry, no duplicate
  assert.equal(again.createdAt, closed.createdAt);
  assert.equal(again.status, 'active');
  assert.equal(again.attempts, 3);
  assert.equal(again.userAnswer, 'the');
  assert.equal(again.reviewIntervalDays, 7); // wrong answers get half of the normal interval (14 / 2)
  assert.equal(again.nextReviewAt, NOW + 7 * DAY_MS);
});

test('a whole story: wrong, three correct, wrong again, three correct again', () => {
  const answers: AttemptRecord[] = [];
  const give = (correct: boolean) =>
    answers.push(attempt('articles', correct, 1000 + answers.length * 60_000, { exerciseId: 'art-001' }));

  give(false);
  let mistake = registerMistake(undefined, details, NOW, 'm1');
  assert.equal(mistake.status, 'active');

  for (let i = 1; i <= 3; i++) {
    give(true);
    mistake = advanceMistake(mistake, answers, NOW);
    assert.equal(mistake.status, i < 3 ? 'active' : 'understood', `correct answer ${i}`);
  }

  give(false);
  mistake = registerMistake(mistake, details, NOW, 'other-id');
  assert.equal(mistake.status, 'active');
  assert.equal(mistake.id, 'm1');
  assert.equal(mistake.attempts, 2);

  for (let i = 1; i <= 3; i++) {
    give(true);
    mistake = advanceMistake(mistake, answers, NOW);
    assert.equal(mistake.status, i < 3 ? 'active' : 'understood', `second round, correct answer ${i}`);
  }
});
