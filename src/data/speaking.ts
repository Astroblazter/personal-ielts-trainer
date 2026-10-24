import type { SpeakingPrompt } from '@/types';

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'sp-001',
    part: 'part1',
    titleRu: 'Part 1: Знакомство и повседневная жизнь',
    topicEn: 'Home and hometown',
    questionsEn: [
      "Let's talk about where you live. Do you live in a house or a flat?",
      'What do you like most about your hometown?',
      'Would you prefer to live in a big city or a small town? Why?',
      'How has your hometown changed since you were a child?',
    ],
    suggestedTimeSeconds: 60,
    tipsRu: [
      'Давайте развёрнутые ответы (2–3 предложения), не односложно.',
      'Используйте конкретные примеры из своей жизни.',
      'Не заучивайте ответы — говорите естественно.',
    ],
  },
  {
    id: 'sp-002',
    part: 'part1',
    titleRu: 'Part 1: Работа и учёба',
    topicEn: 'Work and study',
    questionsEn: [
      'Do you work or are you a student?',
      'What do you enjoy most about your work or studies?',
      'Is there anything you would like to change about your job or studies?',
      'What are your future plans regarding your work or education?',
    ],
    suggestedTimeSeconds: 60,
    tipsRu: [
      'Говорите в Present Simple для фактов, Present Continuous для текущих проектов.',
      'Используйте-linking words: "well", "actually", "to be honest".',
      'Если не знаете точный ответ — скажите, как бы вы поступили.',
    ],
  },
  {
    id: 'sp-003',
    part: 'part2',
    titleRu: 'Part 2: Монолог по карточке',
    topicEn: 'Describe a place you would like to visit',
    questionsEn: [
      'Describe a place you would like to visit in the future.',
      'You should say: where it is, how you would travel there, what you would do there,',
      'and explain why you would like to visit this place.',
    ],
    cuesEn: [
      'Where it is',
      'How you would travel there',
      'What you would do there',
      'Why you would like to visit it',
    ],
    suggestedTimeSeconds: 120,
    tipsRu: [
      'У вас есть 1 минута на подготовку — делайте заметки.',
      'Говорите 1–2 минуты, не торопитесь.',
      'Если забыли слово — перефразируйте, не молчите.',
      'Структурируйте ответ по пунктам карточки.',
    ],
  },
  {
    id: 'sp-004',
    part: 'part2',
    titleRu: 'Part 2: Важное событие',
    topicEn: 'Describe a memorable event in your life',
    questionsEn: [
      'Describe a memorable event in your life.',
      'You should say: what the event was, when and where it happened, who was there,',
      'and explain why it was memorable for you.',
    ],
    cuesEn: [
      'What the event was',
      'When and where it happened',
      'Who was there',
      'Why it was memorable',
    ],
    suggestedTimeSeconds: 120,
    tipsRu: [
      'Используйте Past Simple для описания события.',
      'Past Continuous для фона: "It was raining when we arrived".',
      'Не пытайтесь рассказать всё — выберите самые яркие детали.',
    ],
  },
  {
    id: 'sp-005',
    part: 'part3',
    titleRu: 'Part 3: Абстрактные вопросы',
    topicEn: 'Travel and cultural exchange',
    questionsEn: [
      'Why do you think people travel to different countries?',
      'How has international travel changed over the past few decades?',
      'Do you think tourism has a positive or negative effect on local communities?',
      'Some people say that travel broadens the mind. Do you agree?',
    ],
    suggestedTimeSeconds: 90,
    tipsRu: [
      'Дайте развёрнутые, абстрактные ответы.',
      'Используйте модальные глаголы: might, could, tend to.',
      'Рассматривайте разные стороны вопроса, даже если есть своё мнение.',
    ],
  },
  {
    id: 'sp-006',
    part: 'part3',
    titleRu: 'Part 3: Образование и технологии',
    topicEn: 'Education and technology',
    questionsEn: [
      'How has technology changed the way people learn languages?',
      'Do you think online learning will replace traditional classrooms? Why or why not?',
      'What role should schools play in teaching cultural awareness?',
      'How might education change in the next twenty years?',
    ],
    suggestedTimeSeconds: 90,
    tipsRu: [
      'Используйте конструкции для предположений: "It is likely that...", "I would argue that...".',
      'Делайте паузы между мыслями — это нормально.',
      'Сравнивайте прошлое и настоящее, чтобы показать глубину.',
    ],
  },
];

export function getSpeakingPromptById(id: string): SpeakingPrompt | undefined {
  return SPEAKING_PROMPTS.find((p) => p.id === id);
}

export function getSpeakingPromptsByPart(part: SpeakingPrompt['part']): SpeakingPrompt[] {
  return SPEAKING_PROMPTS.filter((p) => p.part === part);
}
