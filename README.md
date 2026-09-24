# pt-tracker

A small Vite + React app for tracking daily physical therapy exercises, grouped into
day-phase blocks with a per-exercise / per-block weekly schedule.

## Install

1. `npm install`
2. `npm start` to open `http://localhost:5173`

Optional: `npm link` once (from the repo root), then `pt` launches it from anywhere.

Build for production: `npm run build` (outputs to `dist/`).

## Project structure

```
src/
  main.jsx                 entry, mounts App
  App.jsx                  container: persistent state, handlers, context provider, layout
  data.js                  exercise blocks (content)
  context/
    TrackerContext.js      shared state + handlers for the day/block/row tree
  components/
    Header.jsx             sticky top bar: stats chips, day-type badge, week dots, controls
    DayPicker.jsx          day selector for day view (compact grid on phones, pills above)
    DayView.jsx            one day's blocks in fixed lane columns (day view)
    DayCard.jsx            one day as a card of blocks (week and 3-day views)
    DayLabel.jsx           day name + date, brightens for the selected day
    CategoryBlock.jsx      one block: collapsible header, progress bar, exercise rows
    ExerciseRow.jsx        one exercise row: toggle, badges, note editor (memoized)
    Footer.jsx             sticky hold timer (prep, hold, rest)
    Confetti.jsx           completion confetti burst (self-contained, owns its keyframes)
  hooks/
    usePersistentState.js  useState mirrored to localStorage (init + persist)
  lib/
    schedule.js            DAYS, getExercisesForDay, isStrengthDay
    stats.js               hashString, exerciseId, completionKey, isCompleted, categoryStats, dayStats
    dates.js               today's weekday + per-day date labels
    duration.js            per-block time estimates
    blockStyle.js          per-block accent color + icon
    exerciseDisplay.jsx    name formatting + equipment/priority icon badges
    audio.js               hold-timer WebAudio cues (bowl chime, temple-block rest)
```

`App.jsx` is the container. It owns the persistent state and handlers and
exposes them through `TrackerContext`, so the day, block, and row components
read what they need without prop-drilling. `ExerciseRow` is the exception: it
takes explicit props and is wrapped in `React.memo`, with `useCallback`-stable
handlers, so a note keystroke re-renders only the edited row. The schedule is
static, so each day's blocks are resolved once at module load
(`SCHEDULE_BY_DAY`).

## Exercise data model (`data.js`)

```js
export const exercises = {
  Standing: {
    displayName: 'Standing',   // header label
    lane: 1,                   // fixed day-view column
    icon: Dumbbell,            // lucide icon
    accent: 'purple',          // color token, see lib/blockStyle.js
    days: MWF,                 // optional: whole block runs only these days
    strength: true,            // optional: marks the day as a strength day in the header
    minutes: 10,               // optional: override the computed time estimate
    noEstimate: true,          // optional: hide the time estimate entirely
    exercises: [
      { name, sets, reps },                  // omit days → daily
      { name, sets, reps, days: MWF },       // per-exercise schedule wins over block
      { name, sets, reps, hold: '3s' },      // reps with a hold each
      { name, sets, hold: '30s' },           // holds instead of reps
      { name, target: 5000 },                // goal-style item
      { name, sets, reps, priority: true },  // star icon, counts toward the header chip
      { name, sets, reps, link },            // adds a video link after the name
    ],
  },
}
```

Block keys are also storage keys, and the position blocks store names without
the position word (`Flexion with Dumbbell (3)` in `Standing`).

Scheduling resolves in order: a per-exercise `days` wins, else the block's
`days`, else daily. The dumbbell blocks (`Sidelying`, `Supine`, `Standing`,
`Seated`) are gated to **Mon/Wed/Fri** for 48h recovery between sessions, and
`Resistance` runs Tue/Thu/Sat. Warm up, hand, and stretches run daily.
Completion and notes are stored in
localStorage keyed by `${day}-${block}-${exerciseId}`, where `exerciseId` is a
short hash of the exercise name (see `stats.js`). Keying off durable identity
rather than array position means reordering or inserting exercises no longer
scrambles existing checkmarks. Renaming an exercise or its block drops its
state.

## Credits

The hold-timer chimes are Tibetan singing bowl strikes from Wikimedia
Commons, CC BY-SA 4.0, normalized/faded and transcoded to AAC:
[`bowl10.m4a` (4.5")](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_4.5inch.flac)
and [`bowl30.m4a` (11")](https://commons.wikimedia.org/wiki/File:Tibetan_Singing_Bowl_hit_11inch.flac).

## Development

See [AGENTS.md](AGENTS.md) for the architecture notes and
[CONTRIBUTING.md](CONTRIBUTING.md) for commit and coding conventions. There is
no test suite. Run `npm run lint` and `npm run build`, then verify behavior in
the running app, since a missed prop or a stale hook dependency passes the build
and only breaks at runtime.
