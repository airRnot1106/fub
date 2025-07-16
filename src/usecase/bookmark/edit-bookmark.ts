import { Result } from "@praha/byethrow";
import { Bookmark, BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";

export class EditBookmark {
  constructor(private readonly repository: BookmarkRepository) {}

  execute(
    idString: string,
    urlString: string,
    titleString: string,
    tagStrings: string[],
  ): Result.ResultAsync<Bookmark, Error[]> {
    return Result.pipe(
      Result.do(),
      Result.bind("id", () => BookmarkId.create(idString)),
      Result.bind("title", () => BookmarkTitle.create(titleString)),
      Result.bind("url", () => BookmarkUrl.create(urlString)),
      Result.bind(
        "tags",
        () =>
          Result.combine(
            tagStrings.map((tagString) => BookmarkTag.create(tagString)),
          ),
      ),
      Result.andThen(({ id, title, url, tags }) =>
        Result.pipe(
          this.repository.findById(id),
          Result.andThen((existingBookmark) => {
            if (!existingBookmark) {
              return Result.fail(new Error("Bookmark not found"));
            }

            // Create updated bookmark with new title, URL, and tags
            const updatedBookmark = Bookmark.reconstitute(
              existingBookmark.id,
              title,
              url,
              tags,
              existingBookmark.createdAt,
              new Date(), // Update updatedAt to current time
            );

            return Result.pipe(
              updatedBookmark,
              Result.andThrough((bookmark) => this.repository.save(bookmark)),
            );
          }),
        )
      ),
      Result.mapError((error) => Array.isArray(error) ? error : [error]),
    );
  }
}
