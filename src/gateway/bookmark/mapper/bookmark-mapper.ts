import { Result } from "@praha/byethrow";
import { Bookmark } from "../../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../../core/bookmark/bookmark-tag.ts";
import { BookmarkDto } from "../dto/bookmark-dto.ts";
import { parseDate } from "../../../shared/date.ts";

export class BookmarkMapper {
  static toDomain(dto: BookmarkDto): Result.Result<Bookmark, Error[]> {
    return Result.pipe(
      Result.do(),
      Result.bind("id", () => BookmarkId.create(dto.id)),
      Result.bind("title", () => BookmarkTitle.create(dto.title)),
      Result.bind("url", () => BookmarkUrl.create(dto.url)),
      Result.bind("tags", () =>
        Result.combine(
          dto.tags.map((tag) => BookmarkTag.create(tag)),
        )),
      Result.bind("createdAt", () => parseDate(dto.createdAt)),
      Result.bind("updatedAt", () => parseDate(dto.updatedAt)),
      Result.andThen(({ id, title, url, tags, createdAt, updatedAt }) =>
        Bookmark.reconstitute(
          id,
          title,
          url,
          tags,
          createdAt,
          updatedAt,
        )
      ),
      Result.mapError((error) => Array.isArray(error) ? error : [error]),
    );
  }

  static toDto(bookmark: Bookmark): BookmarkDto {
    return {
      id: bookmark.id.value,
      title: bookmark.title.value,
      url: bookmark.url.value,
      tags: bookmark.tags.map((tag) => tag.value),
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
    };
  }
}
