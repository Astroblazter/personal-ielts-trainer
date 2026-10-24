import type { ListeningTrack } from '@/types';

export const LISTENING_TRACKS: ListeningTrack[] = [
  {
    id: 'ls-001',
    titleEn: 'Booking a room at a village inn',
    titleRu: 'Бронирование комнаты в деревенской гостинице',
    difficulty: 'B1',
    durationLabel: '~2 min',
    transcriptEn: `Receptionist: Good afternoon, The Fox and Hounds Inn, Sarah speaking. How can I help you?

Caller: Hi, I'd like to book a room for next weekend, please. Just one night, Saturday the 14th.

Receptionist: Of course. We have a double room available for that night. The rate is ninety-five pounds, including breakfast.

Caller: That sounds perfect. Does the room have a view of the garden?

Receptionist: Yes, all our double rooms overlook the garden at the back of the inn.

Caller: Wonderful. Is there parking available?

Receptionist: Yes, we have a small car park at the front. It's free for guests.

Caller: Great. Could I book that, please? The name is Thomas Walker.

Receptionist: Certainly, Mr Walker. Can I take a contact number?

Caller: Yes, it's 07700 900123.

Receptionist: Thank you. So that's a double room for Saturday the 14th, one night, ninety-five pounds including breakfast and parking. We'll see you then!`,
    questions: [
      {
        id: 'ls-001-q1',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'How much does the room cost per night?',
        options: [
          { id: 'a', text: '£75' },
          { id: 'b', text: '£95' },
          { id: 'c', text: '£115' },
          { id: 'd', text: '£59' },
        ],
        correctOptionId: 'b',
        explanationRu: 'Ресепшн называет цену: "ninety-five pounds, including breakfast".',
      },
      {
        id: 'ls-001-q2',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'What do all double rooms overlook?',
        options: [
          { id: 'a', text: 'The car park' },
          { id: 'b', text: 'The garden' },
          { id: 'c', text: 'The village square' },
          { id: 'd', text: 'The main road' },
        ],
        correctOptionId: 'b',
        explanationRu: 'Ресепшн: "all our double rooms overlook the garden".',
      },
      {
        id: 'ls-001-q3',
        type: 'fill_blank',
        instructionRu: 'Впишите правильный ответ.',
        questionEn: 'Parking is ______ for guests.',
        acceptedAnswers: ['free'],
        explanationRu: 'Ресепшн: "It\'s free for guests".',
      },
      {
        id: 'ls-001-q4',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'How many nights is the booking for?',
        options: [
          { id: 'a', text: 'One night' },
          { id: 'b', text: 'Two nights' },
          { id: 'c', text: 'Three nights' },
          { id: 'd', text: 'A full week' },
        ],
        correctOptionId: 'a',
        explanationRu: 'Гость: "Just one night, Saturday the 14th".',
      },
    ],
  },
  {
    id: 'ls-002',
    titleEn: 'A walking tour of the Cotswolds',
    titleRu: 'Пешеходная экскурсия по Котсуолду',
    difficulty: 'B1+',
    durationLabel: '~3 min',
    transcriptEn: `Guide: Welcome everyone to our Cotswolds walking tour. My name is Emma, and I'll be your guide today. We'll be walking for about two hours, so please make sure you have comfortable shoes and a bottle of water.

We'll start here in the village of Bourton-on-the-Water, which is often called the "Venice of the Cotswolds" because of its low bridges over the River Windrush. As we walk, I'll point out some of the distinctive honey-coloured stone buildings that the region is famous for.

Our first stop will be the model village, a one-ninth scale replica of Bourton itself, built in the 1930s. After that, we'll follow the river path to the old railway bridge, which offers a wonderful view of the surrounding hills.

Around halfway through, we'll stop at a traditional tea room for a short break. You'll have about twenty minutes to rest and, if you like, try a scone with clotted cream and jam.

After the break, we'll continue to the village of Lower Slaughter — don't worry, the name has nothing to do with violence! It comes from the Old English word for "muddy place". The walk between the two villages takes about thirty minutes.

Are there any questions before we set off?`,
    questions: [
      {
        id: 'ls-002-q1',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'How long is the walking tour?',
        options: [
          { id: 'a', text: 'About one hour' },
          { id: 'b', text: 'About two hours' },
          { id: 'c', text: 'About three hours' },
          { id: 'd', text: 'About half a day' },
        ],
        correctOptionId: 'b',
        explanationRu: 'Гид: "We\'ll be walking for about two hours".',
      },
      {
        id: 'ls-002-q2',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'Why is Bourton-on-the-Water called the "Venice of the Cotswolds"?',
        options: [
          { id: 'a', text: 'Because of its canals' },
          { id: 'b', text: 'Because of its low bridges over the river' },
          { id: 'c', text: 'Because of its stone buildings' },
          { id: 'd', text: 'Because of its tea rooms' },
        ],
        correctOptionId: 'b',
        explanationRu: 'Гид: "because of its low bridges over the River Windrush".',
      },
      {
        id: 'ls-002-q3',
        type: 'fill_blank',
        instructionRu: 'Впишите пропущенное слово.',
        questionEn: 'The model village is a one-ninth scale ______ of Bourton.',
        acceptedAnswers: ['replica'],
        explanationRu: 'Гид: "a one-ninth scale replica of Bourton itself".',
      },
      {
        id: 'ls-002-q4',
        type: 'multiple_choice',
        instructionRu: 'Выберите правильный вариант.',
        questionEn: 'What does the name "Lower Slaughter" originally refer to?',
        options: [
          { id: 'a', text: 'A violent historical event' },
          { id: 'b', text: 'The Old English word for "muddy place"' },
          { id: 'c', text: 'A type of local animal' },
          { id: 'd', text: 'A famous battle' },
        ],
        correctOptionId: 'b',
        explanationRu: 'Гид: "It comes from the Old English word for \\"muddy place\\"".',
      },
    ],
  },
];

export function getListeningTrackById(id: string): ListeningTrack | undefined {
  return LISTENING_TRACKS.find((t) => t.id === id);
}
