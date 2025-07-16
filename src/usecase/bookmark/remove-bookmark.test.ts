import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import { RemoveBookmark } from "./remove-bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import {
  createBookmark,
  createMockRepository,
} from "../../core/bookmark/mocks.ts";

Deno.test("RemoveBookmark - should remove bookmark successfully", async () => {
  const repository = createMockRepository();
  const removeBookmark = new RemoveBookmark(repository);

  const id = BookmarkId.create("test-id");
  if (Result.isFailure(id)) return;

  const bookmark = createBookmark(
    id.value,
    "Test Title",
    "https://example.com",
    ["tag1"],
  );

  const mockFindById = spy(() => Promise.resolve(Result.succeed(bookmark)));
  // deno-lint-ignore no-explicit-any
  (repository as any).findById = mockFindById;

  const result = await removeBookmark.execute("test-id");

  assertEquals(Result.isSuccess(result), true);

  assertSpyCalls(repository.findById, 1);
  assertSpyCalls(repository.remove, 1);
  assertSpyCall(repository.remove, 0, {
    args: [id.value],
  });
});
