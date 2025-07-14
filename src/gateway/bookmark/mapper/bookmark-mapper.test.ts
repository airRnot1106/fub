import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { BookmarkMapper } from "./bookmark-mapper.ts";
import { BookmarkDto } from "../dto/bookmark-dto.ts";
import { Bookmark } from "../../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../../core/bookmark/bookmark-tag.ts";

const arbitraryValidBookmarkDto = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) =>
    s.trim().length > 0
  ),
  url: fc.webUrl(),
  tags: fc.array(
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
      s.trim().length > 0
    ),
  ),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
});

Deno.test("BookmarkMapper - should convert valid BookmarkDto to Bookmark domain entity", () => {
  fc.assert(
    fc.property(arbitraryValidBookmarkDto, (dto: BookmarkDto) => {
      const result = BookmarkMapper.toDomain(dto);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.id.value, dto.id);
        assertEquals(result.value.title.value, dto.title.trim());
        assertEquals(result.value.url.value, dto.url);
      }
    }),
  );
});

Deno.test("BookmarkMapper - should return error for invalid BookmarkDto", () => {
  const arbitraryInvalidBookmarkDto = fc.oneof(
    // Invalid ID (empty string)
    fc.record({
      id: fc.constant(""),
      title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      url: fc.webUrl(),
      tags: fc.array(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      ),
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    }),
    // Invalid ID (not UUID format)
    fc.record({
      id: fc.string().filter((s) =>
        !s.match(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        )
      ),
      title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      url: fc.webUrl(),
      tags: fc.array(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      ),
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    }),
    // Invalid title (empty string)
    fc.record({
      id: fc.uuid(),
      title: fc.constant(""),
      url: fc.webUrl(),
      tags: fc.array(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      ),
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    }),
    // Invalid title (whitespace only)
    fc.record({
      id: fc.uuid(),
      title: fc.string().filter((s) => s.trim().length === 0 && s.length > 0),
      url: fc.webUrl(),
      tags: fc.array(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      ),
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    }),
    // Invalid URL
    fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      url: fc.string().filter((s) => !s.startsWith("http")),
      tags: fc.array(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      ),
      createdAt: fc.constant(new Date().toISOString()),
      updatedAt: fc.constant(new Date().toISOString()),
    }),
    // Invalid date format
    fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      url: fc.webUrl(),
      tags: fc.array(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      ),
      createdAt: fc.constant("invalid-date"),
      updatedAt: fc.constant(new Date().toISOString()),
    }),
  );

  fc.assert(
    fc.property(arbitraryInvalidBookmarkDto, (invalidDto: BookmarkDto) => {
      const result = BookmarkMapper.toDomain(invalidDto);
      assertEquals(Result.isFailure(result), true);
    }),
  );
});

Deno.test("BookmarkMapper - should convert Bookmark domain entity to BookmarkDto", () => {
  fc.assert(
    fc.property(arbitraryValidBookmarkDto, (dtoData: BookmarkDto) => {
      // First create a valid domain entity from the generated data
      const idResult = BookmarkId.create(dtoData.id);
      const titleResult = BookmarkTitle.create(dtoData.title);
      const urlResult = BookmarkUrl.create(dtoData.url);

      // Create tags array
      const tagResults = dtoData.tags.map((tag) => BookmarkTag.create(tag));
      const allTagsValid = tagResults.every((result) =>
        Result.isSuccess(result)
      );

      if (
        Result.isSuccess(idResult) && Result.isSuccess(titleResult) &&
        Result.isSuccess(urlResult) && allTagsValid
      ) {
        const tags = tagResults.map((result) =>
          Result.isSuccess(result) ? result.value : null
        ).filter(Boolean) as BookmarkTag[];

        const bookmarkResult = Bookmark.reconstitute(
          idResult.value,
          titleResult.value,
          urlResult.value,
          tags,
          new Date(dtoData.createdAt),
          new Date(dtoData.updatedAt),
        );

        if (Result.isSuccess(bookmarkResult)) {
          const dto = BookmarkMapper.toDto(bookmarkResult.value);

          // Verify the conversion is correct
          assertEquals(dto.id, dtoData.id);
          assertEquals(dto.title, dtoData.title.trim()); // BookmarkTitle trims the input
          assertEquals(dto.url, dtoData.url);
          assertEquals(dto.tags.length, dtoData.tags.length);
          assertEquals(typeof dto.createdAt, "string");
          assertEquals(typeof dto.updatedAt, "string");

          // Verify arrays match after trimming
          dto.tags.forEach((tag, index) => {
            assertEquals(tag, dtoData.tags[index].trim());
          });
        }
      }
    }),
  );
});
