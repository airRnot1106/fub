import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls, spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { AddBookmark } from "./add-bookmark.ts";
import { BookmarkRepository } from "../../core/bookmark/bookmark.ts";

// Helper function to create mock repository
function createMockRepository() {
  const mockRepository: BookmarkRepository = {
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
  };
}

Deno.test("AddBookmark - should create and save bookmark successfully", async () => {
  await fc.assert(
    fc.asyncProperty(
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
      async (url, title, tags) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(url, title, tags);

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;

          assertEquals(bookmark.title.value, title.trim());
          assertEquals(bookmark.url.value, url.trim());
          assertEquals(bookmark.tags.length, tags.length);
          for (let i = 0; i < tags.length; i++) {
            assertEquals(bookmark.tags[i].value, tags[i].trim());
          }

          assertSpyCalls(repository.save, 1);
          assertSpyCall(repository.save, 0, {
            args: [bookmark],
          });
        }
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("AddBookmark - should handle empty tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      async (url, title) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(url, title, []);

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          assertEquals(bookmark.tags.length, 0);
          assertSpyCalls(repository.save, 1);
        }
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("AddBookmark - should fail with invalid URL", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant(""),
        fc.string().filter((s) => !s.match(/^https?:\/\//)),
        fc.string({ minLength: 1 }).map((s) => `ftp://${s}`),
        fc.string({ minLength: 1 }).map((s) => `javascript:${s}`),
        fc.string().filter((s) => s.includes(" ") && !s.match(/^https?:\/\//)),
      ),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      async (invalidUrl, title) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(invalidUrl, title, []);
        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: 20 },
  );
});

Deno.test("AddBookmark - should fail with invalid title", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.webUrl(),
      fc.oneof(
        fc.constant(""),
        fc.string().filter((s) => s.trim().length === 0),
        fc.string({ minLength: 501 }),
      ),
      async (url, invalidTitle) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(url, invalidTitle, []);
        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: 20 },
  );
});

Deno.test("AddBookmark - should fail with invalid tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
      ),
      fc.oneof(
        fc.array(fc.constant(""), { minLength: 1 }),
        fc.array(fc.string().filter((s) => s.trim().length === 0), {
          minLength: 1,
        }),
        fc.array(fc.string({ minLength: 51 }), { minLength: 1 }),
      ),
      async (url, title, invalidTags) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(url, title, invalidTags);
        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: 20 },
  );
});

Deno.test("AddBookmark - should handle repository save failure", async () => {
  const mockRepository = {
    save: (): Result.ResultAsync<void, Error> =>
      Promise.resolve(Result.fail(new Error("Database connection failed"))),
    findAll: () => Promise.resolve(Result.succeed([])),
    findById: () =>
      Promise.resolve(
        Result.succeed(null),
      ),
  };
  const repository = {
    ...mockRepository,
    save: spy(mockRepository, "save"),
  };

  const addBookmark = new AddBookmark(repository);

  const result = await addBookmark.execute(
    "https://example.com",
    "Valid Title",
    ["tag1"],
  );

  assertEquals(Result.isFailure(result), true);
  assertSpyCalls(repository.save, 1);
});

Deno.test("AddBookmark - should generate unique IDs", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.webUrl(),
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
        s.trim().length > 0
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
      fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
          s.trim().length > 0
        ),
        { maxLength: 10 },
      ),
      async (url1, url2, title1, title2, tags1, tags2) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result1 = await addBookmark.execute(url1, title1, tags1);
        const result2 = await addBookmark.execute(url2, title2, tags2);

        assertEquals(Result.isSuccess(result1), true);
        assertEquals(Result.isSuccess(result2), true);

        if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
          assertEquals(result1.value.id.equals(result2.value.id), false);
        }

        assertSpyCalls(repository.save, 2);
      },
    ),
    { numRuns: 10 },
  );
});

Deno.test("AddBookmark - should trim whitespace from inputs", async () => {
  await fc.assert(
    fc.asyncProperty(
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
      fc.string().filter((s) => s.length > 0 && s.trim() === ""),
      async (url, title, tags, padding) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const paddedUrl = padding + url + padding;
        const paddedTitle = padding + title + padding;
        const paddedTags = tags.map((tag) => padding + tag + padding);

        const result = await addBookmark.execute(
          paddedUrl,
          paddedTitle,
          paddedTags,
        );

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          assertEquals(bookmark.title.value, title.trim());
          assertEquals(bookmark.url.value, url.trim());
          for (let i = 0; i < tags.length; i++) {
            assertEquals(bookmark.tags[i].value, tags[i].trim());
          }
        }
      },
    ),
    { numRuns: 10 },
  );
});
