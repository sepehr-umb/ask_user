# Asking policy

## Rule
Ask when the user left a choice unresolved and it changes user-visible behavior, scope, or rework.
Proceed when the user specified the behavior, or the detail is routine and reversible.

## Examples

| Prompt | Decision | Why |
|---|---|---|
| "Keep reminder state only for this session." | Proceed | Persistence is specified. |
| "Add a reminder that survives restarts." | Proceed | Persistence is specified. |
| "Add a reminder feature." | Ask | Persistence is unresolved and changes behavior after restart. |
| "Make reminders persist or not, as you think best." | [ ] | [ ] |
| "Name the state variable whatever you want." | Proceed | Routine and reversible. |

## Unanswered questions
On `cancelled` or `unavailable`, the agent names the decision and does not pick one.
It continues only with work that does not depend on the answer.

## Demo prompts
- Unresolved: [ ]
- Fully specified: [ ]