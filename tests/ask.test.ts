import { describe, it, expect } from "vitest";
import { askUser, type AskParams, type AskUI } from "../src/ask.js";

class FakeUI implements AskUI {
  calls: Array<{
    method: "select" | "input";
    args: unknown[];
  }> = [];

  private selectReturn?: string | undefined;
  private inputReturn?: string | undefined;
  private rejectOnAborted = false;

  setSelectResult(value: string | undefined) {
    this.selectReturn = value;
  }
  setInputResult(value: string | undefined) {
    this.inputReturn = value;
  }
  setRejectOnAborted(value: boolean) {
    this.rejectOnAborted = value;
  }

  async select(
    title: string,
    options: string[],
    opts?: { signal?: AbortSignal }
  ): Promise<string | undefined> {
    this.calls.push({ method: "select", args: [title, options, opts] });
    if (this.rejectOnAborted && opts?.signal?.aborted) {
      throw new Error("aborted");
    }
    return this.selectReturn;
  }

  async input(
    title: string,
    placeholder?: string,
    opts?: { signal?: AbortSignal }
  ): Promise<string | undefined> {
    this.calls.push({ method: "input", args: [title, placeholder, opts] });
    if (this.rejectOnAborted && opts?.signal?.aborted) {
      throw new Error("aborted");
    }
    return this.inputReturn;
  }
}

const validParams: AskParams = {
  question: "What color?",
  reason: "Need to know your preference.",
  options: [
    { label: "Red", tradeoff: "Bold but risky" },
    { label: "Blue", tradeoff: "Calm but common" },
  ],
};

describe("askUser", () => {
  // 1. Option selected
  it("returns answered with option source when user picks an option", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Red — Bold but risky");
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({
      status: "answered",
      source: "option",
      answer: "Red",
    });
    expect(ui.calls.length).toBe(1);
    expect(ui.calls[0].method).toBe("select");
  });

  // 2. Recommendation present, user ignores it
  it("returns the chosen bare label even when recommendation is present", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Blue — Calm but common");
    const result = await askUser(
      { ...validParams, recommendation: "Red" },
      ui,
      true,
      undefined
    );
    expect(result).toEqual({
      status: "answered",
      source: "option",
      answer: "Blue",
    });
    const selectCall = ui.calls.find((c) => c.method === "select")!;
    const entries = selectCall.args[1] as string[];
    expect(entries[0]).toBe("Red — Bold but risky (recommended)");
    expect(entries[1]).toBe("Blue — Calm but common");
  });

  // 3. Custom answer trimmed
  it("trims custom answer and returns it with custom source", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Write my own answer…");
    ui.setInputResult("  hello world  ");
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({
      status: "answered",
      source: "custom",
      answer: "hello world",
    });
    expect(ui.calls.some((c) => c.method === "input")).toBe(true);
  });

  // 4. Select dismissed
  it("returns cancelled dismissed when select resolves undefined", async () => {
    const ui = new FakeUI();
    ui.setSelectResult(undefined);
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({ status: "cancelled", reason: "dismissed" });
  });

  // 5. Input dismissed
  it("returns cancelled dismissed when input resolves undefined", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Write my own answer…");
    ui.setInputResult(undefined);
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({ status: "cancelled", reason: "dismissed" });
  });

  // 6. Empty custom answer
  it("returns cancelled empty_answer when custom input is empty string", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Write my own answer…");
    ui.setInputResult("");
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({ status: "cancelled", reason: "empty_answer" });
  });

  // 7. Whitespace-only custom answer
  it("returns cancelled empty_answer when custom input is whitespace only", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Write my own answer…");
    ui.setInputResult("   ");
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({ status: "cancelled", reason: "empty_answer" });
  });

  // 8. No UI available
  it("returns unavailable when hasUI is false and does not call UI", async () => {
    const ui = new FakeUI();
    const result = await askUser(validParams, ui, false, undefined);
    expect(result).toEqual({ status: "unavailable" });
    expect(ui.calls.length).toBe(0);
  });

  // 9. Three valid options accepted
  it("accepts three options and opens dialog normally", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Green — Fresh but loud");
    const params: AskParams = {
      question: "Pick one",
      reason: "Testing three options",
      options: [
        { label: "Red", tradeoff: "Bold" },
        { label: "Blue", tradeoff: "Calm" },
        { label: "Green", tradeoff: "Fresh but loud" },
      ],
    };
    const result = await askUser(params, ui, true, undefined);
    expect(result).toEqual({
      status: "answered",
      source: "option",
      answer: "Green",
    });
    expect(ui.calls.length).toBe(1);
  });

  // 10. Dialog content
  it("passes correct title and entries to select", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Red — Bold but risky (recommended)");
    const params: AskParams = {
      question: "What theme?",
      reason: "Determines appearance.",
      options: [
        { label: "Dark", tradeoff: "Easy on eyes" },
        { label: "Light", tradeoff: "Better in sun" },
      ],
      recommendation: "Dark",
    };
    await askUser(params, ui, true, undefined);
    const selectCall = ui.calls.find((c) => c.method === "select")!;
    const title = selectCall.args[0] as string;
    const entries = selectCall.args[1] as string[];
    expect(title).toContain("What theme?");
    expect(title).toContain("Determines appearance.");
    expect(entries).toEqual([
      "Dark — Easy on eyes (recommended)",
      "Light — Better in sun",
      "Write my own answer…",
    ]);
  });

  // 11. Recommendation never used as fallback
  it("does not fall back to recommendation when select is dismissed", async () => {
    const ui = new FakeUI();
    ui.setSelectResult(undefined);
    const result = await askUser(
      { ...validParams, recommendation: "Red" },
      ui,
      true,
      undefined
    );
    expect(result).toEqual({ status: "cancelled", reason: "dismissed" });
  });

  it("does not fall back to recommendation when custom answer is empty", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Write my own answer…");
    ui.setInputResult("");
    const result = await askUser(
      { ...validParams, recommendation: "Red" },
      ui,
      true,
      undefined
    );
    expect(result).toEqual({ status: "cancelled", reason: "empty_answer" });
  });

  // 12. Invalid inputs throw and open no dialog
  describe("invalid inputs throw validation error and open no dialog", () => {
    it("throws for exactly 1 option", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "Q",
        reason: "R",
        options: [{ label: "A", tradeoff: "B" }],
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /option/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("throws for exactly 4 options", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "Q",
        reason: "R",
        options: [
          { label: "A", tradeoff: "B" },
          { label: "C", tradeoff: "D" },
          { label: "E", tradeoff: "F" },
          { label: "G", tradeoff: "H" },
        ],
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /option/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("throws for duplicate labels (case-insensitive)", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "Q",
        reason: "R",
        options: [
          { label: "Red", tradeoff: "B" },
          { label: "red", tradeoff: "D" },
        ],
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /duplicate/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("throws for empty question", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "",
        reason: "R",
        options: [
          { label: "A", tradeoff: "B" },
          { label: "C", tradeoff: "D" },
        ],
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /question/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("throws for empty reason", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "Q",
        reason: "",
        options: [
          { label: "A", tradeoff: "B" },
          { label: "C", tradeoff: "D" },
        ],
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /reason/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("throws for recommendation that does not match any option label", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "Q",
        reason: "R",
        options: [
          { label: "A", tradeoff: "B" },
          { label: "C", tradeoff: "D" },
        ],
        recommendation: "Z",
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /recommendation/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("throws for option label equal to Write my own answer… (case-insensitive)", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "Q",
        reason: "R",
        options: [
          { label: "Write my own answer…", tradeoff: "B" },
          { label: "C", tradeoff: "D" },
        ],
      };
      await expect(askUser(params, ui, false, undefined)).rejects.toThrow(
        /reserved|Write my own answer/i
      );
      expect(ui.calls.length).toBe(0);
    });

    it("error message does not say not implemented", async () => {
      const ui = new FakeUI();
      const params: AskParams = {
        question: "",
        reason: "R",
        options: [
          { label: "A", tradeoff: "B" },
          { label: "C", tradeoff: "D" },
        ],
      };
      try {
        await askUser(params, ui, false, undefined);
        expect.fail("should have thrown");
      } catch (err: any) {
        expect(err.message).not.toMatch(/not implemented/i);
      }
    });
  });

  // 13. Aborted signal
  it("returns cancelled dismissed when signal is already aborted", async () => {
    const ui = new FakeUI();
    ui.setRejectOnAborted(true);
    const controller = new AbortController();
    controller.abort();
    const result = await askUser(validParams, ui, true, controller.signal);
    expect(result).toEqual({ status: "cancelled", reason: "dismissed" });
  });

  // 14. No signal passed still works
  it("works with signal undefined", async () => {
    const ui = new FakeUI();
    ui.setSelectResult("Red — Bold but risky");
    const result = await askUser(validParams, ui, true, undefined);
    expect(result).toEqual({
      status: "answered",
      source: "option",
      answer: "Red",
    });
    const selectCall = ui.calls.find((c) => c.method === "select")!;
    const opts = selectCall.args[2] as { signal?: AbortSignal } | undefined;
    // signal may be undefined or explicitly passed as undefined
    expect(opts?.signal).toBeUndefined();
  });
});
