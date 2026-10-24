import type { GrammarTopic, TopicId } from '@/types';

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  {
    id: 'present_simple_vs_continuous',
    titleEn: 'Present Simple vs Present Continuous',
    titleRu: 'Present Simple vs Present Continuous',
    shortDescriptionRu:
      'Разница между регулярными действиями и действиями, происходящими прямо сейчас.',
  },
  {
    id: 'past_simple_vs_present_perfect',
    titleEn: 'Past Simple vs Present Perfect',
    titleRu: 'Past Simple vs Present Perfect',
    shortDescriptionRu:
      'Когда использовать завершённое прошлое, а когда — результат, связанный с настоящим.',
  },
  {
    id: 'past_simple_vs_past_continuous',
    titleEn: 'Past Simple vs Past Continuous',
    titleRu: 'Past Simple vs Past Continuous',
    shortDescriptionRu: 'Прерванное действие и фон в прошлом.',
  },
  {
    id: 'future_forms',
    titleEn: 'Future Forms',
    titleRu: 'Future forms',
    shortDescriptionRu: 'will, be going to, Present Continuous для будущего.',
  },
  {
    id: 'subject_verb_agreement',
    titleEn: 'Subject–Verb Agreement',
    titleRu: 'Subject–verb agreement',
    shortDescriptionRu: 'Согласование подлежащего и сказуемого в числе.',
  },
  {
    id: 'articles',
    titleEn: 'Articles',
    titleRu: 'Articles: a, an, the, zero article',
    shortDescriptionRu: 'Неопределённый, определённый и нулевой артикль.',
  },
  {
    id: 'prepositions',
    titleEn: 'Prepositions',
    titleRu: 'Prepositions',
    shortDescriptionRu: 'Предлоги места, времени и направления.',
  },
  {
    id: 'word_order',
    titleEn: 'Word Order',
    titleRu: 'Word order',
    shortDescriptionRu: 'Порядок слов в утвердительном предложении.',
  },
  {
    id: 'questions_negatives',
    titleEn: 'Questions and Negatives',
    titleRu: 'Questions and negatives',
    shortDescriptionRu: 'Построение вопросов и отрицаний.',
  },
  {
    id: 'countable_uncountable',
    titleEn: 'Countable and Uncountable Nouns',
    titleRu: 'Countable and uncountable nouns',
    shortDescriptionRu: 'Исчисляемые и неисчисляемые существительные.',
  },
  {
    id: 'modals',
    titleEn: 'Modal Verbs',
    titleRu: 'Modal verbs',
    shortDescriptionRu: 'can, could, must, should, may и их значения.',
  },
  {
    id: 'conditionals',
    titleEn: 'Conditionals',
    titleRu: 'Conditionals',
    shortDescriptionRu: 'Zero, First, Second и Third conditionals.',
  },
  {
    id: 'gerunds_infinitives',
    titleEn: 'Gerunds and Infinitives',
    titleRu: 'Gerunds and infinitives',
    shortDescriptionRu: 'Когда после глагола идёт -ing, а когда — to + verb.',
  },
  {
    id: 'comparatives_superlatives',
    titleEn: 'Comparatives and Superlatives',
    titleRu: 'Comparatives and superlatives',
    shortDescriptionRu: 'Сравнительная и превосходная степень прилагательных.',
  },
  {
    id: 'sentence_structure',
    titleEn: 'Sentence Structure',
    titleRu: 'Sentence structure and common errors',
    shortDescriptionRu: 'Базовая структура предложений и типичные ошибки.',
  },
];

export function getTopicById(id: TopicId): GrammarTopic | undefined {
  return GRAMMAR_TOPICS.find((t) => t.id === id);
}

export const TOPIC_IDS = GRAMMAR_TOPICS.map((t) => t.id);
