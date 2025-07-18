import { spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { ConfigKey as _ConfigKey } from "./config-key.ts";
import { FuzzyFinderCommand } from "./fuzzy-finder-command.ts";
import { FuzzyFinderArgs } from "./fuzzy-finder-args.ts";
import { FuzzyFinderConfig } from "./fuzzy-finder-config.ts";

/**
 * Fast-check generators for config testing
 */
export const generators = {
  // Valid value generators
  validConfigKey: () =>
    fc.array(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) =>
        /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)
      ),
      { minLength: 1, maxLength: 5 },
    ).map((segments) => segments.join(".")),

  validCommand: () =>
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
      /^[a-zA-Z0-9_-]+$/.test(s)
    ),

  validArgs: () =>
    fc.string({ maxLength: 100 }).filter((s) =>
      !s.includes(";") &&
      !s.includes("$(") &&
      !s.includes("&&") &&
      !s.includes("||") &&
      !s.includes("rm ") &&
      !s.includes("execute(")
    ),

  // Invalid value generators
  invalidConfigKey: () =>
    fc.oneof(
      fc.constant(""),
      fc.string().filter((s) => s.trim().length === 0),
      fc.constant("fuzzy..command"), // double dots
      fc.constant(".fuzzy.command"), // leading dot
      fc.constant("fuzzy.command."), // trailing dot
      fc.constant("fuzzy.comm@nd"), // special characters
      fc.constant("fuzzy.comm and"), // spaces
    ),

  invalidCommand: () =>
    fc.oneof(
      fc.constant(""),
      fc.string().filter((s) => s.trim().length === 0),
      fc.constant("fzf&"), // ampersand
      fc.constant("fzf|peco"), // pipe
      fc.constant("fzf; rm"), // semicolon
      fc.constant("fzf && echo"), // command injection
      fc.constant("fzf$(rm)"), // command substitution
    ),

  dangerousArgs: () =>
    fc.oneof(
      fc.constant("--preview 'rm -rf /'"),
      fc.constant("--bind 'ctrl-d:execute(rm {})'"),
      fc.constant("; rm -rf /"),
      fc.constant("$(rm -rf /)"),
      fc.constant("&& malicious_command"),
    ),
};

/**
 * Test configuration constants
 */
export const testConfig = {
  numRuns: {
    normal: 10,
    invalid: 20,
    integration: 5,
  },
};

/**
 * Create a mock config repository for testing
 */
export function createMockConfigRepository() {
  const mockRepository = {
    get: () => Promise.resolve(Result.succeed(null)),
    set: () => Promise.resolve(Result.succeed(undefined)),
    remove: () => Promise.resolve(Result.succeed(undefined)),
    getAll: () => Promise.resolve(Result.succeed({})),
  };
  return {
    ...mockRepository,
    get: spy(mockRepository, "get"),
    set: spy(mockRepository, "set"),
    remove: spy(mockRepository, "remove"),
    getAll: spy(mockRepository, "getAll"),
  };
}

/**
 * Create a fuzzy finder config from raw values
 */
export function createFuzzyFinderConfig(
  command: string,
  args: string,
): FuzzyFinderConfig {
  const commandResult = FuzzyFinderCommand.create(command);
  const argsResult = FuzzyFinderArgs.create(args);

  if (Result.isFailure(commandResult)) throw new Error("Invalid command");
  if (Result.isFailure(argsResult)) throw new Error("Invalid args");

  const configResult = FuzzyFinderConfig.create(
    commandResult.value,
    argsResult.value,
  );

  if (Result.isFailure(configResult)) throw new Error("Invalid config");
  return configResult.value;
}

/**
 * Create a temporary directory for integration tests
 */
export async function createTempDirectory(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "bkm_config_test_" });
  return tempDir;
}

/**
 * Create a mock config repository with failing operations
 */
export function createFailingMockConfigRepository(errorMessage: string) {
  const mockRepository = {
    get: () => Promise.resolve(Result.fail(new Error(errorMessage))),
    set: () => Promise.resolve(Result.fail(new Error(errorMessage))),
    remove: () => Promise.resolve(Result.fail(new Error(errorMessage))),
    getAll: () => Promise.resolve(Result.fail(new Error(errorMessage))),
  };
  return {
    ...mockRepository,
    get: spy(mockRepository, "get"),
    set: spy(mockRepository, "set"),
    remove: spy(mockRepository, "remove"),
    getAll: spy(mockRepository, "getAll"),
  };
}
