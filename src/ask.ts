export interface AskOption {
  label: string;
  tradeoff: string;
}

export interface AskParams {
  question: string;
  reason: string;
  options: AskOption[];
  recommendation?: string;
}

export interface AskUI {
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

export type Result =
  | { status: "answered"; source: "option"; answer: string }
  | { status: "answered"; source: "custom"; answer: string }
  | { status: "cancelled"; reason: "dismissed" | "empty_answer" }
  | { status: "unavailable" };

const RESERVED_LABEL = "Write my own answer…";

export async function askUser(
  params: AskParams,
  ui: AskUI,
  hasUI: boolean,
  signal: AbortSignal | undefined
): Promise<Result> {
  // Validate inputs first
  if (!params.question || params.question.trim() === "") {
    throw new Error("question is required and must be non-empty");
  }
  if (!params.reason || params.reason.trim() === "") {
    throw new Error("reason is required and must be non-empty");
  }
  if (!Array.isArray(params.options) || params.options.length < 2 || params.options.length > 3) {
    throw new Error("options must contain 2 or 3 items");
  }

  const seenLabels = new Set<string>();
  for (const opt of params.options) {
    if (!opt.label || opt.label.trim() === "") {
      throw new Error("option label is required and must be non-empty");
    }
    if (!opt.tradeoff || opt.tradeoff.trim() === "") {
      throw new Error("option tradeoff is required and must be non-empty");
    }
    const normalized = opt.label.trim().toLowerCase();
    if (normalized === RESERVED_LABEL.toLowerCase()) {
      throw new Error("option label is reserved: Write my own answer…");
    }
    if (seenLabels.has(normalized)) {
      throw new Error("duplicate option labels are not allowed");
    }
    seenLabels.add(normalized);
  }

  if (params.recommendation !== undefined) {
    const rec = params.recommendation.trim();
    const match = params.options.find(
      (o) => o.label.trim().toLowerCase() === rec.toLowerCase()
    );
    if (!match) {
      throw new Error("recommendation must match one of the option labels");
    }
  }

  if (!hasUI) {
    return { status: "unavailable" };
  }

  const entries: string[] = params.options.map((opt) => {
    const isRec =
      params.recommendation !== undefined &&
      opt.label.trim().toLowerCase() === params.recommendation.trim().toLowerCase();
    return `${opt.label} — ${opt.tradeoff}${isRec ? " (recommended)" : ""}`;
  });
  entries.push(RESERVED_LABEL);

  const title = `${params.question} — ${params.reason}`;

  try {
    const selected = await ui.select(title, entries, { signal });
    if (selected === undefined) {
      return { status: "cancelled", reason: "dismissed" };
    }

    const selectedIndex = entries.indexOf(selected);
    if (selectedIndex === -1) {
      return { status: "cancelled", reason: "dismissed" };
    }

    if (selectedIndex === entries.length - 1) {
      // Custom answer
      try {
        const custom = await ui.input(title, undefined, { signal });
        if (custom === undefined) {
          return { status: "cancelled", reason: "dismissed" };
        }
        const trimmed = custom.trim();
        if (trimmed === "") {
          return { status: "cancelled", reason: "empty_answer" };
        }
        return { status: "answered", source: "custom", answer: trimmed };
      } catch {
        return { status: "cancelled", reason: "dismissed" };
      }
    }

    return {
      status: "answered",
      source: "option",
      answer: params.options[selectedIndex].label,
    };
  } catch {
    return { status: "cancelled", reason: "dismissed" };
  }
}
