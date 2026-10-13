# Brief: Implementer — ask_user Pi extension

## Identity
- **Role:** Implementer
- **Repository:** /Users/sepehr/.pi/agent/extensions/ask_user
- **Branch:** `w2-ask-user`
- **Herdr pane label:** `implementer`

## Task sequence
| Phase | ID | Depends on | Description |
|---|---|---|---|
| Phase A | **W2-1** | W2-0 (contract agreed by humans) | Write contract tests with a fake UI and a minimal `src/ask.ts` stub. Run `npm test`, then **STOP** and report the failing output to the orchestrator. |
| Phase B | **W2-2** | W2-1 (orchestrator says “go”) | Make the tests pass and add the Pi registration in `src/index.ts`. Report diff summary and test output. |

## Ownership
You may edit **only** `src/` and `tests/`. Do not edit anything else.

## Interfaces

### `src/ask.ts` (pure module — no Pi imports)
Export a single async function:

```ts
export async function askUser(
  params: AskParams,
  ui: AskUI,
  hasUI: boolean,
  signal: AbortSignal | undefined
): Promise<Result>
```

- `AskParams` contains: `question` (string), `reason` (string), `options` (array of `{ label: string; tradeoff: string }`), and optional `recommendation` (string).
- `AskUI` is an interface structurally compatible with Pi's `ctx.ui`:
  ```ts
  interface AskUI {
    select(
      title: string,
      options: string[],
      opts?: { signal?: AbortSignal }
    ): Promise<string | undefined>;
    input(
      title: string,
      placeholder?: string,
      opts?: { signal?: AbortSignal }
    ): Promise<string | undefined>;
  }
  ```
  The tests supply a fake implementation that records calls.
- Returns exactly one of the contract `Result` shapes from AGENTS.md.

### `src/index.ts` (Pi registration)
- Import `type { ExtensionAPI } from "@earendil-works/pi-coding-agent"`.
- Import `{ Type } from "@earendil-works/pi-ai"`.
- Register `ask_user` with `pi.registerTool`.
  - `executionMode`: `"sequential"`.
  - Schema via TypeBox (`Type.Object(...)`).
  - `description` / `promptGuidelines` must match the asking-policy copy in `docs/asking-policy.md`.
  - Model-facing text states the `status` and the verbatim `answer`.
  - Structured `Result` goes into `details`.
- Delegate dialog logic to the function exported by `src/ask.ts`.

## Phase A (W2-1) — Tests and stub

### 1. Write `tests/ask.test.ts`
Use **Vitest** (already installed). Create a fake `AskUI` object that records every call to `select` and `input` so assertions can inspect:
- what title was shown,
- what entries were passed,
- which signal was forwarded,
- whether the call resolved to a given string / `undefined` / threw.

Cover **all** of the following cases. For each, assert the exact `Result` shape and, when relevant, the recorded UI calls.

1. **Option selected** — user picks an option → `{ status: "answered", source: "option", answer: <bare label> }`.
2. **Recommendation present, user ignores it** — recommended option is suffixed `(recommended)` in the select entries, but the user picks a different option; the answer is still the bare label of the chosen option.
3. **Custom answer trimmed** — user chooses `"Write my own answer…"`, then types `"  hello world  "` → `{ status: "answered", source: "custom", answer: "hello world" }`.
4. **Select dismissed** — `select` resolves `undefined` → `{ status: "cancelled", reason: "dismissed" }`.
5. **Input dismissed** — user chooses `"Write my own answer…"`, then `input` resolves `undefined` → `{ status: "cancelled", reason: "dismissed" }`.
6. **Empty custom answer** — custom input is `""` → `{ status: "cancelled", reason: "empty_answer" }`.
7. **Whitespace-only custom answer** — custom input is `"   "` → `{ status: "cancelled", reason: "empty_answer" }`.
8. **No UI available** — `hasUI` is `false` → `{ status: "unavailable" }`; no dialog call is made.
9. **Three valid options accepted** — input with three options passes validation and opens the dialog normally.
10. **Dialog content** — assert the `select` title contains both the `question` and the `reason`; assert the `select` entries are exactly `["<label> — <tradeoff>" per option in order, recommended one suffixed " (recommended)", then "Write my own answer…" last]`.
11. **Recommendation never used as fallback** —
    - recommendation set, `select` dismissed → `{ status: "cancelled", reason: "dismissed" }`;
    - recommendation set, custom answer empty → `{ status: "cancelled", reason: "empty_answer" }`.
12. **Invalid inputs throw a validation error and open no dialog** (even when `hasUI` is `false`):
    - exactly 1 option,
    - exactly 4 options,
    - duplicate labels (case-insensitive),
    - empty `question`,
    - empty `reason`,
    - `recommendation` that does not match any option `label`,
    - an option `label` equal to `"Write my own answer…"` (case-insensitive, trimmed).
    For each, assert that the function **throws** (error, not a resolved Result) and that no UI method was invoked. Require the thrown error message to name the specific problem (e.g. matching `/option/i`, `/duplicate/i`, `/question/i`, `/reason/i`, `/recommendation/i`, or `/reserved|Write my own answer/i`) and require the message **not** to match `/not implemented/i`. Because the Phase A stub throws `"not implemented"`, these invalid-input tests **must fail** against the stub.
13. **Aborted signal** — pass an already-aborted `AbortSignal`. The dialog call may either resolve `undefined` or reject. Either way, the result must be `{ status: "cancelled", reason: "dismissed" }`.
14. **No signal passed still works** — call `askUser` with `signal: undefined`. Valid input and normal user selection should still resolve correctly.

### 2. Create `src/ask.ts` stub
Export the `askUser` function with the correct signature. The body should `throw new Error("not implemented")`. This ensures test failures show **missing behavior**, not a broken import.

### 3. Run tests and stop
Run `npm test`. Capture the output. **Do not proceed to Phase B.** Return the failing test output to the orchestrator.

## Phase B (W2-2) — Implementation
Wait for the orchestrator to say “go”.

1. Implement `src/ask.ts` so every test passes:
   - Validate inputs first (invalid → throw, no UI call).
   - If `hasUI` is `false`, return `{ status: "unavailable" }`.
   - Build `select` entries: `<label> — <tradeoff>` for each option, with the recommended one suffixed ` (recommended)`.
   - Map the selected entry back by **index** in the entries list, never by parsing display text.
   - If the last entry (`"Write my own answer…"`) is chosen, open `input`.
   - Trim custom answer; empty/whitespace → `{ status: "cancelled", reason: "empty_answer" }`.
   - Forward the `AbortSignal` (which may be `undefined`) to both `select` and `input`; handle abort as cancelled/dismissed.
   - Never fall back to the recommendation or any default.

2. Add `src/index.ts`:
   - Register the tool with TypeBox schema, `executionMode: "sequential"`, and description / promptGuidelines matching `docs/asking-policy.md`.
   - Call the pure `askUser` function with the runtime `ctx.ui`, `ctx.hasUI`, and the tool’s `AbortSignal`.

3. Run `npm test`. Return:
   - A concise diff summary (`git diff --stat` or description of what changed).
   - The full passing test output.

## Constraints
- Do **not** open or copy `examples/extensions/question.ts` or `examples/extensions/questionnaire.ts`.
- Do **not** add dependencies without explicit orchestrator approval.
- Do **not** edit `AGENTS.md`, `docs/`, `.gitignore`, `.git/`, or `briefs/`.
- Report any unresolved decision or scope change to the orchestrator instead of inventing an answer.
