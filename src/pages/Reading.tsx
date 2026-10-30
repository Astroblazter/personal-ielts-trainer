import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, BookOpen, Clock } from 'lucide-react';
import { READING_PASSAGES } from '@/data/reading';
import type { ReadingPassage, ReadingQuestion } from '@/types';
import { SectionTitle } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { useTrainerData } from '@/hooks/useTrainerData';
import { localizedTitle, questionText } from '@/data/localize';
import { t } from '@/i18n';

type Answers = Record<string, string>;
type Results = Record<string, boolean>;

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
}

function checkQuestion(q: ReadingQuestion, answer: string): boolean {
  if (q.type === 'fill_blank') {
    const accepted = (q.acceptedAnswers ?? []).map(normalize);
    return accepted.includes(normalize(answer));
  }
  return answer === q.correctOptionId;
}

export default function Reading() {
  const { recordSession } = useTrainerData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const passage = useMemo(
    () => READING_PASSAGES.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  );

  const results = useMemo<Results>(() => {
    if (!passage || !submitted) return {};
    const r: Results = {};
    for (const q of passage.questions) {
      const a = answers[q.id] ?? '';
      r[q.id] = checkQuestion(q, a);
    }
    return r;
  }, [passage, submitted, answers]);

  const score = useMemo(
    () => Object.values(results).filter(Boolean).length,
    [results],
  );

  const selectPassage = useCallback((id: string) => {
    setSelectedId(id);
    setAnswers({});
    setSubmitted(false);
    setStartTime(Date.now());
  }, []);

  const backToList = () => {
    setSelectedId(null);
    setAnswers({});
    setSubmitted(false);
  };

  const submitAll = useCallback(async () => {
    if (!passage) return;
    setSubmitted(true);
    const correctCount = passage.questions.filter((q) => checkQuestion(q, answers[q.id] ?? '')).length;
    await recordSession({
      startedAt: startTime,
      completedAt: Date.now(),
      exercisesCompleted: passage.questions.length,
      correctCount,
      timeSpentMs: Date.now() - startTime,
    });
  }, [passage, answers, startTime, recordSession]);

  if (!passage) {
    return (
      <div>
        <SectionTitle title={t('reading.title')} subtitle={t('reading.subtitle')} />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration
            name="reading"
            size="inline"
            alt="Reading in an English garden"
            className="shrink-0"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {READING_PASSAGES.map((p: ReadingPassage) => (
            <button
              key={p.id}
              onClick={() => selectPassage(p.id)}
              className="card group p-5 text-left transition-colors hover:border-[rgb(var(--color-primary))]"
            >
              <div className="flex items-center gap-2">
                <span className="badge badge-primary">{t(`difficulty.${p.difficulty}`)}</span>
                <span className="text-xs text-muted">{p.sourceLabel}</span>
              </div>
              <p className="mt-3 font-medium">{localizedTitle(p)}</p>
              <p className="mt-1 text-sm text-muted">{p.titleEn}</p>
              <p className="mt-3 text-xs text-muted">
                {p.questions.length} {t('reading.questions')}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title={localizedTitle(passage)}
        subtitle={passage.titleEn}
        action={
          <button className="btn btn-ghost" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
            {t('reading.backToList')}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Passage */}
        <div className="card max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted">
            <BookOpen className="h-4 w-4" />
            <span>{t('reading.passage')}</span>
          </div>
          <div className="space-y-4 text-sm leading-relaxed">
            {passage.passageEn.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {passage.questions.map((q, idx) => {
            const isCorrect = submitted ? results[q.id] : null;
            return (
              <div key={q.id} className="card p-4">
                <div className="mb-2 flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-primary-soft))] text-xs font-medium text-primary">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-muted">{questionText(q).instruction}</p>
                    <p className="mt-1 text-sm font-medium">{q.questionEn}</p>
                  </div>
                  {submitted && (
                    <span className="shrink-0">
                      {isCorrect ? (
                        <Check className="h-5 w-5 text-success" />
                      ) : (
                        <X className="h-5 w-5 text-error" />
                      )}
                    </span>
                  )}
                </div>

                {q.type === 'fill_blank' ? (
                  <input
                    type="text"
                    className="input mt-2"
                    value={answers[q.id] ?? ''}
                    disabled={submitted}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder={t('reading.yourAnswer')}
                  />
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {q.options?.map((o) => {
                      const selected = answers[q.id] === o.id;
                      const showCorrect = submitted && o.id === q.correctOptionId;
                      const showWrong = submitted && selected && o.id !== q.correctOptionId;
                      return (
                        <button
                          key={o.id}
                          disabled={submitted}
                          onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                          className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            showCorrect
                              ? 'border-[rgb(var(--color-success))] bg-[rgb(var(--color-success-soft))]'
                              : showWrong
                                ? 'border-[rgb(var(--color-error))] bg-[rgb(var(--color-error-soft))]'
                                : selected
                                  ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-soft))]'
                                  : 'border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-2))]'
                          }`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                            {o.id.toUpperCase()}
                          </span>
                          {o.text}
                        </button>
                      );
                    })}
                  </div>
                )}

                {submitted && (
                  <p className="mt-2 rounded-md bg-[rgb(var(--color-surface-2))] px-3 py-2 text-xs text-muted">
                    {questionText(q).explanation}
                  </p>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <button
              className="btn btn-primary w-full"
              onClick={submitAll}
              disabled={passage.questions.some((q) => !answers[q.id])}
            >
              {t('reading.submitAll')}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="card p-5 text-center">
              <p className="text-3xl font-semibold">{score} / {passage.questions.length}</p>
              <p className="mt-1 text-xs text-muted">{t('reading.score')}</p>
              <button className="btn btn-secondary mt-4" onClick={backToList}>
                <ArrowLeft className="h-4 w-4" />
                {t('reading.backToList')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
