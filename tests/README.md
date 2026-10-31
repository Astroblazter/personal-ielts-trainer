# Tests

Run all tests:

```
npm test
```

No extra packages are needed: the tests use Node's built-in test runner and run the TypeScript
sources directly (Node 22.6 or newer). `register.mjs` and `loader.mjs` only teach Node the `@/` path alias.

| File | What it checks |
|---|---|
| `checker.test.ts` | Answer checking: accepted variants, typos ("almost correct"), find-the-error, free writing |
| `exercises.test.ts` | The exercise bank: unique ids, well-formed items, every item accepts its own correct answer, English texts |
| `diagnostic.test.ts` | Adaptive diagnostic: staircase, no repeats, level estimate rises with ability |
| `studyPlan.test.ts` | Four-week plan, week progress, recommended start level, lesson focus |
| `progressTrend.test.ts` | "Before / after" comparison by topic |
| `learning.test.ts` | Streak, statistics, spaced repetition, daily lesson selection |
| `mistakes.test.ts` | Mistakes notebook: closing after three correct answers in a row, re-opening after a mistake |
| `vocabulary.test.ts` | Vocabulary: seed words, boxes and review dates, practice sessions, exercises |
| `content.test.ts` | English texts of Reading, Listening, Writing, Speaking |

Not covered: screens (React) and the IndexedDB storage layer, which need a browser environment.
