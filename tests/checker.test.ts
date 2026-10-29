import test from 'node:test';
import assert from 'node:assert/strict';
import { checkExercise } from '@/engine/checker';
import { getExerciseById } from '@/data/exercises';
import { setLang } from '@/i18n';
import type { Exercise } from '@/types';

setLang('ru');

function exercise(id: string): Exercise {
  const ex = getExerciseById(id);
  assert.ok(ex, `exercise ${id} exists`);
  return ex;
}

test('multiple choice: the right option is correct, any other is incorrect', () => {
  const ex = exercise('psc-005'); // Water ___ at 100 degrees: option "a" = boils
  assert.equal(checkExercise(ex, 'a').outcome, 'correct');
  assert.equal(checkExercise(ex, 'b').outcome, 'incorrect');
  assert.equal(checkExercise(ex, 'b').suggestedCorrection, 'boils');
});

test('fill in: accepted variants, capitals, punctuation and curly apostrophes', () => {
  const ex = exercise('pspp-006'); // I ___ (not / see) him since last summer
  for (const answer of ["haven't seen", 'have not seen', 'Have Not Seen.', '  haven’t   seen  ', "HAVEN'T SEEN!"]) {
    assert.equal(checkExercise(ex, answer).outcome, 'correct', answer);
  }
  assert.equal(checkExercise(ex, 'did not see').outcome, 'incorrect');
});

test('fill in: a typo in the middle of a word is "almost correct", but still incorrect', () => {
  const ex = exercise('pspp-006');
  for (const answer of ["have't seen", 'havent seen', 'have not seeen']) {
    const result = checkExercise(ex, answer);
    assert.equal(result.outcome, 'incorrect', answer);
    assert.equal(result.nearMiss, true, answer);
  }
  assert.equal(checkExercise(exercise('prep-006'), 'sinse').nearMiss, true);
});

test('fill in: grammar mistakes are not mistaken for typos', () => {
  // ending change: melt / melts
  const melts = checkExercise(exercise('cond-005'), 'melt');
  assert.equal(melts.outcome, 'incorrect');
  assert.notEqual(melts.nearMiss, true);
  // short word: a / an
  const article = checkExercise(exercise('art-006'), 'a');
  assert.equal(article.outcome, 'incorrect');
  assert.notEqual(article.nearMiss, true);
  // a different word
  assert.notEqual(checkExercise(exercise('prep-006'), 'for').nearMiss, true);
});

test('find the error: needs the right part AND the right correction', () => {
  const ex = exercise('ff-006'); // I will call you / when I will arrive / at the station.
  assert.equal(checkExercise(ex, 1, 'when I arrive').outcome, 'correct');
  assert.equal(checkExercise(ex, 1, 'When I arrive.').outcome, 'correct'); // capitals, full stop
  assert.equal(checkExercise(ex, 2, 'when I arrive').outcome, 'incorrect'); // wrong part
  assert.equal(checkExercise(ex, 1, 'when I came').outcome, 'incorrect'); // wrong fix
  assert.equal(checkExercise(ex, 1, '').outcome, 'incorrect'); // empty fix
});

test('find the error: a typo in the correction is "almost correct" only if the part is right', () => {
  const ex = exercise('ff-006');
  const typo = checkExercise(ex, 1, 'when I arive');
  assert.equal(typo.outcome, 'incorrect');
  assert.equal(typo.nearMiss, true);
  assert.notEqual(checkExercise(ex, 2, 'when I arive').nearMiss, true);
});

test('write a sentence: pattern match is correct, partial match needs review, no match is incorrect', () => {
  const advice = exercise('mod-008'); // advice with "should"
  assert.equal(checkExercise(advice, 'You should rest more.').outcome, 'correct');
  assert.equal(checkExercise(advice, "You shouldn't work so late.").outcome, 'correct');
  assert.equal(checkExercise(advice, 'He should to rest').outcome, 'needs_review');
  assert.equal(checkExercise(advice, 'I think rest is good.').outcome, 'incorrect');
});

test('write a sentence: an empty answer is incorrect', () => {
  const result = checkExercise(exercise('pspp-008'), '   ');
  assert.equal(result.outcome, 'incorrect');
  assert.ok(result.detail);
});

test('write a sentence: present perfect experience', () => {
  const ex = exercise('pspp-008');
  assert.equal(checkExercise(ex, "I've been to Spain.").outcome, 'correct');
  assert.equal(checkExercise(ex, 'I went to Spain.').outcome, 'incorrect');
});

test('feedback messages follow the interface language', () => {
  const ex = exercise('prep-006');
  setLang('ru');
  assert.match(checkExercise(ex, 'for').detail ?? '', /Принимаются/);
  setLang('en');
  assert.match(checkExercise(ex, 'for').detail ?? '', /Accepted/);
  setLang('ru');
});
