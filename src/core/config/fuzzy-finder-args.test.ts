import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { FuzzyFinderArgs } from "./fuzzy-finder-args.ts";

Deno.test("FuzzyFinderArgs - should create valid args", () => {
  const result = FuzzyFinderArgs.create("--height 40%");

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.value, "--height 40%");
    assertEquals(result.value.toString(), "--height 40%");
  }
});

Deno.test("FuzzyFinderArgs - should accept empty string", () => {
  const result = FuzzyFinderArgs.create("");

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.value, "");
  }
});

Deno.test("FuzzyFinderArgs - should accept whitespace-only string", () => {
  const result = FuzzyFinderArgs.create("   ");

  assertEquals(Result.isSuccess(result), true);
});

Deno.test("FuzzyFinderArgs - should accept common fzf arguments", () => {
  const validArgs = [
    "--height 40%",
    "--reverse",
    "--border",
    "--preview 'cat {}'",
    "--bind 'ctrl-d:preview-page-down'",
    "--multi",
    "--no-sort",
  ];

  validArgs.forEach((args) => {
    const result = FuzzyFinderArgs.create(args);
    assertEquals(Result.isSuccess(result), true);
  });
});

Deno.test("FuzzyFinderArgs - should reject dangerous arguments", () => {
  const dangerousArgs = [
    "--preview 'rm -rf /'",
    "--bind 'ctrl-d:execute(rm {})'",
    "; rm -rf /",
    "$(rm -rf /)",
    "&& malicious_command",
  ];

  dangerousArgs.forEach((args) => {
    const result = FuzzyFinderArgs.create(args);
    assertEquals(Result.isFailure(result), true);
  });
});

Deno.test("FuzzyFinderArgs - equals method should work correctly", () => {
  const args1Result = FuzzyFinderArgs.create("--height 40%");
  const args2Result = FuzzyFinderArgs.create("--height 40%");
  const args3Result = FuzzyFinderArgs.create("--reverse");

  if (
    Result.isSuccess(args1Result) && Result.isSuccess(args2Result) &&
    Result.isSuccess(args3Result)
  ) {
    assertEquals(args1Result.value.equals(args2Result.value), true);
    assertEquals(args1Result.value.equals(args3Result.value), false);
  }
});

Deno.test("FuzzyFinderArgs - property-based test for safe args", () => {
  fc.assert(
    fc.property(
      fc.string({ maxLength: 100 }).filter((s) =>
        !s.includes(";") &&
        !s.includes("$(") &&
        !s.includes("&&") &&
        !s.includes("||") &&
        !s.includes("rm ") &&
        !s.includes("execute(")
      ),
      (args) => {
        const result = FuzzyFinderArgs.create(args);
        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          assertEquals(result.value.value, args);
        }
      },
    ),
    { numRuns: 100 },
  );
});
