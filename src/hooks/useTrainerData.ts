import { useCallback, useEffect, useState } from 'react';
import type {
  AttemptRecord,
  MistakeEntry,
  SessionRecord,
  DiagnosticResult,
  VocabWord,
  UserProfile,
} from '@/types';
import {
  getAllAttempts,
  getAllMistakes,
  getAllSessions,
  getDiagnosticResults,
  getAllVocabulary,
  getProfile,
  getSessionByDate,
  saveProfile,
  addMistake,
  updateMistake,
  deleteMistake as dbDeleteMistake,
  addAttempt,
  addSession,
  saveDiagnosticResult,
  addVocabWord,
  updateVocabWord,
  deleteVocabWord as dbDeleteVocab,
  findMistakeByExerciseId,
} from '@/data/db';
import { computeIntervalDays, todayKey } from '@/engine/learning';

const DAY_MS = 86_400_000;

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface ErrorCategoryMap {
  verb_tenses: 'verb_tenses';
  articles: 'articles';
  prepositions: 'prepositions';
  word_order: 'word_order';
  sentence_structure: 'sentence_structure';
  vocabulary: 'vocabulary';
  spelling: 'spelling';
  other: 'other';
}

const topicToCategory: Record<string, keyof ErrorCategoryMap> = {
  present_simple_vs_continuous: 'verb_tenses',
  past_simple_vs_present_perfect: 'verb_tenses',
  past_simple_vs_past_continuous: 'verb_tenses',
  future_forms: 'verb_tenses',
  subject_verb_agreement: 'sentence_structure',
  articles: 'articles',
  prepositions: 'prepositions',
  word_order: 'word_order',
  questions_negatives: 'sentence_structure',
  countable_uncountable: 'other',
  modals: 'verb_tenses',
  conditionals: 'sentence_structure',
  gerunds_infinitives: 'verb_tenses',
  comparatives_superlatives: 'other',
  sentence_structure: 'sentence_structure',
  diagnostic: 'other',
};

export function topicIdToCategory(topicId: string): MistakeEntry['category'] {
  return (topicToCategory[topicId] ?? 'other') as MistakeEntry['category'];
}

export interface TrainerData {
  attempts: AttemptRecord[];
  mistakes: MistakeEntry[];
  sessions: SessionRecord[];
  diagnostic: DiagnosticResult[];
  vocabulary: VocabWord[];
  profile: UserProfile;
  loading: boolean;
  refresh: () => Promise<void>;
  recordAttempt: (
    a: Omit<AttemptRecord, 'id' | 'createdAt'>,
    opts?: { addToMistakes?: boolean },
  ) => Promise<AttemptRecord>;
  upsertMistake: (m: MistakeEntry) => Promise<void>;
  setMistakeStatus: (id: string, status: MistakeEntry['status']) => Promise<void>;
  removeMistake: (id: string) => Promise<void>;
  recordSession: (s: Omit<SessionRecord, 'date'>) => Promise<void>;
  recordDiagnostic: (r: Omit<DiagnosticResult, 'id'>) => Promise<void>;
  addWord: (w: Omit<VocabWord, 'id' | 'createdAt' | 'reviewStatus' | 'correctCount' | 'incorrectCount' | 'nextReviewAt'>) => Promise<void>;
  editWord: (w: VocabWord) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  updateProfile: (p: Partial<UserProfile>) => Promise<void>;
}

export function useTrainerData(): TrainerData {
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabWord[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    currentLevel: 'not_assessed',
    targetIeltsScore: 6.0,
    dailyGoalMinutes: 20,
    lastDiagnosticAt: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [a, m, s, d, v, p] = await Promise.all([
        getAllAttempts(),
        getAllMistakes(),
        getAllSessions(),
        getDiagnosticResults(),
        getAllVocabulary(),
        getProfile(),
      ]);
      setAttempts(a);
      setMistakes(m);
      setSessions(s);
      setDiagnostic(d);
      setVocabulary(v);
      setProfile(p);
    } catch (e) {
      console.error('Failed to load data from IndexedDB', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordAttempt = useCallback<TrainerData['recordAttempt']>(
    async (a, opts) => {
      const rec: AttemptRecord = { ...a, id: genId('att'), createdAt: Date.now() };
      await addAttempt(rec);
      setAttempts((prev) => [...prev, rec]);

      // If incorrect and user wants it in mistakes (or by default for wrong answers)
      if (!a.correct && opts?.addToMistakes) {
        const existing = await findMistakeByExerciseId(a.exerciseId);
        const attempts = (existing?.attempts ?? 0) + 1;
        const interval = computeIntervalDays(attempts, false);
        const mistake: MistakeEntry = existing
          ? {
              ...existing,
              userAnswer: a.userAnswer,
              suggestedCorrection: a.suggestedCorrection,
              attempts,
              nextReviewAt: Date.now() + interval * DAY_MS,
              reviewIntervalDays: interval,
              status: 'active',
            }
          : {
              id: genId('mis'),
              exerciseId: a.exerciseId,
              topicId: a.topicId,
              category: topicIdToCategory(a.topicId),
              questionEn: '',
              userAnswer: a.userAnswer,
              suggestedCorrection: a.suggestedCorrection,
              explanationRu: '',
              createdAt: Date.now(),
              attempts,
              status: 'active',
              nextReviewAt: Date.now() + interval * DAY_MS,
              reviewIntervalDays: interval,
            };
        await addMistake(mistake);
        setMistakes((prev) => {
          const idx = prev.findIndex((x) => x.id === mistake.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = mistake;
            return copy;
          }
          return [...prev, mistake];
        });
      }
      return rec;
    },
    [],
  );

  const upsertMistake = useCallback(async (m: MistakeEntry) => {
    await addMistake(m);
    setMistakes((prev) => {
      const idx = prev.findIndex((x) => x.id === m.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = m;
        return copy;
      }
      return [...prev, m];
    });
  }, []);

  const setMistakeStatus = useCallback(async (id: string, status: MistakeEntry['status']) => {
    const m = (await getAllMistakes()).find((x) => x.id === id);
    if (!m) return;
    const updated = { ...m, status };
    await updateMistake(updated);
    setMistakes((prev) => prev.map((x) => (x.id === id ? updated : x)));
  }, []);

  const removeMistake = useCallback(async (id: string) => {
    await dbDeleteMistake(id);
    setMistakes((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const recordSession = useCallback(async (s: Omit<SessionRecord, 'date'>) => {
    const date = todayKey(new Date(s.startedAt));
    const existing = await getSessionByDate(date);
    const rec: SessionRecord = existing
      ? {
          ...s,
          date,
          exercisesCompleted: s.exercisesCompleted + (existing.exercisesCompleted ?? 0),
          correctCount: s.correctCount + (existing.correctCount ?? 0),
          timeSpentMs: s.timeSpentMs + (existing.timeSpentMs ?? 0),
        }
      : { ...s, date };
    await addSession(rec);
    setSessions((prev) => {
      const idx = prev.findIndex((x) => x.date === rec.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = rec;
        return copy;
      }
      return [...prev, rec];
    });
  }, []);

  const recordDiagnostic = useCallback(async (r: Omit<DiagnosticResult, 'id'>) => {
    const rec: DiagnosticResult = { ...r, id: genId('diag') };
    await saveDiagnosticResult(rec);
    setDiagnostic((prev) => [...prev, rec]);
    const newProfile: UserProfile = {
      ...profile,
      lastDiagnosticAt: rec.takenAt,
      currentLevel: rec.correctCount / rec.totalQuestions >= 0.7 ? 'B1' : 'not_assessed',
    };
    await saveProfile(newProfile);
    setProfile(newProfile);
  }, [profile]);

  const addWord = useCallback(async (w: Omit<VocabWord, 'id' | 'createdAt' | 'reviewStatus' | 'correctCount' | 'incorrectCount' | 'nextReviewAt'>) => {
    const now = Date.now();
    const rec: VocabWord = {
      ...w,
      id: genId('voc'),
      createdAt: now,
      reviewStatus: 'new',
      correctCount: 0,
      incorrectCount: 0,
      nextReviewAt: now,
    };
    await addVocabWord(rec);
    setVocabulary((prev) => [...prev, rec]);
  }, []);

  const editWord = useCallback(async (w: VocabWord) => {
    await updateVocabWord(w);
    setVocabulary((prev) => prev.map((x) => (x.id === w.id ? w : x)));
  }, []);

  const removeWord = useCallback(async (id: string) => {
    await dbDeleteVocab(id);
    setVocabulary((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const updateProfile = useCallback(async (p: Partial<UserProfile>) => {
    const next = { ...profile, ...p };
    await saveProfile(next);
    setProfile(next);
  }, [profile]);

  return {
    attempts,
    mistakes,
    sessions,
    diagnostic,
    vocabulary,
    profile,
    loading,
    refresh,
    recordAttempt,
    upsertMistake,
    setMistakeStatus,
    removeMistake,
    recordSession,
    recordDiagnostic,
    addWord,
    editWord,
    removeWord,
    updateProfile,
  };
}
