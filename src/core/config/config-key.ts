import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class ConfigKey implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(key: string): Result.Result<ConfigKey, Error> {
    // Empty or whitespace-only validation
    if (!key || key.trim().length === 0) {
      return Result.fail(new Error("ConfigKey cannot be empty"));
    }

    // Invalid format validation
    if (
      key.includes("..") || // double dots
      key.startsWith(".") || // leading dot
      key.endsWith(".") || // trailing dot
      /[^a-zA-Z0-9.]/.test(key) // special characters or spaces
    ) {
      return Result.fail(new Error(`Invalid ConfigKey format: ${key}`));
    }

    return Result.succeed(new ConfigKey(key));
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
