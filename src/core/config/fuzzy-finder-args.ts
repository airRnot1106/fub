import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class FuzzyFinderArgs implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(args: string): Result.Result<FuzzyFinderArgs, Error> {
    // Security validation - reject dangerous patterns
    const dangerousPatterns = [
      /;/,                    // command separator
      /\$\(/,                 // command substitution
      /&&/,                   // command chaining
      /\|\|/,                 // command chaining
      /\brm\s/,               // remove commands
      /execute\(/,            // fzf execute action
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(args)) {
        return Result.fail(new Error(`Dangerous FuzzyFinderArgs pattern detected: ${args}`));
      }
    }

    return Result.succeed(new FuzzyFinderArgs(args));
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}