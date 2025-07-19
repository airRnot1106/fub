import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import { SetFuzzyFinderConfig } from "./set-fuzzy-finder-config.ts";
import { FuzzyFinderCommand } from "../../core/config/fuzzy-finder-command.ts";
import { FuzzyFinderArgs } from "../../core/config/fuzzy-finder-args.ts";
import { FuzzyFinderConfig } from "../../core/config/fuzzy-finder-config.ts";
import type { ConfigRepository } from "../../core/config/config.ts";

// Simple mock repository for testing
function createSimpleMockRepository(): {
  repository: ConfigRepository;
  setConfigs: Map<string, string>;
} {
  const setConfigs = new Map<string, string>();

  const repository: ConfigRepository = {
    get: () => Promise.resolve(Result.succeed(null)),
    set: (key, value) => {
      setConfigs.set(key.value, value);
      return Promise.resolve(Result.succeed(undefined));
    },
    remove: () => Promise.resolve(Result.succeed(undefined)),
    getAll: () => Promise.resolve(Result.succeed({})),
  };

  return { repository, setConfigs };
}

Deno.test("SetFuzzyFinderConfig - should set fuzzy finder config successfully", async () => {
  const command = "fzf";
  const args = "--height 40% --reverse";

  const { repository, setConfigs } = createSimpleMockRepository();

  const commandResult = FuzzyFinderCommand.create(command);
  const argsResult = FuzzyFinderArgs.create(args);

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const configResult = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    if (Result.isSuccess(configResult)) {
      const usecase = new SetFuzzyFinderConfig(repository);
      const result = await usecase.execute(configResult.value);

      assertEquals(Result.isSuccess(result), true);
      assertEquals(setConfigs.get("fuzzy.command"), command);
      assertEquals(setConfigs.get("fuzzy.args"), args);
    }
  }
});

Deno.test("SetFuzzyFinderConfig - should set config with empty args", async () => {
  const command = "peco";
  const args = "";

  const { repository, setConfigs } = createSimpleMockRepository();

  const commandResult = FuzzyFinderCommand.create(command);
  const argsResult = FuzzyFinderArgs.create(args);

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const configResult = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    if (Result.isSuccess(configResult)) {
      const usecase = new SetFuzzyFinderConfig(repository);
      const result = await usecase.execute(configResult.value);

      assertEquals(Result.isSuccess(result), true);
      assertEquals(setConfigs.get("fuzzy.command"), command);
      assertEquals(setConfigs.get("fuzzy.args"), args);
    }
  }
});

Deno.test("SetFuzzyFinderConfig - should handle repository failure for command", async () => {
  const command = "fzf";
  const args = "--height 40%";
  const errorMessage = "Database connection failed";

  const _setConfigs = new Map<string, string>();
  let setCallCount = 0;

  const repository: ConfigRepository = {
    get: () => Promise.resolve(Result.succeed(null)),
    set: (key) => {
      setCallCount++;
      if (key.value === "fuzzy.command") {
        return Promise.resolve(Result.fail(new Error(errorMessage)));
      }
      return Promise.resolve(Result.succeed(undefined));
    },
    remove: () => Promise.resolve(Result.succeed(undefined)),
    getAll: () => Promise.resolve(Result.succeed({})),
  };

  const commandResult = FuzzyFinderCommand.create(command);
  const argsResult = FuzzyFinderArgs.create(args);

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const configResult = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    if (Result.isSuccess(configResult)) {
      const usecase = new SetFuzzyFinderConfig(repository);
      const result = await usecase.execute(configResult.value);

      assertEquals(Result.isFailure(result), true);
      if (Result.isFailure(result)) {
        assertEquals(result.error.message, errorMessage);
      }
      assertEquals(setCallCount, 1); // Should stop after first failure
    }
  }
});

Deno.test("SetFuzzyFinderConfig - should handle repository failure for args", async () => {
  const command = "fzf";
  const args = "--height 40%";
  const errorMessage = "Database connection failed";

  let setCallCount = 0;

  const repository: ConfigRepository = {
    get: () => Promise.resolve(Result.succeed(null)),
    set: (key) => {
      setCallCount++;
      if (key.value === "fuzzy.args") {
        return Promise.resolve(Result.fail(new Error(errorMessage)));
      }
      return Promise.resolve(Result.succeed(undefined));
    },
    remove: () => Promise.resolve(Result.succeed(undefined)),
    getAll: () => Promise.resolve(Result.succeed({})),
  };

  const commandResult = FuzzyFinderCommand.create(command);
  const argsResult = FuzzyFinderArgs.create(args);

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const configResult = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    if (Result.isSuccess(configResult)) {
      const usecase = new SetFuzzyFinderConfig(repository);
      const result = await usecase.execute(configResult.value);

      assertEquals(Result.isFailure(result), true);
      if (Result.isFailure(result)) {
        assertEquals(result.error.message, errorMessage);
      }
      assertEquals(setCallCount, 2); // Should fail on second call
    }
  }
});
