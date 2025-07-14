import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { BookmarkDto } from "./bookmark-dto.ts";

const arbitraryBookmarkDto = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  url: fc.webUrl(),
  tags: fc.array(fc.string({ minLength: 1 })),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
});

Deno.test("BookmarkDto - should have id property", () => {
  fc.assert(
    fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
      assertEquals(typeof dto.id, "string");
    }),
  );
});

Deno.test("BookmarkDto - should have title property", () => {
  fc.assert(
    fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
      assertEquals(typeof dto.title, "string");
    }),
  );
});

Deno.test("BookmarkDto - should have url property", () => {
  fc.assert(
    fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
      assertEquals(typeof dto.url, "string");
    }),
  );
});

Deno.test("BookmarkDto - should have tags property as array", () => {
  fc.assert(
    fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
      assertEquals(Array.isArray(dto.tags), true);
    }),
  );
});

Deno.test("BookmarkDto - should have createdAt property", () => {
  fc.assert(
    fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
      assertEquals(typeof dto.createdAt, "string");
    }),
  );
});

Deno.test("BookmarkDto - should have updatedAt property", () => {
  fc.assert(
    fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
      assertEquals(typeof dto.updatedAt, "string");
    }),
  );
});
