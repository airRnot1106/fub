import { Result } from "@praha/byethrow";
import { Bookmark } from "../../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../../core/bookmark/bookmark-tag.ts";
import { BookmarkDto } from "../dto/bookmark-dto.ts";

export class BookmarkMapper {
  static toDomain(dto: BookmarkDto): Result.Result<Bookmark, Error> {
    const idResult = BookmarkId.create(dto.id);
    if (Result.isFailure(idResult)) {
      return idResult;
    }

    const titleResult = BookmarkTitle.create(dto.title);
    if (Result.isFailure(titleResult)) {
      return titleResult;
    }

    const urlResult = BookmarkUrl.create(dto.url);
    if (Result.isFailure(urlResult)) {
      return urlResult;
    }

    const tags: BookmarkTag[] = [];
    for (const tagValue of dto.tags) {
      const tagResult = BookmarkTag.create(tagValue);
      if (Result.isFailure(tagResult)) {
        return tagResult;
      }
      tags.push(tagResult.value);
    }

    const dateResult = this.parseDates(dto.createdAt, dto.updatedAt);
    if (Result.isFailure(dateResult)) {
      return dateResult;
    }

    return Bookmark.reconstitute(
      idResult.value,
      titleResult.value,
      urlResult.value,
      tags,
      dateResult.value.createdAt,
      dateResult.value.updatedAt,
    );
  }

  private static parseDates(
    createdAtStr: string,
    updatedAtStr: string,
  ): Result.Result<{ createdAt: Date; updatedAt: Date }, Error> {
    try {
      const createdAt = new Date(createdAtStr);
      const updatedAt = new Date(updatedAtStr);
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        return Result.fail(new Error("Invalid date format"));
      }
      return Result.succeed({ createdAt, updatedAt });
    } catch {
      return Result.fail(new Error("Invalid date format"));
    }
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
