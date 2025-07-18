import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class FuzzyFinderCommand implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(command: string): Result.Result<FuzzyFinderCommand, Error> {
    // Empty or whitespace-only validation
    if (!command || command.trim().length === 0) {
      return Result.fail(new Error("FuzzyFinderCommand cannot be empty"));
    }

    // Security validation - reject dangerous characters
    if (/[&|;$`(){}[\]<>'"\\]/.test(command)) {
      return Result.fail(new Error(`Invalid FuzzyFinderCommand format: ${command}`));
    }

    return Result.succeed(new FuzzyFinderCommand(command));
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}