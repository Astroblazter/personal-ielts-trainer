import type { VocabTheme, VocabWord } from '@/types';

const now = 0; // set lazily on first load via repository

function w(
  id: string,
  word: string,
  translationRu: string,
  exampleEn: string,
  topicId: VocabWord['topicId'],
  difficulty: VocabWord['difficulty'],
  theme: VocabTheme,
): VocabWord {
  return {
    id,
    word,
    translationRu,
    exampleEn,
    topicId,
    difficulty,
    theme,
    stage: 0,
    createdAt: now,
    reviewStatus: 'new',
    correctCount: 0,
    incorrectCount: 0,
    nextReviewAt: now,
  };
}

// Words of the first seed version (v-001 … v-030): the id numbers must not change.
// topicId is a required field of the data model but is not used for vocabulary; the theme is.
export const SEED_VOCABULARY: VocabWord[] = [
  w('v-001', 'achieve', 'достигать', 'She achieved her goal of passing the IELTS exam.', 'sentence_structure', 'B1', 'academic'),
  w('v-002', 'research', 'исследование', 'The research was published in a leading journal.', 'countable_uncountable', 'B1', 'education'),
  w('v-003', 'environment', 'окружающая среда', 'We must protect the environment for future generations.', 'articles', 'B1', 'environment'),
  w('v-004', 'significant', 'значительный', 'There has been a significant increase in tourism.', 'comparatives_superlatives', 'B2', 'academic'),
  w('v-005', 'challenge', 'вызов', 'Learning a new language is a real challenge.', 'sentence_structure', 'B1', 'academic'),
  w('v-006', 'opportunity', 'возможность', 'Studying abroad is a great opportunity.', 'countable_uncountable', 'B1', 'academic'),
  w('v-007', 'improve', 'улучшать', 'You can improve your English by reading every day.', 'gerunds_infinitives', 'B1', 'academic'),
  w('v-008', 'consequence', 'последствие', 'Pollution is a consequence of industrial growth.', 'articles', 'B2', 'academic'),
  w('v-009', 'essential', 'существенный, необходимый', 'Water is essential for all living things.', 'subject_verb_agreement', 'B1', 'academic'),
  w('v-010', 'suggest', 'предлагать', 'I suggest taking a short break.', 'gerunds_infinitives', 'B1', 'academic'),
  w('v-011', 'require', 'требовать', 'The course requires regular attendance.', 'subject_verb_agreement', 'B1', 'academic'),
  w('v-012', 'provide', 'предоставлять', 'The university provides housing for students.', 'word_order', 'B1', 'academic'),
  w('v-013', 'consider', 'рассматривать, обдумывать', 'Please consider applying for the scholarship.', 'gerunds_infinitives', 'B1', 'academic'),
  w('v-014', 'develop', 'развивать', 'Reading helps you develop your vocabulary.', 'sentence_structure', 'A2', 'academic'),
  w('v-015', 'benefit', 'польза, выгода', 'There are many benefits to learning a second language.', 'countable_uncountable', 'B1', 'academic'),
  w('v-016', 'approach', 'подход, подходить', 'We need a new approach to this problem.', 'articles', 'B1', 'academic'),
  w('v-017', 'establish', 'учреждать, устанавливать', 'The school was established in 1990.', 'sentence_structure', 'B2', 'academic'),
  w('v-018', 'maintain', 'поддерживать', 'It is hard to maintain a healthy diet.', 'modals', 'B1', 'academic'),
  w('v-019', 'contribute', 'вносить вклад', 'Everyone can contribute to the project.', 'prepositions', 'B1', 'academic'),
  w('v-020', 'evidence', 'доказательство, улики', 'There is strong evidence to support this theory.', 'countable_uncountable', 'B2', 'academic'),
  w('v-021', 'method', 'метод', 'This method is more effective than the old one.', 'comparatives_superlatives', 'B1', 'academic'),
  w('v-022', 'frequently', 'часто', 'She frequently travels for work.', 'word_order', 'B1', 'academic'),
  w('v-023', 'although', 'хотя', 'Although it was raining, we went for a walk.', 'sentence_structure', 'B1', 'academic'),
  w('v-024', 'however', 'однако', 'The test was hard; however, I passed it.', 'word_order', 'B2', 'academic'),
  w('v-025', 'therefore', 'поэтому', 'I studied hard; therefore, I got a good grade.', 'word_order', 'B2', 'academic'),
  w('v-026', 'increase', 'увеличивать(ся)', 'The number of students has increased.', 'past_simple_vs_present_perfect', 'B1', 'academic'),
  w('v-027', 'decrease', 'уменьшать(ся)', 'Sales decreased last quarter.', 'past_simple_vs_present_perfect', 'B1', 'academic'),
  w('v-028', 'suggest', 'предлагать', 'The data suggests a clear trend.', 'subject_verb_agreement', 'B2', 'academic'),
  w('v-029', 'affect', 'влиять на', 'Lack of sleep affects your concentration.', 'subject_verb_agreement', 'B2', 'academic'),
  w('v-030', 'effect', 'эффект, влияние', 'The medicine had a positive effect.', 'articles', 'B2', 'academic'),

  // Themes of the IELTS exam: 5 useful words each (seed version 2, ids from v-101).
  // education
  w('v-101', 'curriculum', 'учебный план, программа', 'The school changed its curriculum to include more science.', 'sentence_structure', 'B2', 'education'),
  w('v-102', 'tuition', 'плата за обучение', 'Tuition fees are rising every year.', 'sentence_structure', 'B2', 'education'),
  w('v-103', 'assignment', 'задание', 'The teacher gave us a difficult assignment.', 'sentence_structure', 'B1', 'education'),
  w('v-104', 'graduate', 'заканчивать вуз; выпускник', 'She graduated from university in 2022.', 'sentence_structure', 'B1', 'education'),
  w('v-105', 'deadline', 'крайний срок', 'The deadline for the essay is Friday.', 'sentence_structure', 'B1', 'education'),
  // work
  w('v-106', 'employee', 'сотрудник', 'Every employee must wear a badge.', 'sentence_structure', 'B1', 'work'),
  w('v-107', 'salary', 'зарплата', 'He receives a monthly salary.', 'sentence_structure', 'B1', 'work'),
  w('v-108', 'career', 'карьера', 'She is building a career in medicine.', 'sentence_structure', 'B1', 'work'),
  w('v-109', 'colleague', 'коллега', 'My colleagues are very helpful.', 'sentence_structure', 'B1', 'work'),
  w('v-110', 'unemployment', 'безработица', 'Unemployment is a serious problem in many regions.', 'sentence_structure', 'B2', 'work'),
  // technology
  w('v-111', 'device', 'устройство', 'Most people use a mobile device every day.', 'sentence_structure', 'B1', 'technology'),
  w('v-112', 'software', 'программное обеспечение', 'The company develops educational software.', 'sentence_structure', 'B1', 'technology'),
  w('v-113', 'invention', 'изобретение', 'The printing press was a great invention.', 'sentence_structure', 'B1', 'technology'),
  w('v-114', 'digital', 'цифровой', 'Digital skills are important for modern jobs.', 'sentence_structure', 'B1', 'technology'),
  w('v-115', 'communicate', 'общаться', 'Social media helps people communicate quickly.', 'sentence_structure', 'B1', 'technology'),
  // environment
  w('v-116', 'pollution', 'загрязнение', 'Air pollution is a problem in big cities.', 'sentence_structure', 'B1', 'environment'),
  w('v-117', 'climate', 'климат', 'The climate here is mild and wet.', 'sentence_structure', 'B1', 'environment'),
  w('v-118', 'renewable', 'возобновляемый', 'Wind is a renewable source of energy.', 'sentence_structure', 'B2', 'environment'),
  w('v-119', 'waste', 'отходы; тратить впустую', 'We should reduce the amount of plastic waste.', 'sentence_structure', 'B1', 'environment'),
  w('v-120', 'protect', 'защищать', 'National parks protect wild animals.', 'sentence_structure', 'B1', 'environment'),
  // health
  w('v-121', 'diet', 'питание, диета', 'A balanced diet includes fruit and vegetables.', 'sentence_structure', 'B1', 'health'),
  w('v-122', 'exercise', 'упражнение; заниматься спортом', 'Regular exercise keeps you healthy.', 'sentence_structure', 'A2', 'health'),
  w('v-123', 'symptom', 'симптом', 'A cough is a common symptom of a cold.', 'sentence_structure', 'B2', 'health'),
  w('v-124', 'treatment', 'лечение', 'The treatment lasted for six weeks.', 'sentence_structure', 'B1', 'health'),
  w('v-125', 'stress', 'стресс', 'Too much stress can harm your health.', 'sentence_structure', 'B1', 'health'),
  // society
  w('v-126', 'community', 'сообщество', 'The local community organised a clean-up day.', 'sentence_structure', 'B1', 'society'),
  w('v-127', 'population', 'население', 'The population of the city has doubled.', 'sentence_structure', 'B1', 'society'),
  w('v-128', 'tradition', 'традиция', 'It is a tradition to eat together on Sundays.', 'sentence_structure', 'B1', 'society'),
  w('v-129', 'generation', 'поколение', 'Younger generations use technology more.', 'sentence_structure', 'B1', 'society'),
  w('v-130', 'equality', 'равенство', 'The law guarantees equality between men and women.', 'sentence_structure', 'B2', 'society'),
  // culture
  w('v-131', 'custom', 'обычай', 'It is a custom to take off your shoes at the door.', 'sentence_structure', 'B1', 'culture'),
  w('v-132', 'heritage', 'наследие', 'The old town is a World Heritage site.', 'sentence_structure', 'B2', 'culture'),
  w('v-133', 'festival', 'фестиваль', 'The film festival attracts thousands of visitors.', 'sentence_structure', 'B1', 'culture'),
  w('v-134', 'identity', 'идентичность', 'Language is an important part of cultural identity.', 'sentence_structure', 'B2', 'culture'),
  w('v-135', 'belong', 'принадлежать; быть членом', 'He belongs to a local music club.', 'sentence_structure', 'B1', 'culture'),
  // travel
  w('v-136', 'destination', 'пункт назначения', 'Paris is a popular tourist destination.', 'sentence_structure', 'B1', 'travel'),
  w('v-137', 'journey', 'путешествие, поездка', 'The journey took about five hours.', 'sentence_structure', 'B1', 'travel'),
  w('v-138', 'accommodation', 'жильё, размещение', 'We booked accommodation near the beach.', 'sentence_structure', 'B1', 'travel'),
  w('v-139', 'passport', 'паспорт', 'Remember to bring your passport.', 'sentence_structure', 'A2', 'travel'),
  w('v-140', 'sightseeing', 'осмотр достопримечательностей', 'We spent the day sightseeing in Rome.', 'sentence_structure', 'B1', 'travel'),
];

/** Words that were added to the seed after the first version; they are added to an existing notebook once. */
export const SEED_VERSION = 2;
export const FIRST_NEW_SEED_ID = 'v-101';
