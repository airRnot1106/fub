import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { EditBookmark } from "./edit-bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";
import { Bookmark } from "../../core/bookmark/bookmark.ts";

// Helper function to create mock repository
function createMockRepository() {
  const mockRepository = {
    save: () => Promise.resolve(Result.succeed(undefined)),
    findAll: () => Promise.resolve(Result.succeed([])),
    findById: () =>
      Promise.resolve(
        Result.succeed(null),
      ),
  };
  return {
    ...mockRepository,
    save: spy(mockRepository, "save"),
    findById: spy(mockRepository, "findById"),
  };
}

// Helper function to create a bookmark
function createBookmark(
  id: BookmarkId,
  title: string,
  url: string,
  tags: string[],
): Bookmark {
  const bookmarkTitle = BookmarkTitle.create(title);
  const bookmarkUrl = BookmarkUrl.create(url);
  const bookmarkTags = tags.map((tag) => BookmarkTag.create(tag));

  if (Result.isFailure(bookmarkTitle)) throw new Error("Invalid title");
  if (Result.isFailure(bookmarkUrl)) throw new Error("Invalid url");
  if (bookmarkTags.some((tag) => Result.isFailure(tag))) {
    throw new Error("Invalid tag");
  }

  const validTags = bookmarkTags.map((tag) => {
    if (Result.isFailure(tag)) throw new Error("Invalid tag");
    return tag.value;
  });
  const bookmark = Bookmark.create(
    id,
    bookmarkTitle.value,
    bookmarkUrl.value,
    validTags,
  );

  if (Result.isFailure(bookmark)) throw new Error("Invalid bookmark");
  return bookmark.value;
}

Deno.test("EditBookmark - should update bookmark successfully", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      async (
        idValue,
        originalUrl,
        originalTitle,
        originalTags,
        newTitle,
        newTags,
      ) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const id = BookmarkId.create(idValue);
        if (Result.isFailure(id)) return;

        const originalBookmark = createBookmark(
          id.value,
          originalTitle,
          originalUrl,
          originalTags,
        );

        const mockFindById = spy(() =>
          Promise.resolve(Result.succeed(originalBookmark))
        );
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const result = await editBookmark.execute(
          idValue,
          originalUrl,
          newTitle,
          newTags,
        );

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const updatedBookmark = result.value;

          assertEquals(updatedBookmark.id.equals(id.value), true);
          assertEquals(updatedBookmark.title.value, newTitle.trim());
          assertEquals(updatedBookmark.url.value, originalUrl.trim());
          assertEquals(updatedBookmark.tags.length, newTags.length);
          for (let i = 0; i < newTags.length; i++) {
            assertEquals(updatedBookmark.tags[i].value, newTags[i].trim());
          }

          assertSpyCalls(repository.findById, 1);
          assertSpyCalls(repository.save, 1);
          assertSpyCall(repository.save, 0, {
            args: [updatedBookmark],
          });
        }
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("EditBookmark - should fail when bookmark not found", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      async (idValue, url, title, tags) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const mockFindById = spy(() => Promise.resolve(Result.succeed(null)));
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const result = await editBookmark.execute(idValue, url, title, tags);

        assertEquals(Result.isFailure(result), true);

        // Only check findById call if ID is valid
        const idResult = BookmarkId.create(idValue);
        if (Result.isSuccess(idResult)) {
          assertSpyCalls(repository.findById, 1);
        }
        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("EditBookmark - should fail with invalid title", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      fc.oneof(
        fc.constant(""),
        fc.string().filter((s) => s.trim().length === 0),
        fc.string({ minLength: 501 }),
      ),
      async (idValue, url, originalTitle, originalTags, invalidTitle) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const id = BookmarkId.create(idValue);
        if (Result.isFailure(id)) return;

        const originalBookmark = createBookmark(
          id.value,
          originalTitle,
          url,
          originalTags,
        );

        const mockFindById = spy(() =>
          Promise.resolve(Result.succeed(originalBookmark))
        );
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const result = await editBookmark.execute(
          idValue,
          url,
          invalidTitle,
          originalTags,
        );

        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.findById, 1);
        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: 20 },
  );
});

Deno.test("EditBookmark - should fail with invalid tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      fc.oneof(
        fc.array(fc.constant(""), { minLength: 1 }),
        fc.array(fc.string().filter((s) => s.trim().length === 0), {
          minLength: 1,
        }),
        fc.array(fc.string({ minLength: 51 }), { minLength: 1 }),
      ),
      async (idValue, url, title, originalTags, invalidTags) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const id = BookmarkId.create(idValue);
        if (Result.isFailure(id)) return;

        const originalBookmark = createBookmark(
          id.value,
          title,
          url,
          originalTags,
        );

        const mockFindById = spy(() =>
          Promise.resolve(Result.succeed(originalBookmark))
        );
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const result = await editBookmark.execute(
          idValue,
          url,
          title,
          invalidTags,
        );

        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.findById, 1);
        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: 20 },
  );
});

Deno.test("EditBookmark - should handle repository save failure", async () => {
  const mockRepository = {
    save: (): Result.ResultAsync<void, Error> =>
      Promise.resolve(Result.fail(new Error("Database connection failed"))),
    findAll: () => Promise.resolve(Result.succeed([])),
    findById: (): Result.ResultAsync<Bookmark | null, Error[]> =>
      Promise.resolve(Result.succeed(null)),
  };

  const repository = {
    ...mockRepository,
    save: spy(mockRepository, "save"),
    findById: spy(mockRepository, "findById"),
  };

  const editBookmark = new EditBookmark(repository);

  const id = BookmarkId.create("test-id");
  if (Result.isFailure(id)) return;

  const bookmark = createBookmark(
    id.value,
    "Original Title",
    "https://example.com",
    ["tag1"],
  );

  const mockFindById = spy(() => Promise.resolve(Result.succeed(bookmark)));
  // deno-lint-ignore no-explicit-any
  (repository as any).findById = mockFindById;

  const result = await editBookmark.execute(
    "test-id",
    "https://example.com",
    "Updated Title",
    ["tag2"],
  );

  assertEquals(Result.isFailure(result), true);
  assertSpyCalls(repository.findById, 1);
  assertSpyCalls(repository.save, 1);
});

Deno.test("EditBookmark - should handle empty tags update", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { minLength: 1, maxLength: 10 },
      ),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      async (idValue, url, originalTitle, originalTags, newTitle) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const id = BookmarkId.create(idValue);
        if (Result.isFailure(id)) return;

        const originalBookmark = createBookmark(
          id.value,
          originalTitle,
          url,
          originalTags,
        );

        const mockFindById = spy(() =>
          Promise.resolve(Result.succeed(originalBookmark))
        );
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const result = await editBookmark.execute(
          idValue,
          url,
          newTitle,
          [], // Empty tags
        );

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const updatedBookmark = result.value;
          assertEquals(updatedBookmark.tags.length, 0);
          assertEquals(updatedBookmark.title.value, newTitle.trim());
        }

        assertSpyCalls(repository.findById, 1);
        assertSpyCalls(repository.save, 1);
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("EditBookmark - should preserve createdAt timestamp", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      async (idValue, url, originalTitle, originalTags, newTitle) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const id = BookmarkId.create(idValue);
        if (Result.isFailure(id)) return;

        const originalBookmark = createBookmark(
          id.value,
          originalTitle,
          url,
          originalTags,
        );

        const mockFindById = spy(() =>
          Promise.resolve(Result.succeed(originalBookmark))
        );
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const result = await editBookmark.execute(
          idValue,
          url,
          newTitle,
          originalTags,
        );

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const updatedBookmark = result.value;
          assertEquals(
            updatedBookmark.createdAt.getTime(),
            originalBookmark.createdAt.getTime(),
          );
          assertEquals(
            updatedBookmark.updatedAt.getTime() >
              originalBookmark.updatedAt.getTime(),
            true,
          );
        }

        assertSpyCalls(repository.findById, 1);
        assertSpyCalls(repository.save, 1);
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("EditBookmark - should trim whitespace from updated inputs", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1 }),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      fc.string().filter((s) => s.length > 0 && s.trim() === ""),
      async (
        idValue,
        url,
        originalTitle,
        originalTags,
        newTitle,
        newTags,
        padding,
      ) => {
        const repository = createMockRepository();
        const editBookmark = new EditBookmark(repository);

        const id = BookmarkId.create(idValue);
        if (Result.isFailure(id)) return;

        const originalBookmark = createBookmark(
          id.value,
          originalTitle,
          url,
          originalTags,
        );

        const mockFindById = spy(() =>
          Promise.resolve(Result.succeed(originalBookmark))
        );
        // deno-lint-ignore no-explicit-any
        (repository as any).findById = mockFindById;

        const paddedTitle = padding + newTitle + padding;
        const paddedTags = newTags.map((tag) => padding + tag + padding);

        const result = await editBookmark.execute(
          idValue,
          url,
          paddedTitle,
          paddedTags,
        );

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const updatedBookmark = result.value;
          assertEquals(updatedBookmark.title.value, newTitle.trim());
          for (let i = 0; i < newTags.length; i++) {
            assertEquals(updatedBookmark.tags[i].value, newTags[i].trim());
          }
        }

        assertSpyCalls(repository.findById, 1);
        assertSpyCalls(repository.save, 1);
      },
    ),
    { numRuns: 10 },
  );
});
