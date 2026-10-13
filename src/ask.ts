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

export async function askUser(
  params: AskParams,
  ui: AskUI,
  hasUI: boolean,
  signal: AbortSignal | undefined
): Promise<Result> {
  throw new Error("not implemented");
}
