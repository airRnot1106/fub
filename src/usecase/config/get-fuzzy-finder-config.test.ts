import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import { GetFuzzyFinderConfig } from "./get-fuzzy-finder-config.ts";
import { FuzzyFinderCommand } from "../../core/config/fuzzy-finder-command.ts";
import { FuzzyFinderArgs } from "../../core/config/fuzzy-finder-args.ts";
import { FuzzyFinderConfig } from "../../core/config/fuzzy-finder-config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import type { ConfigRepository } from "../../core/config/config.ts";

// Simple mock repository for testing
function createSimpleMockRepository(
  mockGet: (key: ConfigKey) => Result.ResultAsync<string | null, Error>
): ConfigRepository {
  return {
    get: mockGet,
    set: async () => Promise.resolve(Result.succeed(undefined)),
    remove: async () => Promise.resolve(Result.succeed(undefined)),
    getAll: async () => Promise.resolve(Result.succeed({})),
  };
}

Deno.test("GetFuzzyFinderConfig - should get fuzzy finder config successfully", async () => {
  const commandValue = "fzf";
  const argsValue = "--height 40% --reverse";
  
  const repository = createSimpleMockRepository(
    async (key) => {
      if (key.value === "fuzzy.command") {
        return Promise.resolve(Result.succeed(commandValue));
      }
      if (key.value === "fuzzy.args") {
        return Promise.resolve(Result.succeed(argsValue));
      }
      return Promise.resolve(Result.succeed(null));
    }
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.command.value, commandValue);
    assertEquals(result.value.args.value, argsValue);
    assertEquals(result.value.getCommandLine(), `${commandValue} ${argsValue}`);
  }
});

Deno.test("GetFuzzyFinderConfig - should use default config when not set", async () => {
  const repository = createSimpleMockRepository(
    async () => Promise.resolve(Result.succeed(null))
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.command.value, "fzf");
    assertEquals(result.value.args.value, "");
    assertEquals(result.value.getCommandLine(), "fzf");
  }
});

Deno.test("GetFuzzyFinderConfig - should use default args when only command is set", async () => {
  const commandValue = "peco";
  
  const repository = createSimpleMockRepository(
    async (key) => {
      if (key.value === "fuzzy.command") {
        return Promise.resolve(Result.succeed(commandValue));
      }
      return Promise.resolve(Result.succeed(null));
    }
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.command.value, commandValue);
    assertEquals(result.value.args.value, "");
    assertEquals(result.value.getCommandLine(), commandValue);
  }
});

Deno.test("GetFuzzyFinderConfig - should use default command when only args is set", async () => {
  const argsValue = "--reverse --border";
  
  const repository = createSimpleMockRepository(
    async (key) => {
      if (key.value === "fuzzy.args") {
        return Promise.resolve(Result.succeed(argsValue));
      }
      return Promise.resolve(Result.succeed(null));
    }
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.command.value, "fzf");
    assertEquals(result.value.args.value, argsValue);
    assertEquals(result.value.getCommandLine(), `fzf ${argsValue}`);
  }
});

Deno.test("GetFuzzyFinderConfig - should handle repository failure", async () => {
  const errorMessage = "Database connection failed";
  
  const repository = createSimpleMockRepository(
    async () => Promise.resolve(Result.fail(new Error(errorMessage)))
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isFailure(result), true);
  if (Result.isFailure(result)) {
    assertEquals(result.error.message, errorMessage);
  }
});

Deno.test("GetFuzzyFinderConfig - should handle invalid stored command", async () => {
  const invalidCommand = "fzf&&rm";
  const validArgs = "--height 40%";
  
  const repository = createSimpleMockRepository(
    async (key) => {
      if (key.value === "fuzzy.command") {
        return Promise.resolve(Result.succeed(invalidCommand));
      }
      if (key.value === "fuzzy.args") {
        return Promise.resolve(Result.succeed(validArgs));
      }
      return Promise.resolve(Result.succeed(null));
    }
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isFailure(result), true);
});

Deno.test("GetFuzzyFinderConfig - should handle invalid stored args", async () => {
  const validCommand = "fzf";
  const invalidArgs = "--preview 'rm -rf /'";
  
  const repository = createSimpleMockRepository(
    async (key) => {
      if (key.value === "fuzzy.command") {
        return Promise.resolve(Result.succeed(validCommand));
      }
      if (key.value === "fuzzy.args") {
        return Promise.resolve(Result.succeed(invalidArgs));
      }
      return Promise.resolve(Result.succeed(null));
    }
  );
  
  const usecase = new GetFuzzyFinderConfig(repository);
  const result = await usecase.execute();
  
  assertEquals(Result.isFailure(result), true);
});