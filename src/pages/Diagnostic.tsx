import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Check, X, ArrowRight, RotateCcw } from 'lucide-react';
import { DIAGNOSTIC_QUESTIONS } from '@/data/diagnostic';
import { getTopicById } from '@/data/grammarTopics';
import { useTrainerData } from '@/hooks/useTrainerData';
import type { DiagnosticQuestion } from '@/types';
import { SectionTitle, EmptyState } from '@/components/ui';
import { t } from '@/i18n';

type Phase = 'intro' | 'taking' | 'result';

interface Answer {
  questionId: string;
  selectedOptionId: string;
  correct: boolean;
}

export default function Diagnostic() {
  const navigate = useNavigate();
  const { diagnostic, recordDiagnostic, profile } = useTrainerData();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const questions = DIAGNOSTIC_QUESTIONS;
  const lastResult = useMemo(
    () => [...diagnostic].sort((a, b) => b.takenAt - a.takenAt)[0],
    [diagnostic],
  );

  const start = () => {
    setPhase('taking');
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setShowFeedback(false);
  };

  const submitAnswer = useCallback(() => {
    if (selected === null) return;
    const q = questions[currentQ];
    const correct = selected === q.correctOptionId;
    const answer: Answer = {
      questionId: q.id,
      selectedOptionId: selected,
      correct,
    };
    setAnswers((prev) => [...prev, answer]);
    setShowFeedback(true);
  }, [selected, currentQ, questions]);

  const next = useCallback(async () => {
    if (currentQ + 1 >= questions.length) {
      const all = [...answers];
      const correctCount = all.filter((a) => a.correct).length;
      const perTopic: Record<string, { correct: number; total: number }> = {};
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const a = all[i];
        const entry = perTopic[q.topicId] ?? { correct: 0, total: 0 };
        entry.total += 1;
        if (a?.correct) entry.correct += 1;
        perTopic[q.topicId] = entry;
      }
      await recordDiagnostic({
        takenAt: Date.now(),
        totalQuestions: questions.length,
        correctCount,
        perTopic,
      });
      setPhase('result');
    } else {
      setCurrentQ((i) => i + 1);
      setSelected(null);
      setShowFeedback(false);
    }
  }, [currentQ, questions, answers, recordDiagnostic]);

  if (phase === 'intro') {
    return (
      <div>
        <SectionTitle title={t('diagnostic.title')} subtitle={t('diagnostic.subtitle')} />
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--color-primary-soft))]">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted">{t('diagnostic.disclaimer')}</p>
              <p className="mt-2 text-sm">
                {questions.length} {t('diagnostic.question').toLowerCase()}
              </p>
              <button className="btn btn-primary mt-4" onClick={start}>
                {t('diagnostic.start')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {lastResult && (
            <div className="mt-6 border-t border-[rgb(var(--color-border))] pt-4">
              <h3 className="text-sm font-semibold">{t('diagnostic.lastResult')}</h3>
              <p className="mt-2 text-sm">
                {t('diagnostic.correctAnswers')}: {lastResult.correctCount} / {lastResult.totalQuestions}
              </p>
              <p className="text-sm text-muted">
                {t('diagnostic.result')}: {profile.currentLevel}
              </p>
            </div>
          )}

          {!lastResult && (
            <p className="mt-4 text-sm text-muted">{t('diagnostic.notTaken')}</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const correctCount = answers.filter((a) => a.correct).length;
    const total = questions.length;
    const perTopic: Record<string, { correct: number; total: number }> = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const a = answers[i];
      const entry = perTopic[q.topicId] ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (a?.correct) entry.correct += 1;
      perTopic[q.topicId] = entry;
    }
    const topicEntries = Object.entries(perTopic).map(([topicId, v]) => ({
      topicId,
      ...v,
      accuracy: Math.round((v.correct / v.total) * 100),
    }));
    const stronger = [...topicEntries].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
    const weaker = [...topicEntries].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

    return (
      <div>
        <SectionTitle title={t('diagnostic.result')} />
        <div className="card p-6">
          <div className="text-center">
            <p className="text-4xl font-semibold">
              {correctCount} / {total}
            </p>
            <p className="mt-2 text-sm text-muted">{t('diagnostic.correctAnswers')}</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-success">
                {t('diagnostic.stronger')}
              </h3>
              <ul className="space-y-1">
                {stronger.map((s) => {
                  const topic = getTopicById(s.topicId as never);
                  return (
                    <li key={s.topicId} className="text-sm">
                      {topic?.titleRu ?? s.topicId}: {s.accuracy}%
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-error">
                {t('diagnostic.weaker')}
              </h3>
              <ul className="space-y-1">
                {weaker.map((w) => {
                  const topic = getTopicById(w.topicId as never);
                  return (
                    <li key={w.topicId} className="text-sm">
                      {topic?.titleRu ?? w.topicId}: {w.accuracy}%
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted">{t('diagnostic.disclaimer')}</div>

          <div className="mt-6 flex gap-2">
            <button className="btn btn-secondary" onClick={start}>
              <RotateCcw className="h-4 w-4" />
              {t('diagnostic.repeatLater')}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/lesson')}>
              {t('nav.dailyLesson')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // taking
  const q: DiagnosticQuestion = questions[currentQ];
  const currentAnswer = answers[currentQ];
  const isAnswered = showFeedback || currentAnswer !== undefined;

  return (
    <div>
      <SectionTitle
        title={t('diagnostic.title')}
        subtitle={`${t('diagnostic.question')} ${currentQ + 1} ${t('diagnostic.of')} ${questions.length}`}
      />

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(currentQ / questions.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <span className="badge badge-primary">{t(`difficulty.${'IELTS'}`)}</span>
        {(() => {
          const topic = getTopicById(q.topicId);
          return topic ? (
            <span className="badge badge-neutral ml-2">{topic.titleRu}</span>
          ) : null;
        })()}
        <p className="mt-2 text-sm text-muted">{q.instructionRu}</p>
        <p className="mt-3 text-lg font-medium">{q.questionEn}</p>

        <div className="mt-4 grid gap-2">
          {q.options.map((o) => {
            const isSelected = selected === o.id;
            const isCorrect = o.id === q.correctOptionId;
            const showCorrect = isAnswered && isCorrect;
            const showWrong = isAnswered && isSelected && !isCorrect;
            return (
              <button
                key={o.id}
                onClick={() => !isAnswered && setSelected(o.id)}
                disabled={isAnswered}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  showCorrect
                    ? 'border-success bg-[rgb(var(--color-success-soft))]'
                    : showWrong
                      ? 'border-error bg-[rgb(var(--color-error-soft))]'
                      : isSelected
                        ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-soft))]'
                        : 'border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-2))]'
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {o.id.toUpperCase()}
                </span>
                {o.text}
                {showCorrect && <Check className="ml-auto h-4 w-4 text-success" />}
                {showWrong && <X className="ml-auto h-4 w-4 text-error" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-4 rounded-lg bg-[rgb(var(--color-surface-2))] p-4 text-sm">
            <p className="text-muted">{t('common.explanation')}:</p>
            <p className="mt-1">{q.explanationRu}</p>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {!isAnswered ? (
            <button
              className="btn btn-primary"
              onClick={submitAnswer}
              disabled={selected === null}
            >
              {t('common.submit')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={next}>
              {currentQ + 1 >= questions.length ? t('diagnostic.finish') : t('common.next')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
