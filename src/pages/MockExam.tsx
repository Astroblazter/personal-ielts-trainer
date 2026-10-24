import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Clock, ClipboardCheck, CheckCircle2, Flag } from 'lucide-react';
import { READING_PASSAGES } from '@/data/reading';
import { LISTENING_TRACKS } from '@/data/listening';
import { WRITING_TASKS } from '@/data/writing';
import { SPEAKING_PROMPTS } from '@/data/speaking';
import type { MockSectionResult } from '@/types';
import { SectionTitle } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { useTrainerData } from '@/hooks/useTrainerData';
import { t } from '@/i18n';

type Phase = 'intro' | 'reading' | 'listening' | 'writing' | 'speaking' | 'results';
type SectionPhase = Exclude<Phase, 'intro' | 'results'>;

const SECTION_ORDER: SectionPhase[] = ['reading', 'listening', 'writing', 'speaking'];
const SECTION_TIME_SECONDS: Record<SectionPhase, number> = {
  reading: 600,
  listening: 420,
  writing: 600,
  speaking: 240,
};

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[.,!?;:]+$/g, '').replace(/\s+/g, ' ');
}

export default function MockExam() {
  const { recordSession } = useTrainerData();
  const [phase, setPhase] = useState<Phase>('intro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<MockSectionResult[]>([]);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [writingText, setWritingText] = useState('');
  const [speakingDone, setSpeakingDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const readingPassage = READING_PASSAGES[0];
  const listeningTrack = LISTENING_TRACKS[0];
  const writingTask = WRITING_TASKS[1];
  const speakingPrompt = SPEAKING_PROMPTS[2];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && phase !== 'intro' && phase !== 'results') {
      handleNextSection();
    }
  }, [timeLeft, phase]);

  const startExam = useCallback(() => {
    setResults([]);
    setReadingAnswers({});
    setListeningAnswers({});
    setWritingText('');
    setSpeakingDone(false);
    setPhase('reading');
    startTimer(SECTION_TIME_SECONDS.reading);
  }, [startTimer]);

  const handleNextSection = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === 'reading') {
      let correct = 0;
      for (const q of readingPassage.questions) {
        const a = readingAnswers[q.id] ?? '';
        if (q.type === 'fill_blank') {
          const accepted = (q.acceptedAnswers ?? []).map(normalize);
          if (accepted.includes(normalize(a))) correct++;
        } else if (a === q.correctOptionId) {
          correct++;
        }
      }
      const total = readingPassage.questions.length;
      setResults((prev) => [...prev, {
        section: 'reading',
        score: correct,
        total,
        details: `${correct}/${total}`,
      }]);
      setPhase('listening');
      startTimer(SECTION_TIME_SECONDS.listening);
    } else if (phase === 'listening') {
      let correct = 0;
      for (const q of listeningTrack.questions) {
        const a = listeningAnswers[q.id] ?? '';
        if (q.type === 'fill_blank') {
          const accepted = (q.acceptedAnswers ?? []).map(normalize);
          if (accepted.includes(normalize(a))) correct++;
        } else if (a === q.correctOptionId) {
          correct++;
        }
      }
      const total = listeningTrack.questions.length;
      setResults((prev) => [...prev, {
        section: 'listening',
        score: correct,
        total,
        details: `${correct}/${total}`,
      }]);
      setPhase('writing');
      startTimer(SECTION_TIME_SECONDS.writing);
    } else if (phase === 'writing') {
      const wc = writingText.trim().split(/\s+/).filter(Boolean).length;
      const score = wc >= writingTask.minWords ? 1 : 0;
      setResults((prev) => [...prev, {
        section: 'writing',
        score,
        total: 1,
        details: `${wc} ${t('writing.words')}`,
      }]);
      setPhase('speaking');
      startTimer(SECTION_TIME_SECONDS.speaking);
    } else if (phase === 'speaking') {
      setResults((prev) => [...prev, {
        section: 'speaking',
        score: speakingDone ? 1 : 0,
        total: 1,
        details: speakingDone ? t('mock.completed') : t('mock.skipped'),
      }]);
      finishExam();
    }
  }, [phase, readingAnswers, listeningAnswers, writingText, speakingDone, readingPassage, listeningTrack, writingTask]);

  const finishExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('results');
    await recordSession({
      startedAt: Date.now() - 600000,
      completedAt: Date.now(),
      exercisesCompleted: 1,
      correctCount: 1,
      timeSpentMs: 600000,
    });
  }, [recordSession]);

  const sectionIndex = SECTION_ORDER.indexOf(phase as SectionPhase);
  const timerActive = timeLeft > 0 && phase !== 'intro' && phase !== 'results';

  if (phase === 'intro') {
    return (
      <div>
        <SectionTitle title={t('mock.title')} subtitle={t('mock.subtitle')} />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration
            name="mock"
            size="page"
            alt="A path leading to a castle"
            className="shrink-0 max-w-[380px]"
          />
        </div>
        <div className="card p-6">
          <p className="text-sm leading-relaxed">{t('mock.intro')}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {SECTION_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-3 rounded-lg bg-[rgb(var(--color-surface-2))] p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-primary-soft))] text-sm font-medium text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{t(`mock.sections.${s}`)}</p>
                  <p className="text-xs text-muted">
                    {Math.floor(SECTION_TIME_SECONDS[s] / 60)} {t('writing.min')}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button className="btn btn-primary" onClick={startExam}>
              <ClipboardCheck className="h-4 w-4" />
              {t('mock.start')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalPossible = results.reduce((sum, r) => sum + r.total, 0);
    const pct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    return (
      <div>
        <SectionTitle title={t('mock.resultsTitle')} subtitle={t('mock.resultsSubtitle')} />
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <h2 className="text-xl font-semibold">{t('mock.summary')}</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {results.map((r) => (
              <div key={r.section} className="rounded-lg bg-[rgb(var(--color-surface-2))] p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {t(`mock.sections.${r.section}`)}
                </p>
                <p className="mt-2 text-2xl font-semibold">{r.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg bg-[rgb(var(--color-primary-soft))] p-5 text-center">
            <p className="text-xs text-muted">{t('mock.overall')}</p>
            <p className="mt-1 text-4xl font-bold text-primary">{pct}%</p>
            <p className="mt-2 text-xs text-muted">{t('mock.disclaimer')}</p>
          </div>
          <div className="mt-6">
            <button className="btn btn-primary" onClick={() => setPhase('intro')}>
              <ClipboardCheck className="h-4 w-4" />
              {t('mock.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Timer + progress */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="badge badge-primary">
            {sectionIndex + 1} / {SECTION_ORDER.length}
          </span>
          <span className="text-sm font-medium">{t(`mock.sections.${phase}`)}</span>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
          timerActive && timeLeft < 60 ? 'bg-[rgb(var(--color-error-soft))] text-error' : 'bg-[rgb(var(--color-surface-2))] text-muted'
        }`}>
          <Clock className="h-4 w-4" />
          {fmtTime(timeLeft)}
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((sectionIndex) / SECTION_ORDER.length) * 100}%` }}
        />
      </div>

      {/* Reading section */}
      {phase === 'reading' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="card max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-4 text-sm leading-relaxed">
              {readingPassage.passageEn.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {readingPassage.questions.map((q, idx) => (
              <div key={q.id} className="card p-4">
                <p className="text-xs text-muted">{idx + 1}. {q.questionEn}</p>
                <div className="mt-2 space-y-1.5">
                  {q.options?.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setReadingAnswers({ ...readingAnswers, [q.id]: o.id })}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                        readingAnswers[q.id] === o.id
                          ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-soft))]'
                          : 'border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-2))]'
                      }`}
                    >
                      {o.text}
                    </button>
                  ))}
                  {q.type === 'fill_blank' && (
                    <input
                      className="input"
                      value={readingAnswers[q.id] ?? ''}
                      onChange={(e) => setReadingAnswers({ ...readingAnswers, [q.id]: e.target.value })}
                      placeholder={t('reading.yourAnswer')}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listening section */}
      {phase === 'listening' && (
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-muted">{t('mock.listeningNote')}</p>
            <div className="mt-3 max-h-[300px] overflow-y-auto rounded-lg bg-[rgb(var(--color-surface-2))] p-4 text-sm leading-relaxed">
              {listeningTrack.transcriptEn.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          {listeningTrack.questions.map((q, idx) => (
            <div key={q.id} className="card p-4">
              <p className="text-xs text-muted">{idx + 1}. {q.questionEn}</p>
              <div className="mt-2 space-y-1.5">
                {q.options?.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setListeningAnswers({ ...listeningAnswers, [q.id]: o.id })}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                      listeningAnswers[q.id] === o.id
                        ? 'border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary-soft))]'
                        : 'border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-2))]'
                    }`}
                  >
                    {o.text}
                  </button>
                ))}
                {q.type === 'fill_blank' && (
                  <input
                    className="input"
                    value={listeningAnswers[q.id] ?? ''}
                    onChange={(e) => setListeningAnswers({ ...listeningAnswers, [q.id]: e.target.value })}
                    placeholder={t('listening.yourAnswer')}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Writing section */}
      {phase === 'writing' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="whitespace-pre-wrap rounded-lg bg-[rgb(var(--color-surface-2))] p-4 text-sm leading-relaxed">
              {writingTask.promptEn}
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{t('writing.yourAnswer')}</span>
              <span className="text-xs text-muted">
                {writingText.trim().split(/\s+/).filter(Boolean).length} / {writingTask.minWords}
              </span>
            </div>
            <textarea
              className="input min-h-[300px] resize-y text-sm leading-relaxed"
              value={writingText}
              onChange={(e) => setWritingText(e.target.value)}
              placeholder={t('writing.placeholder')}
            />
          </div>
        </div>
      )}

      {/* Speaking section */}
      {phase === 'speaking' && (
        <div className="space-y-4">
          <div className="card p-6">
            <p className="text-sm text-muted">{t('mock.speakingNote')}</p>
            <div className="mt-4 space-y-3">
              {speakingPrompt.questionsEn.map((q, i) => (
                <p key={i} className="text-base font-medium leading-relaxed">{q}</p>
              ))}
            </div>
            {speakingPrompt.cuesEn && (
              <div className="mt-4 rounded-lg bg-[rgb(var(--color-surface-2))] p-4">
                <ul className="space-y-1 text-sm">
                  {speakingPrompt.cuesEn.map((cue, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="card p-6 text-center">
            <p className="text-sm text-muted">{t('mock.speakingInstructions')}</p>
            <button
              className={`btn mt-4 ${speakingDone ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => setSpeakingDone(true)}
            >
              {speakingDone ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t('speaking.submitted')}
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  {t('mock.markSpeakingDone')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Next button */}
      <div className="mt-6 flex justify-end">
        <button className="btn btn-primary" onClick={handleNextSection}>
          {sectionIndex + 1 >= SECTION_ORDER.length ? t('mock.finish') : t('common.next')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
