import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAR_EXERCISES } from '@/data/exercises';
import {
  DIAGNOSTIC_LENGTH,
  diagnosticPool,
  estimateLevel,
  levelIndex,
  pickNextExercise,
  summarize,
  targetLevel,
  type DiagnosticAnswer,
} from '@/engine/diagnostic';
import { seededRandom } from './helpers.ts';

const pool = diagnosticPool(GRAMMAR_EXERCISES);

/** Runs a whole diagnostic; `answer` decides whether the learner answers an exercise correctly. */
function runDiagnostic(answer: (level: number, rng: () => number) => boolean, seed: number): DiagnosticAnswer[] {
  const rng = seededRandom(seed);
  const answers: DiagnosticAnswer[] = [];
  while (answers.length < DIAGNOSTIC_LENGTH) {
    const ex = pickNextExercise(pool, answers, rng);
    if (!ex) break;
    const level = levelIndex(ex.difficulty);
    answers.push({ exerciseId: ex.id, topicId: ex.topicId, level, correct: answer(level, rng) });
  }
  return answers;
}

/** A learner of ability `theta`: easy items are mostly right, hard ones mostly wrong. */
function learner(theta: number) {
  return (level: number, rng: () => number) => rng() < 0.2 + 0.78 / (1 + Math.exp(-1.6 * (theta - level)));
}

const LEVELS = ['A2', 'B1', 'B1+', 'B2'];

test('the diagnostic pool contains no free-writing exercises', () => {
  assert.ok(pool.length > DIAGNOSTIC_LENGTH);
  assert.ok(pool.every((e) => e.type !== 'write_sentence'));
});

test('levelIndex maps difficulty labels to 0..3 (IELTS counts as the top level)', () => {
  assert.deepEqual(['A2', 'B1', 'B1+', 'B2', 'IELTS'].map((d) => levelIndex(d as never)), [0, 1, 2, 3, 3]);
});

test('staircase: one level up after a correct answer, one down after a mistake, within 0..3', () => {
  const a = (level: number, correct: boolean): DiagnosticAnswer => ({ exerciseId: 'x', topicId: 'articles', level, correct });
  assert.equal(targetLevel([]), 1); // starts at B1
  assert.equal(targetLevel([a(1, true)]), 2);
  assert.equal(targetLevel([a(2, false)]), 1);
  assert.equal(targetLevel([a(3, true)]), 3); // cannot go above B2
  assert.equal(targetLevel([a(0, false)]), 0); // cannot go below A2
});

test('a run has the planned length, never repeats an exercise, and covers most topics', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const answers = runDiagnostic(learner(1.5), seed);
    assert.equal(answers.length, DIAGNOSTIC_LENGTH);
    assert.equal(new Set(answers.map((x) => x.exerciseId)).size, answers.length);
    assert.ok(new Set(answers.map((x) => x.topicId)).size >= 11, `seed ${seed}: too few topics`);
  }
});

test('the next question is null when the pool is exhausted', () => {
  const all: DiagnosticAnswer[] = pool.map((e) => ({
    exerciseId: e.id,
    topicId: e.topicId,
    level: levelIndex(e.difficulty),
    correct: true,
  }));
  assert.equal(pickNextExercise(pool, all), null);
});

test('questions get harder after correct answers and easier after mistakes', () => {
  const allCorrect = runDiagnostic(() => true, 11);
  const allWrong = runDiagnostic(() => false, 11);
  const mean = (xs: DiagnosticAnswer[]) => xs.reduce((s, x) => s + x.level, 0) / xs.length;
  assert.ok(mean(allCorrect) > mean(allWrong) + 1, 'difficulty should follow the answers');
});

test('the level estimate rises with ability and covers both ends of the scale', () => {
  const meanScore = (theta: number) => {
    let sum = 0;
    for (let seed = 1; seed <= 60; seed++) sum += estimateLevel(runDiagnostic(learner(theta), seed)).score;
    return sum / 60;
  };
  const weak = meanScore(-0.5);
  const middle = meanScore(1.5);
  const strong = meanScore(3.5);
  assert.ok(weak < middle && middle < strong, `scores should increase: ${weak} < ${middle} < ${strong}`);
  assert.ok(strong - weak > 1.2, 'weak and strong learners should be clearly apart');
});

test('a learner who answers everything correctly is placed high, one who misses everything low', () => {
  const high = estimateLevel(runDiagnostic(() => true, 21)).level;
  const low = estimateLevel(runDiagnostic(() => false, 21)).level;
  assert.ok(LEVELS.indexOf(high) >= 2, `all correct gave ${high}`);
  assert.ok(LEVELS.indexOf(low) <= 1, `all wrong gave ${low}`);
});

test('estimateLevel maps the average level to a label (the first answers are warm-up)', () => {
  const at = (level: number, n = 12): DiagnosticAnswer[] =>
    Array.from({ length: n }, (_, i) => ({ exerciseId: `e${i}`, topicId: 'articles', level, correct: true }));
  assert.equal(estimateLevel(at(0)).level, 'A2');
  assert.equal(estimateLevel(at(1)).level, 'B1');
  assert.equal(estimateLevel(at(2)).level, 'B1+');
  assert.equal(estimateLevel(at(3)).level, 'B2');
  // warm-up: four easy answers at the start do not drag a B2 learner down
  const warm = [...at(0, 4), ...at(3, 12)];
  assert.equal(estimateLevel(warm).level, 'B2');
  assert.equal(estimateLevel([]).level, 'B1');
});

test('summarize counts answers per topic and per level', () => {
  const answers: DiagnosticAnswer[] = [
    { exerciseId: '1', topicId: 'articles', level: 1, correct: true },
    { exerciseId: '2', topicId: 'articles', level: 2, correct: false },
    { exerciseId: '3', topicId: 'modals', level: 1, correct: true },
  ];
  const s = summarize(answers);
  assert.deepEqual(s.perTopic.articles, { correct: 1, total: 2 });
  assert.deepEqual(s.perTopic.modals, { correct: 1, total: 1 });
  assert.deepEqual(s.perLevel, [
    { level: 'B1', correct: 2, total: 2 },
    { level: 'B1+', correct: 0, total: 1 },
  ]);
});
