import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAR_EXERCISES } from '@/data/exercises';
import { GRAMMAR_TOPICS } from '@/data/grammarTopics';
import { EXERCISE_TEXT_EN, TOPIC_DESCRIPTION_EN } from '@/data/exercisesEn';
import { checkExercise } from '@/engine/checker';
import { exerciseText, topicDescription } from '@/data/localize';
import { setLang } from '@/i18n';
import type { Exercise } from '@/types';

const topicIds = new Set(GRAMMAR_TOPICS.map((t) => t.id));
const DIFFICULTIES = ['A2', 'B1', 'B1+', 'B2', 'IELTS'];
const CYRILLIC = /[А-Яа-яЁё]/;

test('exercise ids are unique', () => {
  const ids = GRAMMAR_EXERCISES.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every exercise has a known topic and difficulty', () => {
  for (const e of GRAMMAR_EXERCISES) {
    assert.ok(topicIds.has(e.topicId), `${e.id}: unknown topic ${e.topicId}`);
    assert.ok(DIFFICULTIES.includes(e.difficulty), `${e.id}: unknown difficulty ${e.difficulty}`);
    assert.ok(e.questionEn.trim().length > 0, `${e.id}: empty question`);
    assert.ok(e.explanationRu.trim().length > 0, `${e.id}: empty explanation`);
  }
});

test('multiple choice and find-the-error exercises are well formed', () => {
  for (const e of GRAMMAR_EXERCISES) {
    const d = e.data;
    if (d.type === 'multiple_choice') {
      assert.ok(d.options.length >= 2, `${e.id}: needs at least 2 options`);
      assert.ok(d.options.some((o) => o.id === d.correctOptionId), `${e.id}: correct option is missing`);
      assert.equal(new Set(d.options.map((o) => o.id)).size, d.options.length, `${e.id}: duplicate option ids`);
      assert.equal(new Set(d.options.map((o) => o.text)).size, d.options.length, `${e.id}: duplicate option texts`);
    }
    if (d.type === 'find_error') {
      assert.ok(d.errorSegmentIndex >= 0 && d.errorSegmentIndex < d.sentenceParts.length, `${e.id}: bad segment index`);
      assert.ok(d.correction.trim().length > 0, `${e.id}: empty correction`);
    }
    if (d.type === 'fill_blank') {
      assert.ok(d.acceptedAnswers.length > 0, `${e.id}: no accepted answers`);
    }
  }
});

/** What the learner actually sees, so that the same task is not in the bank twice. */
function visibleTask(e: Exercise): string {
  const d = e.data;
  let body: string;
  if (d.type === 'multiple_choice') {
    // a sentence with a gap is the task itself; a generic question ("Which sentence is correct?") is told apart by its options
    body = e.questionEn.includes('___') ? e.questionEn : `${e.questionEn}|${d.options.map((o) => o.text).sort().join('/')}`;
  }
  else if (d.type === 'fill_blank') body = `${d.promptBefore ?? ''}|${d.promptAfter ?? ''}`;
  else if (d.type === 'find_error') body = d.sentenceParts.join(' ');
  else body = e.questionEn;
  return `${e.topicId}::${e.type}::${body.toLowerCase().trim()}`;
}

test('no task is repeated in the exercise bank', () => {
  const seen = new Map<string, string>();
  for (const e of GRAMMAR_EXERCISES) {
    const key = visibleTask(e);
    assert.ok(!seen.has(key), `${e.id} repeats ${seen.get(key)}`);
    seen.set(key, e.id);
  }
});

test('a find-the-error exercise really contains the error', () => {
  for (const e of GRAMMAR_EXERCISES) {
    if (e.data.type !== 'find_error') continue;
    const { sentenceParts, errorSegmentIndex, correction } = e.data;
    const wrongPart = sentenceParts[errorSegmentIndex].toLowerCase();
    // the correction must differ from the part that is marked as wrong
    assert.notEqual(wrongPart.replace(/[.,!?]+$/, ''), correction.toLowerCase().replace(/[.,!?]+$/, ''), `${e.id}: the correction equals the "wrong" part`);
  }
});

function correctAnswer(e: Exercise): [unknown, string?] {
  const d = e.data;
  if (d.type === 'multiple_choice') return [d.correctOptionId];
  if (d.type === 'fill_blank') return [d.acceptedAnswers[0]];
  if (d.type === 'find_error') return [d.errorSegmentIndex, d.correction];
  return [e.exampleEn];
}

function wrongAnswer(e: Exercise): [unknown, string?] {
  const d = e.data;
  if (d.type === 'multiple_choice') return [d.options.find((o) => o.id !== d.correctOptionId)!.id];
  if (d.type === 'fill_blank') return ['zzz'];
  if (d.type === 'find_error') return [(d.errorSegmentIndex + 1) % d.sentenceParts.length, 'zzz'];
  return ['hello world'];
}

test('every exercise accepts its own correct answer and rejects a wrong one', () => {
  for (const e of GRAMMAR_EXERCISES) {
    const [a, c] = correctAnswer(e);
    assert.equal(checkExercise(e, a, c).outcome, 'correct', `${e.id}: correct answer rejected`);
    const [wa, wc] = wrongAnswer(e);
    assert.notEqual(checkExercise(e, wa, wc).outcome, 'correct', `${e.id}: wrong answer accepted`);
  }
});

test('every exercise has complete English text without Russian letters', () => {
  setLang('en');
  try {
    const ids = new Set(GRAMMAR_EXERCISES.map((e) => e.id));
    for (const key of Object.keys(EXERCISE_TEXT_EN)) assert.ok(ids.has(key), `${key}: text for an unknown exercise`);
    for (const e of GRAMMAR_EXERCISES) {
      assert.ok(EXERCISE_TEXT_EN[e.id], `${e.id}: no English text`);
      const text = exerciseText(e);
      // prompt and notes exist only for writing exercises
      const fields = e.type === 'write_sentence' ? text : { ...text, prompt: '-', notes: '-' };
      for (const [field, value] of Object.entries(fields)) {
        assert.ok(value && value.trim().length > 0, `${e.id}: empty ${field}`);
        assert.ok(!CYRILLIC.test(value), `${e.id}: Russian letters in ${field}`);
      }
      if (e.type === 'write_sentence') {
        assert.ok(text.prompt && text.notes, `${e.id}: writing exercise needs a prompt and notes`);
      }
    }
    for (const topic of GRAMMAR_TOPICS) {
      assert.ok(TOPIC_DESCRIPTION_EN[topic.id], `${topic.id}: no English description`);
      assert.ok(!CYRILLIC.test(topicDescription(topic)), `${topic.id}: Russian letters in description`);
    }
  } finally {
    setLang('ru');
  }
});

test('the bank covers every level for the adaptive diagnostic', () => {
  const pool = GRAMMAR_EXERCISES.filter((e) => e.type !== 'write_sentence');
  for (const level of ['A2', 'B1', 'B1+', 'B2']) {
    assert.ok(pool.filter((e) => e.difficulty === level).length >= 12, `too few ${level} exercises`);
  }
  for (const topic of GRAMMAR_TOPICS) {
    assert.ok(GRAMMAR_EXERCISES.filter((e) => e.topicId === topic.id).length >= 8, `${topic.id}: fewer than 8 exercises`);
  }
});
