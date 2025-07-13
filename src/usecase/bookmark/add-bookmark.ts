import { Result } from "@praha/byethrow";
import { Bookmark, BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";

export class AddBookmark {
  constructor(private readonly repository: BookmarkRepository) {}

  execute(
    urlString: string,
    titleString: string,
    tagStrings: string[],
  ): Result.ResultAsync<Bookmark, Error[]> {
    return Result.pipe(
      Result.do(),
      Result.bind("id", () => Result.succeed(BookmarkId.generate())),
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
        Bookmark.create(id, title, url, tags)
      ),
      Result.andThrough((bookmark) =>
        Result.pipe(
          this.repository.findAll(),
          Result.map((bookmarks) =>
            bookmarks.some((existingBookmark) =>
                existingBookmark.title.equals(bookmark.title)
              )
              ? Result.fail("Bookmark with the same title already exists")
              : Result.succeed()
          ),
        )
      ),
      Result.andThrough((bookmark) => this.repository.save(bookmark)),
      Result.mapError((error) => Array.isArray(error) ? error : [error]),
    );
  }
}
