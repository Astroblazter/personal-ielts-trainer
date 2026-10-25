import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AttemptRecord,
  DailyLessonState,
  DiagnosticResult,
  MistakeEntry,
  Preferences,
  SectionAttemptRecord,
  SessionRecord,
  UserProfile,
  VocabWord,
} from '@/types';
import { SEED_VOCABULARY } from '@/data/vocabulary';
import { assertUniqueExerciseIds } from '@/data/exercises';
import { todayKey } from '@/engine/learning';

interface TrainerDB extends DBSchema {
  attempts: { key: string; value: AttemptRecord };
  mistakes: { key: string; value: MistakeEntry; indexes: { 'by-status': string; 'by-topic': string } };
  vocabulary: { key: string; value: VocabWord; indexes: { 'by-topic': string } };
  sessions: { key: string; value: SessionRecord };
  diagnostic: { key: string; value: DiagnosticResult };
  lessonState: { key: string; value: DailyLessonState };
  preferences: { key: string; value: Preferences };
  profile: { key: string; value: UserProfile };
  sectionAttempts: { key: string; value: SectionAttemptRecord; indexes: { 'by-source': string; 'by-section': string } };
}

const DB_NAME = 'ielts-trainer';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<TrainerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TrainerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TrainerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('attempts', { keyPath: 'id' });
          const mistakes = db.createObjectStore('mistakes', { keyPath: 'id' });
          mistakes.createIndex('by-status', 'status');
          mistakes.createIndex('by-topic', 'topicId');
          const vocab = db.createObjectStore('vocabulary', { keyPath: 'id' });
          vocab.createIndex('by-topic', 'topicId');
          db.createObjectStore('sessions', { keyPath: 'date' });
          db.createObjectStore('diagnostic', { keyPath: 'id' });
          db.createObjectStore('lessonState', { keyPath: 'date' });
          db.createObjectStore('preferences');
          db.createObjectStore('profile');
        }
        if (oldVersion < 2) {
          const sectionAttempts = db.createObjectStore('sectionAttempts', { keyPath: 'id' });
          sectionAttempts.createIndex('by-source', 'source');
          sectionAttempts.createIndex('by-section', 'sectionId');
        }
      },
      async blocked() {
        // noop
      },
    });
  }
  return dbPromise;
}

const PREF_KEY = 'preferences';
const PROFILE_KEY = 'profile';

// ── Preferences ─────────────────────────────────────────────────────────
const DEFAULT_PREFS: Preferences = {
  theme: 'system',
  interfaceLanguage: 'ru',
  dailyGoalMinutes: 20,
  targetIeltsScore: 6.0,
};

export async function getPreferences(): Promise<Preferences> {
  const db = await getDb();
  const stored = await db.get('preferences', PREF_KEY);
  return stored ?? DEFAULT_PREFS;
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  const db = await getDb();
  await db.put('preferences', prefs, PREF_KEY);
}

// ── Profile ─────────────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  currentLevel: 'not_assessed',
  targetIeltsScore: 6.0,
  dailyGoalMinutes: 20,
  lastDiagnosticAt: null,
};

export async function getProfile(): Promise<UserProfile> {
  const db = await getDb();
  const stored = await db.get('profile', PROFILE_KEY);
  return stored ?? DEFAULT_PROFILE;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDb();
  await db.put('profile', profile, PROFILE_KEY);
}

// ── Attempts ─────────────────────────────────────────────────────────────
export async function addAttempt(a: AttemptRecord): Promise<void> {
  const db = await getDb();
  await db.put('attempts', a);
}

export async function getAllAttempts(): Promise<AttemptRecord[]> {
  const db = await getDb();
  return db.getAll('attempts');
}

export async function getAttemptsByExercise(exerciseId: string): Promise<AttemptRecord[]> {
  const db = await getDb();
  const all = await db.getAll('attempts');
  return all.filter((a) => a.exerciseId === exerciseId);
}

// ── Mistakes ────────────────────────────────────────────────────────────
export async function addMistake(m: MistakeEntry): Promise<void> {
  const db = await getDb();
  const existing = await db.get('mistakes', m.id);
  if (existing) {
    await db.put('mistakes', { ...existing, ...m });
  } else {
    await db.put('mistakes', m);
  }
}

export async function updateMistake(m: MistakeEntry): Promise<void> {
  const db = await getDb();
  await db.put('mistakes', m);
}

export async function deleteMistake(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('mistakes', id);
}

export async function getAllMistakes(): Promise<MistakeEntry[]> {
  const db = await getDb();
  return db.getAll('mistakes');
}

export async function findMistakeByExerciseId(exerciseId: string): Promise<MistakeEntry | undefined> {
  const db = await getDb();
  const all = await db.getAll('mistakes');
  return all.find((m) => m.exerciseId === exerciseId && m.status !== 'archived');
}

// ── Vocabulary ──────────────────────────────────────────────────────────
export async function getAllVocabulary(): Promise<VocabWord[]> {
  const db = await getDb();
  let vocab = await db.getAll('vocabulary');
  if (vocab.length === 0) {
    await seedVocabulary();
    vocab = await db.getAll('vocabulary');
  }
  return vocab;
}

export async function addVocabWord(w: VocabWord): Promise<void> {
  const db = await getDb();
  await db.put('vocabulary', w);
}

export async function updateVocabWord(w: VocabWord): Promise<void> {
  const db = await getDb();
  await db.put('vocabulary', w);
}

export async function deleteVocabWord(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('vocabulary', id);
}

async function seedVocabulary(): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  for (const w of SEED_VOCABULARY) {
    await db.put('vocabulary', { ...w, createdAt: now, nextReviewAt: now });
  }
}

// ── Sessions ────────────────────────────────────────────────────────────
export async function addSession(s: SessionRecord): Promise<void> {
  const db = await getDb();
  await db.put('sessions', s);
}

export async function getSessionByDate(date: string): Promise<SessionRecord | undefined> {
  const db = await getDb();
  return db.get('sessions', date);
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  const db = await getDb();
  return db.getAll('sessions');
}

// ── Diagnostic ─────────────────────────────────────────────────────────
export async function saveDiagnosticResult(r: DiagnosticResult): Promise<void> {
  const db = await getDb();
  await db.put('diagnostic', r);
}

export async function getDiagnosticResults(): Promise<DiagnosticResult[]> {
  const db = await getDb();
  return db.getAll('diagnostic');
}

// ── Daily lesson state ──────────────────────────────────────────────────
export async function getLessonState(): Promise<DailyLessonState | undefined> {
  const db = await getDb();
  // The store's keyPath is `date`, so the record lives under today's date key.
  return db.get('lessonState', todayKey());
}

export async function saveLessonState(state: DailyLessonState): Promise<void> {
  const db = await getDb();
  await db.put('lessonState', state);
}

export async function clearLessonState(): Promise<void> {
  const db = await getDb();
  await db.delete('lessonState', todayKey());
}

// ── Section attempts (Reading / Listening / Writing / Speaking / Mock) ───
export async function addSectionAttempt(a: SectionAttemptRecord): Promise<void> {
  const db = await getDb();
  await db.put('sectionAttempts', a);
}

export async function getAllSectionAttempts(): Promise<SectionAttemptRecord[]> {
  const db = await getDb();
  return db.getAll('sectionAttempts');
}

export async function getSectionAttemptsBySource(source: SectionAttemptRecord['source']): Promise<SectionAttemptRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex('sectionAttempts', 'by-source', source);
}

// ── Export / Import ──────────────────────────────────────────────────────
export interface BackupData {
  exportedAt: number;
  version: 1;
  attempts: AttemptRecord[];
  mistakes: MistakeEntry[];
  vocabulary: VocabWord[];
  sessions: SessionRecord[];
  diagnostic: DiagnosticResult[];
  sectionAttempts: SectionAttemptRecord[];
  preferences: Preferences | null;
  profile: UserProfile | null;
  lessonState: DailyLessonState | null;
}

export async function exportBackup(): Promise<BackupData> {
  const db = await getDb();
  const [attempts, mistakes, vocabulary, sessions, diagnostic, sectionAttempts, lessonState] = await Promise.all([
    db.getAll('attempts'),
    db.getAll('mistakes'),
    db.getAll('vocabulary'),
    db.getAll('sessions'),
    db.getAll('diagnostic'),
    db.getAll('sectionAttempts').catch(() => []),
    db.get('lessonState', todayKey()).catch(() => undefined),
  ]);
  const preferences = await getPreferences();
  const profile = await getProfile();
  return {
    exportedAt: Date.now(),
    version: 1,
    attempts,
    mistakes,
    vocabulary,
    sessions,
    diagnostic,
    sectionAttempts,
    preferences,
    profile,
    lessonState: lessonState ?? null,
  };
}

export function validateBackup(data: unknown): data is BackupData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Partial<BackupData>;
  return (
    Array.isArray(d.attempts) &&
    Array.isArray(d.mistakes) &&
    Array.isArray(d.vocabulary) &&
    Array.isArray(d.sessions) &&
    (d.version === 1 || typeof d.version === 'number')
  );
}

export type ImportMode = 'overwrite' | 'merge';

export async function importBackup(data: BackupData, mode: ImportMode): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ['attempts', 'mistakes', 'vocabulary', 'sessions', 'diagnostic', 'sectionAttempts', 'lessonState', 'preferences', 'profile'],
    'readwrite',
  );

  if (mode === 'overwrite') {
    await Promise.all([
      tx.objectStore('attempts').clear(),
      tx.objectStore('mistakes').clear(),
      tx.objectStore('vocabulary').clear(),
      tx.objectStore('sessions').clear(),
      tx.objectStore('diagnostic').clear(),
      tx.objectStore('sectionAttempts').clear().catch(() => {}),
      tx.objectStore('lessonState').clear(),
    ]);
  }

  for (const a of data.attempts ?? []) tx.objectStore('attempts').put(a);
  for (const m of data.mistakes ?? []) tx.objectStore('mistakes').put(m);
  for (const v of data.vocabulary ?? []) tx.objectStore('vocabulary').put(v);
  for (const s of data.sessions ?? []) tx.objectStore('sessions').put(s);
  for (const dg of data.diagnostic ?? []) tx.objectStore('diagnostic').put(dg);
  for (const sa of data.sectionAttempts ?? []) tx.objectStore('sectionAttempts').put(sa);
  if (data.lessonState) tx.objectStore('lessonState').put(data.lessonState);
  if (data.preferences) tx.objectStore('preferences').put(data.preferences, PREF_KEY);
  if (data.profile) tx.objectStore('profile').put(data.profile, PROFILE_KEY);

  await tx.done;
}

// Init-time sanity check.
export async function initDb(): Promise<void> {
  assertUniqueExerciseIds();
  await getDb();
  await getAllVocabulary(); // seeds if empty
}
