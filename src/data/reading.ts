import type { ReadingPassage } from '@/types';

export const READING_PASSAGES: ReadingPassage[] = [
  {
    id: 'rd-001',
    titleEn: 'The Lake District: A Living Landscape',
    titleRu: 'Озёрный край: живой пейзаж',
    difficulty: 'B1',
    sourceLabel: 'IELTS-style Academic Reading',
    passageEn: `The Lake District, located in north-west England, is the largest national park in the country. Its combination of mountains, lakes and valleys has made it one of the most popular tourist destinations in Britain.

The region was shaped by glaciers during the last Ice Age. As the ice retreated, it left behind deep valleys called "corries" and long ribbon lakes such as Windermere and Ullswater. The highest peak in the park, Scafell Pike, rises to 978 metres above sea level.

In the late 18th century, the Lake District became closely associated with a group of writers known as the Lake Poets. William Wordsworth, perhaps the most famous of them, lived in Grasmere for many years and drew inspiration from the surrounding landscape. His poem "I Wandered Lonely as a Cloud" was inspired by a walk along the shore of Ullswater.

Tourism is now the main economic activity in the region. Around 16 million visitors come to the Lake District each year, generating significant income for local businesses. However, the high number of tourists also creates challenges, including traffic congestion and erosion of popular footpaths.

In 2017, the Lake District was designated a UNESCO World Heritage Site, recognising both its natural beauty and its cultural significance. The decision was not without controversy: some conservationists argued that the award focused too much on farming traditions and not enough on the need to protect the landscape from over-development.`,
    questions: [
      {
        id: 'rd-001-q1',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'Where is the Lake District located?',
        options: [
          { id: 'a', text: 'South-west England' },
          { id: 'b', text: 'North-west England' },
          { id: 'c', text: 'North-east England' },
          { id: 'd', text: 'Central England' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В первом абзаце сказано: "located in north-west England".',
      },
      {
        id: 'rd-001-q2',
        type: 'true_false_not_given',
        instructionRu: 'Отметьте: True, False или Not Given.',
        questionEn: 'Scafell Pike is the highest mountain in England.',
        options: [
          { id: 'a', text: 'True' },
          { id: 'b', text: 'False' },
          { id: 'c', text: 'Not Given' },
        ],
        correctOptionId: 'c',
        explanationRu: 'В тексте сказано, что Scafell Pike — высочайшая вершина в парке, но не указано, что это высочайшая гора в Англии. Значит Not Given.',
      },
      {
        id: 'rd-001-q3',
        type: 'fill_blank',
        instructionRu: 'Впишите пропущенное слово из текста.',
        questionEn: 'Tourism is the main economic ______ in the region.',
        acceptedAnswers: ['activity'],
        explanationRu: 'В четвёртом абзаце: "Tourism is now the main economic activity in the region."',
      },
      {
        id: 'rd-001-q4',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'What inspired Wordsworth\'s poem "I Wandered Lonely as a Cloud"?',
        options: [
          { id: 'a', text: 'A visit to Grasmere village' },
          { id: 'b', text: 'A walk along the shore of Ullswater' },
          { id: 'c', text: 'A climb up Scafell Pike' },
          { id: 'd', text: 'A train journey through the valleys' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В третьем абзаце: "inspired by a walk along the shore of Ullswater".',
      },
      {
        id: 'rd-001-q5',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'How many visitors come to the Lake District each year?',
        options: [
          { id: 'a', text: 'About 6 million' },
          { id: 'b', text: 'About 16 million' },
          { id: 'c', text: 'About 60 million' },
          { id: 'd', text: 'About 1.6 million' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В четвёртом абзаце: "Around 16 million visitors come to the Lake District each year".',
      },
    ],
  },
  {
    id: 'rd-002',
    titleEn: 'The British Tea Tradition',
    titleRu: 'Британская чайная традиция',
    difficulty: 'B1+',
    sourceLabel: 'IELTS-style Academic Reading',
    passageEn: `Tea was first introduced to Britain in the 17th century, but it was not until the 19th century that it became a truly national drink. The arrival of afternoon tea is usually attributed to Anna, the Duchess of Bedford, who in 1840 began requesting tea and light refreshments in the late afternoon to bridge the gap between lunch and dinner.

Afternoon tea quickly became a social event among the upper classes. It typically consisted of tea served with sandwiches, scones and cakes. The tradition spread to tea rooms and hotels, where it remains popular today, although it is now more of an occasional treat than a daily ritual.

In contrast, "builder's tea" — a strong cup of tea served in a mug with milk and sugar — is the everyday tea of millions of British workers. It is a symbol of everyday life rather than elegance, and it reflects the democratic nature of tea drinking in Britain.

Despite the rise of coffee shops in recent decades, tea remains the most consumed hot drink in the United Kingdom. According to recent surveys, British people drink approximately 100 million cups of tea per day, far exceeding coffee consumption.

Interestingly, most of the tea drunk in Britain is grown abroad, primarily in India, Kenya and Sri Lanka. The only commercial tea plantation in the United Kingdom is the Tregothnan Estate in Cornwall, which has been growing tea since the 1990s using the region's mild climate.`,
    questions: [
      {
        id: 'rd-002-q1',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'Who is credited with starting the afternoon tea tradition?',
        options: [
          { id: 'a', text: 'Queen Victoria' },
          { id: 'b', text: 'Anna, the Duchess of Bedford' },
          { id: 'c', text: 'A London hotel owner' },
          { id: 'd', text: 'A Cornish tea farmer' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В первом абзаце: "attributed to Anna, the Duchess of Bedford".',
      },
      {
        id: 'rd-002-q2',
        type: 'true_false_not_given',
        instructionRu: 'Отметьте: True, False или Not Given.',
        questionEn: 'Afternoon tea was originally a daily event for all social classes.',
        options: [
          { id: 'a', text: 'True' },
          { id: 'b', text: 'False' },
          { id: 'c', text: 'Not Given' },
        ],
        correctOptionId: 'b',
        explanationRu: 'Во втором абзаце: "quickly became a social event among the upper classes" — значит False.',
      },
      {
        id: 'rd-002-q3',
        type: 'fill_blank',
        instructionRu: 'Впишите пропущенное слово.',
        questionEn: 'Builder\'s tea is served in a ______ with milk and sugar.',
        acceptedAnswers: ['mug'],
        explanationRu: 'В третьем абзаце: "served in a mug with milk and sugar".',
      },
      {
        id: 'rd-002-q4',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'Approximately how many cups of tea do British people drink per day?',
        options: [
          { id: 'a', text: '10 million' },
          { id: 'b', text: '100 million' },
          { id: 'c', text: '1 million' },
          { id: 'd', text: '1 billion' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В четвёртом абзаце: "approximately 100 million cups of tea per day".',
      },
      {
        id: 'rd-002-q5',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'Where is the only commercial tea plantation in the UK located?',
        options: [
          { id: 'a', text: 'Kent' },
          { id: 'b', text: 'Devon' },
          { id: 'c', text: 'Cornwall' },
          { id: 'd', text: 'Yorkshire' },
        ],
        correctOptionId: 'c',
        explanationRu: 'В последнем абзаце: "the Tregothnan Estate in Cornwall".',
      },
    ],
  },
  {
    id: 'rd-003',
    titleEn: 'Public Libraries in the Digital Age',
    titleRu: 'Публичные библиотеки в цифровую эпоху',
    difficulty: 'B2',
    sourceLabel: 'IELTS-style Academic Reading',
    passageEn: `Public libraries have long been regarded as cornerstones of civic life, offering free access to knowledge and serving as community gathering spaces. However, the rapid expansion of digital technology has led many to question their continued relevance.

In the United Kingdom, the number of public library visits has declined steadily over the past decade. Between 2005 and 2019, visits fell by nearly 30 percent, according to government statistics. Critics argue that this decline reflects a fundamental shift in how people access information, with search engines and online encyclopaedias replacing traditional reference materials.

Yet libraries have not simply accepted decline. Many have reinvented themselves as multi-purpose community hubs. Modern libraries now offer computer access, coding workshops, language classes, and even 3D printing facilities. In some areas, libraries have become "warm spaces" during winter, providing heated rooms for those who cannot afford rising energy bills.

Digital lending has also grown significantly. The ability to borrow e-books and audiobooks from home has attracted new users who might never have visited a physical branch. However, some librarians worry that this shift risks excluding elderly and low-income readers who may lack the devices or internet access needed to use digital services.

The debate over the future of libraries ultimately hinges on a broader question: should public institutions evolve to meet changing needs, or should they preserve traditional roles even as demand for them falls? The answer may well be a combination of both.`,
    questions: [
      {
        id: 'rd-003-q1',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'By how much did library visits fall between 2005 and 2019?',
        options: [
          { id: 'a', text: 'Nearly 10 percent' },
          { id: 'b', text: 'Nearly 20 percent' },
          { id: 'c', text: 'Nearly 30 percent' },
          { id: 'd', text: 'Nearly 50 percent' },
        ],
        correctOptionId: 'c',
        explanationRu: 'Во втором абзаце: "visits fell by nearly 30 percent".',
      },
      {
        id: 'rd-003-q2',
        type: 'true_false_not_given',
        instructionRu: 'Отметьте: True, False или Not Given.',
        questionEn: 'All librarians support the shift towards digital lending.',
        options: [
          { id: 'a', text: 'True' },
          { id: 'b', text: 'False' },
          { id: 'c', text: 'Not Given' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В четвёртом абзаце: "some librarians worry that this shift risks excluding elderly and low-income readers" — значит False.',
      },
      {
        id: 'rd-003-q3',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'What concern do some librarians raise about digital lending?',
        options: [
          { id: 'a', text: 'It is too expensive for libraries to operate' },
          { id: 'b', text: 'It may exclude readers without devices or internet' },
          { id: 'c', text: 'It reduces the quality of available books' },
          { id: 'd', text: 'It is unpopular with young users' },
        ],
        correctOptionId: 'b',
        explanationRu: 'В четвёртом абзаце: "risks excluding elderly and low-income readers who may lack the devices or internet access".',
      },
      {
        id: 'rd-003-q4',
        type: 'fill_blank',
        instructionRu: 'Впишите пропущенное слово.',
        questionEn: 'Some libraries have become "warm ______" during winter.',
        acceptedAnswers: ['spaces'],
        explanationRu: 'В третьем абзаце: "libraries have become \\"warm spaces\\" during winter".',
      },
      {
        id: 'rd-003-q5',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'What is the author\'s concluding view on libraries?',
        options: [
          { id: 'a', text: 'Libraries should focus only on digital services' },
          { id: 'b', text: 'Libraries should preserve only traditional roles' },
          { id: 'c', text: 'A combination of evolution and tradition is likely best' },
          { id: 'd', text: 'Libraries will soon become unnecessary' },
        ],
        correctOptionId: 'c',
        explanationRu: 'В последнем абзаце: "The answer may well be a combination of both."',
      },
    ],
  },
];

export function getReadingPassageById(id: string): ReadingPassage | undefined {
  return READING_PASSAGES.find((p) => p.id === id);
}
