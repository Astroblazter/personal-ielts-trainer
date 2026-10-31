import { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Search, Layers } from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { matchText } from '@/engine/checker';
import {
  buildSession,
  dueWords,
  exerciseFor,
  findGap,
  firstLetterHint,
  isNewWord,
  nextReviewTime,
  reviewWord,
  translationOptions,
  type Gap,
  type WordExercise,
} from '@/engine/vocabulary';
import type { VocabTheme, VocabWord } from '@/types';
import { SectionTitle, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t, getLang } from '@/i18n';

type Mode = 'list' | 'add' | 'practice' | 'summary';

const THEMES: VocabTheme[] = [
  'academic',
  'education',
  'work',
  'technology',
  'environment',
  'health',
  'society',
  'culture',
  'travel',
  'other',
];

interface Question {
  wordId: string;
  kind: WordExercise;
  gap: Gap | null;
  options: string[];
}

interface Feedback {
  correct: boolean;
  /** A typo away from the right answer: counted as wrong, but explained. */
  near: boolean;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function makeQuestion(word: VocabWord, all: VocabWord[]): Question {
  const gap = findGap(word);
  const kind = exerciseFor(word, gap !== null);
  return {
    wordId: word.id,
    kind,
    gap: kind === 'gap' ? gap : null,
    options: kind === 'translate' ? translationOptions(word, all) : [],
  };
}

export default function Vocabulary() {
  const { vocabulary, addWord, removeWord, editWord } = useTrainerData();
  const [mode, setMode] = useState<Mode>('list');
  const [search, setSearch] = useState('');
  const [themeFilter, setThemeFilter] = useState<VocabTheme | 'all'>('all');

  // practice session
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [typed, setTyped] = useState('');
  const [firstTry, setFirstTry] = useState<Record<string, boolean>>({});
  const requeued = useRef<Set<string>>(new Set());

  const [form, setForm] = useState({
    word: '',
    translationRu: '',
    exampleEn: '',
    theme: 'other' as VocabTheme,
    difficulty: 'B1' as VocabWord['difficulty'],
  });

  const now = Date.now();
  const byId = useMemo(() => new Map(vocabulary.map((w) => [w.id, w])), [vocabulary]);
  const dueCount = useMemo(() => dueWords(vocabulary, Date.now()).length, [vocabulary]);
  const stats = useMemo(
    () => ({
      total: vocabulary.length,
      fresh: vocabulary.filter(isNewWord).length,
      mastered: vocabulary.filter((w) => w.reviewStatus === 'mastered').length,
    }),
    [vocabulary],
  );
  const themesInUse = useMemo(
    () => THEMES.filter((th) => vocabulary.some((w) => (w.theme ?? 'other') === th)),
    [vocabulary],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vocabulary
      .filter((w) => themeFilter === 'all' || (w.theme ?? 'other') === themeFilter)
      .filter((w) => !q || w.word.toLowerCase().includes(q) || w.translationRu.toLowerCase().includes(q));
  }, [vocabulary, search, themeFilter]);

  const submitAdd = useCallback(async () => {
    if (!form.word.trim() || !form.translationRu.trim()) return;
    await addWord({
      word: form.word.trim(),
      translationRu: form.translationRu.trim(),
      exampleEn: form.exampleEn.trim(),
      topicId: 'sentence_structure',
      theme: form.theme,
      difficulty: form.difficulty,
      note: undefined,
    });
    setForm({ word: '', translationRu: '', exampleEn: '', theme: 'other', difficulty: 'B1' });
    setMode('list');
  }, [form, addWord]);

  // ── practice ───────────────────────────────────────────────────────────
  const showQuestion = useCallback(
    (wordId: string) => {
      const word = byId.get(wordId);
      if (!word) return;
      setQuestion(makeQuestion(word, vocabulary));
      setFeedback(null);
      setFlipped(false);
      setTyped('');
    },
    [byId, vocabulary],
  );

  const startPractice = useCallback(() => {
    const session = buildSession(vocabulary, Date.now(), {
      theme: themeFilter === 'all' ? undefined : themeFilter,
    });
    if (session.length === 0) return;
    requeued.current = new Set();
    setQueue(session.map((w) => w.id));
    setIndex(0);
    setFirstTry({});
    setMode('practice');
    setQuestion(makeQuestion(session[0], vocabulary));
    setFeedback(null);
    setFlipped(false);
    setTyped('');
  }, [vocabulary, themeFilter]);

  const answer = useCallback(
    async (word: VocabWord, correct: boolean, near = false) => {
      setFeedback({ correct, near });
      setFirstTry((prev) => (prev[word.id] === undefined ? { ...prev, [word.id]: correct } : prev));
      // a word answered wrong comes back once at the end of the session
      if (!correct && !requeued.current.has(word.id)) {
        requeued.current.add(word.id);
        setQueue((q) => [...q, word.id]);
      }
      await editWord(reviewWord(word, correct, Date.now()));
    },
    [editWord],
  );

  const checkTyped = useCallback(() => {
    if (!question || feedback || !typed.trim()) return;
    const word = byId.get(question.wordId);
    if (!word) return;
    const accepted = question.kind === 'gap' && question.gap ? question.gap.accepted : [word.word];
    const result = matchText(typed, accepted);
    void answer(word, result === 'correct', result === 'near');
  }, [question, feedback, typed, byId, answer]);

  const next = useCallback(() => {
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      showQuestion(queue[index + 1]);
    } else {
      setMode('summary');
    }
  }, [index, queue, showQuestion]);

  // ── screens ────────────────────────────────────────────────────────────
  if (mode === 'practice' && question) {
    const word = byId.get(question.wordId);
    if (!word) return null;
    const progress = `${index + 1} / ${queue.length}`;

    return (
      <div>
        <SectionTitle
          title={t('vocabulary.practice')}
          subtitle={progress}
          action={
            <button className="btn btn-ghost" onClick={() => setMode('list')}>
              {t('vocabulary.backToList')}
            </button>
          }
        />
        <div className="card mx-auto max-w-xl p-6">
          {question.kind === 'flashcard' && (
            <div className="text-center">
              <p className="text-3xl font-semibold">{word.word}</p>
              {!flipped ? (
                <button className="btn btn-primary mt-6" onClick={() => setFlipped(true)}>
                  {t('vocabulary.showAnswer')}
                </button>
              ) : (
                <>
                  <p className="mt-4 text-xl text-primary">{word.translationRu}</p>
                  <p className="mt-2 text-sm italic text-muted">{word.exampleEn}</p>
                  {!feedback && (
                    <div className="mt-6 flex justify-center gap-3">
                      <button className="btn btn-primary" onClick={() => void answer(word, true)}>
                        {t('vocabulary.know')}
                      </button>
                      <button className="btn btn-secondary" onClick={() => void answer(word, false)}>
                        {t('vocabulary.dontKnow')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {question.kind === 'translate' && (
            <div>
              <p className="text-sm text-muted">{t('vocabulary.chooseTranslation')}</p>
              <p className="mt-2 text-3xl font-semibold">{word.word}</p>
              <div className="mt-4 grid gap-2">
                {question.options.map((option) => (
                  <button
                    key={option}
                    disabled={feedback !== null}
                    onClick={() => void answer(word, option === word.translationRu)}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                      feedback && option === word.translationRu
                        ? 'border-[rgb(var(--color-success))] bg-[rgb(var(--color-surface-2))]'
                        : 'border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-2))]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(question.kind === 'recall' || question.kind === 'gap') && (
            <div>
              <p className="text-sm text-muted">
                {question.kind === 'recall' ? t('vocabulary.typeEnglish') : t('vocabulary.fillGap')}
              </p>
              {question.kind === 'recall' ? (
                <>
                  <p className="mt-2 text-2xl font-semibold">{word.translationRu}</p>
                  <p className="mt-1 text-xs text-muted">
                    {t('vocabulary.hint', { hint: firstLetterHint(word.word) })}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-lg">{question.gap?.text}</p>
                  <p className="mt-1 text-xs text-muted">{word.translationRu}</p>
                </>
              )}
              <div className="mt-4 flex gap-2">
                <input
                  className="input"
                  value={typed}
                  disabled={feedback !== null}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') checkTyped();
                  }}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {!feedback && (
                  <button className="btn btn-primary" onClick={checkTyped} disabled={!typed.trim()}>
                    {t('vocabulary.check')}
                  </button>
                )}
              </div>
            </div>
          )}

          {feedback && (
            <div
              className={`mt-5 rounded-r-lg border-l-4 bg-[rgb(var(--color-surface-2))] p-4 text-sm ${
                feedback.correct
                  ? 'border-l-[var(--color-success)]'
                  : feedback.near
                    ? 'border-l-[var(--color-warning)]'
                    : 'border-l-[var(--color-error)]'
              }`}
              aria-live="polite"
            >
              <p
                className={`font-medium ${
                  feedback.correct ? 'text-success' : feedback.near ? 'text-warning' : 'text-error'
                }`}
              >
                {feedback.correct
                  ? t('common.correct')
                  : feedback.near
                    ? t('common.almostCorrect')
                    : t('common.incorrect')}
              </p>
              {!feedback.correct && question.kind !== 'flashcard' && (
                <p className="mt-1">
                  {t('vocabulary.answerIs', {
                    answer:
                      question.kind === 'translate'
                        ? word.translationRu
                        : question.kind === 'gap' && question.gap
                          ? question.gap.answer
                          : word.word,
                  })}
                </p>
              )}
              {feedback.near && <p className="mt-1 text-muted">{t('checker.typoHint')}</p>}
              <p className="mt-2 italic text-muted">{word.exampleEn}</p>
              <button className="btn btn-primary mt-4" onClick={next} autoFocus>
                {t('common.next')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'summary') {
    const total = Object.keys(firstTry).length;
    const rightFirst = Object.values(firstTry).filter(Boolean).length;
    const again = Object.entries(firstTry)
      .filter(([, ok]) => !ok)
      .map(([id]) => byId.get(id)?.word)
      .filter((w): w is string => Boolean(w));
    const left = dueWords(vocabulary, Date.now()).length;
    const upcoming = nextReviewTime(vocabulary, Date.now());
    return (
      <div>
        <SectionTitle title={t('vocabulary.sessionDone')} />
        <div className="card mx-auto max-w-xl p-6">
          <p className="text-lg font-semibold">{t('vocabulary.sessionSummary', { n: total, k: rightFirst })}</p>
          {again.length > 0 && (
            <p className="mt-3 text-sm text-muted">{t('vocabulary.comeBackSoon', { words: again.join(', ') })}</p>
          )}
          {left > 0 ? (
            <p className="mt-3 text-sm">{t('vocabulary.moreDue', { n: left })}</p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              {t('vocabulary.nothingDue')}{' '}
              {upcoming !== null && t('vocabulary.nextReviewAt', { date: formatDate(upcoming) })}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {left > 0 && (
              <button className="btn btn-primary" onClick={startPractice}>
                {t('vocabulary.another')}
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setMode('list')}>
              {t('vocabulary.backToList')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'add') {
    return (
      <div>
        <SectionTitle title={t('vocabulary.addWord')} />
        <div className="card mx-auto max-w-xl space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs text-muted">{t('vocabulary.word')}</label>
            <input
              className="input"
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t('vocabulary.translation')}</label>
            <input
              className="input"
              value={form.translationRu}
              onChange={(e) => setForm({ ...form, translationRu: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">{t('vocabulary.example')}</label>
            <input
              className="input"
              value={form.exampleEn}
              onChange={(e) => setForm({ ...form, exampleEn: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">{t('vocabulary.theme')}</label>
              <select
                className="input"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value as VocabTheme })}
              >
                {THEMES.map((th) => (
                  <option key={th} value={th}>
                    {t(`vocabularyThemes.${th}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">{t('common.difficulty')}</label>
              <select
                className="input"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as VocabWord['difficulty'] })}
              >
                {(['A2', 'B1', 'B1+', 'B2'] as const).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted">{t('vocabulary.exampleHint')}</p>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={submitAdd}>
              {t('common.save')}
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('list')}>
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // list
  const upcoming = nextReviewTime(vocabulary, now);
  return (
    <div>
      <SectionTitle
        title={t('vocabulary.title')}
        subtitle={t('vocabulary.subtitle')}
        action={
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={startPractice} disabled={dueCount === 0}>
              <Layers className="h-4 w-4" />
              {t('vocabulary.practice')} ({dueCount})
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('add')}>
              <Plus className="h-4 w-4" />
              {t('vocabulary.addWord')}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t('vocabulary.statTotal'), stats.total],
          [t('vocabulary.statDue'), dueCount],
          [t('vocabulary.statNew'), stats.fresh],
          [t('vocabulary.statMastered'), stats.mastered],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-3 text-center">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
      {dueCount === 0 && (
        <p className="mt-3 text-sm text-muted">
          {t('vocabulary.nothingDue')}{' '}
          {upcoming !== null && t('vocabulary.nextReviewAt', { date: formatDate(upcoming) })}
        </p>
      )}

      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input pl-9"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={`btn ${themeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setThemeFilter('all')}
        >
          {t('vocabulary.allThemes')}
        </button>
        {themesInUse.map((th) => (
          <button
            key={th}
            className={`btn ${themeFilter === th ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setThemeFilter(th)}
          >
            {t(`vocabularyThemes.${th}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t('vocabulary.noWords')}>
            <Illustration name="emptyVocab" size="inline" alt="Empty word notebook" className="mt-2" />
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {filtered.map((w) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{w.word}</span>
                    <span className="badge badge-neutral">{w.difficulty}</span>
                    <span
                      className={`badge ${
                        w.reviewStatus === 'mastered'
                          ? 'badge-success'
                          : w.reviewStatus === 'new'
                            ? 'badge-neutral'
                            : 'badge-primary'
                      }`}
                    >
                      {t(`reviewStatus.${w.reviewStatus}`)}
                    </span>
                    <span className="text-xs text-muted">{t(`vocabularyThemes.${w.theme ?? 'other'}`)}</span>
                  </div>
                  <p className="mt-1 text-sm">{w.translationRu}</p>
                  {w.exampleEn && <p className="mt-1 text-xs italic text-muted">{w.exampleEn}</p>}
                  {!isNewWord(w) && (
                    <p className="mt-1 text-xs text-muted">
                      {w.nextReviewAt <= now
                        ? t('vocabulary.dueNow')
                        : t('vocabulary.reviewOn', { date: formatDate(w.nextReviewAt) })}
                    </p>
                  )}
                </div>
                <button
                  className="btn btn-ghost text-error"
                  onClick={() => removeWord(w.id)}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
