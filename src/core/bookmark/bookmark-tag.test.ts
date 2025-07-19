import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { BookmarkTag } from "./bookmark-tag.ts";

// Custom generator for valid tag strings
const validTagGenerator = fc.string({ minLength: 1, maxLength: 50 }).filter(
  (s) => s.trim().length > 0,
);

// Custom generator for invalid tag strings
const invalidTagGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("   "),
  fc.constant("  \t  \n  "), // Only whitespace characters
  fc.string({ minLength: 51, maxLength: 100 }), // Too long
  fc.string().filter((s) => s.trim().length === 0 && s.length > 0), // Non-empty but only whitespace
);

Deno.test("BookmarkTag - should create from valid string", () => {
  fc.assert(
    fc.property(validTagGenerator, (tag) => {
      const result = BookmarkTag.create(tag);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, tag.trim());
      }
    }),
  );
});

Deno.test("BookmarkTag - should reject invalid string", () => {
  fc.assert(
    fc.property(invalidTagGenerator, (invalidTag) => {
      const result = BookmarkTag.create(invalidTag);
      assertEquals(Result.isFailure(result), true);
    }),
  );
});

Deno.test("BookmarkTag - should reject empty string", () => {
  const result = BookmarkTag.create("");
  assertEquals(Result.isFailure(result), true);
});

Deno.test("BookmarkTag - should reject whitespace-only string", () => {
  fc.assert(
    fc.property(
      fc.string().filter((s) => s.trim() === "" && s.length > 0),
      (whitespaceOnly) => {
        const result = BookmarkTag.create(whitespaceOnly);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("BookmarkTag - should reject too long string", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 51 }).filter((s) => s.trim().length > 50),
      (longTag) => {
        const result = BookmarkTag.create(longTag);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("BookmarkTag - should trim whitespace", () => {
  fc.assert(
    fc.property(validTagGenerator, (tag) => {
      const withWhitespace = `  ${tag}  `;
      const result = BookmarkTag.create(withWhitespace);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, tag.trim());
      }
    }),
  );
});

Deno.test("BookmarkTag - should implement ValueObject interface", () => {
  fc.assert(
    fc.property(validTagGenerator, (tag) => {
      const result = BookmarkTag.create(tag);
      if (Result.isSuccess(result)) {
        const bookmarkTag = result.value;
        const trimmed = tag.trim();
        // Should have value property
        assertEquals(bookmarkTag.value, trimmed);
        // Should implement toString
        assertEquals(bookmarkTag.toString(), trimmed);
        // Should implement equals
        const result2 = BookmarkTag.create(tag);
        if (Result.isSuccess(result2)) {
          assertEquals(bookmarkTag.equals(result2.value), true);
        }
      }
    }),
  );
});

Deno.test("BookmarkTag - equals should be reflexive", () => {
  fc.assert(
    fc.property(validTagGenerator, (tag) => {
      const result = BookmarkTag.create(tag);
      if (Result.isSuccess(result)) {
        const bookmarkTag = result.value;
        assertEquals(bookmarkTag.equals(bookmarkTag), true);
      }
    }),
  );
});

Deno.test("BookmarkTag - equals should be symmetric", () => {
  fc.assert(
    fc.property(validTagGenerator, (tag) => {
      const result1 = BookmarkTag.create(tag);
      const result2 = BookmarkTag.create(tag);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(
          result1.value.equals(result2.value),
          result2.value.equals(result1.value),
        );
      }
    }),
  );
});

Deno.test("BookmarkTag - different tags should not be equal", () => {
  fc.assert(
    fc.property(validTagGenerator, validTagGenerator, (tag1, tag2) => {
      fc.pre(tag1.trim() !== tag2.trim());
      const result1 = BookmarkTag.create(tag1);
      const result2 = BookmarkTag.create(tag2);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(result1.value.equals(result2.value), false);
      }
    }),
  );
});
