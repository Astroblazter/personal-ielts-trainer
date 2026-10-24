import type { WritingTask } from '@/types';

export const WRITING_TASKS: WritingTask[] = [
  {
    id: 'wt-001',
    type: 'task1',
    titleRu: 'Task 1: Описание графика',
    promptEn: `The chart below shows the number of international tourists visiting the United Kingdom between 2000 and 2020.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
    minWords: 150,
    maxWords: 220,
    suggestedTimeMinutes: 20,
    sampleAnswerEn: `The chart illustrates the number of international tourists visiting the United Kingdom over a twenty-year period from 2000 to 2020.

Overall, the number of visitors rose steadily during the first decade, reaching a peak in 2015, before declining sharply in the final five years.

In 2000, approximately 25 million tourists visited the UK. This figure increased gradually to around 33 million by 2010 and continued to climb to a peak of roughly 40 million in 2015. The growth during this period can be attributed to several factors, including improved transport links and a stronger global economy.

However, between 2015 and 2020, the number of visitors fell significantly, dropping to around 22 million. This decline was likely caused by a combination of economic uncertainty and, in the final year, the global pandemic which severely restricted international travel.

In conclusion, while the UK experienced strong growth in tourism for the first fifteen years, the latter half of the decade saw a notable reversal of this trend.`,
    checklist: [
      { id: 'wc1', labelRu: 'Минимум 150 слов' },
      { id: 'wc2', labelRu: 'Есть чёткое вступление с перефразированием темы' },
      { id: 'wc3', labelRu: 'Описаны основные тенденции (рост/спад/пик)' },
      { id: 'wc4', labelRu: 'Использованы сравнительные конструкции (whereas, while, compared to)' },
      { id: 'wc5', labelRu: 'Есть краткий итоговый абзац' },
      { id: 'wc6', labelRu: 'Нет личных мнений (I think, in my opinion)' },
    ],
    tipsRu: [
      'Начните с перефразирования темы, не копируя её дословно.',
      'Группируйте данные логически, а не перечисляйте все точки подряд.',
      'Используйте Past Simple для прошлых периодов.',
      'Оставьте 2–3 минуты на проверку грамматики и орфографии.',
    ],
  },
  {
    id: 'wt-002',
    type: 'task2',
    titleRu: 'Task 2: Эссе-рассуждение',
    promptEn: `Some people believe that learning a foreign language is only useful for travel and work, while others argue that it has broader benefits for personal development and cultural understanding.

Discuss both these views and give your own opinion.

Write at least 250 words.`,
    minWords: 250,
    maxWords: 400,
    suggestedTimeMinutes: 40,
    sampleAnswerEn: `The question of why one should learn a foreign language has long been debated. While some see language learning primarily as a practical tool for travel and career advancement, others argue that its benefits extend far beyond these areas. In my view, both perspectives have merit, but the broader benefits are ultimately more significant.

On the one hand, there is no denying that language skills are highly practical. In an increasingly globalised economy, speaking a second language can open doors to job opportunities that would otherwise be inaccessible. Many employers actively seek candidates who can communicate with international clients. Furthermore, for travellers, even a basic knowledge of the local language can transform a trip, allowing for genuine interactions rather than superficial tourist experiences.

On the other hand, the advantages of language learning go well beyond practical utility. Research has shown that bilingual individuals tend to develop better problem-solving skills and greater cognitive flexibility. Learning a language also fosters empathy and cultural awareness, as it requires engaging with different ways of thinking and living. Through studying another language, one gains access to literature, films and traditions that would remain inaccessible through translation alone.

In my opinion, while the practical benefits are often the initial motivation, it is the deeper cognitive and cultural gains that make language learning truly valuable. A person who learns a language only for a job may stop once the goal is achieved, but someone who appreciates the broader benefits is likely to continue learning for life.

In conclusion, language learning serves both practical and personal purposes. However, its greatest value lies not in what it enables us to do, but in who it helps us become.`,
    checklist: [
      { id: 'wc1', labelRu: 'Минимум 250 слов' },
      { id: 'wc2', labelRu: 'Есть введение с ясно сформулированной позицией' },
      { id: 'wc3', labelRu: 'Обе точки зрения рассмотрены в отдельных абзацах' },
      { id: 'wc4', labelRu: 'Использованы связующие элементы (however, furthermore, on the one hand)' },
      { id: 'wc5', labelRu: 'Собственное мнение выражено ясно' },
      { id: 'wc6', labelRu: 'Есть логичный заключительный абзац' },
      { id: 'wc7', labelRu: 'Нет неформальной лексики (slang, contractions like don\'t)' },
    ],
    tipsRu: [
      'Потратьте 2–3 минуты на план: введение, 2 абзаца аргументов, мнение, заключение.',
      'Каждый абзац должен начинаться с тематического предложения.',
      'Подкрепляйте утверждения примерами.',
      'Следите за временем: оставьте 5 минут на проверку.',
    ],
  },
];

export function getWritingTaskById(id: string): WritingTask | undefined {
  return WRITING_TASKS.find((t) => t.id === id);
}
