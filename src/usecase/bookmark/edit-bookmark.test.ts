import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { EditBookmark } from "./edit-bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import {
  createBookmark,
  createFailingMockRepository,
  createMockRepository,
  generators,
  testConfig,
} from "../../core/bookmark/mocks.ts";

Deno.test("EditBookmark - should update bookmark successfully", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
      generators.validTitle(),
      generators.validTags(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("EditBookmark - should fail when bookmark not found", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("EditBookmark - should fail with invalid title", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
      generators.invalidTitle(),
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
    { numRuns: testConfig.numRuns.invalid },
  );
});

Deno.test("EditBookmark - should fail with invalid tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
      generators.invalidTags(),
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
    { numRuns: testConfig.numRuns.invalid },
  );
});

Deno.test("EditBookmark - should handle repository save failure", async () => {
  const repository = createFailingMockRepository("Database connection failed");

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
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      fc.array(
        generators.validTag(),
        { minLength: 1, maxLength: 10 },
      ),
      generators.validTitle(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("EditBookmark - should preserve createdAt timestamp", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
      generators.validTitle(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("EditBookmark - should trim whitespace from updated inputs", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validId(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
      generators.validTitle(),
      generators.validTags(),
      generators.whitespace(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});
