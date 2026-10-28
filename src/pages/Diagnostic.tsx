import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, RotateCcw } from 'lucide-react';
import { GRAMMAR_EXERCISES } from '@/data/exercises';
import { getTopicById } from '@/data/grammarTopics';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useAnswerRecorder } from '@/hooks/useAnswerRecorder';
import {
  DIAGNOSTIC_LENGTH,
  diagnosticPool,
  estimateLevel,
  levelIndex,
  pickNextExercise,
  summarize,
  type DiagnosticAnswer,
} from '@/engine/diagnostic';
import type { CheckResult } from '@/engine/checker';
import type { AssessmentLevel, Exercise, TopicId } from '@/types';
import { ExercisePlayer } from '@/components/ExercisePlayer';
import { SectionTitle } from '@/components/ui';
import { t } from '@/i18n';

type Phase = 'intro' | 'taking' | 'result';

interface Finished {
  level: AssessmentLevel;
  answers: DiagnosticAnswer[];
}

const topicName = (id: string) => getTopicById(id as TopicId)?.titleRu ?? id;

export default function Diagnostic() {
  const navigate = useNavigate();
  const { diagnostic, recordDiagnostic, recordAttempt, upsertMistake, refresh, profile } = useTrainerData();
  const recordAnswer = useAnswerRecorder('diagnostic', recordAttempt, upsertMistake, refresh);

  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
  const [current, setCurrent] = useState<Exercise | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const shownAtRef = useRef(Date.now());

  const pool = useMemo(() => diagnosticPool(GRAMMAR_EXERCISES), []);
  const lastResult = useMemo(
    () => [...diagnostic].sort((a, b) => b.takenAt - a.takenAt)[0],
    [diagnostic],
  );

  const start = () => {
    const first = pickNextExercise(pool, []);
    setAnswers([]);
    setFinished(null);
    setCurrent(first);
    shownAtRef.current = Date.now();
    setPhase(first ? 'taking' : 'intro');
  };

  const handleAnswered = useCallback(
    async (result: CheckResult, addToMistakes: boolean, flagged: boolean) => {
      if (!current) return;
      const answer: DiagnosticAnswer = {
        exerciseId: current.id,
        topicId: current.topicId,
        level: levelIndex(current.difficulty),
        correct: result.outcome === 'correct',
      };
      // Keep one answer per exercise, even if the player reports the same answer again.
      setAnswers((prev) => (prev.some((a) => a.exerciseId === answer.exerciseId) ? prev : [...prev, answer]));
      await recordAnswer(current, result, addToMistakes, flagged, shownAtRef.current);
    },
    [current, recordAnswer],
  );

  const advance = useCallback(async () => {
    if (answers.length < DIAGNOSTIC_LENGTH) {
      const next = pickNextExercise(pool, answers);
      if (next) {
        setCurrent(next);
        shownAtRef.current = Date.now();
        return;
      }
    }
    const estimate = estimateLevel(answers);
    const { perTopic } = summarize(answers);
    await recordDiagnostic({
      takenAt: Date.now(),
      totalQuestions: answers.length,
      correctCount: answers.filter((a) => a.correct).length,
      perTopic,
      estimatedLevel: estimate.level,
      levelScore: estimate.score,
    });
    setFinished({ level: estimate.level, answers });
    setPhase('result');
  }, [answers, pool, recordDiagnostic]);

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
              <p className="mt-2 text-sm">{t('diagnostic.adaptiveNote', { n: DIAGNOSTIC_LENGTH })}</p>
              <button className="btn btn-primary mt-4" onClick={start}>
                {t('diagnostic.start')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {lastResult ? (
            <div className="mt-6 border-t border-[rgb(var(--color-border))] pt-4">
              <h3 className="text-sm font-semibold">{t('diagnostic.lastResult')}</h3>
              <p className="mt-2 text-sm">
                {t('diagnostic.correctAnswers')}: {lastResult.correctCount} / {lastResult.totalQuestions}
              </p>
              <p className="text-sm text-muted">
                {t('diagnostic.estimate')}:{' '}
                {profile.currentLevel === 'not_assessed' ? t('dashboard.notAssessed') : profile.currentLevel}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">{t('diagnostic.notTaken')}</p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'result' && finished) {
    const { perTopic, perLevel } = summarize(finished.answers);
    const correctCount = finished.answers.filter((a) => a.correct).length;
    const total = finished.answers.length;
    const topics = Object.entries(perTopic).map(([topicId, v]) => ({
      topicId,
      ...v,
      accuracy: Math.round((v.correct / v.total) * 100),
    }));
    const weaker = topics
      .filter((x) => x.accuracy < 100)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
      .slice(0, 3);
    const stronger = topics
      .filter((x) => x.accuracy === 100)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    return (
      <div>
        <SectionTitle title={t('diagnostic.result')} />
        <div className="card p-6">
          <div className="text-center">
            <p className="text-sm text-muted">{t('diagnostic.estimate')}</p>
            <p className="mt-1 text-5xl font-semibold">{finished.level}</p>
            <p className="mt-2 text-sm text-muted">
              {t('diagnostic.correctAnswers')}: {correctCount} / {total}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold">{t('diagnostic.byLevel')}</h3>
            <ul className="space-y-1">
              {perLevel.map((l) => (
                <li key={l.level} className="flex justify-between text-sm">
                  <span>{l.level}</span>
                  <span className="text-muted">
                    {l.correct} / {l.total}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-success">{t('diagnostic.stronger')}</h3>
              {stronger.length === 0 ? (
                <p className="text-sm text-muted">—</p>
              ) : (
                <ul className="space-y-1">
                  {stronger.map((s) => (
                    <li key={s.topicId} className="text-sm">
                      {topicName(s.topicId)}: {s.correct}/{s.total}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-error">{t('diagnostic.weaker')}</h3>
              {weaker.length === 0 ? (
                <p className="text-sm text-muted">{t('diagnostic.noWeak')}</p>
              ) : (
                <ul className="space-y-1">
                  {weaker.map((w) => (
                    <li key={w.topicId} className="text-sm">
                      {topicName(w.topicId)}: {w.correct}/{w.total}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-muted">{t('diagnostic.topicsNote')}</p>
          <p className="mt-1 text-xs text-muted">{t('diagnostic.mistakesAdded')}</p>
          <p className="mt-1 text-xs text-muted">{t('diagnostic.disclaimer')}</p>

          <div className="mt-6 flex flex-wrap gap-2">
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
  if (!current) return null;
  const isLast = answers.length >= DIAGNOSTIC_LENGTH;
  const number = Math.min(answers.length + (answers.some((a) => a.exerciseId === current.id) ? 0 : 1), DIAGNOSTIC_LENGTH);

  return (
    <div>
      <SectionTitle
        title={t('diagnostic.title')}
        subtitle={`${t('diagnostic.question')} ${number} ${t('diagnostic.of')} ${DIAGNOSTIC_LENGTH}`}
      />

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((number - 1) / DIAGNOSTIC_LENGTH) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <ExercisePlayer
          key={current.id}
          exercise={current}
          source="diagnostic"
          onAnswered={handleAnswered}
          onAdvance={advance}
          showAdvance
          allowRetry={false}
          advanceLabel={isLast ? t('diagnostic.finish') : t('common.next')}
        />
      </div>
    </div>
  );
}
