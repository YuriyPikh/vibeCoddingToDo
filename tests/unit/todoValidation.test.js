const { TITLE_LIMIT, validateTitle } = require("../../src/validation/todoValidation");

describe("validateTitle", () => {
  it("normalizes whitespace for a valid title", () => {
    expect(validateTitle("  finish   lab   draft  ")).toEqual({
      isValid: true,
      value: "finish lab draft",
    });
  });

  it("rejects empty or whitespace-only values", () => {
    expect(validateTitle("   ")).toEqual({
      isValid: false,
      message: "Enter a task before adding it.",
    });
  });

  it("rejects values longer than the allowed title length", () => {
    expect(validateTitle("a".repeat(TITLE_LIMIT + 1))).toEqual({
      isValid: false,
      message: `Keep the task under ${TITLE_LIMIT} characters.`,
    });
  });
});
