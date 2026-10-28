// English versions of the exercise texts (explanations, common-mistake notes, instructions
// and writing prompts). Keyed by exercise id; the Russian originals stay in the exercise data.
// Exercises without an entry here fall back to the Russian text.

export interface ExerciseTextEn {
  /** Only for exercises whose Russian instruction is not one of the standard ones. */
  instruction?: string;
  explanation: string;
  commonMistake: string;
  /** Writing exercises only. */
  prompt?: string;
  notes?: string;
}

export const EXERCISE_TEXT_EN: Record<string, ExerciseTextEn> = {
  'psc-001': {
    explanation:
      '“Usually” points to a regular action, so we use Present Simple (drinks). Present Continuous is for actions happening at the moment of speaking.',
    commonMistake:
      'Learners often use the Continuous with habit markers: usually, often, every day.',
  },
  'psc-002': {
    instruction: 'Put the verb in the correct form (Present Simple or Present Continuous).',
    explanation:
      '“Look!” and “right now” are signals for Present Continuous. The action is happening at the moment of speaking.',
    commonMistake:
      'Do not use Present Simple for actions that are happening right now.',
  },
  'psc-003': {
    explanation:
      'Understand is a stative verb, so it is not used in the Continuous. Even for “now” we need Present Simple.',
    commonMistake:
      'Stative verbs (know, understand, like, want) are not used in the Continuous.',
  },
  'psc-004': {
    instruction: 'Write a sentence about a friend who is reading a book right now.',
    explanation:
      'For an action at the moment of speaking we use Present Continuous: is/are + V-ing.',
    commonMistake:
      'Do not confuse it with Present Simple (reads), which is for regular actions.',
    prompt: 'Describe what your friend is reading right now.',
    notes:
      'The checker looks for Present Continuous: “(he/she/my friend) is reading (a/the) book”. Capital letters, extra spaces and final punctuation are ignored.',
  },
  'pspp-001': {
    explanation:
      'Experience up to now without a specific time is Present Perfect (have been). “Three times” is not tied to a particular moment in the past.',
    commonMistake:
      'Past Simple (was) needs a specific moment in the past: I went to London last year.',
  },
  'pspp-002': {
    instruction: 'Put the verb in Past Simple or Present Perfect.',
    explanation:
      '“Yesterday” is a specific time in the past, so we need Past Simple (finished).',
    commonMistake:
      'With past time markers (yesterday, last week, in 2020) do not use Present Perfect.',
  },
  'pspp-003': {
    explanation:
      '“Last night” is a specific past time, so Present Perfect (have seen) is wrong. We need Past Simple (saw).',
    commonMistake:
      'Present Perfect cannot be used with an exact time in the past.',
  },
  'pspp-004': {
    instruction: 'Write about a place you have visited, without giving a date.',
    explanation:
      'An experience without a specific date is expressed with Present Perfect.',
    commonMistake:
      'Do not use Past Simple if there is no specific time marker.',
    prompt: 'Describe the experience of visiting a place without an exact date: use Present Perfect.',
    notes:
      'The checker looks for Present Perfect: “I have visited/been to ...”. An exact date is not needed: it is an experience up to now.',
  },
  'pspc-001': {
    explanation:
      'A long background action (while) is Past Continuous (was cooking). The action that interrupts it is Past Simple (rang).',
    commonMistake:
      'Do not use Past Simple for the background action after “while”.',
  },
  'pspc-002': {
    instruction: 'Put the verbs in the correct form.',
    explanation:
      'The interrupting event (when) is Past Simple (arrived). The background (were having) is already given.',
    commonMistake:
      'Do not mix up the roles: “when” introduces a short action, “while” a long one.',
  },
  'pspc-003': {
    explanation:
      'A long action with “while” is Past Continuous (was walking). The short event is Past Simple (started).',
    commonMistake:
      'People often forget the Continuous after “while”.',
  },
  'ff-001': {
    explanation:
      'When there is clear evidence that something is about to happen, we use “be going to”.',
    commonMistake:
      '“Will” is used for decisions made at the moment of speaking, not for predictions based on clear signs.',
  },
  'ff-002': {
    instruction: 'Put the verb in the correct future form.',
    explanation:
      'A promise or a spontaneous decision takes will + base verb.',
    commonMistake:
      'Do not use “going to” for promises.',
  },
  'ff-003': {
    instruction: 'Write about your plans for the weekend using “be going to”.',
    explanation:
      'A plan or intention is expressed with be going to.',
    commonMistake:
      'Do not confuse it with Present Continuous for arrangements (I am meeting ...).',
    prompt: 'Describe your weekend plans with the construction be going to.',
    notes:
      'The checker looks for “going to” expressing an intention or plan.',
  },
  'sva-001': {
    explanation:
      'The subject “My brother and I” is plural, so we need “are”.',
    commonMistake:
      'Do not use “is” with a compound plural subject.',
  },
  'sva-002': {
    instruction: 'Fill in the blank.',
    explanation:
      '“Each of” takes a singular verb (has).',
    commonMistake:
      'The word “students” next to the verb is confusing: the verb agrees with “each”.',
  },
  'sva-003': {
    explanation:
      '“News” is uncountable and always singular: “the news is”.',
    commonMistake:
      'Words ending in -s (news, maths, physics) are often singular.',
  },
  'art-001': {
    instruction: 'Choose the correct article.',
    explanation:
      'Before a vowel sound we use “an” (apple), before a consonant sound “a” (banana).',
    commonMistake:
      '“An” depends on the sound, not the letter: an hour, a university.',
  },
  'art-002': {
    instruction: 'Insert the article (a, an, the) or leave it empty (zero article).',
    explanation:
      'A unique object (the sun) needs the definite article.',
    commonMistake:
      'Unique things (sun, moon, sky) always take “the”.',
  },
  'art-003': {
    explanation:
      'When we talk about a field in general (music, art, science), no article is needed.',
    commonMistake:
      'General uncountable nouns usually take no article.',
  },
  'art-004': {
    instruction: 'Write a sentence about learning English (no article before the name of the language).',
    explanation:
      'The names of languages and school subjects are used without an article.',
    commonMistake:
      'A common mistake is “the English” instead of “English”.',
    prompt: 'Write that you are learning English. Names of languages take no article.',
    notes:
      'The checker makes sure there is no “the” before “english”.',
  },
  'prep-001': {
    instruction: 'Choose the correct preposition.',
    explanation:
      'A surface takes the preposition “on”.',
    commonMistake:
      'Do not mix up on (surface), in (inside) and at (point).',
  },
  'prep-002': {
    instruction: 'Insert the preposition.',
    explanation:
      'After “afraid” we use the preposition “of”.',
    commonMistake:
      'Adjectives fix their prepositions: afraid of, interested in, good at.',
  },
  'prep-003': {
    explanation:
      'The mistake is not in the preposition: “in London” is correct. This exercise has no incorrect part; it trains attention. The correct version is the same as the original.',
    commonMistake:
      'Not every part is wrong: check the whole construction.',
  },
  'prep-004': {
    instruction: 'Insert the preposition of time.',
    explanation:
      'For an exact time we use “at”.',
    commonMistake:
      '“In” for months and years, “on” for days, “at” for clock time.',
  },
  'wo-001': {
    instruction: 'Choose the correct word order.',
    explanation:
      'A frequency adverb (always) goes before the main verb but after “to be”.',
    commonMistake:
      'Do not put “always” at the beginning or between the verb and the object.',
  },
  'wo-002': {
    instruction: 'Make an affirmative sentence from the words: yesterday / I / a film / watched.',
    explanation:
      'The basic order is SVO: subject + verb + object. A time adverbial can go at the beginning or at the end.',
    commonMistake:
      'Do not put the time adverbial between the verb and the object.',
    prompt: 'Put the words into an affirmative sentence.',
    notes:
      'Two orders are accepted: with the time adverbial at the beginning or at the end.',
  },
  'wo-003': {
    instruction: 'Find the mistake in the word order.',
    explanation:
      'A frequency adverb goes before the main verb: “I always go”.',
    commonMistake:
      'A frequency adverb does not go after the verb.',
  },
  'qn-001': {
    instruction: 'Choose the correct question.',
    explanation:
      'In Present Simple questions with “you” the auxiliary verb is “Do”.',
    commonMistake:
      'Do not use “Does” with “you”: “Does” is for he/she/it.',
  },
  'qn-002': {
    instruction: 'Fill in the blank in the negative sentence.',
    explanation:
      'The negative in Present Simple for she/he/it is does not + verb.',
    commonMistake:
      'After “does not” the verb has no -s.',
  },
  'qn-003': {
    instruction: 'Write a question for the answer “Yes, I have been to Paris.”',
    explanation:
      'A Present Perfect question is Have + subject + V3.',
    commonMistake:
      'Do not use “Did you” for an experience without a time.',
    prompt: 'Make a Present Perfect question.',
    notes:
      'The checker looks for a question with “Have you ...” and the verb been/visited.',
  },
  'cu-001': {
    explanation:
      '“Information” is uncountable: it does not take “a/an” or “many”. “Some” works.',
    commonMistake:
      '“Informations” is a wrong form: the word is uncountable.',
  },
  'cu-002': {
    instruction: 'Fill in the blank.',
    explanation:
      '“Books” is countable plural, so we need “many”.',
    commonMistake:
      'With uncountable nouns use “much”, not “many”.',
  },
  'cu-003': {
    explanation:
      '“Advice” is uncountable: we cannot say “an advice”. Use “some advice” or just “advice”.',
    commonMistake:
      'Many uncountable nouns (advice, homework, news) cannot be counted.',
  },
  'mod-001': {
    instruction: 'Choose the correct modal verb.',
    explanation:
      'A strict ban is “must not”. “Should not” is a recommendation, not a ban.',
    commonMistake:
      'Do not mix up a ban (must not) with advice (should not).',
  },
  'mod-002': {
    instruction: 'Insert a modal verb to give advice.',
    explanation:
      'Advice is expressed with “should” or “ought to”.',
    commonMistake:
      'After a modal verb the base form follows without “to” (must go, should go).',
  },
  'mod-003': {
    instruction: 'Write a sentence about an ability in the past using “could”.',
    explanation:
      '“Could” expresses a general ability in the past.',
    commonMistake:
      'Do not use “could” for a single event: Past Simple (managed to) is better there.',
    prompt: 'Describe an ability in the past with “could”.',
    notes:
      'The checker looks for “could” expressing a past ability.',
  },
  'cond-001': {
    instruction: 'Choose the correct option (First Conditional).',
    explanation:
      'First Conditional: if + Present Simple, will + base verb. A real condition in the future.',
    commonMistake:
      'Do not use “will” in the if-clause.',
  },
  'cond-002': {
    instruction: 'Fill in the blank (Second Conditional).',
    explanation:
      'Second Conditional: if + Past Simple, would + base verb. An unreal condition. In formal speech we say “were”.',
    commonMistake:
      'Do not use “would” in the if-clause.',
  },
  'cond-003': {
    explanation:
      'In the First Conditional the if-clause takes Present Simple, not “will”.',
    commonMistake:
      '“Will” in the if-clause is a common mistake.',
  },
  'gi-001': {
    explanation:
      'After “enjoy” we use a gerund (reading).',
    commonMistake:
      '“Enjoy to read” is wrong: after enjoy comes -ing.',
  },
  'gi-002': {
    instruction: 'Put the verb in the correct form.',
    explanation:
      'After “decide” we use the infinitive with to (to study).',
    commonMistake:
      'After decide, want and hope we use the infinitive, not the gerund.',
  },
  'gi-003': {
    explanation:
      'After “want” we use the infinitive: to go.',
    commonMistake:
      'Do not mix them up: enjoy + -ing, want + to + infinitive.',
  },
  'cs-001': {
    instruction: 'Choose the correct form.',
    explanation:
      'Long adjectives (3+ syllables) form the comparative with “more”.',
    commonMistake:
      'Do not add -er to long adjectives.',
  },
  'cs-002': {
    instruction: 'Insert the superlative form.',
    explanation:
      'The short adjective high forms the superlative highest.',
    commonMistake:
      'Do not use “most” with short adjectives.',
  },
  'cs-003': {
    explanation:
      'Short adjectives already form the comparative with -er; “more” is not needed.',
    commonMistake:
      'A double comparative (more taller) is a common mistake.',
  },
  'ss-001': {
    instruction: 'Choose the grammatically correct sentence.',
    explanation:
      '“Although” and “but” are not used together: only one conjunction is needed.',
    commonMistake:
      'In some languages “although ... but” is normal, but English uses only one conjunction.',
  },
  'ss-002': {
    instruction: 'Write a complex sentence with “because”.',
    explanation:
      '“Because” introduces a clause of reason. Put a comma when the reason comes first and the result after it.',
    commonMistake:
      'Do not put a comma before “because” when its clause comes after the main clause.',
    prompt: 'Make a sentence with a reason using “because”.',
    notes:
      'The checker looks for “because” expressing a reason.',
  },
  'ss-003': {
    explanation:
      '“Many people” is plural, so we need “There are”.',
    commonMistake:
      'There is/are agrees with the number of the subject that follows.',
  },
  'ss-004': {
    instruction: 'Write a sentence in the passive: “The letter was written by Tom.”',
    explanation:
      'Passive voice: be + V3. The doer is introduced with “by”.',
    commonMistake:
      'Do not mix up the passive (was written) with Past Continuous (was writing).',
    prompt: 'Make a sentence in the passive voice.',
    notes:
      'The checker looks for the passive: was + V3 + by.',
  },
  'psc-005': {
    explanation:
      'This is a general fact, so we use Present Simple (boils). Present Continuous describes a process happening right now.',
    commonMistake:
      'Scientific facts and laws of nature always take Present Simple.',
  },
  'psc-006': {
    explanation:
      '“Now” shows that the action is happening at the moment of speaking, so we need Present Continuous (am driving).',
    commonMistake:
      'Do not forget the auxiliary am/is/are: “I driving” is wrong.',
  },
  'psc-007': {
    explanation:
      'Have meaning “to own” is a stative verb and is not used in the Continuous. We say: She has two brothers.',
    commonMistake:
      'Have meaning “to eat, to take a shower” can be Continuous (is having lunch), but have meaning “to own” cannot.',
  },
  'psc-008': {
    instruction: 'Write a sentence about what you usually do in the morning using the word usually.',
    explanation:
      'Habits and regular actions take Present Simple; usually goes before the main verb.',
    commonMistake:
      'Do not use the Continuous with usually: “I am usually drinking” is wrong.',
    prompt: 'Describe your morning habit.',
    notes:
      'The checker looks for Present Simple with usually: “I usually (drink coffee / get up early…)”. Capital letters and final punctuation are ignored.',
  },
  'psc-009': {
    explanation:
      'The action is happening right now, so the question is in Present Continuous: are + subject + V-ing.',
    commonMistake:
      'In questions the auxiliary comes before the subject: “are you looking”, not “you are looking”.',
  },
  'pspp-005': {
    explanation:
      'The year 2018 is a specific finished moment in the past, so we use Past Simple (lived).',
    commonMistake:
      'Do not use Present Perfect with a specific date in the past.',
  },
  'pspp-006': {
    explanation:
      '“Since last summer” is a period that lasts until now, so we use Present Perfect: have not (haven\'t) seen.',
    commonMistake:
      'After since we need Present Perfect, not Past Simple: “I didn\'t see him since” is wrong.',
  },
  'pspp-007': {
    explanation:
      '“In 2015” is a specific moment in the past, so we use Past Simple (moved).',
    commonMistake:
      'Words with an exact date (in 2015, last week, yesterday, ago) do not go with Present Perfect.',
  },
  'pspp-008': {
    instruction: 'Write a sentence about a country you have already visited, using Present Perfect.',
    explanation:
      'Life experience without a time is expressed with Present Perfect: have/has been to.',
    commonMistake:
      'Have been to means “went and came back”; have gone to means “went and has not come back yet”.',
    prompt: 'Tell us where you have been.',
    notes:
      'The checker looks for Present Perfect: “I have been to (Italy / Spain…)”. The short form “I\'ve been to” is accepted too.',
  },
  'pspp-009': {
    explanation:
      'After “This is the first time…” we use Present Perfect: have caught.',
    commonMistake:
      'After “the first/second time” learners often use Past Simple. Present Perfect is needed.',
  },
  'pspc-004': {
    explanation:
      'A long action in the past that was interrupted by a short event (rang) is Past Continuous.',
    commonMistake:
      'The short interrupting action is Past Simple; the long background action is Past Continuous.',
  },
  'pspc-005': {
    explanation:
      '“While” introduces a long action that was in progress when another event happened: Past Continuous (was cooking).',
    commonMistake:
      'Do not forget was/were: “While she cooking” is wrong.',
  },
  'pspc-006': {
    explanation:
      'This is a short completed action, so we need Past Simple (broke), not Past Continuous.',
    commonMistake:
      'Past Continuous describes a process, not a result: “was breaking” sounds like “was in the middle of breaking”.',
  },
  'pspc-007': {
    instruction: 'Write about yourself: what you were doing yesterday at 8 p.m. (Past Continuous).',
    explanation:
      'An action in progress at a specific moment in the past is expressed with Past Continuous: was/were + V-ing.',
    commonMistake:
      'Do not use Past Simple for a process at a specific moment: “I watched at 8 p.m.” sounds like a finished action.',
    prompt: 'What were you doing yesterday at 8 p.m.?',
    notes:
      'The checker looks for Past Continuous: “I was (watching / reading / cooking…)”. If your verb is not in the checker\'s list, the answer gets the status “needs review” and you can mark it as correct.',
  },
  'pspc-008': {
    explanation:
      'The long background action is Past Continuous (was walking); the short event that interrupted it is Past Simple (met).',
    commonMistake:
      'Using the same tense for both verbs is a typical mistake: you need Continuous + Simple.',
  },
  'ff-004': {
    explanation:
      'A prediction based on what we can see now (clouds) is expressed with be going to.',
    commonMistake:
      'For predictions based on visible signs use going to; will is for opinions and spontaneous decisions.',
  },
  'ff-005': {
    explanation:
      'The decision is made at the moment of speaking, so we use will (I will answer / I\'ll answer).',
    commonMistake:
      'For a decision made right now do not use going to: “I am going to answer” sounds like a plan made earlier.',
  },
  'ff-006': {
    explanation:
      'After when, as soon as, before, after and if, we do not use will in time and condition clauses. We use Present Simple.',
    commonMistake:
      'Will cannot go after when/if/as soon as in the subordinate clause.',
  },
  'ff-007': {
    instruction: 'Write a sentence about your plans for the weekend using be going to.',
    explanation:
      'A plan or intention made in advance is expressed with be going to + verb.',
    commonMistake:
      'After going to comes the base form: “going to visit”, not “going to visiting”.',
    prompt: 'Tell us about your plans for the weekend.',
    notes:
      'The checker looks for the construction “I am going to + verb”. The short form “I\'m going to” is accepted too.',
  },
  'ff-008': {
    explanation:
      'By + a future time expresses an action that will be finished by that time: Future Perfect (will have finished).',
    commonMistake:
      'With by + a future date we need Future Perfect, not the simple future.',
  },
  'cond-004': {
    explanation:
      'An unreal or unlikely condition in the present: if + Past Simple, would + verb (second conditional).',
    commonMistake:
      'Do not put would in the if-clause: “If I would have” is wrong.',
  },
  'cond-005': {
    explanation:
      'A general law of nature: the zero conditional is if + Present Simple, Present Simple in the main clause.',
    commonMistake:
      'For general laws we need neither will nor Past Simple: “it melts”.',
  },
  'cond-006': {
    explanation:
      'In the if-clause of the second conditional we use Past Simple (studied); would is only in the main clause.',
    commonMistake:
      'Would in both parts of the sentence is a common mistake.',
  },
  'cond-007': {
    instruction: 'Write a second-conditional sentence about what you would do if you won the lottery.',
    explanation:
      'Second Conditional: if + Past Simple, would + verb.',
    commonMistake:
      'Do not say “If I will win” or “If I would win”.',
    prompt: 'What would you do if you won the lottery?',
    notes:
      'The checker looks for the Second Conditional: “If I won the lottery, I would …”. Capital letters and final punctuation are ignored.',
  },
  'cond-008': {
    explanation:
      'An unreal condition in the past (third conditional): if + Past Perfect, would have + V3.',
    commonMistake:
      'Past Simple in the if-clause of the third conditional is a common mistake: you need Past Perfect (had taken).',
  },
  'art-005': {
    explanation:
      'Before a superlative (best, biggest, most interesting) we always use the.',
    commonMistake:
      'Without the, a superlative sounds incomplete: “the best”, “the most interesting”.',
  },
  'art-006': {
    explanation:
      'Before a word that begins with a vowel sound (interesting) we use an. The film is mentioned for the first time, so the article is indefinite.',
    commonMistake:
      'The choice between a and an depends on the sound, not the letter: an hour, a university.',
  },
  'art-007': {
    explanation:
      'With the names of meals (breakfast, lunch, dinner) we usually use no article.',
    commonMistake:
      'Exception: if the meal has a description — “a big breakfast”, “the breakfast was delicious”.',
  },
  'art-008': {
    explanation:
      'Before the names of single lakes and mountains (Lake Baikal, Mount Everest) no article is needed. The is used before rivers, oceans and mountain ranges: the Danube, the Alps.',
    commonMistake:
      'Do not put the before a lake with the word Lake: “the Lake Baikal” is wrong.',
  },
  'art-009': {
    instruction: 'Write a sentence about the job you want to have (use a or an before the job).',
    explanation:
      'Before the name of a job in the singular we use the indefinite article a/an.',
    commonMistake:
      'Do not leave out the article before a job: “I want to be teacher” is wrong.',
    prompt: 'Tell us what you want to be.',
    notes:
      'The checker looks for the article before a job: “I want to be a (teacher) / an (engineer)”. Capital letters and final punctuation are ignored.',
  },
  'prep-005': {
    explanation:
      'With months, years and seasons we use in: in June, in 2024, in summer.',
    commonMistake:
      'On is used only with a specific date or day of the week: on June 5th, on Monday.',
  },
  'prep-006': {
    explanation:
      'Since shows the start of a period (since 2015); for shows its length (for ten years).',
    commonMistake:
      'Do not mix them up: for + period (for two years), since + starting point (since 2019).',
  },
  'prep-007': {
    explanation:
      'Fixed collocation: good at + noun or gerund.',
    commonMistake:
      'Many prepositions must be learned together with the word: good at, interested in, afraid of.',
  },
  'prep-008': {
    explanation:
      'In look forward to, to is a preposition, and after a preposition the verb takes -ing: to seeing.',
    commonMistake:
      'After to in look forward to, be used to and object to we need -ing, not the infinitive.',
  },
  'prep-009': {
    instruction: 'Write a sentence about how you get to work or school using by.',
    explanation:
      'With means of transport we use the preposition by (by bus, by car), without an article.',
    commonMistake:
      'Do not say “by the bus”: no article after by. But “on foot” means walking.',
    prompt: 'Tell us how you get to work or school.',
    notes:
      'The checker looks for by with a means of transport: “I go to work by bus / by car…”. Capital letters and final punctuation are ignored.',
  },
  'sva-004': {
    explanation:
      'News is an uncountable noun, so the verb is singular: the news is.',
    commonMistake:
      'Despite the ending -s, the words news, mathematics and economics take a singular verb.',
  },
  'sva-005': {
    explanation:
      'In neither … nor the verb agrees with the nearest subject. The nearest one here is friends (plural), so are.',
    commonMistake:
      'The verb agrees with the subject closest to it: Neither his friends nor Tom is at home.',
  },
  'sva-006': {
    explanation:
      'In there is/are the verb agrees with the noun that follows. Books is plural, so there are.',
    commonMistake:
      'Do not go by “there”: whether it is “There is” or “There are” depends on the next word.',
  },
  'sva-007': {
    explanation:
      'Everybody, everyone, somebody and nobody are singular pronouns, so the verb is is.',
    commonMistake:
      'Even though it means “all people”, everybody and everyone take a singular verb.',
  },
  'sva-008': {
    instruction: 'Write a sentence that begins with Everyone in Present Simple.',
    explanation:
      'After everyone the verb is in the singular (3rd person): everyone likes, everyone is.',
    commonMistake:
      'Do not use a plural verb: “Everyone are” and “Everyone like” are mistakes.',
    prompt: 'Begin your sentence with the word Everyone.',
    notes:
      'The checker looks for agreement: “Everyone (is / has / likes / loves…)”. If your verb is not in the checker\'s list, the answer gets the status “needs review” and you can mark it as correct.',
  },
  'wo-004': {
    explanation:
      'Frequency adverbs (always, usually, never) go after the verb to be but before main verbs.',
    commonMistake:
      'After be the adverb comes next: She is always. Before a main verb: She always comes.',
  },
  'wo-005': {
    explanation:
      'If the indirect object (to whom?) comes without a preposition, it goes before the direct object: gave her the book. With a preposition: gave the book to her.',
    commonMistake:
      'Do not mix the two ways: “gave to her the book” is wrong.',
  },
  'wo-006': {
    explanation:
      'In an affirmative English sentence the order is subject + verb (I went), even if the sentence starts with a time adverbial.',
    commonMistake:
      'Inversion (the verb before the subject) in a statement is a mistake typical of learners whose first language has a freer word order.',
  },
  'wo-007': {
    instruction: 'Make a sentence from the words: always / early / gets up / my brother.',
    explanation:
      'A frequency adverb goes before the main verb: My brother always gets up early.',
    commonMistake:
      'Do not put a frequency adverb at the beginning or after the object: “Always my brother gets up early” is wrong.',
    prompt: 'Put the words in the correct order.',
    notes:
      'The checker looks for the word order: subject + frequency adverb + verb + adverbial. Capital letters and final punctuation are ignored.',
  },
  'wo-008': {
    explanation:
      'Order in a sentence: subject + verb + object + place + time. A time adverbial (tomorrow) usually comes at the end.',
    commonMistake:
      'Do not separate the verb from its place with a time adverbial: “going tomorrow to the cinema”.',
  },
  'qn-004': {
    explanation:
      'In Present Simple questions with she/he/it we use the auxiliary does.',
    commonMistake:
      'After does the main verb has no -s: “Does she speak”, not “Does she speaks”.',
  },
  'qn-005': {
    explanation:
      'The negative in Present Simple with she/he/it: does not (doesn\'t) + base verb.',
    commonMistake:
      'Do not add -s after doesn\'t: “She doesn\'t goes” is wrong.',
  },
  'qn-006': {
    explanation:
      'In a question the auxiliary verb comes before the subject: Where did you buy…?',
    commonMistake:
      'Question word order: question word + auxiliary + subject + main verb.',
  },
  'qn-007': {
    explanation:
      'In an indirect question the word order is the same as in a statement: where the post office is.',
    commonMistake:
      'After Could you tell me / Do you know the word order is not that of a question: “where is the post office” is wrong.',
  },
  'qn-008': {
    instruction: 'Write a question about where your friend lives (Present Simple, start with Where).',
    explanation:
      'A Present Simple question with he/she/your friend needs the auxiliary does and the base form of the main verb.',
    commonMistake:
      'Do not leave out does: “Where your friend lives?” is wrong.',
    prompt: 'Ask where your friend lives.',
    notes:
      'The checker looks for a Present Simple question: “Where does your friend live?”. Capital letters and final punctuation are ignored.',
  },
  'cu-004': {
    explanation:
      'Water is an uncountable noun, so in a question we use much. Many is used only with countable nouns (how many books).',
    commonMistake:
      'Do not say “how many water”: uncountable nouns need much.',
  },
  'cu-005': {
    explanation:
      'Friends is a countable plural noun, so we use a few (“several”). A little is used with uncountable nouns: a little time.',
    commonMistake:
      'A few and few differ in meaning: a few means “several (enough)”, few means “hardly any”.',
  },
  'cu-006': {
    explanation:
      'Information is uncountable and has no plural: informations is wrong.',
    commonMistake:
      'Uncountable nouns include information, advice, furniture, news, luggage and homework: they have no -s.',
  },
  'cu-007': {
    explanation:
      'The uncountable noun paper is counted with units: a piece of paper, a sheet of paper.',
    commonMistake:
      'Do not say “a paper” for “a sheet of paper”: a paper is an article or a newspaper.',
  },
  'cu-008': {
    instruction: 'Write a sentence about coffee using a lot of, a little or much.',
    explanation:
      'Before the uncountable noun coffee we use a lot of, much, a little or some, but not many or a few.',
    commonMistake:
      'Do not use many and few with coffee, tea, water: “many coffee” is wrong.',
    prompt: 'Tell us how much coffee you drink.',
    notes:
      'The checker looks for a quantifier with an uncountable noun: “I drink a lot of coffee / I do not drink much coffee”. Capital letters and final punctuation are ignored.',
  },
  'mod-004': {
    explanation:
      'Should expresses advice. Can is possibility or ability, might is weak probability.',
    commonMistake:
      'After should the main verb has no to: “should to see” is wrong.',
  },
  'mod-005': {
    explanation:
      'For an ability in the past we use could (the past form of can) + base verb.',
    commonMistake:
      'Do not say “She can swim when she was five”: with the past you need could.',
  },
  'mod-006': {
    explanation:
      'After modal verbs (must, can, should, may) the main verb has no to.',
    commonMistake:
      'Exceptions are have to and ought to, which need to.',
  },
  'mod-007': {
    explanation:
      'Must expresses a confident conclusion based on facts: “they must be at home”. Might is only a possibility.',
    commonMistake:
      'For a confident logical conclusion use must; for a weak one use might.',
  },
  'mod-008': {
    instruction: 'Write a sentence giving advice to a friend using should.',
    explanation:
      'Should + base verb expresses advice or a recommendation.',
    commonMistake:
      'Do not add to after should or -s: “He should goes” is wrong.',
    prompt: 'Give your friend some advice.',
    notes:
      'The checker looks for advice with should: “You should (see a doctor / sleep more)”. The short form “shouldn\'t” is accepted too. If your verb is not in the checker\'s list, the answer gets the status “needs review” and you can mark it as correct.',
  },
  'gi-004': {
    explanation:
      'After the verb suggest we use the -ing form: suggest going.',
    commonMistake:
      'After suggest, enjoy, avoid and finish you need a gerund (-ing), not to + infinitive.',
  },
  'gi-005': {
    explanation:
      'After the verb hope we use the infinitive with to: hope to see.',
    commonMistake:
      'Hope, want, decide and plan take to + infinitive: “I hope seeing” is wrong.',
  },
  'gi-006': {
    explanation:
      'After the verb avoid we use a gerund: avoid answering.',
    commonMistake:
      'Avoid, enjoy, finish, mind and suggest are verbs followed by a gerund.',
  },
  'gi-007': {
    explanation:
      'Remember + -ing means “to remember a past action” (remember seeing). Remember + to-infinitive means “not to forget to do something”.',
    commonMistake:
      'Remember to lock the door means “don\'t forget to lock it”. Remember locking the door means “I remember that I locked it”.',
  },
  'gi-008': {
    instruction: 'Write a sentence about what you enjoy doing in your free time, using enjoy + a verb with -ing.',
    explanation:
      'After enjoy we use a gerund (a verb with -ing): enjoy reading.',
    commonMistake:
      'Do not use the infinitive with to after enjoy: “I enjoy to read” is wrong.',
    prompt: 'Tell us what you enjoy doing in your free time.',
    notes:
      'The checker looks for the construction enjoy + -ing: “I enjoy (reading / cooking / swimming)”. If your verb is not in the checker\'s list, the answer gets the status “needs review”.',
  },
  'cs-004': {
    explanation:
      'Comparing two people: short adjective + -er + than (taller than).',
    commonMistake:
      'Do not add more to a short adjective: “more taller” is wrong.',
  },
  'cs-005': {
    explanation:
      'The superlative of good is the best. This is an exception: good — better — the best.',
    commonMistake:
      'Irregular forms must be learned: good — better — best, bad — worse — worst.',
  },
  'cs-006': {
    explanation:
      'Big is a short adjective; its comparative is bigger, without more.',
    commonMistake:
      'Do not combine more and -er: “more bigger” is wrong.',
  },
  'cs-007': {
    explanation:
      'The construction “the more … the better” expresses a dependence: the more of one, the better the other.',
    commonMistake:
      'In both parts of this construction we use the + comparative.',
  },
  'cs-008': {
    instruction: 'Write a sentence comparing two cities or two countries using than.',
    explanation:
      'To compare two things we use a short adjective + -er than or more + a long adjective + than.',
    commonMistake:
      'After a comparative we use than, not that or as.',
    prompt: 'Compare two cities or two countries.',
    notes:
      'The checker looks for a comparative with than: “Rome is bigger than Florence”. If your adjective is not in the checker\'s list, the answer gets the status “needs review”.',
  },
  'ss-005': {
    explanation:
      'Who refers to people, which refers to things. The subject is not repeated in the clause: after who we do not need he.',
    commonMistake:
      'Do not repeat the subject: “The man who he lives” is wrong.',
  },
  'ss-006': {
    explanation:
      'Although introduces a contrast (“even though”). Because introduces a reason.',
    commonMistake:
      'Do not use although and but together in one sentence.',
  },
  'ss-007': {
    explanation:
      'Because of + a noun, because + a full clause (subject + verb). A clause follows here (the people are friendly), so we need because.',
    commonMistake:
      'Because of the weather — a noun; because the weather is bad — a clause.',
  },
  'ss-008': {
    instruction: 'Combine the two sentences into one with who: I have a friend. She lives in Canada.',
    explanation:
      'Who introduces a relative clause that describes a person; the subject she is replaced by who.',
    commonMistake:
      'Do not repeat the subject after who: “a friend who she lives” is wrong.',
    prompt: 'Combine the sentences with who.',
    notes:
      'The checker looks for a defining relative clause with who: “I have a friend who lives in Canada”. Capital letters and final punctuation are ignored.',
  },
  'ss-009': {
    explanation:
      'So introduces a result: first the reason (I was very tired), then the consequence (I went to bed early).',
    commonMistake:
      'Because introduces a reason and so introduces a result: do not mix up their order.',
  },
  'psc-010': {
    explanation:
      'The verb see meaning “to understand” is a stative verb and is not used in the Continuous: I see what you mean.',
    commonMistake:
      'The verbs see, understand, know, believe and mean in the sense of “understand” usually have no -ing form.',
  },
  'psc-011': {
    explanation:
      'Present Continuous with always expresses a repeated action that annoys the speaker: He is always complaining.',
    commonMistake:
      'Present Simple (“He always complains”) sounds neutral; with the Continuous there is a tone of irritation.',
  },
  'pspc-009': {
    explanation:
      'The action happened earlier than another moment in the past (by the time I got), so we use Past Perfect: had left.',
    commonMistake:
      'By the time + Past Simple needs Past Perfect in the main clause if the action finished earlier.',
  },
  'pspp-010': {
    explanation:
      'Know is a stative verb and is not used in the Continuous, even with since: I have known her since 2010.',
    commonMistake:
      'Do not use the Continuous with know, like, love, want, believe: “have been knowing” is wrong.',
  },
  'ff-009': {
    explanation:
      'The action will be in progress at a specific moment in the future (this time next week): Future Continuous — will be lying.',
    commonMistake:
      'Do not confuse lie (lying), “to be in a lying position”, with lay (laying), “to put down”.',
  },
  'cond-009': {
    explanation:
      'Mixed conditional: the condition is in the past (had studied), the result is in the present (now) — would + verb.',
    commonMistake:
      'A mixed conditional combines a past condition with a present result: if + Past Perfect, would + V.',
  },
  'cond-010': {
    explanation:
      'In the if-clause of the third conditional we use Past Perfect (had known); would have is only in the main clause.',
    commonMistake:
      'Would have in both parts is a common mistake: the if-clause needs had + V3.',
  },
  'cond-011': {
    explanation:
      'After wish about an unreal present we use Past Simple: I wish I had.',
    commonMistake:
      'Do not say “I wish I have”: a wish about an unreal present is expressed with a past form.',
  },
  'mod-009': {
    explanation:
      'Should have + V3 expresses criticism or regret about the past: “you ought to have told me earlier”.',
    commonMistake:
      'Should have + V3 is about the past; should + infinitive is advice for the present or future.',
  },
  'gi-009': {
    explanation:
      'Be used to (“to be accustomed to”) needs the -ing form: is used to getting up.',
    commonMistake:
      'Do not confuse used to + infinitive (“did regularly in the past”) and be used to + -ing (“is accustomed to”).',
  },
  'gi-010': {
    explanation:
      'After the verb deny we use a gerund: deny breaking.',
    commonMistake:
      'Deny, admit, risk, consider and postpone are verbs that need a gerund.',
  },
  'sva-009': {
    explanation:
      'A number of + plural means “several”, so the verb is plural: are.',
    commonMistake:
      'The number of students is… (the quantity is singular), but A number of students are… (several).',
  },
  'ss-010': {
    explanation:
      'In a clause set off by commas (non-defining) we use who (for people) or which (for things) instead of that.',
    commonMistake:
      'That is not used after a comma: “My brother, that lives in Canada” is wrong.',
  },
  'ss-011': {
    explanation:
      'A report cannot finish by itself, someone finishes it: we need the passive — will be finished.',
    commonMistake:
      'Future passive: will be + V3.',
  },
  'art-010': {
    explanation:
      'Before the word only we use the.',
    commonMistake:
      'The is also used before first, last, same and superlatives.',
  },
  'prep-010': {
    explanation:
      'Fixed collocation: responsible for + noun.',
    commonMistake:
      'Many adjectives need a particular preposition: responsible for, afraid of, interested in.',
  },
  'qn-009': {
    explanation:
      'In a tag question after a negative statement we use an affirmative tag with the same auxiliary: haven\'t → have you.',
    commonMistake:
      'After a negative the tag is affirmative, after an affirmative it is negative.',
  },
  'wo-009': {
    explanation:
      'After a negative adverb at the beginning of a sentence (never, rarely, seldom) the auxiliary goes before the subject: Never have I seen.',
    commonMistake:
      'Inversion after never, rarely and hardly makes speech more emphatic and is used in writing.',
  },
  'psc-012': {
    explanation:
      'A regular action: Present Simple, and for she we add -s: drinks.',
    commonMistake:
      'With he/she/it in Present Simple the verb takes -s.',
  },
  'art-011': {
    explanation:
      'Before a vowel sound (apple) we use an.',
    commonMistake:
      'The choice of a or an depends on the sound: an apple, a banana.',
  },
  'prep-011': {
    explanation:
      'An object lying on a surface: on the table.',
    commonMistake:
      'In means inside something (in the box), on means on a surface (on the table).',
  },
  'qn-010': {
    explanation:
      'In a Present Simple question with the film (it) we use does.',
    commonMistake:
      'After does the main verb has no -s: “does the film start”, not “starts”.',
  },
  'cu-009': {
    explanation:
      'Child is a countable noun with an irregular plural: children.',
    commonMistake:
      'Irregular forms must be learned: child — children, man — men, woman — women.',
  },
  'sva-010': {
    explanation:
      'With the pronoun they the verb to be in Present Simple is are.',
    commonMistake:
      'Forms of to be: I am, he/she/it is, we/you/they are.',
  },
  'mod-010': {
    explanation:
      'Can expresses ability: I can swim.',
    commonMistake:
      'After can the main verb has no to: “I can swim”, not “I can to swim”.',
  },
};

export const TOPIC_DESCRIPTION_EN: Record<string, string> = {
  present_simple_vs_continuous: 'The difference between regular actions and actions happening right now.',
  past_simple_vs_present_perfect: 'When to use a finished past action and when a result connected with the present.',
  past_simple_vs_past_continuous: 'An interrupted action and the background in the past.',
  future_forms: 'will, be going to and Present Continuous for the future.',
  subject_verb_agreement: 'Subject–verb agreement in number.',
  articles: 'The indefinite, definite and zero article.',
  prepositions: 'Prepositions of place, time and direction.',
  word_order: 'Word order in affirmative sentences.',
  questions_negatives: 'Forming questions and negatives.',
  countable_uncountable: 'Countable and uncountable nouns.',
  modals: 'can, could, must, should, may and their meanings.',
  conditionals: 'Zero, First, Second and Third conditionals.',
  gerunds_infinitives: 'When a verb is followed by -ing and when by to + verb.',
  comparatives_superlatives: 'The comparative and superlative of adjectives.',
  sentence_structure: 'Basic sentence structure and common mistakes.',
};
