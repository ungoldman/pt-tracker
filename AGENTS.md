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
- format: `npm run format` (Biome, writes `src/` and `test/`)
- test: `npm test` (lint, then the Vitest suite)
- coverage: `npm run coverage` (the suite with the 100% gate)
- preview a build: `npm run preview`

The `pt` command (`bin/pt.js`) launches the dev server from anywhere once
`npm link` has been run once in the repo root. It forces Firefox so Vite's
`--open` does not reuse a stray Chromium tab.

## Verification

A change is not done until `npm test`, `npm run coverage`, and `npm run build`
all pass. CI (`.github/workflows/tests.yml`) runs the same gate on every push
and pull request.

Coverage is held at 100% of lines, branches, functions, and statements for
everything under `src/` except `main.jsx`, which only mounts the app. Reach it
by testing the behavior or by deleting a branch that cannot happen, never by
excluding a file or contriving an input.

The suite runs in jsdom, which has no layout, no real service worker, and no
audio. So the tests cannot see a control that is clipped, mispositioned, or too
small to tap, and they cannot see what a real browser does with the worker.
Anything visual, and anything touching `vite.config.js`, `lib/updates.js`, or
`kill-sw.js`, still needs a look in a real browser against `npm run build` and
`npm run preview`.

How the tests are built:

- They live in `test/`, one file per area, named `*.test.js` or `*.test.jsx`.
- Component tests mount the whole `App` and drive it the way a person would,
  through `mountApp` in `test/helpers.jsx`. It pins the date to a Tuesday and
  fakes every timer, since completion, auto-advance, and the hold timer all run
  on them. Step time with `tick`.
- They run against `test/fixtures/program.js`, not the real program, so
  revising an exercise never breaks a test. `test/setup.js` swaps it in for
  `src/data.js`. The real program is checked for shape in `test/data.test.js`.
  A new data shape (a new optional field, say) needs an example in the fixture.
- Pure modules get example tests plus `fast-check` properties where an
  invariant holds across all inputs, as with `resolveSchedule` keeping storage
  keys intact under any moves.
- Only the edges are faked: `AudioContext`, `fetch`, `matchMedia`, the wake
  lock, and the plugin's `registerSW`. App code runs for real, apart from the
  program data swap above.

## Stack

JavaScript and JSX, no TypeScript. React 19 with function components and hooks.
Vite 8, Tailwind CSS v3, Biome (lint + format), Vitest with jsdom and Testing
Library (tests + coverage). npm is the package
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
    DayPicker.jsx          day selector (progress chips on phones, pills from sm up)
    DayView.jsx            one day's blocks in fixed lane columns (day view)
    DayCard.jsx            one day as a card of blocks (week and 3-day views)
    DayLabel.jsx           day name + date, brightens for the selected day
    CategoryBlock.jsx      one block: collapsible header, progress bar, exercise rows
    AwayBlock.jsx          placeholder for a block moved off a day or skipped
    MovePanel.jsx          day picker for moving or skipping one block
    Popover.jsx            floating panel anchored to a control, used by both move panels
    UpdateNotice.jsx       "new version ready" notice, accepts a waiting build
    DayMoves.jsx           day-level moves: pull unfinished blocks in, send moved ones back
    MissedYesterday.jsx    offer at the top of today to pull in yesterday's unfinished blocks
    WeekOverview.jsx       week view on phones: a row per day, a progress bar per block
    ExerciseRow.jsx        one exercise row: toggle, badges, note editor (memoized)
    Footer.jsx             sticky hold timer (prep, hold, rest)
    Confetti.jsx           completion confetti burst (self-contained, owns its keyframes)
  hooks/
    usePersistentState.js  useState mirrored to localStorage (init + persist)
    useDismiss.js          close on Escape or outside press
  lib/
    schedule.js            DAYS, getExercisesForDay, isStrengthDay, resolveSchedule (moves)
    stats.js               exerciseId, completionKey, isCompleted, categoryStats, dayStats
    dates.js               today's weekday + per-day date labels
    duration.js            per-block time estimates
    blockStyle.js          per-block accent color + icon
    exerciseDisplay.jsx    name formatting + equipment/priority icon badges
    audio.js               hold-timer WebAudio cues (bowl chime, temple-block rest)
    updates.js             service worker registration and the new-version signal
  kill-sw.js               emergency-exit service worker, published only by the kill switch
test/
  setup.js                 jsdom gaps and the fixture-program swap, run before every file
  helpers.jsx              mountApp, time stepping, queries, the fake AudioContext
  fixtures/program.js      stand-in exercise program with one of every data shape
  *.test.js(x)             one file per area
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
(`SCHEDULE_BY_DAY`). What renders is that schedule with the week's moves applied
(`resolveSchedule`, see Moves below).

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
      { name, sets, reps, perDay: 3 },       // shows "3x/day", still one check
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

## Moves

A block can be moved to another day or skipped for the week. Moves are a
persisted map, `ptTrackerMoves`, keyed `${sourceDay}-${category}` with a
destination day or `skip` as the value. `resolveSchedule` applies it to the
static schedule and gives each day its `blocks` and an `away` list of what left.

A moved block keeps its scheduled day as storage identity. Monday's `Standing`
shown on Tuesday still reads and writes `Monday-Standing-*`, so a move never
touches completion or notes and undoing it is deleting one map entry. Every
resolved block carries `sourceDay`. Use that for keys, and the day it renders
under only for layout. `CategoryBlock` takes them as `day` and `shownDay`.

Only a block whose scheduled exercises are all day-gated gets day targets. A
daily block can only be skipped. The per-block control shows in day and 3-day
views. Week view has the day-level control and the placeholders. The day-level
control pulls unfinished movable blocks in from other days and sends back what
was moved in. It never sends a day's blocks out to a third day. Strength blocks
move as one session per scheduled day, so a session parked on another day stays
separate from that day's own.

Moves are persisted overrides, the same shape of hazard as the collapse scar
above. The guards are that a move is always visible in both places, entries that
no longer match the schedule are ignored, and Reset week clears them. Reset day
clears the checks a day shows and leaves moves alone.

Weeks have no identity. Keys are weekday names, so a block cannot move into next
week.

## Phones

Below `sm` the layout changes shape rather than just reflowing, because the
phone is what gets used mid-exercise with one hand busy.

- Day navigation is the `DayPicker` chips alone. They carry each day's progress,
  so the header's week dots and day view's headline are hidden there, and the
  day-moves button sits at the end of the chip row.
- Rows stack the sets under the name. Week view is `WeekOverview`, not seven
  stacked cards.
- The hold-timer bar is not sticky. It sits at the end of the page.
- Small controls get a 44px hit area on touch screens from the `hit-44` class
  in `index.css`, which leaves their look alone. The element must be positioned.
- Tooltips are hidden where there is no hover, since a tap would leave one stuck.
- The note textarea is 16px. Anything smaller makes iOS Safari zoom on focus.

Two behaviors apply at every width. In day view a block's header sticks under
the app header while its rows scroll, offset by `--header-h`, which `Header`
publishes. And finishing a block scrolls the next unfinished one into view. Both
depend on day view's block list not being a scroll container below `lg`.

## Deploys and the service worker

Pushing to `main` deploys to GitHub Pages, which serves `index.html` with a 10
minute max-age that a static site cannot change. The app is also installed on
the phone's home screen, where there is no reload button. A service worker
(`vite-plugin-pwa`, configured in `vite.config.js`) covers both: it caches the
built app for offline use, and the browser's own check for a new worker skips
the HTTP cache.

It runs in the plugin's `prompt` mode on purpose. A new build downloads in the
background and then waits. It takes over only when `UpdateNotice` is accepted,
or the next time the app is opened after being fully closed. It never reloads a
page by itself, and there is no `skipWaiting` or `clientsClaim` outside that
accept. Accepting in one tab does reload any other open tab. `lib/updates.js`
registers it and asks for an update check on every return to the foreground,
since a resumed app does not navigate. A page no worker controls yet (the first
visit) never has a waiting worker, so there Update is a plain reload.

Rules that keep it from biting:

- No worker runs in dev. The plugin swaps in a no-op there. Test worker changes
  against `npm run build` and `npm run preview`.
- The worker file stays `sw.js` at the app root. A client only ever checks the
  URL it registered, so renaming or removing it strands installed copies.
- Its scope is `/pt-tracker/`, and its cache is named for that scope. Cache
  Storage is shared by the whole origin, so anything that deletes caches must
  filter by scope.
- Completion, notes, and moves are in localStorage, which the worker never
  touches.
- To back out, set `KILL_SERVICE_WORKER` in `vite.config.js` and deploy. That
  publishes `src/kill-sw.js` as `sw.js` and builds the app with no worker
  registration. The kill worker unregisters itself and deletes only this app's
  caches. It does not reload open pages. Leave it deployed until every
  installed copy has opened once while online. The plugin's own `selfDestroying`
  option is not used: it deletes every cache on the origin and force-reloads
  open pages.
- `vite-plugin-pwa` is pinned to an exact version. Read its changelog before
  moving it, a major bump can change the generated worker.

## Hold timer and audio (Footer)

The hold timer cycles prep, hold, then a rest break, looping until stopped, all
wall-clock based so a backgrounded tab does not drift. It holds a screen wake
lock while running. An exercise with timed holds of 10s or more gets a timer
button on its row (`holdPlan` in `lib/duration.js`). That run uses the
exercise's own hold length and count, stops itself after the last hold, and
checks the exercise off. Timer state stays inside `Footer`, reached through a
ref from `App`, so its ticking never re-renders the list. Audio is WebAudio, in
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
