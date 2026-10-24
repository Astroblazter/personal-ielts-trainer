import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, Square, Play, Pause, Trash2, Clock, MicOff } from 'lucide-react';
import { SPEAKING_PROMPTS, getSpeakingPromptsByPart } from '@/data/speaking';
import type { SpeakingPrompt, SpeakingPart } from '@/types';
import { SectionTitle } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { useTrainerData } from '@/hooks/useTrainerData';
import { t } from '@/i18n';

const PART_LABELS: Record<SpeakingPart, string> = {
  part1: 'Part 1',
  part2: 'Part 2',
  part3: 'Part 3',
};

export default function Speaking() {
  const { recordSession } = useTrainerData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<SpeakingPart | 'all'>('all');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef(0);

  const prompt = SPEAKING_PROMPTS.find((p) => p.id === selectedId) ?? null;

  const filteredPrompts = filter === 'all' ? SPEAKING_PROMPTS : getSpeakingPromptsByPart(filter);

  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
      }
    };
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  const selectPrompt = useCallback((id: string) => {
    setSelectedId(id);
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlaying(false);
    setElapsed(0);
    setSubmitted(false);
    startTimeRef.current = Date.now();
  }, []);

  const backToList = () => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
    setSelectedId(null);
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlaying(false);
    setElapsed(0);
    setSubmitted(false);
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((tr) => tr.stop());
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setElapsed(0);
      startTimeRef.current = Date.now();
      stopTimer();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    } catch {
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopTimer();
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const deleteRecording = () => {
    setAudioUrl(null);
    setIsPlaying(false);
    setElapsed(0);
  };

  const submitSpeaking = useCallback(async () => {
    if (!prompt) return;
    setSubmitted(true);
    await recordSession({
      startedAt: startTimeRef.current,
      completedAt: Date.now(),
      exercisesCompleted: 1,
      correctCount: 1,
      timeSpentMs: Date.now() - startTimeRef.current,
    });
  }, [prompt, recordSession]);

  if (!prompt) {
    return (
      <div>
        <SectionTitle title={t('speaking.title')} subtitle={t('speaking.subtitle')} />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration
            name="speaking"
            size="inline"
            alt="Conversation in a tea room"
            className="shrink-0"
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'part1', 'part2', 'part3'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f === 'all' ? t('common.all') : PART_LABELS[f]}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredPrompts.map((p: SpeakingPrompt) => (
            <button
              key={p.id}
              onClick={() => selectPrompt(p.id)}
              className="card group p-5 text-left transition-colors hover:border-[rgb(var(--color-primary))]"
            >
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <span className="badge badge-primary">{PART_LABELS[p.part]}</span>
              </div>
              <p className="mt-3 font-medium">{p.titleRu}</p>
              <p className="mt-1 text-sm text-muted">{p.topicEn}</p>
              <p className="mt-3 text-xs text-muted">
                {Math.floor(p.suggestedTimeSeconds / 60)}:{(p.suggestedTimeSeconds % 60).toString().padStart(2, '0')} {t('speaking.suggested')}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const targetTime = prompt.suggestedTimeSeconds;

  return (
    <div>
      <SectionTitle
        title={prompt.titleRu}
        subtitle={`${PART_LABELS[prompt.part]} · ${prompt.topicEn}`}
        action={
          <button className="btn btn-ghost" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
            {t('speaking.backToList')}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main area */}
        <div className="space-y-4">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2 text-xs text-muted">
              <Clock className="h-4 w-4" />
              <span>{t('speaking.suggested')}: {fmtTime(targetTime)}</span>
            </div>

            <div className="space-y-3">
              {prompt.questionsEn.map((q, i) => (
                <p key={i} className="text-base font-medium leading-relaxed">{q}</p>
              ))}
            </div>

            {prompt.cuesEn && (
              <div className="mt-4 rounded-lg bg-[rgb(var(--color-surface-2))] p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {t('speaking.cues')}
                </p>
                <ul className="space-y-1 text-sm">
                  {prompt.cuesEn.map((cue, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      {cue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recorder */}
          <div className="card p-6">
            <div className="flex flex-col items-center gap-4">
              {!audioUrl && !isRecording && (
                <button
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-white transition-transform hover:scale-105"
                  onClick={startRecording}
                >
                  <Mic className="h-8 w-8" />
                </button>
              )}

              {isRecording && (
                <button
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[rgb(var(--color-error))] text-white transition-transform hover:scale-105"
                  onClick={stopRecording}
                >
                  <Square className="h-8 w-8" />
                </button>
              )}

              {audioUrl && !isRecording && (
                <div className="flex items-center gap-4">
                  <button
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--color-primary))] text-white transition-transform hover:scale-105"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>
                  <button
                    className="btn btn-ghost text-error"
                    onClick={deleteRecording}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('speaking.delete')}
                  </button>
                </div>
              )}

              <audio
                ref={audioRef}
                src={audioUrl ?? undefined}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="text-center">
                {isRecording && (
                  <>
                    <p className="text-2xl font-semibold text-error">{fmtTime(elapsed)}</p>
                    <p className="text-xs text-muted">{t('speaking.recording')}</p>
                  </>
                )}
                {!isRecording && !audioUrl && (
                  <p className="text-sm text-muted">{t('speaking.pressToRecord')}</p>
                )}
                {audioUrl && !isRecording && (
                  <p className="text-sm text-muted">{t('speaking.recorded')}</p>
                )}
              </div>

              {audioUrl && !submitted && (
                <button className="btn btn-primary" onClick={submitSpeaking}>
                  {t('speaking.submit')}
                </button>
              )}

              {submitted && (
                <div className="w-full rounded-lg bg-[rgb(var(--color-success-soft))] p-4 text-center">
                  <p className="text-sm font-medium text-success">{t('speaking.submitted')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              {t('speaking.tips')}
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {prompt.tipsRu.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs text-muted">
              <MicOff className="h-4 w-4" />
              <span>{t('speaking.privacyNote')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
