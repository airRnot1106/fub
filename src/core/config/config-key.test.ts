import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { ConfigKey } from "./config-key.ts";

Deno.test("ConfigKey - should create valid config key", () => {
  const result = ConfigKey.create("fuzzy.command");

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.value, "fuzzy.command");
    assertEquals(result.value.toString(), "fuzzy.command");
  }
});

Deno.test("ConfigKey - should reject empty string", () => {
  const result = ConfigKey.create("");

  assertEquals(Result.isFailure(result), true);
  if (Result.isFailure(result)) {
    assertEquals(result.error.message.includes("empty"), true);
  }
});

Deno.test("ConfigKey - should reject whitespace-only string", () => {
  const result = ConfigKey.create("   ");

  assertEquals(Result.isFailure(result), true);
});

Deno.test("ConfigKey - should accept dotted notation", () => {
  const validKeys = [
    "fuzzy.command",
    "fuzzy.args",
    "browser.command",
    "editor.command",
  ];

  validKeys.forEach((key) => {
    const result = ConfigKey.create(key);
    assertEquals(Result.isSuccess(result), true);
  });
});

Deno.test("ConfigKey - should reject invalid formats", () => {
  const invalidKeys = [
    "fuzzy..command", // double dots
    ".fuzzy.command", // leading dot
    "fuzzy.command.", // trailing dot
    "fuzzy.comm@nd", // special characters
    "fuzzy.comm and", // spaces
  ];

  invalidKeys.forEach((key) => {
    const result = ConfigKey.create(key);
    assertEquals(Result.isFailure(result), true);
  });
});

Deno.test("ConfigKey - equals method should work correctly", () => {
  const key1Result = ConfigKey.create("fuzzy.command");
  const key2Result = ConfigKey.create("fuzzy.command");
  const key3Result = ConfigKey.create("fuzzy.args");

  if (
    Result.isSuccess(key1Result) && Result.isSuccess(key2Result) &&
    Result.isSuccess(key3Result)
  ) {
    assertEquals(key1Result.value.equals(key2Result.value), true);
    assertEquals(key1Result.value.equals(key3Result.value), false);
  }
});

Deno.test("ConfigKey - property-based test for valid keys", () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) =>
          /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)
        ),
        { minLength: 1, maxLength: 5 },
      ),
      (segments) => {
        const keyString = segments.join(".");
        const result = ConfigKey.create(keyString);
        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          assertEquals(result.value.value, keyString);
        }
      },
    ),
    { numRuns: 100 },
  );
});
