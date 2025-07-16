import { assertEquals } from "@std/assert";
import { assertSpyCall, assertSpyCalls } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { AddBookmark } from "./add-bookmark.ts";
import {
  createFailingMockRepository,
  createMockRepository,
  generators,
  testConfig,
} from "../../core/bookmark/mocks.ts";

Deno.test("AddBookmark - should create and save bookmark successfully", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("AddBookmark - should handle empty tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validUrl(),
      generators.validTitle(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("AddBookmark - should fail with invalid URL", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.invalidUrls(),
      generators.validTitle(),
      async (invalidUrl, title) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(invalidUrl, title, []);
        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: testConfig.numRuns.invalid },
  );
});

Deno.test("AddBookmark - should fail with invalid title", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validUrl(),
      generators.invalidTitle(),
      async (url, invalidTitle) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(url, invalidTitle, []);
        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: testConfig.numRuns.invalid },
  );
});

Deno.test("AddBookmark - should fail with invalid tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validUrl(),
      generators.validTitle(),
      generators.invalidTags(),
      async (url, title, invalidTags) => {
        const repository = createMockRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(url, title, invalidTags);
        assertEquals(Result.isFailure(result), true);

        assertSpyCalls(repository.save, 0);
      },
    ),
    { numRuns: testConfig.numRuns.invalid },
  );
});

Deno.test("AddBookmark - should handle repository save failure", async () => {
  const repository = createFailingMockRepository("Database connection failed");

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
      generators.validUrl(),
      generators.validUrl(),
      generators.validTitle(),
      generators.validTitle(),
      generators.validTags(),
      generators.validTags(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});

Deno.test("AddBookmark - should trim whitespace from inputs", async () => {
  await fc.assert(
    fc.asyncProperty(
      generators.validUrl(),
      generators.validTitle(),
      generators.validTags(),
      generators.whitespace(),
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
    { numRuns: testConfig.numRuns.normal },
  );
});
