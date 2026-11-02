# Agent Guidelines

pt-tracker is a private Vite + React app for tracking my shoulder and hand PT
home programs. One user, deployed to GitHub Pages and installed on my phone. It loosely follows my package-standard
conventions, but it is an app rather than an npm library, so the release,
TypeScript, and coverage machinery from that standard does not apply here.

## Commands

- install: `npm install`
- run: `npm start` (Vite dev server, opens http://localhost:5173/pt-tracker/)
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
  invariant holds across all inputs, as with the date arithmetic in `plan.js`.
- Only the edges are faked: `AudioContext`, `fetch`, `matchMedia`, the wake
  lock, and the plugin's `registerSW`. App code runs for real, apart from the
  program data swap above.

## Stack

JavaScript and JSX, no TypeScript. React 19 with function components and hooks.
Vite 8, Tailwind CSS v4, Biome (lint + format), Vitest with jsdom and Testing
Library (tests + coverage). npm is the package
manager and `package-lock.json` is committed. The `version` field in
`package.json` is inert, there are no releases.

## Layout

```
src/
  main.jsx                 entry, mounts App
  App.jsx                  container: persistent state, handlers, context provider, tab and player switch
  data.js                  exercise blocks, the daily routine, sessions, and day limits
  context/
    TrackerContext.js      shared state + handlers for the tab, player, and row tree
  components/
    Header.jsx             title, week count, theme, resets, and the tab bar
    TodayTab.jsx           Up next, today's sessions, daily goals, the full picker on request
    HandTab.jsx            hand passes, the once-a-day hand work, as-needed items
    WeekTab.jsx            week strip, a chosen day's detail, what the week has left
    Player.jsx             one run (session, hand pass, once-a-day work) as cards or a list
    SessionPicker.jsx      every session ranked for a day, full or short
    DayLog.jsx             a day's sessions with Resume or Open
    WeekStrip.jsx          Monday to Sunday, one mark per session, days open on tap
    Pips.jsx               a count of a target at a glance, part-done ones filled by share
    ItemGroup.jsx          a block's exercises as rows under its accent header
    ExerciseRow.jsx        one exercise row: toggle, badges, note editor (memoized)
    Footer.jsx             hold timer (prep, hold, rest) and its free-running bar
    UpdateNotice.jsx       "new version ready" notice, accepts a waiting build
    Confetti.jsx           completion confetti burst (self-contained, owns its keyframes)
  hooks/
    usePersistentState.js  useState mirrored to localStorage (init + persist)
    useDismiss.js          close on Escape or outside press
    useSingleTap.js        drops the second tap of a double tap on a toggle
    useWakeLock.js         keep the screen awake, taken again when the tab returns
    useWide.js             true from lg up, for what a tab shows outright on a big screen
  lib/
    plan.js                dates, session items, credit, ranking, Up next, daily parts (pure)
    stats.js               exerciseId, the storage hash of an exercise name
    duration.js            time estimates and hold plans
    blockStyle.js          per-block accent color + icon
    exerciseDisplay.jsx    name and dose formatting + equipment/priority icon badges
    audio.js               hold-timer WebAudio cues (bowl chime, temple-block rest)
    updates.js             service worker registration and the new-version signal
  kill-sw.js               emergency-exit service worker, published only by the kill switch
test/
  setup.js                 jsdom gaps and the fixture-program swap, run before every file
  helpers.jsx              mountApp, time stepping, queries, the fake AudioContext
  fixtures/program.js      stand-in program with one of every data shape
  *.test.js(x)             one file per area
scripts/
  generate-doodles.mjs     generates the background wallpaper tile (public/doodles.svg)
public/                    static assets: bowl recordings, web manifest, doodles.svg
```

`App.jsx` owns the persistent state and handlers and exposes them through
`TrackerContext`, so the tabs, the player, and the rows read what they need
without prop-drilling. `ExerciseRow` is the deliberate exception. It takes
explicit props and is wrapped in `React.memo`, with `useCallback`-stable
handlers, so a note keystroke re-renders only the row being edited. Everything
that decides what to offer lives in `lib/plan.js` as pure functions over the
history, so it is tested without the UI.

## Program data model

```js
export const exercises = {
  Standing: {
    displayName: 'Standing',   // header and card label
    icon: Dumbbell,            // lucide icon
    accent: 'purple',          // color token, see lib/blockStyle.js
    exercises: [
      { name, sets, reps },                  // plain
      { name, sets, reps, hold: '3s' },      // reps with a hold each
      { name, sets, hold: '30s' },           // holds instead of reps
      { name, target: 5000 },                // goal-style item
      { name, target: '2k+', perWeek: 3 },   // goal counted across the week
      { name, sets, reps, priority: true },  // star icon, makes the short session
      { name, sets, reps, link },            // adds a video link
      { name, sets, reps, perDay: 3 },       // a daily item done in passes
      { name, ambient: true },               // worn or used as needed, never a task
    ],
  },
}

export const daily = ['hand', 'cardio']

export const limits = { sessionsPerDay: 2, strengthPerDay: 2 }

export const sessions = [
  {
    id: 'standing',            // storage identity, keep stable
    name: 'Standing shoulder',
    warmup: 'warmup',          // optional block done first, left out of a short session
    blocks: ['Standing'],      // the work
    perWeek: 2,                // weekly target
    strength: true,            // optional: dumbbell work, see the rest rules below
    stretches: ['Shoulder IR Stretch', 'Snow Angels on Foam Roll'], // warm-down, by name
  },
]
```

Blocks hold content only. When something is done comes from `daily` and
`sessions`. A daily block's exercises split four ways (`dailyParts`): `perDay`
items run as passes, `target` items are goals, `ambient` items are marks, and
the rest run once a day. A short session is the starred work, or the first half
when fewer than two are starred, plus the first stretch. `test/data.test.js`
checks every block is used somewhere and every stretch name resolves.

Block keys and exercise names are storage identity (see below), as is a
session's `id`. The position blocks store names without the position word
(`Flexion with Dumbbell (3)` in `Standing`), because that is what the old
name-matching layout hashed.

## Planning

A session counts its size (1 for full, 0.5 for short) times the share of its
exercises checked off, so stopping early counts what was done and only
finishing everything earns the whole size. A week runs Monday to Sunday and
its credit resets on Monday. How long since a session was last done reads from
the whole history, so it carries across weeks.

`rankSessions` orders a day's sessions by the share of each weekly target
still open, then by how long since each was done. Strength rests the day after
strength earned credit, and once a day has `strengthPerDay` strength sessions.
A resting session drops out of the offer but can still be picked from the full
list. Past `sessionsPerDay`, Up next stops offering sessions.

`upNext` picks the one thing Today leads with, in order: finish an open
session, catch up a hand pass that is due (one by 11:00, two by 16:00), the top
session while the day has room, any pass left, the once-a-day work, rest. The
pass times are a habit cue rather than a rule. Only the next pass can be
started, and Up next leaves two hours after a pass before offering another,
however overdue it is, so they stay spread through the day. The Hand tab can
still start one early.

The screens call a pass a hand session, the word hand therapy uses, while the
code and storage keep `pass`, so `session` in the code always means a weekly
one. The picker's copy says shoulder or leg work, since hand work is not on it.

## State and persistence

Durable state goes through `usePersistentState`: dark mode, history, notes.
`ptTrackerHistory` is one map keyed by local date (`YYYY-MM-DD`):

```js
{ '2026-10-29': {
    daily: { [itemKey]: true },             // or a pass count for a perDay item
    lastPass: 1793577600000,                // when a pass item was last checked
    sessions: { [id]: { size, total, done: { [itemKey]: true }, finished } }
} }
```

`itemKey` is `${category}-${exerciseId}`, where `exerciseId` is a short hash of
the exercise name (FNV-1a, see `stats.js`). Keying off the name hash rather than
array position means reordering or inserting exercises keeps existing checks.
Renaming an exercise, its block, or a session's `id` drops its state, which is
an accepted trade. An entry records `total` when started, so its credit does
not shift when the program is revised. History older than ten weeks is pruned
on load.

`ptTrackerExerciseNotes` holds one note per exercise, keyed by `itemKey`, so a
note follows the exercise wherever it shows up. The first run of this model
folded the old per-weekday `ptTrackerNotes` into it, latest day winning. The
older keys (`ptTrackerCompleted`, `ptTrackerMoves`, `ptTrackerViewMode`) are no
longer read and are left in place.

Ephemeral or derived UI state stays in plain `useState` and is never persisted:
the tab, the day the week tab shows, the open run, and the player's card. This
rule has a scar behind it: section-collapse overrides used to be persisted, and
stale entries silently shadowed the intended behavior across reloads.

## Phones and desktop

The phone is what gets used mid-exercise with one hand busy, so the layout is
one job per screen.

- The tabs sit in a bar at the foot of the screen, and hide while a run is
  open. From `lg` up they move into the header and each tab lays out in two
  columns.
- A run takes the whole screen on a phone. The header stands aside, and the
  screen stays awake while the player is open, since a set outlasts the phone's
  timeout.
- The player shows one card at a time in a horizontal scroll-snap track. Mark
  done sits at the foot of the card, in thumb reach. A tap checks it and moves
  on after `ADVANCE_MS`, so a second tap cannot land on the next card. Swipes
  and the arrows move without checking. A swipe is read only after `SETTLE_MS` of quiet, because the smooth
  scroll an arrow starts fires scroll events on the way and reading one of
  those pulls the card back. From `lg` up the run is listed beside the card,
  the arrow keys step through it, and Space marks the card done.
- Off-screen cards are `inert`, so they stay mounted for the swipe but out of
  the tab order.
- Today shows the session picker outright from `lg` up. Layout that changes what
  is rendered goes through `useWide`, so the tests can set it with `width`.
- The free-running hold-timer bar shows from `lg` up only. On phones every
  prescribed hold starts from its own card.
- Small controls get a 44px hit area on touch screens from the `hit-44` class
  in `index.css`, which leaves their look alone. The element must be positioned.
- A double tap neither zooms nor selects text, and pinch still works. See
  `index.css`. With zoom off both taps reach the app, so anything that toggles
  on a tap goes through `useSingleTap`, or a double tap undoes itself.
- The note textarea is 16px. Anything smaller makes iOS Safari zoom on focus.

The tests cannot see any of this, since jsdom has no layout and no smooth
scrolling. Check card movement on a phone or in Chrome after touching the
player.

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
- History and notes are in localStorage, which the worker never touches.
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
button on its card and its row (`holdPlan` in `lib/duration.js`). That run uses the
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

Blue is the action and green is done. Block colors stay on small icons and
labels. Text sits on a surface, never directly on the wallpaper. The one loud
thing is the player's dose and Mark done, which have to read from across a room.
Headings and counts use `font-display` (SF Rounded on Apple devices, no font
file to ship).
