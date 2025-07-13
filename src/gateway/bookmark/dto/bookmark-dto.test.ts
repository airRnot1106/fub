import { describe, it } from "jsr:@std/testing/bdd";
import { assertEquals } from "jsr:@std/assert";
import * as fc from "fast-check";
import { BookmarkDto } from "./bookmark-dto.ts";

describe("BookmarkDto", () => {
  const arbitraryBookmarkDto = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1 }),
    url: fc.webUrl(),
    tags: fc.array(fc.string({ minLength: 1 })),
    createdAt: fc.constant(new Date().toISOString()),
    updatedAt: fc.constant(new Date().toISOString()),
  });

  it("should have id property", () => {
    fc.assert(
      fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
        assertEquals(typeof dto.id, "string");
      }),
    );
  });

  it("should have title property", () => {
    fc.assert(
      fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
        assertEquals(typeof dto.title, "string");
      }),
    );
  });

  it("should have url property", () => {
    fc.assert(
      fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
        assertEquals(typeof dto.url, "string");
      }),
    );
  });

  it("should have tags property as array", () => {
    fc.assert(
      fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
        assertEquals(Array.isArray(dto.tags), true);
      }),
    );
  });

  it("should have createdAt property", () => {
    fc.assert(
      fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
        assertEquals(typeof dto.createdAt, "string");
      }),
    );
  });

  it("should have updatedAt property", () => {
    fc.assert(
      fc.property(arbitraryBookmarkDto, (dto: BookmarkDto) => {
        assertEquals(typeof dto.updatedAt, "string");
      }),
    );
  });
});
