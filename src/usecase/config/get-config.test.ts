import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { GetConfig } from "./get-config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import { generators, testConfig } from "../../core/config/mocks.ts";
import type { ConfigRepository } from "../../core/config/config.ts";

// Simple mock repository for testing
function createSimpleMockRepository(
  mockGet: (key: ConfigKey) => Result.ResultAsync<string | null, Error>,
): ConfigRepository {
  return {
    get: mockGet,
    set: () => Promise.resolve(Result.succeed(undefined)),
    remove: () => Promise.resolve(Result.succeed(undefined)),
    getAll: () => Promise.resolve(Result.succeed({})),
  };
}

Deno.test("GetConfig - should get config value successfully", async () => {
  const key = "fuzzy.command";
  const expectedValue = "fzf";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.succeed(expectedValue)),
  );

  const usecase = new GetConfig(repository);
  const result = await usecase.execute(key);

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value, expectedValue);
  }
});

Deno.test("GetConfig - should return null when config does not exist", async () => {
  const key = "nonexistent.key";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.succeed(null)),
  );

  const usecase = new GetConfig(repository);
  const result = await usecase.execute(key);

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value, null);
  }
});

Deno.test("GetConfig - should fail with invalid config key", async () => {
  const invalidKey = "invalid..key";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.succeed("never-called")),
  );

  const usecase = new GetConfig(repository);
  const result = await usecase.execute(invalidKey);

  assertEquals(Result.isFailure(result), true);
});

Deno.test("GetConfig - should handle repository failure", async () => {
  const key = "fuzzy.command";
  const errorMessage = "Database connection failed";

  const repository = createSimpleMockRepository(
    () => Promise.resolve(Result.fail(new Error(errorMessage))),
  );

  const usecase = new GetConfig(repository);
  const result = await usecase.execute(key);

  assertEquals(Result.isFailure(result), true);
  if (Result.isFailure(result)) {
    assertEquals(result.error.message, errorMessage);
  }
});

Deno.test("GetConfig - property-based test for valid keys", () => {
  fc.assert(
    fc.asyncProperty(
      generators.validConfigKey(),
      async (key) => {
        const repository = createSimpleMockRepository(
          () => Promise.resolve(Result.succeed("test-value")),
        );

        const usecase = new GetConfig(repository);
        const result = await usecase.execute(key);

        assertEquals(Result.isSuccess(result), true);
      },
    ),
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("GetConfig - property-based test for invalid keys", () => {
  fc.assert(
    fc.asyncProperty(
      generators.invalidConfigKey(),
      async (key) => {
        const repository = createSimpleMockRepository(
          () => Promise.resolve(Result.succeed("never-called")),
        );

        const usecase = new GetConfig(repository);
        const result = await usecase.execute(key);

        assertEquals(Result.isFailure(result), true);
      },
    ),
    { numRuns: testConfig.numRuns.invalid },
  );
});
