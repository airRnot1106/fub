import { Result } from "@praha/byethrow";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";

export class SetConfig {
  constructor(private readonly repository: ConfigRepository) {}

  execute(keyString: string, value: string): Result.ResultAsync<void, Error> {
    return Result.pipe(
      Result.do(),
      Result.bind("key", () => ConfigKey.create(keyString)),
      Result.bind("validatedValue", () => this.validateValue(value)),
      Result.andThen(({ key, validatedValue }) =>
        this.repository.set(key, validatedValue)
      ),
    );
  }

  private validateValue(value: string): Result.Result<string, Error> {
    if (!value || value.trim().length === 0) {
      return Result.fail(new Error("Config value cannot be empty"));
    }
    return Result.succeed(value.trim());
  }
}
