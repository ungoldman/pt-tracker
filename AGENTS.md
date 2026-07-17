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

- `src/main.jsx`: entry, mounts `App`.
- `src/App.jsx`: the container. Holds all persistent state and handlers, builds
  the tracker context value, and renders the header, the day grid, and the
  footer.
- `src/context/TrackerContext.js`: carries shared state and handlers down to the
  day and block tree so props do not thread through every level. `ExerciseRow`
  is the deliberate exception. It takes explicit props and is wrapped in
  `React.memo`, so a note keystroke re-renders only the row being edited.
- `src/data.js`: the exercise content. Blocks keyed by name, each with an
  `exercises` list and optional `days` / `minutes` / `noEstimate`. See the
  README data-model section for the shape and the scheduling rules.
- `src/lib/`: pure helpers. `stats.js` (`hashString`, `exerciseId`,
  `completionKey`, `isCompleted`, `categoryStats`, `dayStats`), `schedule.js`
  (`DAYS`, `getExercisesForDay`, `isStrengthDay`), `dates.js`, `duration.js`
  (time estimates), `blockStyle.js`, `exerciseDisplay.jsx` (name formatting and
  icon badges).
- `src/components/`: `Header`, `Footer`, `DayCard`, `DayLabel`, `CategoryBlock`,
  `ExerciseRow`, `Confetti`.
- `src/hooks/usePersistentState.js`: `useState` mirrored to localStorage.
- `scripts/generate-doodles.mjs`: generates the background doodle wallpaper tile
  (`public/doodles.svg`).
- `public/`: static assets, including the singing-bowl recordings
  (`bowl10.m4a`, `bowl30.m4a`) and the web manifest.

## State and persistence

Durable state goes through `usePersistentState`: dark mode, completed, notes,
view mode. Completion and notes are keyed `${day}-${category}-${exerciseId}`,
where `day` is the weekday name and `exerciseId` is a short hash of the exercise
name (FNV-1a, see `stats.js`). Keying off the name hash rather than array
position means reordering or inserting exercises keeps existing checkmarks
intact. Renaming an exercise drops its state, which is an accepted trade.

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
wall-clock based so a backgrounded tab does not drift. Audio is WebAudio,
synthesized in the component. The interval chime plays the singing-bowl
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
