import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { useTrainerData } from '@/hooks/useTrainerData';
import { useApp } from '@/context/AppContext';
import { getTopicById } from '@/data/grammarTopics';
import { getExerciseById, getExercisesByTopic } from '@/data/exercises';
import {
  EXERCISES_PER_TOPIC,
  LESSONS_PER_WEEK,
  PLAN_WEEKS,
  buildPlan,
  currentWeekIndex,
  levelLabel,
  recommendedStartLevel,
  targetAccuracy,
  weekProgress,
} from '@/engine/studyPlan';
import { levelIndex } from '@/engine/diagnostic';
import type { TopicId } from '@/types';
import { SectionTitle } from '@/components/ui';
import { t, getLang } from '@/i18n';

const SKILL_KEYS = ['plan.skillReading', 'plan.skillListening', 'plan.skillWriting', 'plan.skillMock'];
const SKILL_LINKS = ['/reading', '/listening', '/writing', '/mock'];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--color-surface-2))]">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default function StudyPlan() {
  const { preferences } = useApp();
  const { attempts, mistakes, sessions, diagnostic, profile, loading } = useTrainerData();

  const latest = useMemo(
    () => [...diagnostic].sort((a, b) => b.takenAt - a.takenAt)[0],
    [diagnostic],
  );
  const now = Date.now();
  const plan = useMemo(
    () => (latest ? buildPlan(latest.takenAt, attempts, Date.now()) : null),
    [latest, attempts],
  );

  if (loading) {
    return <div className="py-12 text-center text-muted">{t('common.loading')}</div>;
  }

  if (!latest || !plan) {
    return (
      <div>
        <SectionTitle title={t('plan.title')} subtitle={t('plan.subtitle')} />
        <div className="card p-6">
          <p className="text-sm">{t('plan.needDiagnostic')}</p>
          <Link to="/diagnostic" className="btn btn-primary mt-4">
            {t('plan.takeDiagnostic')}
          </Link>
        </div>
      </div>
    );
  }

  const level = profile.currentLevel;
  const target = targetAccuracy(level);
  const week = currentWeekIndex(plan, now);
  const levelLabel = level === 'not_assessed' ? t('dashboard.notAssessed') : level;

  return (
    <div>
      <SectionTitle title={t('plan.title')} subtitle={t('plan.subtitle')} />

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm">
              {t('plan.basedOn', { date: formatDate(latest.takenAt), level: levelLabel })}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t('plan.goal', { n: EXERCISES_PER_TOPIC, acc: target })}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t('plan.dailyGoal', { min: preferences.dailyGoalMinutes })}
            </p>
            <p className="mt-1 text-xs text-muted">{t('plan.fixedNote')}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/lesson" className="btn btn-primary">
            {t('nav.dailyLesson')}
          </Link>
          <Link to="/diagnostic" className="btn btn-secondary">
            {t('plan.retake')}
          </Link>
        </div>
      </div>

      {week > PLAN_WEEKS && (
        <div className="card mt-4 p-5">
          <p className="text-sm">{t('plan.finished')}</p>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {plan.map((w) => {
          const p = weekProgress(w, level, attempts, sessions, mistakes, now);
          const isCurrent = p.state === 'current';
          const skillIndex = w.index - 1;
          return (
            <div
              key={w.index}
              className={`card p-5 ${isCurrent ? 'border-[rgb(var(--color-primary))]' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{t('plan.week', { n: w.index })}</h2>
                <span className="text-xs text-muted">
                  {formatDate(w.start)} – {formatDate(w.end - 1)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {isCurrent && <span className="badge badge-primary">{t('plan.current')}</span>}
                {p.state === 'upcoming' && <span className="badge badge-neutral">{t('plan.upcoming')}</span>}
                {p.state === 'past' && !p.completed && (
                  <span className="badge badge-neutral">{t('plan.past')}</span>
                )}
                {p.completed && <span className="badge badge-success">{t('plan.completed')}</span>}
              </div>
              {w.live && <p className="mt-2 text-xs text-muted">{t('plan.liveNote')}</p>}

              <h3 className="mb-2 mt-4 text-sm font-semibold">{t('plan.focusTopics')}</h3>
              <ul className="space-y-3">
                {p.topics.map((tp) => {
                  const topicExercises = getExercisesByTopic(tp.topicId);
                  const startLevel = recommendedStartLevel({
                    attempts,
                    topicId: tp.topicId as TopicId,
                    overall: level,
                    levelOf: (id) => {
                      const ex = getExerciseById(id);
                      return ex ? levelIndex(ex.difficulty) : undefined;
                    },
                    availableLevels: topicExercises.map((e) => levelIndex(e.difficulty)),
                  });
                  return (
                  <li key={tp.topicId}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        {tp.done && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {getTopicById(tp.topicId as TopicId)?.titleRu ?? tp.topicId}
                      </span>
                      <span className="text-xs text-muted">
                        {t('plan.exercisesProgress', {
                          done: tp.attempts,
                          target: EXERCISES_PER_TOPIC,
                          acc: tp.accuracy === null ? '—' : `${tp.accuracy}%`,
                        })}
                      </span>
                    </div>
                    <div className="mt-1">
                      <Bar value={(tp.attempts / EXERCISES_PER_TOPIC) * 100} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{t('plan.startLevel', { level: levelLabel(startLevel) })}</span>
                      <span>{t('plan.topicSize', { n: topicExercises.length })}</span>
                      <Link
                        to={`/grammar?topic=${tp.topicId}&level=${startLevel}`}
                        className="text-primary hover:underline"
                      >
                        {t('plan.openTopic')}
                      </Link>
                    </p>
                  </li>
                  );
                })}
              </ul>

              <div className="mt-4 space-y-1 text-sm">
                <p>
                  {t('plan.lessons', { done: p.lessonsDone, target: LESSONS_PER_WEEK })}
                </p>
                <p>
                  <Link to="/mistakes" className="text-primary hover:underline">
                    {t('plan.mistakes', { n: p.activeMistakes })}
                  </Link>
                </p>
                <p>
                  <span className="text-muted">{t('plan.skill')}: </span>
                  <Link to={SKILL_LINKS[skillIndex]} className="text-primary hover:underline">
                    {t(SKILL_KEYS[skillIndex])}
                  </Link>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted">{t('plan.levelNote')}</p>
      <p className="mt-1 text-xs text-muted">{t('plan.disclaimer')}</p>
    </div>
  );
}
