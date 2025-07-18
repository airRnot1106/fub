import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { FuzzyFinderConfig } from "./fuzzy-finder-config.ts";
import { FuzzyFinderCommand } from "./fuzzy-finder-command.ts";
import { FuzzyFinderArgs } from "./fuzzy-finder-args.ts";

Deno.test("FuzzyFinderConfig - should create valid config", () => {
  const commandResult = FuzzyFinderCommand.create("fzf");
  const argsResult = FuzzyFinderArgs.create("--height 40%");

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const result = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.command.value, "fzf");
      assertEquals(result.value.args.value, "--height 40%");
    }
  }
});

Deno.test("FuzzyFinderConfig - should create config with empty args", () => {
  const commandResult = FuzzyFinderCommand.create("peco");
  const argsResult = FuzzyFinderArgs.create("");

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const result = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.command.value, "peco");
      assertEquals(result.value.args.value, "");
    }
  }
});

Deno.test("FuzzyFinderConfig - getCommandLine should return proper command", () => {
  const commandResult = FuzzyFinderCommand.create("fzf");
  const argsResult = FuzzyFinderArgs.create("--height 40% --reverse");

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const configResult = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    if (Result.isSuccess(configResult)) {
      assertEquals(
        configResult.value.getCommandLine(),
        "fzf --height 40% --reverse",
      );
    }
  }
});

Deno.test("FuzzyFinderConfig - getCommandLine should handle empty args", () => {
  const commandResult = FuzzyFinderCommand.create("peco");
  const argsResult = FuzzyFinderArgs.create("");

  if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
    const configResult = FuzzyFinderConfig.create(
      commandResult.value,
      argsResult.value,
    );

    if (Result.isSuccess(configResult)) {
      assertEquals(configResult.value.getCommandLine(), "peco");
    }
  }
});

Deno.test("FuzzyFinderConfig - equals method should work correctly", () => {
  const cmd1Result = FuzzyFinderCommand.create("fzf");
  const args1Result = FuzzyFinderArgs.create("--height 40%");
  const cmd2Result = FuzzyFinderCommand.create("fzf");
  const args2Result = FuzzyFinderArgs.create("--height 40%");
  const cmd3Result = FuzzyFinderCommand.create("peco");
  const args3Result = FuzzyFinderArgs.create("");

  if (
    Result.isSuccess(cmd1Result) && Result.isSuccess(args1Result) &&
    Result.isSuccess(cmd2Result) && Result.isSuccess(args2Result) &&
    Result.isSuccess(cmd3Result) && Result.isSuccess(args3Result)
  ) {
    const config1Result = FuzzyFinderConfig.create(
      cmd1Result.value,
      args1Result.value,
    );
    const config2Result = FuzzyFinderConfig.create(
      cmd2Result.value,
      args2Result.value,
    );
    const config3Result = FuzzyFinderConfig.create(
      cmd3Result.value,
      args3Result.value,
    );

    if (
      Result.isSuccess(config1Result) && Result.isSuccess(config2Result) &&
      Result.isSuccess(config3Result)
    ) {
      assertEquals(config1Result.value.equals(config2Result.value), true);
      assertEquals(config1Result.value.equals(config3Result.value), false);
    }
  }
});

Deno.test("FuzzyFinderConfig - property-based test", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) =>
        /^[a-zA-Z0-9_-]+$/.test(s)
      ),
      fc.string({ maxLength: 50 }).filter((s) =>
        !s.includes(";") && !s.includes("$(") && !s.includes("&&")
      ),
      (command, args) => {
        const cmdResult = FuzzyFinderCommand.create(command);
        const argsResult = FuzzyFinderArgs.create(args);

        if (Result.isSuccess(cmdResult) && Result.isSuccess(argsResult)) {
          const configResult = FuzzyFinderConfig.create(
            cmdResult.value,
            argsResult.value,
          );
          assertEquals(Result.isSuccess(configResult), true);

          if (Result.isSuccess(configResult)) {
            const expectedCommandLine = args.trim()
              ? `${command} ${args.trim()}`
              : command;
            assertEquals(
              configResult.value.getCommandLine(),
              expectedCommandLine,
            );
          }
        }
      },
    ),
    { numRuns: 100 },
  );
});
