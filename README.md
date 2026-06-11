# pt-tracker

A small Vite + React app for tracking daily shoulder PT, grouped into day-phase
blocks with a per-exercise / per-block weekly schedule.

## Install

1. `npm install`
2. `npm start` — opens `http://localhost:5173`

Build for production: `npm run build` (outputs to `dist/`).

## Project structure

```
src/
  App.jsx                  top-level component: state, handlers, render
  data.js                  exercise blocks + motivational quotes (content)
  components/
    Confetti.jsx           completion confetti burst (self-contained, owns its keyframes)
    Footer.jsx             helpful-links footer
  hooks/
    usePersistentState.js  useState mirrored to localStorage (init + persist)
  lib/
    schedule.js            DAYS, getExercisesForDay(exercises, day), isStrengthDay(blocks) — pure
    stats.js               completionKey, isCompleted, categoryStats, dayStats — pure
```

`App.jsx` imports the pure helpers under local aliases (`scheduleForDay`,
`computeIsStrengthDay`, `categoryStats`, `dayStats`, `isDone`) and keeps thin
wrappers, so render-side call sites stay unchanged.

## Exercise data model (`data.js`)

```js
export const exercises = {
  'Block Name': {
    days: ['Monday', 'Wednesday', 'Friday'], // optional: whole block runs only these days
    exercises: [
      { name, sets, reps },                   // omit days → daily
      { name, sets, reps, days: MWF },         // per-exercise schedule wins over block
      { name, sets, hold: '10s' },             // holds instead of reps
      { name, target: 5000 },                  // goal-style item
      { name, ..., priority: 'high' },         // flagged with a star + accent
    ],
  },
};
```

Scheduling: a per-exercise `days` wins; else the block's `days`; else daily.
Loaded strength/resistance is gated to **Mon/Wed/Fri** (48h recovery between
sessions); isometrics alternate with strength (**Sun/Tue/Thu/Sat**) to avoid
double-loading strength days; mobility and stretches are daily. Completion is
stored in localStorage keyed by `${day}-${block}-${originalIndex}`; the
original index is preserved through day-filtering so keys stay stable.

## Known next step (not yet done)

`App.jsx` still holds the full render (~600 lines). The next refactor is to
extract presentational components — `Header`, `DayCard`, `CategoryBlock`,
`ExerciseRow` — each taking explicit props. This was deliberately deferred to a
session where the running app can be visually verified, since those components
are render-critical and a missed prop won't be caught by `npm run build`.
