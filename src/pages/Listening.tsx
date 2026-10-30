import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X, Play, Pause, Headphones, Eye, EyeOff } from 'lucide-react';
import { LISTENING_TRACKS } from '@/data/listening';
import type { ListeningTrack, ListeningQuestion } from '@/types';
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

function checkQuestion(q: ListeningQuestion, answer: string): boolean {
  if (q.type === 'fill_blank') {
    const accepted = (q.acceptedAnswers ?? []).map(normalize);
    return accepted.includes(normalize(answer));
  }
  return answer === q.correctOptionId;
}

export default function Listening() {
  const { recordSession } = useTrainerData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const track = useMemo(
    () => LISTENING_TRACKS.find((t) => t.id === selectedId) ?? null,
    [selectedId],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const results = useMemo<Results>(() => {
    if (!track || !submitted) return {};
    const r: Results = {};
    for (const q of track.questions) {
      const a = answers[q.id] ?? '';
      r[q.id] = checkQuestion(q, a);
    }
    return r;
  }, [track, submitted, answers]);

  const score = useMemo(
    () => Object.values(results).filter(Boolean).length,
    [results],
  );

  const selectTrack = useCallback((id: string) => {
    setSelectedId(id);
    setAnswers({});
    setSubmitted(false);
    setStartTime(Date.now());
    setShowTranscript(false);
    setIsPlaying(false);
  }, []);

  const backToList = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setSelectedId(null);
    setAnswers({});
    setSubmitted(false);
  };

  const togglePlay = useCallback(() => {
    if (!track) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(track.transcriptEn);
    u.rate = 0.95;
    u.lang = 'en-GB';
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
  }, [track, isPlaying]);

  const submitAll = useCallback(async () => {
    if (!track) return;
    setSubmitted(true);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    const correctCount = track.questions.filter((q) => checkQuestion(q, answers[q.id] ?? '')).length;
    await recordSession({
      startedAt: startTime,
      completedAt: Date.now(),
      exercisesCompleted: track.questions.length,
      correctCount,
      timeSpentMs: Date.now() - startTime,
    });
  }, [track, answers, startTime, recordSession]);

  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  if (!track) {
    return (
      <div>
        <SectionTitle title={t('listening.title')} subtitle={t('listening.subtitle')} />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration
            name="listening"
            size="inline"
            alt="Listening to English sounds in the village"
            className="shrink-0"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {LISTENING_TRACKS.map((tr: ListeningTrack) => (
            <button
              key={tr.id}
              onClick={() => selectTrack(tr.id)}
              className="card group p-5 text-left transition-colors hover:border-[rgb(var(--color-primary))]"
            >
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-primary" />
                <span className="badge badge-primary">{t(`difficulty.${tr.difficulty}`)}</span>
              </div>
              <p className="mt-3 font-medium">{localizedTitle(tr)}</p>
              <p className="mt-1 text-sm text-muted">{tr.titleEn}</p>
              <p className="mt-3 text-xs text-muted">
                {tr.durationLabel} · {tr.questions.length} {t('listening.questions')}
              </p>
            </button>
          ))}
        </div>
        {!speechSupported && (
          <p className="mt-4 text-xs text-muted">{t('listening.noSpeechSupport')}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title={localizedTitle(track)}
        subtitle={track.titleEn}
        action={
          <button className="btn btn-ghost" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
            {t('listening.backToList')}
          </button>
        }
      />

      {/* Audio player */}
      <div className="card mb-6 p-5">
        <div className="flex items-center gap-4">
          <button
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-white transition-transform hover:scale-105"
            onClick={togglePlay}
            disabled={!speechSupported}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium">{t('listening.listen')}</p>
            <p className="text-xs text-muted">
              {track.durationLabel}
              {!speechSupported && ` · ${t('listening.noSpeechSupport')}`}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
              <div
                className={`h-full rounded-full transition-all ${isPlaying ? 'bg-primary' : 'bg-[rgb(var(--color-border))]'}`}
                style={{ width: isPlaying ? '100%' : '0%' }}
              />
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showTranscript ? t('listening.hideTranscript') : t('listening.showTranscript')}
          </button>
        </div>
        {showTranscript && (
          <div className="mt-4 rounded-lg bg-[rgb(var(--color-surface-2))] p-4 text-sm leading-relaxed">
            {track.transcriptEn.split('\n').map((line, i) => (
              <p key={i} className={line.trim() === '' ? 'h-2' : ''}>{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {track.questions.map((q, idx) => {
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
                  placeholder={t('listening.yourAnswer')}
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
            disabled={track.questions.some((q) => !answers[q.id])}
          >
            {t('listening.submitAll')}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="card p-5 text-center">
            <p className="text-3xl font-semibold">{score} / {track.questions.length}</p>
            <p className="mt-1 text-xs text-muted">{t('listening.score')}</p>
            <button className="btn btn-secondary mt-4" onClick={backToList}>
              <ArrowLeft className="h-4 w-4" />
              {t('listening.backToList')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
