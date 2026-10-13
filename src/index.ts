import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@earendil-works/pi-ai";
import { askUser } from "./ask.js";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "ask_user",
    label: "Ask user",
    description:
      "Ask the user a single question with 2–3 options when a product choice is unresolved and it changes user-visible behavior, scope, or rework. Proceed without asking when the user already specified the behavior, or for routine reversible details.",
    promptGuidelines: [
      "Ask when the user left a choice unresolved and it changes user-visible behavior, scope, or rework.",
      "Proceed when the user already specified the behavior, or for routine reversible details.",
      "One question at a time.",
      "On cancelled or unavailable, name the unresolved decision. Do not pick one.",
    ],
    executionMode: "sequential",
    parameters: Type.Object({
      question: Type.String({ description: "One question only" }),
      reason: Type.String({ description: "Why this question is being asked" }),
      options: Type.Array(
        Type.Object({
          label: Type.String({ description: "Option label" }),
          tradeoff: Type.String({ description: "What the user gains and loses with this option" }),
        }),
        { minItems: 2, maxItems: 3, description: "2 or 3 options" }
      ),
      recommendation: Type.Optional(
        Type.String({ description: "Optional recommended option label" })
      ),
    }),
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const result = await askUser(params, ctx.ui, ctx.hasUI, signal);

      const text =
        result.status === "answered"
          ? `${result.status}: ${result.answer}`
          : "Do not pick an option; name the unresolved decision to the user.";

      return {
        content: [{ type: "text", text }],
        details: result,
      };
    },
  });
}
