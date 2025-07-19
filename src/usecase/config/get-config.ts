import { Result } from "@praha/byethrow";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";

export class GetConfig {
  constructor(private readonly repository: ConfigRepository) {}

  execute(keyString: string): Result.ResultAsync<string | null, Error> {
    return Result.pipe(
      Result.do(),
      Result.bind("key", () => ConfigKey.create(keyString)),
      Result.andThen(({ key }) => this.repository.get(key))
    );
  }
}