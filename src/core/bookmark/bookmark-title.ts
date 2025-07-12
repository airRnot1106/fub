import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class BookmarkTitle implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(title: string): Result.Result<BookmarkTitle, Error> {
    const trimmed = title.trim();

    if (trimmed.length === 0) {
      return Result.fail(new Error("BookmarkTitle cannot be empty"));
    }

    if (trimmed.length > 500) {
      return Result.fail(
        new Error("BookmarkTitle cannot exceed 500 characters"),
      );
    }

    return Result.succeed(new BookmarkTitle(trimmed));
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
