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
  App.jsx                  top-level component: state, handlers, day-card render
  data.js                  exercise blocks + motivational quotes (content)
  components/
    Header.jsx             sticky top bar: stats chips, day-type badge, quote, controls
    ExerciseRow.jsx        one exercise row: toggle, badges, note editor (memoized)
    Confetti.jsx           completion confetti burst (self-contained, owns its keyframes)
    Footer.jsx             helpful-links footer
  hooks/
    usePersistentState.js  useState mirrored to localStorage (init + persist)
  lib/
    schedule.js            DAYS, getExercisesForDay(exercises, day), isStrengthDay(blocks) — pure
    stats.js               completionKey, isCompleted, categoryStats, dayStats — pure
    exerciseDisplay.jsx    name formatting + equipment/priority icon badges
```

`App.jsx` imports the pure helpers under local aliases (`scheduleForDay`,
`computeIsStrengthDay`, `categoryStats`, `dayStats`, `isDone`) and keeps thin
wrappers, so render-side call sites stay unchanged. The schedule is static, so
each day's blocks are resolved once at module load (`SCHEDULE_BY_DAY`).
`ExerciseRow` is wrapped in `React.memo` and the handlers passed to it are
`useCallback`-stable, so note keystrokes re-render only the edited row.

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

`Header` and `ExerciseRow` are extracted; the remaining candidates are
`DayCard` and `CategoryBlock`, still inline in `App.jsx` as `renderDayCard`
(~120 lines). Same caveat as before: do it in a session where the running app
can be visually verified, since a missed prop won't be caught by
`npm run build`.
