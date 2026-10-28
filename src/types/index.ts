// Core domain types for the Personal IELTS Trainer.

export type ExerciseType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'find_error'
  | 'write_sentence';

export type Difficulty = 'A2' | 'B1' | 'B1+' | 'B2' | 'IELTS';

export type TopicId =
  | 'present_simple_vs_continuous'
  | 'past_simple_vs_present_perfect'
  | 'past_simple_vs_past_continuous'
  | 'future_forms'
  | 'subject_verb_agreement'
  | 'articles'
  | 'prepositions'
  | 'word_order'
  | 'questions_negatives'
  | 'countable_uncountable'
  | 'modals'
  | 'conditionals'
  | 'gerunds_infinitives'
  | 'comparatives_superlatives'
  | 'sentence_structure'
  | 'diagnostic';

export type ErrorCategory =
  | 'verb_tenses'
  | 'articles'
  | 'prepositions'
  | 'word_order'
  | 'sentence_structure'
  | 'vocabulary'
  | 'spelling'
  | 'other';

export interface GrammarTopic {
  id: TopicId;
  titleEn: string;
  titleRu: string;
  shortDescriptionRu: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
}

export interface MultipleChoiceData {
  type: 'multiple_choice';
  options: MultipleChoiceOption[];
  correctOptionId: string;
}

export interface FillBlankData {
  type: 'fill_blank';
  promptBefore?: string;
  promptAfter?: string;
  acceptedAnswers: string[];
}

export interface FindErrorData {
  type: 'find_error';
  sentenceParts: string[];
  errorSegmentIndex: number;
  correction: string;
}

export interface WriteSentenceData {
  type: 'write_sentence';
  promptRu: string;
  targetWords: string[];
  acceptedPatterns: string[];
  notesRu: string;
}

export type ExerciseData =
  | MultipleChoiceData
  | FillBlankData
  | FindErrorData
  | WriteSentenceData;

export interface Exercise {
  id: string;
  topicId: TopicId;
  difficulty: Difficulty;
  type: ExerciseType;
  instructionRu: string;
  questionEn: string;
  data: ExerciseData;
  explanationRu: string;
  exampleEn: string;
  commonMistakeNoteRu: string;
  relatedTopicId: TopicId;
}

export type ReviewStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface VocabWord {
  id: string;
  word: string;
  translationRu: string;
  exampleEn: string;
  topicId: TopicId;
  difficulty: Difficulty;
  note?: string;
  createdAt: number;
  reviewStatus: ReviewStatus;
  correctCount: number;
  incorrectCount: number;
  nextReviewAt: number;
}

export type MistakeStatus = 'active' | 'understood' | 'archived';

export interface MistakeEntry {
  id: string;
  exerciseId: string;
  topicId: TopicId;
  category: ErrorCategory;
  questionEn: string;
  userAnswer: string;
  suggestedCorrection: string;
  explanationRu: string;
  createdAt: number;
  attempts: number;
  status: MistakeStatus;
  nextReviewAt: number;
  reviewIntervalDays: number;
}

export interface DiagnosticQuestion {
  id: string;
  topicId: TopicId;
  instructionRu: string;
  questionEn: string;
  options: MultipleChoiceOption[];
  correctOptionId: string;
  explanationRu: string;
}

export interface AttemptRecord {
  id: string;
  exerciseId: string;
  topicId: TopicId;
  type: ExerciseType;
  correct: boolean;
  userAnswer: string;
  suggestedCorrection: string;
  createdAt: number;
  timeSpentMs: number;
  source: 'daily_lesson' | 'grammar_lab' | 'diagnostic' | 'mistake_retry';
}

export interface DailyLessonState {
  date: string;
  exerciseIds: string[];
  currentIndex: number;
  answers: Record<string, AttemptRecord>;
  startedAt: number;
  completedAt?: number;
}

export interface DiagnosticResult {
  id: string;
  takenAt: number;
  totalQuestions: number;
  correctCount: number;
  perTopic: Record<string, { correct: number; total: number }>;
  /** Internal grammar level estimate from the adaptive diagnostic (not an IELTS score). */
  estimatedLevel?: AssessmentLevel;
  /** Average difficulty level (0 = A2 ... 3 = B2) the adaptive test settled on. */
  levelScore?: number;
}

export interface SessionRecord {
  date: string;
  startedAt: number;
  completedAt: number;
  exercisesCompleted: number;
  correctCount: number;
  timeSpentMs: number;
}

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  interfaceLanguage: 'ru' | 'en';
  dailyGoalMinutes: number;
  targetIeltsScore: number;
}

export interface ProgressStats {
  totalExercisesCompleted: number;
  totalCorrect: number;
  overallAccuracy: number;
  streak: number;
  lastStudyDate: string | null;
  exercisesByDay: { date: string; count: number; correct: number }[];
  accuracyByTopic: { topicId: TopicId; total: number; correct: number; accuracy: number }[];
  mostFrequentErrors: { category: ErrorCategory; count: number }[];
  topicsDueForReview: { topicId: TopicId; count: number }[];
  reviewSuccessRate: number;
}

export type AssessmentLevel =
  | 'not_assessed'
  | 'A2'
  | 'B1'
  | 'B1+'
  | 'B2'
  | 'IELTS_5.5'
  | 'IELTS_6.0'
  | 'IELTS_6.5';

export interface UserProfile {
  currentLevel: AssessmentLevel;
  targetIeltsScore: number;
  dailyGoalMinutes: number;
  lastDiagnosticAt: number | null;
}

// ── Reading ────────────────────────────────────────────────────────────

export type ReadingQuestionType = 'multiple_choice' | 'true_false_not_given' | 'fill_blank';

export interface ReadingQuestion {
  id: string;
  type: ReadingQuestionType;
  instructionRu: string;
  questionEn: string;
  options?: MultipleChoiceOption[];
  correctOptionId?: string;
  acceptedAnswers?: string[];
  explanationRu: string;
}

export interface ReadingPassage {
  id: string;
  titleEn: string;
  titleRu: string;
  difficulty: Difficulty;
  passageEn: string;
  paragraphLabels?: string[];
  questions: ReadingQuestion[];
  sourceLabel: string;
}

// ── Listening ──────────────────────────────────────────────────────────

export interface ListeningQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank';
  instructionRu: string;
  questionEn: string;
  options?: MultipleChoiceOption[];
  correctOptionId?: string;
  acceptedAnswers?: string[];
  explanationRu: string;
}

export interface ListeningTrack {
  id: string;
  titleEn: string;
  titleRu: string;
  difficulty: Difficulty;
  transcriptEn: string;
  questions: ListeningQuestion[];
  durationLabel: string;
}

// ── Writing ────────────────────────────────────────────────────────────

export type WritingTaskType = 'task1' | 'task2';

export interface WritingChecklistItem {
  id: string;
  labelRu: string;
}

export interface WritingTask {
  id: string;
  type: WritingTaskType;
  titleRu: string;
  promptEn: string;
  minWords: number;
  maxWords: number;
  suggestedTimeMinutes: number;
  sampleAnswerEn: string;
  checklist: WritingChecklistItem[];
  tipsRu: string[];
}

// ── Speaking ───────────────────────────────────────────────────────────

export type SpeakingPart = 'part1' | 'part2' | 'part3';

export interface SpeakingPrompt {
  id: string;
  part: SpeakingPart;
  titleRu: string;
  topicEn: string;
  questionsEn: string[];
  cuesEn?: string[];
  suggestedTimeSeconds: number;
  tipsRu: string[];
}

// ── Mock exam ──────────────────────────────────────────────────────────

export interface MockSectionResult {
  section: 'reading' | 'listening' | 'writing' | 'speaking';
  score: number;
  total: number;
  details: string;
}

export interface MockExamResult {
  id: string;
  takenAt: number;
  sectionResults: MockSectionResult[];
  overallBand: number;
}

// ── Section attempts (shared) ──────────────────────────────────────────

export type SectionSource = 'reading' | 'listening' | 'writing' | 'speaking' | 'mock';

export interface SectionAttemptRecord {
  id: string;
  source: SectionSource;
  exerciseId: string;
  sectionId: string;
  correct: boolean;
  userAnswer: string;
  createdAt: number;
  timeSpentMs: number;
}
