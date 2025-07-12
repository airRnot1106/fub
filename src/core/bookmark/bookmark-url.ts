import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class BookmarkUrl implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(url: string): Result.Result<BookmarkUrl, Error> {
    const trimmed = url.trim();

    if (trimmed.length === 0) {
      return Result.fail(new Error("BookmarkUrl cannot be empty"));
    }

    // Validate URL format using native URL constructor
    try {
      const urlObj = new URL(trimmed);

      // Only allow http and https protocols
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return Result.fail(
          new Error(
            `Invalid protocol: ${urlObj.protocol}. Only http and https are allowed`,
          ),
        );
      }

      return Result.succeed(new BookmarkUrl(trimmed));
    } catch {
      return Result.fail(new Error(`Invalid URL format: ${trimmed}`));
    }
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
