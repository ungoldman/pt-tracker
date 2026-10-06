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

A change is not done until `npm test`, `npm run coverage`, and `npm run build`
pass. Coverage is held at 100% on everything under `src/` except the entry
point, and a change that drops it needs tests in the same commit. The tests run
without a real browser, so anything visual, and anything touching the service
worker, still needs a look in the running app.

### The app, briefly

See `AGENTS.md` for the architecture and the notes on state keying and audio.
The one rule worth repeating: do not persist ephemeral UI state to localStorage.
Durable data (completion, notes, preferences) persists. Derived or momentary
state stays in memory.
