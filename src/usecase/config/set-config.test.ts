import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { SetConfig } from "./set-config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import { generators, testConfig } from "../../core/config/mocks.ts";
import type { ConfigRepository } from "../../core/config/config.ts";

// Simple mock repository for testing
function createSimpleMockRepository(
  mockSet: (key: ConfigKey, value: string) => Result.ResultAsync<void, Error>,
): ConfigRepository {
  return {
    get: () => Promise.resolve(Result.succeed(null)),
    set: mockSet,
    remove: () => Promise.resolve(Result.succeed(undefined)),
    getAll: () => Promise.resolve(Result.succeed({})),
  };
}

Deno.test("SetConfig - should set config value successfully", async () => {
  const key = "fuzzy.command";
  const value = "fzf";

  let capturedKey: string | null = null;
  let capturedValue: string | null = null;

  const repository = createSimpleMockRepository(
    (k, v) => {
      capturedKey = k.value;
      capturedValue = v;
      return Promise.resolve(Result.succeed(undefined));
    },
  );

  const usecase = new SetConfig(repository);
  const result = await usecase.execute(key, value);

  assertEquals(Result.isSuccess(result), true);
  assertEquals(capturedKey, key);
  assertEquals(capturedValue, value);
});

Deno.test("SetConfig - should fail with invalid config key", async () => {
  const invalidKey = "invalid..key";
  const value = "test-value";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.succeed(undefined)),
  );

  const usecase = new SetConfig(repository);
  const result = await usecase.execute(invalidKey, value);

  assertEquals(Result.isFailure(result), true);
});

Deno.test("SetConfig - should fail with empty value", async () => {
  const key = "fuzzy.command";
  const emptyValue = "";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.succeed(undefined)),
  );

  const usecase = new SetConfig(repository);
  const result = await usecase.execute(key, emptyValue);

  assertEquals(Result.isFailure(result), true);
});

Deno.test("SetConfig - should fail with whitespace-only value", async () => {
  const key = "fuzzy.command";
  const whitespaceValue = "   ";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.succeed(undefined)),
  );

  const usecase = new SetConfig(repository);
  const result = await usecase.execute(key, whitespaceValue);

  assertEquals(Result.isFailure(result), true);
});

Deno.test("SetConfig - should handle repository failure", async () => {
  const key = "fuzzy.command";
  const value = "fzf";
  const errorMessage = "Database connection failed";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.fail(new Error(errorMessage))),
  );

  const usecase = new SetConfig(repository);
  const result = await usecase.execute(key, value);

  assertEquals(Result.isFailure(result), true);
  if (Result.isFailure(result)) {
    assertEquals(result.error.message, errorMessage);
  }
});

Deno.test("SetConfig - property-based test for valid keys and values", () => {
  fc.assert(
    fc.asyncProperty(
      generators.validConfigKey(),
      fc.string({ minLength: 1, maxLength: 100 }).filter((s) =>
        s.trim().length > 0
      ),
      async (key, value) => {
        const repository = createSimpleMockRepository(
          () => Promise.resolve(Result.succeed(undefined)),
        );

        const usecase = new SetConfig(repository);
        const result = await usecase.execute(key, value);

        assertEquals(Result.isSuccess(result), true);
      },
    ),
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("SetConfig - property-based test for invalid keys", () => {
  fc.assert(
    fc.asyncProperty(
      generators.invalidConfigKey(),
      fc.string({ minLength: 1, maxLength: 100 }),
      async (key, value) => {
        const repository = createSimpleMockRepository(
          () => Promise.resolve(Result.succeed(undefined)),
        );

        const usecase = new SetConfig(repository);
        const result = await usecase.execute(key, value);

        assertEquals(Result.isFailure(result), true);
      },
    ),
    { numRuns: testConfig.numRuns.invalid },
  );
});
