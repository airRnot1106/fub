import { Result } from "@praha/byethrow";
import type { ValueObject } from "../shared/value-object.ts";

export class BookmarkId implements ValueObject<string> {
  private constructor(public readonly value: string) {}

  static create(id: string): Result.Result<BookmarkId, Error> {
    // UUID validation regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return Result.fail(new Error(`Invalid BookmarkId format: ${id}`));
    }

    return Result.succeed(new BookmarkId(id));
  }

  static generate(): BookmarkId {
    const uuid = crypto.randomUUID();
    return new BookmarkId(uuid);
  }

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
