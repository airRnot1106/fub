import { Result } from "@praha/byethrow";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import { FuzzyFinderCommand } from "../../core/config/fuzzy-finder-command.ts";
import { FuzzyFinderArgs } from "../../core/config/fuzzy-finder-args.ts";
import { FuzzyFinderConfig } from "../../core/config/fuzzy-finder-config.ts";

export class GetFuzzyFinderConfig {
  private readonly DEFAULT_COMMAND = "fzf";
  private readonly DEFAULT_ARGS = "";

  constructor(private readonly repository: ConfigRepository) {}

  execute(): Result.ResultAsync<FuzzyFinderConfig, Error> {
    return Result.pipe(
      Result.do(),
      Result.bind("commandKey", () => ConfigKey.create("fuzzy.command")),
      Result.bind("argsKey", () => ConfigKey.create("fuzzy.args")),
      Result.bind(
        "commandValue",
        ({ commandKey }) => this.repository.get(commandKey),
      ),
      Result.bind("argsValue", ({ argsKey }) => this.repository.get(argsKey)),
      Result.bind(
        "command",
        ({ commandValue }) =>
          FuzzyFinderCommand.create(commandValue || this.DEFAULT_COMMAND),
      ),
      Result.bind(
        "args",
        ({ argsValue }) =>
          FuzzyFinderArgs.create(argsValue || this.DEFAULT_ARGS),
      ),
      Result.andThen(({ command, args }) =>
        FuzzyFinderConfig.create(command, args)
      ),
    );
  }
}
