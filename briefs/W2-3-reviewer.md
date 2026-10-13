# Brief: Reviewer — ask_user Pi extension

## Identity
- **Role:** Reviewer
- **Repository:** /Users/sepehr/.pi/agent/extensions/ask_user
- **Branch:** `w2-ask-user`
- **Herdr pane label:** `reviewer`

## Task sequence
| Phase | ID | Depends on | Description |
|---|---|---|---|
| Phase A | **W2-3** | W2-1 | Derive cases and expected outcomes from `AGENTS.md` and `docs/` **only**. Do **not** read `src/` or `tests/`. Return a numbered case list with inputs, user actions, and exact expected `Result`s. |
| Phase B | **W2-4** | W2-2 + W2-3 (orchestrator says “go”) | Read the diff, run `npm test`, compare against your case list. Each finding needs a reproduction: a proposed failing test (as code in your message). Return findings to the orchestrator. Never edit files. |

## Ownership
**Read-only.** You may edit **nothing**. Do not create, delete, or modify files.

## Phase A (W2-3) — Independent case derivation
Read **only** `AGENTS.md` and `docs/asking-policy.md` / `docs/dependency-plan.md`. Do **not** open `src/` or `tests/`.

Return a **numbered list** with the following cases. For each, specify:
- Input (`question`, `reason`, `options`, `recommendation` if relevant).
- User action (which option chosen, custom text typed, dismissal, etc.).
- **Exact expected `Result`** per the contract in AGENTS.md.

Required cases:

1. **Ambiguous / near-duplicate labels** — e.g. options with labels that differ only in case or trimming. Because the contract says labels must be unique case-insensitively, this input is invalid and must throw without opening a dialog.
2. **Cancelled input** — user chooses `"Write my own answer…"` and then dismisses the input prompt. Expected: `{ status: "cancelled", reason: "dismissed" }`.
3. **No UI** — `hasUI` is `false` with otherwise valid input. Expected: `{ status: "unavailable" }`; no dialog opened.
4. **Answer contradicting recommendation** — the select list shows one option with `(recommended)`, but the user picks a *different* option. Expected: `{ status: "answered", source: "option", answer: <chosen bare label> }` (not the recommended one).
5. **Abort** — an already-aborted `AbortSignal` is passed. Expected: `{ status: "cancelled", reason: "dismissed" }` regardless of whether the underlying dialog resolves `undefined` or rejects.
6. **Genuinely unresolved prompt** (for live demo) — a user prompt that leaves a product choice open and changes user-visible behavior or scope. State:
   - The exact prompt text.
   - Why it triggers `ask_user` (what is unresolved).
   - The expected `question`, `reason`, and options the agent should use.
7. **Fully specified prompt** (for live demo) — a user prompt that already specifies the behavior or delegates the choice. State:
   - The exact prompt text.
   - Why the agent should **proceed** without calling `ask_user`.
   - What work continues instead.

On `cancelled` or `unavailable`, note that the agent must name the unresolved decision and not pick one, per `docs/asking-policy.md`.

## Phase B (W2-4) — Diff audit
Wait for the orchestrator to say “go”.

1. Read the implementation diff (e.g. `git diff`, or ask the orchestrator for the diff).
2. Run `npm test` in the repo.
3. Compare behavior against your W2-3 case list.
4. For every finding (behavior mismatch, missing edge case, wrong error type, etc.) provide:
   - A clear description of the defect.
   - A **reproduction**: a proposed failing test written as code that you would add to `tests/ask.test.ts`.
5. Return all findings to the orchestrator. Do **not** edit any file yourself.

## Constraints
- **Read-only.** Do not edit any file.
- Do not open `src/` or `tests/` during W2-3.
- Do not run `git commit`, `git push`, or change branches.
- Report any unresolved decision or scope change to the orchestrator instead of inventing an answer.
