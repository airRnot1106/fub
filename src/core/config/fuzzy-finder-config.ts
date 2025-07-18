import { Result } from "@praha/byethrow";
import type { FuzzyFinderCommand } from "./fuzzy-finder-command.ts";
import type { FuzzyFinderArgs } from "./fuzzy-finder-args.ts";

export class FuzzyFinderConfig {
  private constructor(
    public readonly command: FuzzyFinderCommand,
    public readonly args: FuzzyFinderArgs,
  ) {}

  static create(
    command: FuzzyFinderCommand,
    args: FuzzyFinderArgs,
  ): Result.Result<FuzzyFinderConfig, Error> {
    return Result.succeed(new FuzzyFinderConfig(command, args));
  }

  getCommandLine(): string {
    const argsValue = this.args.value.trim();
    return argsValue
      ? `${this.command.value} ${argsValue}`
      : this.command.value;
  }

  equals(other: FuzzyFinderConfig): boolean {
    return this.command.equals(other.command) && this.args.equals(other.args);
  }
}
