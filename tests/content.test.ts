import test from 'node:test';
import assert from 'node:assert/strict';
import { READING_PASSAGES } from '@/data/reading';
import { LISTENING_TRACKS } from '@/data/listening';
import { WRITING_TASKS } from '@/data/writing';
import { SPEAKING_PROMPTS } from '@/data/speaking';
import { checklistLabel, localizedTitle, questionText, speakingTips, writingTips } from '@/data/localize';
import { QUESTION_TEXT_EN } from '@/data/contentEn';
import { setLang } from '@/i18n';

const CYRILLIC = /[А-Яа-яЁё]/;
const questions = [...READING_PASSAGES, ...LISTENING_TRACKS].flatMap((x) => x.questions);

function inEnglish(run: () => void) {
  setLang('en');
  try {
    run();
  } finally {
    setLang('ru');
  }
}

function assertEnglish(text: string, what: string) {
  assert.ok(text.trim().length > 0, `${what}: empty`);
  assert.ok(!CYRILLIC.test(text), `${what}: Russian letters in "${text}"`);
}

test('question ids of Reading and Listening are unique', () => {
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every reading and listening question has English text, and nothing is left over', () => {
  inEnglish(() => {
    for (const q of questions) {
      assert.ok(QUESTION_TEXT_EN[q.id], `${q.id}: no English text`);
      const text = questionText(q);
      assertEnglish(text.instruction, `${q.id} instruction`);
      assertEnglish(text.explanation, `${q.id} explanation`);
    }
    for (const id of Object.keys(QUESTION_TEXT_EN)) {
      assert.ok(questions.some((q) => q.id === id), `${id}: English text for an unknown question`);
    }
  });
});

test('every title is available in English', () => {
  inEnglish(() => {
    for (const item of [...READING_PASSAGES, ...LISTENING_TRACKS, ...WRITING_TASKS, ...SPEAKING_PROMPTS]) {
      assertEnglish(localizedTitle(item), `${item.id} title`);
    }
  });
});

test('every writing task has English checklist labels and tips of the same count', () => {
  inEnglish(() => {
    for (const task of WRITING_TASKS) {
      const tips = writingTips(task);
      assert.equal(tips.length, task.tipsRu.length, `${task.id}: tips count`);
      tips.forEach((tip, i) => assertEnglish(tip, `${task.id} tip ${i}`));
      for (const item of task.checklist) assertEnglish(checklistLabel(task.id, item), `${task.id} ${item.id}`);
    }
  });
});

test('every speaking prompt has English tips of the same count', () => {
  inEnglish(() => {
    for (const prompt of SPEAKING_PROMPTS) {
      const tips = speakingTips(prompt);
      assert.equal(tips.length, prompt.tipsRu.length, `${prompt.id}: tips count`);
      tips.forEach((tip, i) => assertEnglish(tip, `${prompt.id} tip ${i}`));
    }
  });
});

test('in Russian the original texts are used', () => {
  setLang('ru');
  assert.equal(localizedTitle(WRITING_TASKS[0]), WRITING_TASKS[0].titleRu);
  assert.equal(questionText(questions[0]).explanation, questions[0].explanationRu);
  assert.deepEqual(writingTips(WRITING_TASKS[0]), WRITING_TASKS[0].tipsRu);
  assert.deepEqual(speakingTips(SPEAKING_PROMPTS[0]), SPEAKING_PROMPTS[0].tipsRu);
});

test('the reading and listening answers still work (each question has a way to be answered correctly)', () => {
  for (const q of questions) {
    if (q.type === 'multiple_choice') {
      assert.ok(q.options?.some((o) => o.id === q.correctOptionId), `${q.id}: correct option missing`);
    } else if (q.type === 'fill_blank') {
      assert.ok((q.acceptedAnswers?.length ?? 0) > 0, `${q.id}: no accepted answers`);
    }
  }
});

