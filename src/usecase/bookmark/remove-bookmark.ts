import { Result } from "@praha/byethrow";
import { BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";

export class RemoveBookmark {
  constructor(private readonly repository: BookmarkRepository) {}

  execute(idString: string): Result.ResultAsync<void, Error[]> {
    return Result.pipe(
      Result.do(),
      Result.bind("id", () => BookmarkId.create(idString)),
      Result.andThen(({ id }) =>
        Result.pipe(
          this.repository.findById(id),
          Result.andThen((existingBookmark) => {
            if (!existingBookmark) {
              return Result.fail(new Error("Bookmark not found"));
            }
            return this.repository.remove(id);
          }),
        )
      ),
      Result.mapError((error) => Array.isArray(error) ? error : [error]),
    );
  }
}
