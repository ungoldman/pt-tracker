# Contributing

pt-tracker is a personal project I maintain for my own use. You are welcome to
read the code, fork it, or open an issue if something looks broken, but I am not
soliciting feature contributions. These guidelines exist mostly so that an agent
(or future me) works in the grain of the codebase.

## Code of conduct

Be decent. This project follows the
[Contributor Covenant](https://www.contributor-covenant.org).

## Coding guidelines

### Commits

Atomic commits, one logical change each. Conventional-commit subjects in
`<topic>: <action>` form, 50 characters max, imperative mood. Add a body only
for what the subject and the diff cannot convey, wrapped at 72. Breaking changes
are discouraged. When one is unavoidable, add a `BREAKING CHANGE:` footer with
the migration in plain terms.

Never add AI attribution. No `Co-authored-by` trailer, no "generated with" line.
Git history is not an ad slot.

### Comments

Comments explain why, not what, and match the density of the surrounding file.
The existing ones carry real intent (why isometrics avoid strength days, why a
collapse override clears on completion). Hold that bar.

### Verification

There is no test suite. A change is not done until `npm run lint` and
`npm run build` pass and the behavior is confirmed in the running app. A missed
prop or a stale hook dependency passes the build and breaks at runtime, so
changes to state, section collapse, or the hold timer need a real look in the
browser, not just a green build.

### The app, briefly

See `AGENTS.md` for the architecture and the notes on state keying and audio.
The one rule worth repeating: do not persist ephemeral UI state to localStorage.
Durable data (completion, notes, preferences) persists. Derived or momentary
state stays in memory.
