import type { Exercise, GrammarTopic } from '@/types';
import { getLang } from '@/i18n';
import { EXERCISE_TEXT_EN, TOPIC_DESCRIPTION_EN } from '@/data/exercisesEn';

export interface ExerciseText {
  instruction: string;
  explanation: string;
  commonMistake: string;
  /** Writing exercises only. */
  prompt?: string;
  notes?: string;
}

const GENERIC_INSTRUCTION_EN: Record<string, string> = {
  'Выберите правильный вариант.': 'Choose the correct option.',
  'Найдите ошибочную часть и предложите исправление.': 'Find the incorrect part and type the correction.',
  'Найдите ошибку.': 'Find the incorrect part and type the correction.',
  'Поставьте глагол в нужную форму.': 'Put the verb in the correct form.',
};

// Fill-in exercises whose blank is not a verb form (they carry the generic
// "put the verb in the correct form" instruction in the exercise data).
const WORD_FILL_IDS = new Set([
  'art-006',
  'prep-006',
  'prep-010',
  'cu-005',
  'cu-009',
  'ss-006',
  'cs-005',
]);

/** Exercise texts in the interface language (English falls back to Russian if missing). */
export function exerciseText(ex: Exercise): ExerciseText {
  const wordFill = WORD_FILL_IDS.has(ex.id);
  const write = ex.data.type === 'write_sentence' ? ex.data : null;
  const ru: ExerciseText = {
    instruction: wordFill ? 'Вставьте пропущенное слово.' : ex.instructionRu,
    explanation: ex.explanationRu,
    commonMistake: ex.commonMistakeNoteRu,
    prompt: write?.promptRu,
    notes: write?.notesRu,
  };
  if (getLang() !== 'en') return ru;

  const en = EXERCISE_TEXT_EN[ex.id];
  if (!en) return ru;
  return {
    instruction:
      en.instruction ?? (wordFill ? 'Fill in the blank.' : (GENERIC_INSTRUCTION_EN[ex.instructionRu] ?? ru.instruction)),
    explanation: en.explanation,
    commonMistake: en.commonMistake,
    prompt: en.prompt ?? ru.prompt,
    notes: en.notes ?? ru.notes,
  };
}

export function topicDescription(topic: GrammarTopic): string {
  if (getLang() !== 'en') return topic.shortDescriptionRu;
  return TOPIC_DESCRIPTION_EN[topic.id] ?? topic.shortDescriptionRu;
}
