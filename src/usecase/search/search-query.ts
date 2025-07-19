import { Result } from "@praha/byethrow";
import type { ValueObject } from "../../core/shared/value-object.ts";

export class SearchQuery implements ValueObject<string> {
  private static readonly MAX_LENGTH = 200;

  private constructor(public readonly value: string) {}

  static create(query: string): Result.Result<SearchQuery, Error> {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      return Result.fail(new Error("SearchQuery cannot be empty"));
    }

    if (trimmed.length > SearchQuery.MAX_LENGTH) {
      return Result.fail(
        new Error(
          `SearchQuery cannot exceed ${SearchQuery.MAX_LENGTH} characters`,
        ),
      );
    }

    return Result.succeed(new SearchQuery(trimmed));
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
