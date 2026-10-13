# ask_user Pi extension

A Pi tool that lets an agent ask the human a single multiple-choice question, with an optional custom answer, when a product choice is unresolved and would change user-visible behavior, scope, or rework. See [`AGENTS.md`](AGENTS.md) for the full input/result contract and the asking policy.

## Usage

```bash
# Run tests
npm install && npm test

# Load the extension in Pi
pi -e ./src/index.ts
# …or from another repo:
pi -e /Users/sepehr/.pi/agent/extensions/ask_user/src/index.ts
```

## Test coverage

Tests verify validation (empty fields, duplicate labels, wrong counts, reserved label); `select`/`input` dialog wiring; option selection; custom answer trimming; dismissal; empty/whitespace custom answers; unavailable UI; recommendation display without fallback; three-option support; aborted signals; and `undefined` signal handling.

## Demo prompts

- **Unresolved** (triggers `ask_user`): *"Add a snooze command to the midnite reminder."*
- **Fully specified** (proceed directly): *"Add /snooze that suppresses the reminder for 15 minutes, session-only, no persistence."*
