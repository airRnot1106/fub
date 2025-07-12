import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { AddBookmark } from "./add-bookmark.ts";
import { Bookmark, BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";

// Mock Repository for testing
class MockBookmarkRepository implements BookmarkRepository {
  private bookmarks: Map<string, Bookmark> = new Map();
  public saveCallCount = 0;
  public lastSavedBookmark: Bookmark | null = null;

  save(bookmark: Bookmark): Result.ResultAsync<void, Error> {
    this.saveCallCount++;
    this.lastSavedBookmark = bookmark;
    this.bookmarks.set(bookmark.id.value, bookmark);
    return Promise.resolve(Result.succeed(undefined)) as Result.ResultAsync<
      void,
      Error
    >;
  }

  findById(id: BookmarkId): Result.ResultAsync<Bookmark | null, Error> {
    const bookmark = this.bookmarks.get(id.value) || null;
    return Promise.resolve(Result.succeed(bookmark)) as Result.ResultAsync<
      Bookmark | null,
      Error
    >;
  }

  findAll(): Result.ResultAsync<Bookmark[], Error> {
    return Promise.resolve(
      Result.succeed(Array.from(this.bookmarks.values())),
    ) as Result.ResultAsync<Bookmark[], Error>;
  }

  findByTag(tag: BookmarkTag): Result.ResultAsync<Bookmark[], Error> {
    const bookmarks = Array.from(this.bookmarks.values()).filter(
      (b) => b.tags.some((t) => t.equals(tag)),
    );
    return Promise.resolve(Result.succeed(bookmarks)) as Result.ResultAsync<
      Bookmark[],
      Error
    >;
  }

  delete(id: BookmarkId): Result.ResultAsync<void, Error> {
    this.bookmarks.delete(id.value);
    return Promise.resolve(Result.succeed(undefined)) as Result.ResultAsync<
      void,
      Error
    >;
  }

  reset(): void {
    this.bookmarks.clear();
    this.saveCallCount = 0;
    this.lastSavedBookmark = null;
  }
}

// Test data generators
const urlStringGenerator = fc.constantFrom(
  "https://example.com",
  "http://localhost:3000",
  "https://github.com/user/repo",
  "https://www.google.com",
);

const titleStringGenerator = fc.string({ minLength: 1, maxLength: 50 }).filter(
  (s) => s.trim().length > 0,
);

const tagStringGenerator = fc.string({ minLength: 1, maxLength: 30 }).filter(
  (s) => s.trim().length > 0,
);

Deno.test("AddBookmark - should create and save bookmark successfully", async () => {
  await fc.assert(
    fc.asyncProperty(
      urlStringGenerator,
      titleStringGenerator,
      fc.array(tagStringGenerator, { maxLength: 5 }),
      async (urlString, titleString, tagStrings) => {
        const repository = new MockBookmarkRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(
          urlString,
          titleString,
          tagStrings,
        );

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;

          // Verify bookmark properties
          assertEquals(bookmark.title.value, titleString.trim());
          assertEquals(bookmark.url.value, urlString.trim());
          assertEquals(bookmark.tags.length, tagStrings.length);

          // Verify tags are properly created
          tagStrings.forEach((tagString, index) => {
            assertEquals(bookmark.tags[index].value, tagString.trim());
          });

          // Verify repository interaction
          assertEquals(repository.saveCallCount, 1);
          assertEquals(repository.lastSavedBookmark, bookmark);
        }
      },
    ),
  );
});

Deno.test("AddBookmark - should fail with invalid URL", async () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const invalidUrls = [
    "",
    "not-a-url",
    "ftp://example.com",
    "javascript:alert('xss')",
  ];

  for (const invalidUrl of invalidUrls) {
    const result = await addBookmark.execute(invalidUrl, "Valid Title", []);
    assertEquals(Result.isFailure(result), true);
    assertEquals(repository.saveCallCount, 0);
  }
});

Deno.test("AddBookmark - should fail with invalid title", async () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const invalidTitles = [
    "",
    "   ",
    "a".repeat(501), // Too long
  ];

  for (const invalidTitle of invalidTitles) {
    const result = await addBookmark.execute(
      "https://example.com",
      invalidTitle,
      [],
    );
    assertEquals(Result.isFailure(result), true);
    assertEquals(repository.saveCallCount, 0);
  }
});

Deno.test("AddBookmark - should fail with invalid tags", async () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const invalidTagLists = [
    [""], // Empty tag
    ["   "], // Whitespace only tag
    ["a".repeat(51)], // Too long tag
  ];

  for (const invalidTags of invalidTagLists) {
    const result = await addBookmark.execute(
      "https://example.com",
      "Valid Title",
      invalidTags,
    );
    assertEquals(Result.isFailure(result), true);
    assertEquals(repository.saveCallCount, 0);
  }
});

Deno.test("AddBookmark - should handle repository save failure", async () => {
  class FailingRepository implements BookmarkRepository {
    save(_bookmark: Bookmark): Result.ResultAsync<void, Error> {
      return Promise.resolve(
        Result.fail(new Error("Database connection failed")),
      ) as Result.ResultAsync<void, Error>;
    }

    findById(_id: BookmarkId): Result.ResultAsync<Bookmark | null, Error> {
      return Promise.resolve(Result.succeed(null)) as Result.ResultAsync<
        Bookmark | null,
        Error
      >;
    }

    findAll(): Result.ResultAsync<Bookmark[], Error> {
      return Promise.resolve(Result.succeed([])) as Result.ResultAsync<
        Bookmark[],
        Error
      >;
    }

    findByTag(_tag: BookmarkTag): Result.ResultAsync<Bookmark[], Error> {
      return Promise.resolve(Result.succeed([])) as Result.ResultAsync<
        Bookmark[],
        Error
      >;
    }

    delete(_id: BookmarkId): Result.ResultAsync<void, Error> {
      return Promise.resolve(Result.succeed(undefined)) as Result.ResultAsync<
        void,
        Error
      >;
    }
  }

  const repository = new FailingRepository();
  const addBookmark = new AddBookmark(repository);

  const result = await addBookmark.execute(
    "https://example.com",
    "Valid Title",
    ["tag1"],
  );
  assertEquals(Result.isFailure(result), true);
});

Deno.test("AddBookmark - should create bookmark with empty tags", async () => {
  await fc.assert(
    fc.asyncProperty(
      urlStringGenerator,
      titleStringGenerator,
      async (urlString, titleString) => {
        const repository = new MockBookmarkRepository();
        const addBookmark = new AddBookmark(repository);

        const result = await addBookmark.execute(urlString, titleString, []);

        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          assertEquals(bookmark.tags.length, 0);
          assertEquals(repository.saveCallCount, 1);
        }
      },
    ),
  );
});

Deno.test("AddBookmark - should generate unique IDs", async () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const result1 = await addBookmark.execute(
    "https://example.com",
    "Title 1",
    [],
  );
  const result2 = await addBookmark.execute(
    "https://example.com",
    "Title 2",
    [],
  );

  assertEquals(Result.isSuccess(result1), true);
  assertEquals(Result.isSuccess(result2), true);

  if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
    assertEquals(result1.value.id.equals(result2.value.id), false);
  }
});
