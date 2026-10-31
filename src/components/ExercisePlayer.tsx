import { useState, type ReactNode } from 'react';
import { Check, X, AlertTriangle, BookPlus, Flag, ArrowRight } from 'lucide-react';
import type { AttemptRecord, Exercise } from '@/types';
import { checkExercise, type CheckResult } from '@/engine/checker';
import { getTopicById } from '@/data/grammarTopics';
import { exerciseText } from '@/data/localize';
import { t } from '@/i18n';

interface Props {
  exercise: Exercise;
  source: AttemptRecord['source'];
  /** Show the "Retry" button after an answer (default: true). */
  allowRetry?: boolean;
  onAnswered?: (result: CheckResult, addToMistakes: boolean, flagged: boolean) => void | Promise<void>;
  onAdvance?: () => void;
  advanceLabel?: string;
  showAdvance?: boolean;
  submittedResult?: CheckResult | null;
  submittedAnswer?: unknown;
  submittedCorrection?: string;
}

export function ExercisePlayer({
  exercise,
  source,
  onAnswered,
  onAdvance,
  advanceLabel,
  showAdvance,
  allowRetry = true,
}: Props) {
  const topic = getTopicById(exercise.topicId);
  const text = exerciseText(exercise);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillText, setFillText] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [sentenceText, setSentenceText] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [addToMistakes, setAddToMistakes] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const submit = () => {
    let r: CheckResult;
    let answerValue: unknown;
    let corr = '';
    if (exercise.type === 'multiple_choice') {
      if (selectedOption === null) return;
      r = checkExercise(exercise, selectedOption);
      answerValue = selectedOption;
    } else if (exercise.type === 'fill_blank') {
      r = checkExercise(exercise, fillText);
      answerValue = fillText;
    } else if (exercise.type === 'find_error') {
      if (selectedSegment === null) return;
      r = checkExercise(exercise, selectedSegment, correctionText);
      answerValue = selectedSegment;
      corr = correctionText;
    } else {
      r = checkExercise(exercise, sentenceText);
      answerValue = sentenceText;
    }
    setResult(r);
    // Wrong answers always go to the mistakes notebook; "needs review" ones only on request.
    onAnswered?.(r, r.outcome === 'incorrect' || addToMistakes, flagged)?.catch((e) => {
      console.error('Failed to save attempt', e);
    });
    // void unused
    void answerValue;
    void corr;
    void source;
  };

  const reset = () => {
    setSelectedOption(null);
    setFillText('');
    setSelectedSegment(null);
    setCorrectionText('');
    setSentenceText('');
    setResult(null);
    setAddToMistakes(false);
    setFlagged(false);
  };

  const outcomeColor =
    result?.outcome === 'correct'
      ? 'border-l-[var(--color-success)]'
      : result?.outcome === 'needs_review' || result?.nearMiss
        ? 'border-l-[var(--color-warning)]'
        : 'border-l-[var(--color-error)]';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-primary">{t(`difficulty.${exercise.difficulty}`)}</span>
        <span className="badge badge-neutral">{topic?.titleRu ?? exercise.topicId}</span>
        <span className="ml-auto text-xs text-muted">
          {exerciseTypeLabel(exercise.type)}
        </span>
      </div>

      <div>
        <p className="text-sm text-muted">{text.instruction}</p>
        <p className="mt-3 text-lg font-medium leading-relaxed">{exercise.questionEn}</p>
      </div>

      {/* Answer area */}
      {!result && (
        <div className="space-y-3">
          {exercise.type === 'multiple_choice' && exercise.data.type === 'multiple_choice' && (
            <div className="grid gap-2">
              {exercise.data.options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOption(o.id)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    selectedOption === o.id
                      ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-soft))]'
                      : 'border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-2))]'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                      selectedOption === o.id
                        ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))] text-white'
                        : 'border-[rgb(var(--color-border))] text-muted'
                    }`}
                  >
                    {o.id.toUpperCase()}
                  </span>
                  {o.text}
                </button>
              ))}
            </div>
          )}

          {exercise.type === 'fill_blank' && exercise.data.type === 'fill_blank' && (
            <div className="flex flex-wrap items-center gap-2 text-base">
              {exercise.data.promptBefore && <span>{exercise.data.promptBefore}</span>}
              <input
                type="text"
                value={fillText}
                onChange={(e) => setFillText(e.target.value)}
                className="input max-w-[220px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
              {exercise.data.promptAfter && <span>{exercise.data.promptAfter}</span>}
            </div>
          )}

          {exercise.type === 'find_error' && exercise.data.type === 'find_error' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-base">
                {exercise.data.sentenceParts.map((part, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSegment(i)}
                    className={`rounded-md px-2 py-1 transition-colors ${
                      selectedSegment === i
                        ? 'bg-[rgb(var(--color-primary-soft))] text-primary ring-2 ring-[rgb(var(--color-primary))]'
                        : 'hover:bg-[rgb(var(--color-surface-2))]'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
              {selectedSegment !== null && (
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    {t('exercise.correctionFor')}
                  </label>
                  <input
                    type="text"
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    className="input"
                    placeholder={t('exercise.correctionPlaceholder')}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          {exercise.type === 'write_sentence' && exercise.data.type === 'write_sentence' && (
            <div className="space-y-2">
              <p className="text-sm text-muted">{text.prompt}</p>
              <textarea
                value={sentenceText}
                onChange={(e) => setSentenceText(e.target.value)}
                className="input min-h-[80px] resize-y"
                placeholder="Write your sentence in English..."
                autoFocus
              />
              <p className="text-xs text-muted">
                {text.notes}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={submit} disabled={!canSubmit(exercise, selectedOption, fillText, selectedSegment, correctionText, sentenceText)}>
              {t('common.submit')}
            </button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {result && (
        <div className={`rounded-r-lg border-l-4 ${outcomeColor} bg-[rgb(var(--color-surface-2))] p-4`}>
          <div className="flex items-center gap-2">
            {result.outcome === 'correct' && <Check className="h-5 w-5 text-success" />}
            {result.outcome === 'incorrect' && !result.nearMiss && <X className="h-5 w-5 text-error" />}
            {(result.outcome === 'needs_review' || result.nearMiss) && <AlertTriangle className="h-5 w-5 text-warning" />}
            <span
              className={`font-medium ${
                result.outcome === 'correct'
                  ? 'text-success'
                  : result.outcome === 'needs_review' || result.nearMiss
                    ? 'text-warning'
                    : 'text-error'
              }`}
            >
              {result.outcome === 'correct'
                ? t('common.correct')
                : result.outcome === 'needs_review'
                  ? t('common.needsReview')
                  : result.nearMiss
                    ? t('common.almostCorrect')
                    : t('common.incorrect')}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="text-muted">{t('exercise.yourAnswer')}:</span>{' '}
              <span className="font-medium">{result.userAnswer || '—'}</span>
            </div>
            {result.outcome !== 'correct' && (
              <div>
                <span className="text-muted">{t('common.correct')}:</span>{' '}
                <span className="font-medium text-primary">{result.suggestedCorrection || '—'}</span>
              </div>
            )}
            {result.detail && (
              <p className="rounded-md bg-[rgb(var(--color-surface))] px-3 py-2 text-xs text-muted">
                {result.detail}
              </p>
            )}
            <div>
              <span className="text-muted">{t('common.explanation')}:</span>
              <p className="mt-1">{text.explanation}</p>
            </div>
            <div>
              <span className="text-muted">{t('common.example')}:</span>
              <p className="mt-1 italic">{exercise.exampleEn}</p>
            </div>
            <div>
              <span className="text-muted">{t('common.commonMistake')}:</span>
              <p className="mt-1 text-muted">{text.commonMistake}</p>
            </div>
          </div>

          {exercise.type === 'write_sentence' && (
            <p className="mt-3 rounded-md bg-[rgb(var(--color-surface))] px-3 py-2 text-xs text-muted">
              {t('diagnostic.disclaimer')}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {result.outcome === 'needs_review' && !addToMistakes && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAddToMistakes(true);
                  onAnswered?.(result, true, flagged)?.catch((e) => console.error('Failed to save', e));
                }}
              >
                <BookPlus className="h-4 w-4" />
                {t('common.addMistake')}
              </button>
            )}
            {result.outcome === 'needs_review' && !flagged && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFlagged(true);
                  onAnswered?.(result, addToMistakes, true)?.catch((e) => console.error('Failed to save', e));
                }}
              >
                <Flag className="h-4 w-4" />
                {t('common.flagReview')}
              </button>
            )}
            {allowRetry && (
              <button className="btn btn-ghost" onClick={reset}>
                {t('common.retry')}
              </button>
            )}
            {showAdvance && (
              <button className="btn btn-primary ml-auto" onClick={onAdvance}>
                {advanceLabel ?? t('common.next')}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function canSubmit(
  type: Exercise,
  selectedOption: string | null,
  fillText: string,
  selectedSegment: number | null,
  correctionText: string,
  sentenceText: string,
): boolean {
  if (type.type === 'multiple_choice') return selectedOption !== null;
  if (type.type === 'fill_blank') return fillText.trim().length > 0;
  if (type.type === 'find_error') return selectedSegment !== null && correctionText.trim().length > 0;
  if (type.type === 'write_sentence') return sentenceText.trim().length > 0;
  return false;
}

function exerciseTypeLabel(type: Exercise['type']): string {
  switch (type) {
    case 'multiple_choice':
      return 'Multiple choice';
    case 'fill_blank':
      return 'Fill in the blank';
    case 'find_error':
      return 'Find the error';
    case 'write_sentence':
      return 'Write a sentence';
  }
}

export function FeedbackBadge({ outcome }: { outcome: CheckResult['outcome'] }): ReactNode {
  if (outcome === 'correct') return <Check className="h-4 w-4 text-success" />;
  if (outcome === 'incorrect') return <X className="h-4 w-4 text-error" />;
  return <AlertTriangle className="h-4 w-4 text-warning" />;
}
