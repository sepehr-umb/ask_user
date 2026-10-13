# ask_user Pi extension

## Repository
- Repo root: this folder (`ask_user/`). Launch Pi and every herdr worker from here.
- Full local path: /Users/sepehr/.pi/agent/extensions/ask_user
- GitHub: https://github.com/sepehr-umb/ask_user
- Working branch: `w2-ask-user`. PR base: `main`.
- Pi version: 0.87.1
- Install dependencies: `npm install`
- Run tests: `npm test`
- Load the extension in Pi: `pi -e ./src/index.ts`

## Layout
- `AGENTS.md`: shared rules and the tool contract. You are reading it.
- `briefs/`: one brief per worker. Read only your own.
- `docs/`: asking policy, dependency plan, reflection. Written by the humans.
- `src/`: extension source.
- `tests/`: contract tests with a fake UI.

## Workers
- Implementer: follow `briefs/W2-2-implementer.md`. The only worker allowed to edit `src/` and `tests/`.
- Reviewer: follow `briefs/W2-3-reviewer.md`. Read-only. Return findings and proposed tests to the orchestrator.
- If you were not given a brief, do not edit anything. Ask the orchestrator.

## Rules for all agents
- Read the installed Pi extension guide and UI type declarations before relying on any API. Do not guess signatures.
- Do not run `git commit`, `git push`, or change branches. The humans commit.
- Do not edit `AGENTS.md`, `briefs/`, `docs/`, `.gitignore`, or anything in `.git/`.
- Do not add dependencies without approval from the orchestrator.
- If a decision changes behavior, scope, or rework and nothing here settles it, stop and report it. Do not invent an answer.
- Routine details like variable names and helper structure are yours to decide.

## Tool contract

### Input
- `question`: string, required, non-empty. One question only.
- `reason`: string, required, non-empty.
- `options`: 2 or 3 items, each `{ label: string, tradeoff: string }`. Labels non-empty and unique (case-insensitive, trimmed).
- `recommendation`: optional string. Must exactly match one option label.

Invalid input returns an error to the model and opens no dialog.

### Result (exactly one of)
- `{ status: "answered", source: "option", answer: <option label> }`
- `{ status: "answered", source: "custom", answer: <user text, trimmed> }`
- `{ status: "cancelled", reason: "dismissed" | "empty_answer" }`
- `{ status: "unavailable" }`

### Guarantees
- Never return `answered` without a real user response.
- Cancellation, an empty custom answer, and missing UI never fall back to the recommendation or any default.
- The model-facing text states the status and the answer verbatim. The structured result goes in the details.

## Asking policy
- Ask when the user left a product choice unresolved and it changes user-visible behavior, scope, or rework.
- Proceed when the user already specified the behavior, or for routine reversible details.
- One question at a time.
- On `cancelled` or `unavailable`, name the unresolved decision. Do not pick one.
- Examples and edge cases: `docs/asking-policy.md`.
- The copy the model follows at runtime is the tool description in `src/`. Keep the two in sync.