import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { BookmarkTitle } from "./bookmark-title.ts";

Deno.test("BookmarkTitle - should create from valid string", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      (title) => {
        const result = BookmarkTitle.create(title);
        assertEquals(Result.isSuccess(result), true);
        if (Result.isSuccess(result)) {
          assertEquals(result.value.value, title.trim());
        }
      },
    ),
  );
});

Deno.test("BookmarkTitle - should reject empty string", () => {
  const result = BookmarkTitle.create("");
  assertEquals(Result.isFailure(result), true);
});

Deno.test("BookmarkTitle - should reject whitespace-only string", () => {
  fc.assert(
    fc.property(
      fc.string().filter((s) => s.trim() === "" && s.length > 0),
      (whitespaceOnly) => {
        const result = BookmarkTitle.create(whitespaceOnly);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("BookmarkTitle - should reject too long string", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 501 }),
      (longTitle) => {
        const result = BookmarkTitle.create(longTitle);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("BookmarkTitle - should trim whitespace", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 450 }).filter((s) =>
        s.trim().length > 0
      ),
      (title) => {
        const withWhitespace = `  ${title}  `;
        const result = BookmarkTitle.create(withWhitespace);
        assertEquals(Result.isSuccess(result), true);
        if (Result.isSuccess(result)) {
          assertEquals(result.value.value, title.trim());
        }
      },
    ),
  );
});

Deno.test("BookmarkTitle - should implement ValueObject interface", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      (title) => {
        const result = BookmarkTitle.create(title);
        if (Result.isSuccess(result)) {
          const bookmarkTitle = result.value;
          // Should have value property
          assertEquals(bookmarkTitle.value, title.trim());
          // Should implement toString
          assertEquals(bookmarkTitle.toString(), title.trim());
          // Should implement equals
          const result2 = BookmarkTitle.create(title);
          if (Result.isSuccess(result2)) {
            assertEquals(bookmarkTitle.equals(result2.value), true);
          }
        }
      },
    ),
  );
});

Deno.test("BookmarkTitle - equals should be reflexive", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      (title) => {
        const result = BookmarkTitle.create(title);
        if (Result.isSuccess(result)) {
          const bookmarkTitle = result.value;
          assertEquals(bookmarkTitle.equals(bookmarkTitle), true);
        }
      },
    ),
  );
});

Deno.test("BookmarkTitle - equals should be symmetric", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      (title) => {
        const result1 = BookmarkTitle.create(title);
        const result2 = BookmarkTitle.create(title);
        if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
          assertEquals(
            result1.value.equals(result2.value),
            result2.value.equals(result1.value),
          );
        }
      },
    ),
  );
});

Deno.test("BookmarkTitle - different titles should not be equal", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      (title1, title2) => {
        fc.pre(title1.trim() !== title2.trim());
        const result1 = BookmarkTitle.create(title1);
        const result2 = BookmarkTitle.create(title2);
        if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
          assertEquals(result1.value.equals(result2.value), false);
        }
      },
    ),
  );
});
