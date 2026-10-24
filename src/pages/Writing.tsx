import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Clock, FileText, Check, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { WRITING_TASKS } from '@/data/writing';
import type { WritingTask } from '@/types';
import { SectionTitle } from '@/components/ui';
import { Illustration } from '@/components/Illustration';
import { useTrainerData } from '@/hooks/useTrainerData';
import { t } from '@/i18n';

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function Writing() {
  const { recordSession } = useTrainerData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [showSample, setShowSample] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const task = useMemo(
    () => WRITING_TASKS.find((t) => t.id === selectedId) ?? null,
    [selectedId],
  );

  const wordCount = useMemo(() => countWords(text), [text]);
  const meetsMin = task ? wordCount >= task.minWords : false;

  const selectTask = useCallback((id: string) => {
    setSelectedId(id);
    setText('');
    setShowSample(false);
    setCheckedItems(new Set());
    setSubmitted(false);
    setStartTime(Date.now());
  }, []);

  const backToList = () => {
    setSelectedId(null);
    setText('');
    setShowSample(false);
    setCheckedItems(new Set());
    setSubmitted(false);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitWriting = useCallback(async () => {
    if (!task) return;
    setSubmitted(true);
    await recordSession({
      startedAt: startTime,
      completedAt: Date.now(),
      exercisesCompleted: 1,
      correctCount: checkedItems.size,
      timeSpentMs: Date.now() - startTime,
    });
  }, [task, startTime, checkedItems.size, recordSession]);

  if (!task) {
    return (
      <div>
        <SectionTitle title={t('writing.title')} subtitle={t('writing.subtitle')} />
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Illustration
            name="writing"
            size="inline"
            alt="Writing a letter at a wooden desk"
            className="shrink-0"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {WRITING_TASKS.map((task: WritingTask) => (
            <button
              key={task.id}
              onClick={() => selectTask(task.id)}
              className="card group p-5 text-left transition-colors hover:border-[rgb(var(--color-primary))]"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="badge badge-primary">
                  {task.type === 'task1' ? 'Task 1' : 'Task 2'}
                </span>
              </div>
              <p className="mt-3 font-medium">{task.titleRu}</p>
              <p className="mt-1 text-xs text-muted">
                {task.minWords}–{task.maxWords} {t('writing.words')} · {task.suggestedTimeMinutes} {t('writing.min')}
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
        title={task.titleRu}
        subtitle={task.type === 'task1' ? 'IELTS Writing Task 1' : 'IELTS Writing Task 2'}
        action={
          <button className="btn btn-ghost" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
            {t('writing.backToList')}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Writing area */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted">
              <Clock className="h-4 w-4" />
              <span>{t('writing.suggestedTime')}: {task.suggestedTimeMinutes} {t('writing.min')}</span>
            </div>
            <div className="whitespace-pre-wrap rounded-lg bg-[rgb(var(--color-surface-2))] p-4 text-sm leading-relaxed">
              {task.promptEn}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">{t('writing.yourAnswer')}</span>
              <span className={`text-xs font-medium ${meetsMin ? 'text-success' : 'text-muted'}`}>
                {wordCount} / {task.minWords} {t('writing.words')}
              </span>
            </div>
            <textarea
              className="input min-h-[300px] resize-y font-mono text-sm leading-relaxed"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('writing.placeholder')}
              disabled={submitted}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {!submitted && (
                <button
                  className="btn btn-primary"
                  onClick={submitWriting}
                  disabled={!meetsMin}
                >
                  <Check className="h-4 w-4" />
                  {t('writing.submit')}
                </button>
              )}
              {submitted && (
                <button className="btn btn-secondary" onClick={() => { setText(''); setSubmitted(false); setCheckedItems(new Set()); }}>
                  <RotateCcw className="h-4 w-4" />
                  {t('common.retry')}
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowSample((v) => !v)}
              >
                {showSample ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showSample ? t('writing.hideSample') : t('writing.showSample')}
              </button>
            </div>
          </div>

          {showSample && (
            <div className="card p-5">
              <p className="mb-2 text-sm font-medium">{t('writing.sampleAnswer')}</p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {task.sampleAnswerEn}
              </div>
            </div>
          )}
        </div>

        {/* Self-assessment sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              {t('writing.selfCheck')}
            </h3>
            <ul className="space-y-2">
              {task.checklist.map((item) => {
                const checked = checkedItems.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className="flex w-full items-start gap-2 text-left text-sm transition-colors"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? 'border-[rgb(var(--color-success))] bg-[rgb(var(--color-success))]'
                            : 'border-[rgb(var(--color-border))]'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className={checked ? 'text-muted line-through' : ''}>
                        {item.labelRu}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted">
              {checkedItems.size} / {task.checklist.length} {t('writing.checked')}
            </p>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              {t('writing.tips')}
            </h3>
            <ul className="space-y-2 text-sm text-muted">
              {task.tipsRu.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {submitted && (
            <div className="card p-5 text-center">
              <p className="text-sm font-medium">{t('writing.submitted')}</p>
              <p className="mt-2 text-3xl font-semibold">{checkedItems.size}/{task.checklist.length}</p>
              <p className="mt-1 text-xs text-muted">{t('writing.selfScore')}</p>
              <p className="mt-3 text-xs text-muted">{t('writing.selfScoreNote')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
