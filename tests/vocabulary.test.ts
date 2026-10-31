import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_VOCABULARY, FIRST_NEW_SEED_ID } from '@/data/vocabulary';
import { matchText } from '@/engine/checker';
import {
  MAX_NEW_PER_SESSION,
  MAX_STAGE,
  SESSION_SIZE,
  STAGE_INTERVAL_DAYS,
  buildSession,
  dueWords,
  exerciseFor,
  findGap,
  firstLetterHint,
  isNewWord,
  nextReviewTime,
  reviewWord,
  stageOf,
  statusOfStage,
  translationOptions,
} from '@/engine/vocabulary';
import type { VocabWord } from '@/types';
import { DAY_MS, seededRandom } from './helpers.ts';

const NOW = 1_800_000_000_000;
const THEMES = ['academic', 'education', 'work', 'technology', 'environment', 'health', 'society', 'culture', 'travel'];
const CYRILLIC = /[А-Яа-яЁё]/;

function word(overrides: Partial<VocabWord> = {}): VocabWord {
  return {
    id: 'w1',
    word: 'achieve',
    translationRu: 'достигать',
    exampleEn: 'She achieved her goal.',
    topicId: 'sentence_structure',
    difficulty: 'B1',
    stage: 0,
    createdAt: 0,
    reviewStatus: 'new',
    correctCount: 0,
    incorrectCount: 0,
    nextReviewAt: NOW - 1000,
    ...overrides,
  };
}

test('seed vocabulary: ids are unique and every word has a theme, a translation and a usable example', () => {
  const ids = SEED_VOCABULARY.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(SEED_VOCABULARY.length >= 70);
  for (const w of SEED_VOCABULARY) {
    assert.ok(w.theme, `${w.id}: no theme`);
    assert.ok(CYRILLIC.test(w.translationRu), `${w.id}: translation is not Russian`);
    assert.ok(findGap(w), `${w.id}: "${w.word}" is not in its example "${w.exampleEn}"`);
    assert.equal(w.stage, 0);
  }
});

test('seed vocabulary: each IELTS theme has at least five words, and the same sentence is not used twice', () => {
  for (const theme of THEMES) {
    assert.ok(SEED_VOCABULARY.filter((w) => w.theme === theme).length >= 5, `${theme}: fewer than 5 words`);
  }
  const examples = SEED_VOCABULARY.map((w) => w.exampleEn);
  assert.equal(new Set(examples).size, examples.length);
});

test('seed vocabulary: new words start at v-101 so that the upgrade of an old notebook can tell them apart', () => {
  const old = SEED_VOCABULARY.filter((w) => w.id < FIRST_NEW_SEED_ID);
  const added = SEED_VOCABULARY.filter((w) => w.id >= FIRST_NEW_SEED_ID);
  assert.equal(old.length, 30);
  assert.equal(added.length, SEED_VOCABULARY.length - 30);
});

test('stages: new words are in box 0, old words are placed by their correct answers', () => {
  assert.equal(stageOf(word()), 0);
  assert.equal(stageOf(word({ stage: undefined, correctCount: 0 })), 0);
  assert.equal(stageOf(word({ stage: undefined, correctCount: 2 })), 2);
  assert.equal(stageOf(word({ stage: undefined, correctCount: 9 })), 3); // old words never start above box 3
  assert.equal(stageOf(word({ stage: 99 })), MAX_STAGE);
  assert.equal(stageOf(word({ stage: -4 })), 0);
});

test('status follows the stage', () => {
  assert.equal(statusOfStage(0, false), 'new');
  assert.equal(statusOfStage(0, true), 'learning');
  assert.equal(statusOfStage(1, true), 'learning');
  assert.equal(statusOfStage(2, true), 'learning');
  assert.equal(statusOfStage(3, true), 'review');
  assert.equal(statusOfStage(4, true), 'review');
  assert.equal(statusOfStage(MAX_STAGE, true), 'mastered');
});

test('correct answers move a word up one box and push the next review further away', () => {
  let w = word();
  const seen: number[] = [];
  for (let i = 0; i < MAX_STAGE + 2; i++) {
    w = reviewWord(w, true, NOW);
    seen.push((w.nextReviewAt - NOW) / DAY_MS);
  }
  assert.deepEqual(seen, [1, 3, 7, 14, 30, 30, 30]); // never beyond the top box
  assert.equal(w.stage, MAX_STAGE);
  assert.equal(w.reviewStatus, 'mastered');
  assert.equal(w.correctCount, MAX_STAGE + 2);
  assert.deepEqual(STAGE_INTERVAL_DAYS, [0, 1, 3, 7, 14, 30]);
});

test('a wrong answer moves a word down two boxes and brings it back soon', () => {
  const high = reviewWord(word({ stage: 4, correctCount: 4, reviewStatus: 'review' }), false, NOW);
  assert.equal(high.stage, 2);
  assert.equal(high.nextReviewAt, NOW + 3 * DAY_MS);
  assert.equal(high.incorrectCount, 1);
  assert.equal(high.reviewStatus, 'learning');

  const low = reviewWord(word({ stage: 1, correctCount: 1, reviewStatus: 'learning' }), false, NOW);
  assert.equal(low.stage, 0);
  assert.equal(low.nextReviewAt, NOW); // box 0: due again right away
  assert.equal(low.reviewStatus, 'learning'); // seen before, so not "new" any more

  assert.equal(reviewWord(word(), false, NOW).stage, 0); // cannot go below box 0
});

test('reviewWord does not change the word it was given', () => {
  const original = word();
  const copy = structuredClone(original);
  reviewWord(original, true, NOW);
  assert.deepEqual(original, copy);
});

test('a word that was reviewed once is no longer new', () => {
  assert.equal(isNewWord(word()), true);
  assert.equal(isNewWord(reviewWord(word(), false, NOW)), false);
  assert.equal(isNewWord(word({ stage: undefined, correctCount: 1 })), false);
});

test('due words and the next review time', () => {
  const words = [
    word({ id: 'a', nextReviewAt: NOW - DAY_MS }),
    word({ id: 'b', nextReviewAt: NOW }),
    word({ id: 'c', nextReviewAt: NOW + 2 * DAY_MS }),
    word({ id: 'd', nextReviewAt: NOW + DAY_MS }),
  ];
  assert.deepEqual(dueWords(words, NOW).map((w) => w.id), ['a', 'b']);
  assert.equal(nextReviewTime(words, NOW), NOW + DAY_MS);
  assert.equal(nextReviewTime([word({ nextReviewAt: NOW - 5 })], NOW), null);
});

function pool(): VocabWord[] {
  return [
    ...Array.from({ length: 12 }, (_, i) => word({ id: `n${String(i).padStart(2, '0')}`, createdAt: i })), // new words
    ...Array.from({ length: 8 }, (_, i) =>
      word({
        id: `r${i}`,
        stage: 2,
        correctCount: 2,
        reviewStatus: 'learning',
        nextReviewAt: NOW - (i + 1) * DAY_MS, // r7 is the most overdue
      }),
    ),
  ];
}

test('a session: reviews first (most overdue first), at most five new words, ten words in total', () => {
  const session = buildSession(pool(), NOW);
  assert.equal(session.length, SESSION_SIZE);
  assert.equal(session.filter(isNewWord).length, MAX_NEW_PER_SESSION);
  assert.deepEqual(session.slice(0, 5).map((w) => w.id), ['r7', 'r6', 'r5', 'r4', 'r3']);
  assert.equal(new Set(session.map((w) => w.id)).size, session.length);
});

test('a session never holds words that are not due, and new words are taken in a stable order', () => {
  const words = [...pool(), word({ id: 'later', stage: 3, nextReviewAt: NOW + DAY_MS })];
  const session = buildSession(words, NOW);
  assert.ok(!session.some((w) => w.id === 'later'));
  assert.deepEqual(session.filter(isNewWord).map((w) => w.id), ['n00', 'n01', 'n02', 'n03', 'n04']);
});

test('a session with few reviews does not fill up with more than five new words', () => {
  const onlyNew = Array.from({ length: 20 }, (_, i) => word({ id: `n${i}` }));
  assert.equal(buildSession(onlyNew, NOW).length, MAX_NEW_PER_SESSION);
});

test('a session can be limited to one theme, and is empty when nothing is due', () => {
  const words = [
    word({ id: 'a', theme: 'work' }),
    word({ id: 'b', theme: 'health' }),
    word({ id: 'c', theme: 'work', nextReviewAt: NOW + DAY_MS }),
  ];
  assert.deepEqual(buildSession(words, NOW, { theme: 'work' }).map((w) => w.id), ['a']);
  assert.deepEqual(buildSession([word({ nextReviewAt: NOW + DAY_MS })], NOW), []);
});

test('the exercise gets harder with the box: card, choice, writing from memory, sentence', () => {
  const kinds = [0, 1, 2, 3, 4, 5].map((stage) => exerciseFor(word({ stage }), true));
  assert.deepEqual(kinds, ['flashcard', 'translate', 'recall', 'gap', 'gap', 'gap']);
  assert.equal(exerciseFor(word({ stage: 4 }), false), 'recall'); // no usable sentence
});

test('gap: the word is cut out of the example, in the form used there', () => {
  const gap = findGap(word());
  assert.ok(gap);
  assert.equal(gap.text, 'She ___ her goal.');
  assert.equal(gap.answer, 'achieved');
  assert.deepEqual(gap.accepted, ['achieved', 'achieve']);
});

test('gap: capital letters, plural forms and several words', () => {
  assert.equal(findGap(word({ word: 'although', exampleEn: 'Although it was raining, we went out.' }))?.text, '___ it was raining, we went out.');
  assert.equal(findGap(word({ word: 'colleague', exampleEn: 'My colleagues are very helpful.' }))?.answer, 'colleagues');
  assert.equal(findGap(word({ word: 'take part', exampleEn: 'Many people take part in the festival.' }))?.text, 'Many people ___ in the festival.');
});

test('gap: not available when the word is not in the example; it does not cut a longer word out of the middle', () => {
  assert.equal(findGap(word({ word: 'achieve', exampleEn: 'Nothing here.' })), null);
  assert.equal(findGap(word({ word: 'cat', exampleEn: 'The scat was here.' })), null);
});

test('hint for writing a word from memory', () => {
  assert.equal(firstLetterHint('benefit'), 'b······ (7)');
});

test('translation options: the right one and three different wrong ones', () => {
  const all = SEED_VOCABULARY;
  const target = all.find((w) => w.word === 'salary')!;
  for (let seed = 1; seed <= 20; seed++) {
    const options = translationOptions(target, all, seededRandom(seed));
    assert.equal(options.length, 4);
    assert.equal(new Set(options).size, 4);
    assert.ok(options.includes(target.translationRu));
  }
});

test('translation options prefer words of the same theme and cope with a tiny notebook', () => {
  const all = SEED_VOCABULARY;
  const target = all.find((w) => w.word === 'salary')!;
  const sameTheme = new Set(all.filter((w) => w.theme === 'work' && w.id !== target.id).map((w) => w.translationRu));
  const options = translationOptions(target, all, seededRandom(3));
  assert.equal(options.filter((o) => sameTheme.has(o)).length, 3); // work has 5 words, so 4 others are available
  const tiny = [word({ id: 'a', translationRu: 'один' }), word({ id: 'b', translationRu: 'два' })];
  assert.deepEqual([...translationOptions(tiny[0], tiny, seededRandom(1))].sort(), ['два', 'один']);
  assert.deepEqual(translationOptions(tiny[0], [tiny[0]], seededRandom(1)), ['один']);
});

test('translation options never repeat a translation, even when several words share it', () => {
  const target = word({ id: 't', translationRu: 'цель' });
  const all = [
    target,
    word({ id: 'a', translationRu: 'предлагать' }),
    word({ id: 'b', translationRu: 'предлагать' }), // same translation as "a" (like the two "suggest" entries)
    word({ id: 'c', translationRu: 'предлагать' }),
    word({ id: 'd', translationRu: 'решать' }),
    word({ id: 'e', translationRu: 'влиять' }),
  ];
  for (let seed = 1; seed <= 30; seed++) {
    const options = translationOptions(target, all, seededRandom(seed));
    assert.equal(new Set(options).size, options.length, `seed ${seed}: ${options.join(', ')}`);
    assert.ok(options.includes('цель'));
  }
});

test('typed answers: right, a typo away, wrong', () => {
  assert.equal(matchText('environment', ['environment']), 'correct');
  assert.equal(matchText('  Environment. ', ['environment']), 'correct');
  assert.equal(matchText('enviroment', ['environment']), 'near');
  assert.equal(matchText('achieve', ['achieved', 'achieve']), 'correct');
  assert.equal(matchText('achiev', ['achieved', 'achieve']), 'wrong'); // ending missing: not a typo
  assert.equal(matchText('improve', ['achieve']), 'wrong');
});
