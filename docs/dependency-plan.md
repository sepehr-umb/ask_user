# Dependency plan

## Task graph

```
W2-0 → W2-1 ─┬→ W2-2 ─┐
             └→ W2-3 ─┴→ W2-4 → W2-5
```

## Tasks

| Task | Description | Depends on | Owner | Allowed files | Completion evidence |
|---|---|---|---|---|---|
| **W2-0** | Agree tool contract and asking policy. | — | humans | `AGENTS.md`, `docs/` | Input and result shapes documented in `AGENTS.md`; `ask`/`proceed` examples in `docs/asking-policy.md`. |
| **W2-1** | Set up herdr orchestrator + two workers. Write `briefs/W2-2-implementer.md` and `briefs/W2-3-reviewer.md` with spec, repo path, task ID, depends_on, interfaces, allowed files, and expected evidence. Implementer writes failing contract tests with a fake UI covering: option selection, custom answer, dismissed select, dismissed input, empty/whitespace answer, unavailable UI, invalid input. | W2-0 | humans + orchestrator (briefs)<br>implementer (`tests/`) | `briefs/`, `tests/` | Briefs exist with task definitions. Failing test output shows missing behavior (not just a broken import). |
| **W2-2** | Register `ask_user`, validate input, show question/reason/options via `ctx.ui.select` and `ctx.ui.input`, map to the result contract. | W2-1 | implementer | `src/`, `tests/` | Contract tests pass. Real dialog works when loaded with `pi -e ./src/index.ts`. |
| **W2-3** | Derive cases and expected outcomes from the spec only (do not read `src/`). Cases: ambiguous labels, cancelled input, no UI, answer contradicting the recommendation, plus one genuinely unresolved prompt and one fully specified prompt. Run in parallel with W2-2. | W2-1 | reviewer | read-only (no edits) | Case list returned to orchestrator. |
| **W2-4** | Reviewer inspects the diff and runs tests; each defect needs a reproduction (failing test). Humans decide which findings affect requirements. Implementer fixes affected items. Tests rerun. | W2-2, W2-3 | reviewer (audit)<br>implementer (fixes)<br>humans (decide) | `src/`, `tests/` | Reproduced findings resolved; tests pass. |
| **W2-5** | Demo real selection, custom answer used in later work, cancellation, and the fully specified prompt with no `ask_user` call. Write README with load/test instructions. Reviewed PR. Write `docs/reflection.md` on one review finding and one asking-policy decision. | W2-4 | humans | `docs/` (reflection), `README` | Transcripts showing `ask_user` calls and results. PR link. |

## Rules
- Agents never edit `docs/`.

## Resolved contract questions (W2-0)

1. **How does the user choose a custom answer from `ctx.ui.select`?**
   - Decision: The last `select` entry is always `Write my own answer…`. Choosing it opens `ctx.ui.input`. See AGENTS.md "Tool contract → Dialog".

2. **`briefs/` is forbidden to all agents in `AGENTS.md`, but the orchestrator writes briefs in W2-1.**
   - Decision: The orchestrator may write `briefs/` during W2-1 only; workers never edit `briefs/`. Humans review and commit briefs before dispatch. See AGENTS.md "Rules for all agents".

3. **Precedence when input is invalid AND UI is unavailable.**
   - Decision: Validate input first. Invalid input throws an error and opens no dialog regardless of UI availability. Only after validation succeeds does the tool check `ctx.hasUI`. See AGENTS.md "Tool contract → Dialog".
