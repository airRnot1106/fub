import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { BookmarkId } from "./bookmark-id.ts";

Deno.test("BookmarkId - should create from valid UUID string", () => {
  fc.assert(
    fc.property(fc.uuid(), (uuid) => {
      const result = BookmarkId.create(uuid);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, uuid);
      }
    }),
  );
});

Deno.test("BookmarkId - should reject invalid string", () => {
  fc.assert(
    fc.property(
      fc.string().filter((s) =>
        !s.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ),
      (invalidString) => {
        const result = BookmarkId.create(invalidString);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("BookmarkId - should implement ValueObject interface", () => {
  fc.assert(
    fc.property(fc.uuid(), (uuid) => {
      const result = BookmarkId.create(uuid);
      if (Result.isSuccess(result)) {
        const bookmarkId = result.value;
        // Should have value property
        assertEquals(bookmarkId.value, uuid);
        // Should implement toString
        assertEquals(bookmarkId.toString(), uuid);
        // Should implement equals
        const result2 = BookmarkId.create(uuid);
        if (Result.isSuccess(result2)) {
          assertEquals(bookmarkId.equals(result2.value), true);
        }
      }
    }),
  );
});

Deno.test("BookmarkId - equals should be reflexive", () => {
  fc.assert(
    fc.property(fc.uuid(), (uuid) => {
      const result = BookmarkId.create(uuid);
      if (Result.isSuccess(result)) {
        const bookmarkId = result.value;
        assertEquals(bookmarkId.equals(bookmarkId), true);
      }
    }),
  );
});

Deno.test("BookmarkId - equals should be symmetric", () => {
  fc.assert(
    fc.property(fc.uuid(), (uuid) => {
      const result1 = BookmarkId.create(uuid);
      const result2 = BookmarkId.create(uuid);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(
          result1.value.equals(result2.value),
          result2.value.equals(result1.value),
        );
      }
    }),
  );
});

Deno.test("BookmarkId - different IDs should not be equal", () => {
  fc.assert(
    fc.property(fc.uuid(), fc.uuid(), (uuid1, uuid2) => {
      fc.pre(uuid1 !== uuid2);
      const result1 = BookmarkId.create(uuid1);
      const result2 = BookmarkId.create(uuid2);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(result1.value.equals(result2.value), false);
      }
    }),
  );
});

Deno.test("BookmarkId - should generate new unique ID", () => {
  const id1 = BookmarkId.generate();
  const id2 = BookmarkId.generate();
  assertEquals(id1.equals(id2), false);
  assertEquals(typeof id1.value, "string");
  assertEquals(id1.value.length, 36); // UUID length
});
