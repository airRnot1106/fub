import { Result } from "@praha/byethrow";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import type { FuzzyFinderConfig } from "../../core/config/fuzzy-finder-config.ts";

export class SetFuzzyFinderConfig {
  constructor(private readonly repository: ConfigRepository) {}

  execute(config: FuzzyFinderConfig): Result.ResultAsync<void, Error> {
    return Result.pipe(
      Result.do(),
      Result.bind("commandKey", () => ConfigKey.create("fuzzy.command")),
      Result.bind("argsKey", () => ConfigKey.create("fuzzy.args")),
      Result.bind("setCommand", ({ commandKey }) => 
        this.repository.set(commandKey, config.command.value)
      ),
      Result.andThen(({ argsKey }) => 
        this.repository.set(argsKey, config.args.value)
      )
    );
  }
}