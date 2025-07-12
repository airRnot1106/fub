import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class BookmarkTag implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(tag: string): Result.Result<BookmarkTag, Error> {
    const trimmed = tag.trim();

    if (trimmed.length === 0) {
      return Result.fail(new Error("BookmarkTag cannot be empty"));
    }

    if (trimmed.length > 50) {
      return Result.fail(new Error("BookmarkTag cannot exceed 50 characters"));
    }

    return Result.succeed(new BookmarkTag(trimmed));
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
