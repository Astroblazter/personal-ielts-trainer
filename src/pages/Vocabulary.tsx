import { useCallback, useMemo, useState } from 'react';
import { Plus, Trash2, Search, Layers, RotateCcw } from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { getTopicById } from '@/data/grammarTopics';
import type { VocabWord } from '@/types';
import { SectionTitle, EmptyState } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { t } from '@/i18n';

type Mode = 'list' | 'flashcard' | 'add';

export default function Vocabulary() {
  const { vocabulary, addWord, removeWord, editWord } = useTrainerData();
  const [mode, setMode] = useState<Mode>('list');
  const [search, setSearch] = useState('');
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [form, setForm] = useState({
    word: '',
    translationRu: '',
    exampleEn: '',
    topicId: 'sentence_structure' as VocabWord['topicId'],
    difficulty: 'B1' as VocabWord['difficulty'],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vocabulary;
    return vocabulary.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.translationRu.toLowerCase().includes(q),
    );
  }, [vocabulary, search]);

  const dueWords = useMemo(
    () => vocabulary.filter((w) => w.reviewStatus !== 'mastered'),
    [vocabulary],
  );

  const submitAdd = useCallback(async () => {
    if (!form.word.trim() || !form.translationRu.trim()) return;
    await addWord({
      word: form.word.trim(),
      translationRu: form.translationRu.trim(),
      exampleEn: form.exampleEn.trim(),
      topicId: form.topicId,
      difficulty: form.difficulty,
      note: undefined,
    });
    setForm({
      word: '',
      translationRu: '',
      exampleEn: '',
      topicId: 'sentence_structure',
      difficulty: 'B1',
    });
    setMode('list');
  }, [form, addWord]);

  const flashcardWord = dueWords[flashIndex];

  const flashNext = useCallback(
    (known: boolean) => {
      const word = dueWords[flashIndex];
      if (word) {
        const next: VocabWord = {
          ...word,
          correctCount: word.correctCount + (known ? 1 : 0),
          incorrectCount: word.incorrectCount + (known ? 0 : 1),
          reviewStatus: known
            ? word.correctCount + 1 >= 3
              ? 'mastered'
              : 'review'
            : 'learning',
          nextReviewAt: Date.now() + 86_400_000,
        };
        editWord(next);
      }
      setFlipped(false);
      setFlashIndex((i) => (i + 1) % Math.max(dueWords.length, 1));
    },
    [dueWords, flashIndex, editWord],
  );

  if (mode === 'add') {
    return (
      <div>
        <SectionTitle
          title={t('vocabulary.addWord')}
          action={
            <button className="btn btn-ghost" onClick={() => setMode('list')}>
              {t('common.cancel')}
            </button>
          }
        />
        <div className="card max-w-lg space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('vocabulary.word')}</label>
            <input
              className="input"
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('vocabulary.translation')}</label>
            <input
              className="input"
              value={form.translationRu}
              onChange={(e) => setForm({ ...form, translationRu: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('vocabulary.example')}</label>
            <input
              className="input"
              value={form.exampleEn}
              onChange={(e) => setForm({ ...form, exampleEn: e.target.value })}
            />
          </div>
          <button className="btn btn-primary" onClick={submitAdd} disabled={!form.word.trim() || !form.translationRu.trim()}>
            <Plus className="h-4 w-4" />
            {t('common.add')}
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'flashcard' && dueWords.length > 0) {
    return (
      <div>
        <SectionTitle
          title={t('vocabulary.flashcard')}
          subtitle={`${flashIndex + 1} / ${dueWords.length}`}
          action={
            <button className="btn btn-ghost" onClick={() => setMode('list')}>
              {t('common.backTo')}
            </button>
          }
        />
        {flashcardWord ? (
          <div className="mx-auto max-w-md">
            <div
              className="card min-h-[240px] cursor-pointer p-8 flex flex-col items-center justify-center text-center transition-all"
              onClick={() => setFlipped((f) => !f)}
            >
              {!flipped ? (
                <>
                  <p className="text-2xl font-semibold">{flashcardWord.word}</p>
                  <p className="mt-2 text-sm text-muted">{t('vocabulary.flip')}</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-medium">{flashcardWord.translationRu}</p>
                  {flashcardWord.exampleEn && (
                    <p className="mt-3 text-sm italic text-muted">{flashcardWord.exampleEn}</p>
                  )}
                </>
              )}
            </div>
            {flipped && (
              <div className="mt-4 flex justify-center gap-3">
                <button className="btn btn-secondary" onClick={() => flashNext(false)}>
                  {t('vocabulary.dontKnow')}
                </button>
                <button className="btn btn-primary" onClick={() => flashNext(true)}>
                  {t('vocabulary.know')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <EmptyState title={t('common.empty')}>
            <button className="btn btn-secondary mt-2" onClick={() => setMode('list')}>
              {t('common.backTo')}
            </button>
          </EmptyState>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title={t('vocabulary.title')}
        subtitle={t('vocabulary.subtitle')}
        action={
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setFlashIndex(0);
                setFlipped(false);
                setMode('flashcard');
              }}
              disabled={dueWords.length === 0}
            >
              <Layers className="h-4 w-4" />
              {t('vocabulary.flashcard')}
            </button>
            <button className="btn btn-primary" onClick={() => setMode('add')}>
              <Plus className="h-4 w-4" />
              {t('vocabulary.addWord')}
            </button>
          </div>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Illustration
          name="vocabulary"
          size="inline"
          alt="Collecting vocabulary cards"
          className="shrink-0"
        />
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          className="input pl-10"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('vocabulary.noWords')}>
          <Illustration
            name="emptyVocab"
            size="inline"
            alt="Finding your first vocabulary card"
            className="mt-2"
          />
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {filtered.map((w: VocabWord) => {
            const topic = getTopicById(w.topicId);
            return (
              <div key={w.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{w.word}</p>
                      <span className="badge badge-neutral">{t(`difficulty.${w.difficulty}`)}</span>
                      <span className={`badge ${w.reviewStatus === 'mastered' ? 'badge-success' : 'badge-warning'}`}>
                        {t(`reviewStatus.${w.reviewStatus}`)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{w.translationRu}</p>
                    {w.exampleEn && (
                      <p className="mt-1 text-sm italic text-muted">{w.exampleEn}</p>
                    )}
                    {topic && (
                      <p className="mt-1 text-xs text-muted">{topic.titleRu}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-xs text-muted">
                      <span>{t('vocabulary.correctCount')}: {w.correctCount}</span>
                      <span>{t('vocabulary.incorrectCount')}: {w.incorrectCount}</span>
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
