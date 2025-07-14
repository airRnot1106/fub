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
  const invalidDto = {
    id: "",
    title: "",
    url: "invalid-url",
    tags: [],
    createdAt: "invalid-date",
    updatedAt: "invalid-date",
  };

  const result = BookmarkMapper.toDomain(invalidDto);
  assertEquals(Result.isFailure(result), true);
});

Deno.test("BookmarkMapper - should convert Bookmark domain entity to BookmarkDto", () => {
  const validDto = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Test Title",
    url: "https://example.com",
    tags: ["tag1", "tag2"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // First create a valid domain entity
  const idResult = BookmarkId.create(validDto.id);
  const titleResult = BookmarkTitle.create(validDto.title);
  const urlResult = BookmarkUrl.create(validDto.url);
  const tag1Result = BookmarkTag.create(validDto.tags[0]);
  const tag2Result = BookmarkTag.create(validDto.tags[1]);

  if (
    Result.isSuccess(idResult) && Result.isSuccess(titleResult) &&
    Result.isSuccess(urlResult) && Result.isSuccess(tag1Result) &&
    Result.isSuccess(tag2Result)
  ) {
    const bookmarkResult = Bookmark.reconstitute(
      idResult.value,
      titleResult.value,
      urlResult.value,
      [tag1Result.value, tag2Result.value],
      new Date(validDto.createdAt),
      new Date(validDto.updatedAt),
    );

    if (Result.isSuccess(bookmarkResult)) {
      const dto = BookmarkMapper.toDto(bookmarkResult.value);
      assertEquals(typeof dto.id, "string");
      assertEquals(typeof dto.title, "string");
      assertEquals(typeof dto.url, "string");
      assertEquals(Array.isArray(dto.tags), true);
      assertEquals(typeof dto.createdAt, "string");
      assertEquals(typeof dto.updatedAt, "string");
    }
  }
});
