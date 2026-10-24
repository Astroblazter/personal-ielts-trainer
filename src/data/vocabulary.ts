import type { VocabWord } from '@/types';

const now = 0; // set lazily on first load via repository

function w(
  id: string,
  word: string,
  translationRu: string,
  exampleEn: string,
  topicId: VocabWord['topicId'],
  difficulty: VocabWord['difficulty'],
): VocabWord {
  return {
    id,
    word,
    translationRu,
    exampleEn,
    topicId,
    difficulty,
    createdAt: now,
    reviewStatus: 'new',
    correctCount: 0,
    incorrectCount: 0,
    nextReviewAt: now,
  };
}

// Seed vocabulary relevant to everyday English and IELTS Academic topics.
export const SEED_VOCABULARY: VocabWord[] = [
  w('v-001', 'achieve', 'достигать', 'She achieved her goal of passing the IELTS exam.', 'sentence_structure', 'B1'),
  w('v-002', 'research', 'исследование', 'The research was published in a leading journal.', 'countable_uncountable', 'B1'),
  w('v-003', 'environment', 'окружающая среда', 'We must protect the environment for future generations.', 'articles', 'B1'),
  w('v-004', 'significant', 'значительный', 'There has been a significant increase in tourism.', 'comparatives_superlatives', 'B2'),
  w('v-005', 'challenge', 'вызов', 'Learning a new language is a real challenge.', 'sentence_structure', 'B1'),
  w('v-006', 'opportunity', 'возможность', 'Studying abroad is a great opportunity.', 'countable_uncountable', 'B1'),
  w('v-007', 'improve', 'улучшать', 'You can improve your English by reading every day.', 'gerunds_infinitives', 'B1'),
  w('v-008', 'consequence', 'последствие', 'Pollution is a consequence of industrial growth.', 'articles', 'B2'),
  w('v-009', 'essential', 'существенный, необходимый', 'Water is essential for all living things.', 'subject_verb_agreement', 'B1'),
  w('v-010', 'suggest', 'предлагать', 'I suggest taking a short break.', 'gerunds_infinitives', 'B1'),
  w('v-011', 'require', 'требовать', 'The course requires regular attendance.', 'subject_verb_agreement', 'B1'),
  w('v-012', 'provide', 'предоставлять', 'The university provides housing for students.', 'word_order', 'B1'),
  w('v-013', 'consider', 'рассматривать, обдумывать', 'Please consider applying for the scholarship.', 'gerunds_infinitives', 'B1'),
  w('v-014', 'develop', 'развивать', 'Reading helps you develop your vocabulary.', 'sentence_structure', 'A2'),
  w('v-015', 'benefit', 'польза, выгода', 'There are many benefits to learning a second language.', 'countable_uncountable', 'B1'),
  w('v-016', 'approach', 'подход, подходить', 'We need a new approach to this problem.', 'articles', 'B1'),
  w('v-017', 'establish', 'учреждать, устанавливать', 'The school was established in 1990.', 'sentence_structure', 'B2'),
  w('v-018', 'maintain', 'поддерживать', 'It is hard to maintain a healthy diet.', 'modals', 'B1'),
  w('v-019', 'contribute', 'вносить вклад', 'Everyone can contribute to the project.', 'prepositions', 'B1'),
  w('v-020', 'evidence', 'доказательство, улики', 'There is strong evidence to support this theory.', 'countable_uncountable', 'B2'),
  w('v-021', 'method', 'метод', 'This method is more effective than the old one.', 'comparatives_superlatives', 'B1'),
  w('v-022', 'frequently', 'часто', 'She frequently travels for work.', 'word_order', 'B1'),
  w('v-023', 'although', 'хотя', 'Although it was raining, we went for a walk.', 'sentence_structure', 'B1'),
  w('v-024', 'however', 'однако', 'The test was hard; however, I passed it.', 'word_order', 'B2'),
  w('v-025', 'therefore', 'поэтому', 'I studied hard; therefore, I got a good grade.', 'word_order', 'B2'),
  w('v-026', 'increase', 'увеличивать(ся)', 'The number of students has increased.', 'past_simple_vs_present_perfect', 'B1'),
  w('v-027', 'decrease', 'уменьшать(ся)', 'Sales decreased last quarter.', 'past_simple_vs_present_perfect', 'B1'),
  w('v-028', 'suggest', 'предлагать', 'The data suggests a clear trend.', 'subject_verb_agreement', 'B2'),
  w('v-029', 'affect', 'влиять на', 'Lack of sleep affects your concentration.', 'subject_verb_agreement', 'B2'),
  w('v-030', 'effect', 'эффект, влияние', 'The medicine had a positive effect.', 'articles', 'B2'),
];
