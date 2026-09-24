# Agent Guidelines

pt-tracker is a private Vite + React app for tracking my daily shoulder PT. One
user, runs locally, not published. It loosely follows my package-standard
conventions, but it is an app rather than an npm library, so the release,
TypeScript, and coverage machinery from that standard does not apply here.

## Commands

- install: `npm install`
- run: `npm start` (Vite dev server, opens http://localhost:5173)
- build: `npm run build` (outputs to `dist/`)
- lint: `npm run lint` (Biome, read-only)
- format: `npm run format` (Biome, writes `src/`)
- preview a build: `npm run preview`

The `pt` command (`bin/pt.js`) launches the dev server from anywhere once
`npm link` has been run once in the repo root. It forces Firefox so Vite's
`--open` does not reuse a stray Chromium tab.

## Verification

There is no test suite. A change is not done until `npm run lint` and
`npm run build` both pass and the behavior is confirmed in the running app. A
missed prop or a stale hook dependency sails through the build and breaks at
runtime, so anything touching state, section collapse, or the hold timer needs
a real look in the browser. Driving the running app on localhost:5173 with the
Playwright MCP works well for this.

## Stack

JavaScript and JSX, no TypeScript. React 19 with function components and hooks.
Vite 8, Tailwind CSS v3, Biome (lint + format). npm is the package
manager and `package-lock.json` is committed. The `version` field in
`package.json` is inert, there are no releases.

## Layout

```
src/
  main.jsx                 entry, mounts App
  App.jsx                  container: persistent state, handlers, context provider, view switch
  data.js                  exercise blocks (content, see the data model below)
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
    stats.js               exerciseId, completionKey, isCompleted, categoryStats, dayStats
    dates.js               today's weekday + per-day date labels
    duration.js            per-block time estimates
    blockStyle.js          per-block accent color + icon
    exerciseDisplay.jsx    name formatting + equipment/priority icon badges
    audio.js               hold-timer WebAudio cues (bowl chime, temple-block rest)
scripts/
  generate-doodles.mjs     generates the background wallpaper tile (public/doodles.svg)
public/                    static assets: bowl recordings, web manifest, doodles.svg
```

`App.jsx` owns the persistent state and handlers and exposes them through
`TrackerContext`, so the day, block, and row components read what they need
without prop-drilling. `ExerciseRow` is the deliberate exception. It takes
explicit props and is wrapped in `React.memo`, with `useCallback`-stable
handlers, so a note keystroke re-renders only the row being edited. The
schedule is static, so each day's blocks are resolved once at module load
(`SCHEDULE_BY_DAY`).

## Exercise data model

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

Blocks render in key order. Scheduling resolves in order: a per-exercise `days`
wins, else the block's `days`, else daily. The dumbbell blocks (`Sidelying`,
`Supine`, `Standing`, `Seated`) are gated to Mon/Wed/Fri for 48h recovery
between sessions, and `Resistance` runs Tue/Thu/Sat. Warm up, hand, and
stretches run daily.

Block keys and exercise names are both storage identity (see below). The
position blocks store names without the position word (`Flexion with Dumbbell
(3)` in `Standing`), because that is what the old name-matching layout hashed.

## State and persistence

Durable state goes through `usePersistentState`: dark mode, completed, notes,
view mode. Completion and notes are keyed `${day}-${category}-${exerciseId}`,
where `day` is the weekday name and `exerciseId` is a short hash of the exercise
name (FNV-1a, see `stats.js`). Keying off the name hash rather than array
position means reordering or inserting exercises keeps existing checkmarks
intact. Renaming an exercise or its block drops its state, which is an accepted
trade. A data refactor that should not drop state can be checked by diffing
every resolved completion key before and after.

Ephemeral or derived UI state stays in plain `useState` and is never persisted.
This rule has a scar behind it: section-collapse overrides used to be persisted,
and stale entries silently shadowed the intrinsic "completed blocks collapse"
behavior across reloads. Section collapse now works like this. A completed block
collapses (the intrinsic rule, always). The header control applies momentary
bulk actions (collapse all, expand all, reset to default). Completing a block
clears its override, so finishing a block always collapses it no matter which
bulk action ran last.

## Hold timer and audio (Footer)

The hold timer cycles prep, hold, then a rest break, looping until stopped, all
wall-clock based so a backgrounded tab does not drift. Audio is WebAudio, in
`src/lib/audio.js`. The interval chime plays the singing-bowl
recordings from `public/` with a synthesized bowl as fallback. The rest cue is a
synthesized triple temple-block tap with no shipped asset. If you retune a cue,
the knobs are the partial frequencies and their decays.

## Conventions

Follow `CONTRIBUTING.md` for commit and coding conventions. Two that bite here:

- Never commit or push unless asked in the moment. A past "commit and push" is
  not standing permission.
- No AI attribution in commits. No `Co-authored-by`, no "generated with"
  trailer.

## Design restraint

Backgrounds and surfaces stay quiet: flat surfaces, a single semantic accent,
low-contrast wallpaper. When in doubt on background contrast, go quieter. The
wallpaper opacity is deliberately low and meant to stay that way.
