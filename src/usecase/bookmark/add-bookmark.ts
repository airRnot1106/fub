import { Result } from "@praha/byethrow";
import { Bookmark, BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";

export class AddBookmark {
  constructor(private readonly repository: BookmarkRepository) {}

  async execute(
    urlString: string,
    titleString: string,
    tagStrings: string[],
  ): Promise<Result.Result<Bookmark, Error[]>> {
    const validationResult = Result.pipe(
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
    );

    if (Result.isFailure(validationResult)) {
      const errors = Array.isArray(validationResult.error)
        ? validationResult.error
        : [validationResult.error];
      return Result.fail(errors);
    }

    const bookmark = validationResult.value;
    const saveResult = await this.repository.save(bookmark);

    if (Result.isFailure(saveResult)) {
      return Result.fail([saveResult.error]);
    }

    return Result.succeed(bookmark);
  }
}
