// English versions of the Reading, Listening, Writing and Speaking texts.
// Keyed by the ids used in the content data; the Russian originals stay in the data files.
// Anything without an entry here falls back to the Russian text.

export interface QuestionTextEn {
  instruction: string;
  explanation: string;
}

/** Reading and Listening questions (ids are unique across both modules). */
export const QUESTION_TEXT_EN: Record<string, QuestionTextEn> = {
  'rd-001-q1': {
    instruction: 'Choose the correct option.',
    explanation:
      'The first paragraph says: "located in north-west England".',
  },
  'rd-001-q2': {
    instruction: 'Choose True, False or Not Given.',
    explanation:
      'The text says Scafell Pike is the highest peak in the park, but it does not say it is the highest mountain in England. So the answer is Not Given.',
  },
  'rd-001-q3': {
    instruction: 'Write the missing word from the text.',
    explanation:
      'The fourth paragraph says: "Tourism is now the main economic activity in the region."',
  },
  'rd-001-q4': {
    instruction: 'Choose the correct option.',
    explanation:
      'The third paragraph says: "inspired by a walk along the shore of Ullswater".',
  },
  'rd-001-q5': {
    instruction: 'Choose the correct option.',
    explanation:
      'The fourth paragraph says: "Around 16 million visitors come to the Lake District each year".',
  },
  'rd-002-q1': {
    instruction: 'Choose the correct option.',
    explanation:
      'The first paragraph says: "attributed to Anna, the Duchess of Bedford".',
  },
  'rd-002-q2': {
    instruction: 'Choose True, False or Not Given.',
    explanation:
      'The second paragraph says: "quickly became a social event among the upper classes" — so the answer is False.',
  },
  'rd-002-q3': {
    instruction: 'Write the missing word.',
    explanation:
      'The third paragraph says: "served in a mug with milk and sugar".',
  },
  'rd-002-q4': {
    instruction: 'Choose the correct option.',
    explanation:
      'The fourth paragraph says: "approximately 100 million cups of tea per day".',
  },
  'rd-002-q5': {
    instruction: 'Choose the correct option.',
    explanation:
      'The last paragraph says: "the Tregothnan Estate in Cornwall".',
  },
  'rd-003-q1': {
    instruction: 'Choose the correct option.',
    explanation:
      'The second paragraph says: "visits fell by nearly 30 percent".',
  },
  'rd-003-q2': {
    instruction: 'Choose True, False or Not Given.',
    explanation:
      'The fourth paragraph says: "some librarians worry that this shift risks excluding elderly and low-income readers" — so the answer is False.',
  },
  'rd-003-q3': {
    instruction: 'Choose the correct option.',
    explanation:
      'The fourth paragraph says: "risks excluding elderly and low-income readers who may lack the devices or internet access".',
  },
  'rd-003-q4': {
    instruction: 'Write the missing word.',
    explanation:
      'The third paragraph says: "libraries have become “warm spaces” during winter".',
  },
  'rd-003-q5': {
    instruction: 'Choose the correct option.',
    explanation:
      'The last paragraph says: "The answer may well be a combination of both."',
  },
  'ls-001-q1': {
    instruction: 'Choose the correct option.',
    explanation:
      'The receptionist gives the price: "ninety-five pounds, including breakfast".',
  },
  'ls-001-q2': {
    instruction: 'Choose the correct option.',
    explanation:
      'Receptionist: "all our double rooms overlook the garden".',
  },
  'ls-001-q3': {
    instruction: 'Write the correct answer.',
    explanation:
      'Receptionist: "It\'s free for guests".',
  },
  'ls-001-q4': {
    instruction: 'Choose the correct option.',
    explanation:
      'Guest: "Just one night, Saturday the 14th".',
  },
  'ls-002-q1': {
    instruction: 'Choose the correct option.',
    explanation:
      'Guide: "We\'ll be walking for about two hours".',
  },
  'ls-002-q2': {
    instruction: 'Choose the correct option.',
    explanation:
      'Guide: "because of its low bridges over the River Windrush".',
  },
  'ls-002-q3': {
    instruction: 'Write the missing word.',
    explanation:
      'Guide: "a one-ninth scale replica of Bourton itself".',
  },
  'ls-002-q4': {
    instruction: 'Choose the correct option.',
    explanation:
      'Guide: "It comes from the Old English word for “muddy place”".',
  },
};

/** Titles of Writing tasks and Speaking prompts (Reading and Listening already have titleEn). */
export const TITLE_EN: Record<string, string> = {
  'wt-001': 'Task 1: Describing a graph',
  'wt-002': 'Task 2: Discussion essay',
  'sp-001': 'Part 1: Introduction and daily life',
  'sp-002': 'Part 1: Work and study',
  'sp-003': 'Part 2: Cue card monologue',
  'sp-004': 'Part 2: An important event',
  'sp-005': 'Part 3: Abstract questions',
  'sp-006': 'Part 3: Education and technology',
};

export interface WritingTextEn {
  checklist: Record<string, string>;
  tips: string[];
}

export const WRITING_TEXT_EN: Record<string, WritingTextEn> = {
  'wt-001': {
    checklist: {
      wc1: 'At least 150 words',
      wc2: 'A clear introduction that paraphrases the topic',
      wc3: 'The main trends are described (rise / fall / peak)',
      wc4: 'Comparison structures are used (whereas, while, compared to)',
      wc5: 'There is a short summary paragraph',
      wc6: 'No personal opinions (I think, in my opinion)',
    },
    tips: [
      'Start by paraphrasing the topic; do not copy it word for word.',
      'Group the data logically instead of listing every point.',
      'Use Past Simple for past periods.',
      'Leave 2–3 minutes to check grammar and spelling.',
    ],
  },
  'wt-002': {
    checklist: {
      wc1: 'At least 250 words',
      wc2: 'An introduction with a clearly stated position',
      wc3: 'Both points of view are discussed in separate paragraphs',
      wc4: 'Linking words are used (however, furthermore, on the one hand)',
      wc5: 'Your own opinion is expressed clearly',
      wc6: 'A logical concluding paragraph',
      wc7: 'No informal vocabulary (slang, contractions like don\'t)',
    },
    tips: [
      'Spend 2–3 minutes on a plan: introduction, two paragraphs of arguments, opinion, conclusion.',
      'Start every paragraph with a topic sentence.',
      'Support your statements with examples.',
      'Watch the time: leave 5 minutes for checking.',
    ],
  },
};

export const SPEAKING_TIPS_EN: Record<string, string[]> = {
  'sp-001': [
    'Give full answers (2–3 sentences), not one word.',
    'Use specific examples from your own life.',
    'Do not memorise answers: speak naturally.',
  ],
  'sp-002': [
    'Use Present Simple for facts and Present Continuous for current projects.',
    'Use linking words: "well", "actually", "to be honest".',
    'If you do not know the exact answer, say what you would do.',
  ],
  'sp-003': [
    'You have 1 minute to prepare: make notes.',
    'Speak for 1–2 minutes and do not rush.',
    'If you forget a word, rephrase it; do not stay silent.',
    'Structure your answer by the points on the card.',
  ],
  'sp-004': [
    'Use Past Simple to describe the event.',
    'Use Past Continuous for the background: "It was raining when we arrived".',
    'Do not try to tell everything: choose the most vivid details.',
  ],
  'sp-005': [
    'Give developed, abstract answers.',
    'Use modal verbs: might, could, tend to.',
    'Look at different sides of the question, even if you have your own opinion.',
  ],
  'sp-006': [
    'Use structures for speculation: "It is likely that...", "I would argue that...".',
    'Pause between thoughts: this is normal.',
    'Compare the past and the present to show depth.',
  ],
};

