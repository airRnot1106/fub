import { Result } from "@praha/byethrow";
import type { ConfigKey } from "./config-key.ts";

export interface ConfigRepository {
  get(key: ConfigKey): Result.ResultAsync<string | null, Error>;
  set(key: ConfigKey, value: string): Result.ResultAsync<void, Error>;
  remove(key: ConfigKey): Result.ResultAsync<void, Error>;
  getAll(): Result.ResultAsync<Record<string, string>, Error>;
}