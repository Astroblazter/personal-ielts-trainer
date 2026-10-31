import test from 'node:test';
import assert from 'node:assert/strict';
import { DICTIONARIES, setLang, t } from '@/i18n';

type Dict = Record<string, unknown>;

/** All paths of texts in a dictionary, like "exercise.yourAnswer". */
function paths(dict: Dict, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([key, value]) =>
    value !== null && typeof value === 'object' ? paths(value as Dict, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

const ru = paths(DICTIONARIES.ru);
const en = paths(DICTIONARIES.en);

test('Russian and English have exactly the same texts', () => {
  assert.deepEqual(ru.filter((p) => !en.includes(p)), [], 'missing in English');
  assert.deepEqual(en.filter((p) => !ru.includes(p)), [], 'missing in Russian');
});

test('a text with {values} has the same values in both languages', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const get = (dict: Dict, path: string) => path.split('.').reduce<unknown>((cur, key) => (cur as Dict)[key], dict) as string;
  for (const path of ru.filter((p) => en.includes(p))) {
    assert.deepEqual(placeholders(get(DICTIONARIES.ru, path)), placeholders(get(DICTIONARIES.en, path)), path);
  }
});

test('no text is empty', () => {
  for (const [lang, list] of [['ru', ru], ['en', en]] as const) {
    for (const path of list) {
      setLang(lang);
      assert.ok(t(path).trim().length > 0, `${lang}: ${path} is empty`);
    }
  }
  setLang('ru');
});

test('the line with the learner\'s own answer is called "Your answer", not "Submit"', () => {
  setLang('ru');
  assert.equal(t('exercise.yourAnswer'), 'Ваш ответ');
  assert.notEqual(t('exercise.yourAnswer'), t('common.submit'));
  setLang('en');
  assert.equal(t('exercise.yourAnswer'), 'Your answer');
  setLang('ru');
});
