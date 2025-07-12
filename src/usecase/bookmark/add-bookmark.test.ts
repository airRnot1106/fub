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

  save(bookmark: Bookmark): Result.Result<void, Error> {
    this.saveCallCount++;
    this.lastSavedBookmark = bookmark;
    this.bookmarks.set(bookmark.id.value, bookmark);
    return Result.succeed(undefined);
  }

  findById(id: BookmarkId): Result.Result<Bookmark | null, Error> {
    const bookmark = this.bookmarks.get(id.value) || null;
    return Result.succeed(bookmark);
  }

  findAll(): Result.Result<Bookmark[], Error> {
    return Result.succeed(Array.from(this.bookmarks.values()));
  }

  findByTag(tag: BookmarkTag): Result.Result<Bookmark[], Error> {
    const bookmarks = Array.from(this.bookmarks.values()).filter(
      (b) => b.tags.some((t) => t.equals(tag)),
    );
    return Result.succeed(bookmarks);
  }

  delete(id: BookmarkId): Result.Result<void, Error> {
    this.bookmarks.delete(id.value);
    return Result.succeed(undefined);
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

Deno.test("AddBookmark - should create and save bookmark successfully", () => {
  fc.assert(
    fc.property(
      urlStringGenerator,
      titleStringGenerator,
      fc.array(tagStringGenerator, { maxLength: 5 }),
      (urlString, titleString, tagStrings) => {
        const repository = new MockBookmarkRepository();
        const addBookmark = new AddBookmark(repository);

        const result = addBookmark.execute(urlString, titleString, tagStrings);

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

Deno.test("AddBookmark - should fail with invalid URL", () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const invalidUrls = [
    "",
    "not-a-url",
    "ftp://example.com",
    "javascript:alert('xss')",
  ];

  invalidUrls.forEach((invalidUrl) => {
    const result = addBookmark.execute(invalidUrl, "Valid Title", []);
    assertEquals(Result.isFailure(result), true);
    assertEquals(repository.saveCallCount, 0);
  });
});

Deno.test("AddBookmark - should fail with invalid title", () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const invalidTitles = [
    "",
    "   ",
    "a".repeat(501), // Too long
  ];

  invalidTitles.forEach((invalidTitle) => {
    const result = addBookmark.execute("https://example.com", invalidTitle, []);
    assertEquals(Result.isFailure(result), true);
    assertEquals(repository.saveCallCount, 0);
  });
});

Deno.test("AddBookmark - should fail with invalid tags", () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const invalidTagLists = [
    [""], // Empty tag
    ["   "], // Whitespace only tag
    ["a".repeat(51)], // Too long tag
  ];

  invalidTagLists.forEach((invalidTags) => {
    const result = addBookmark.execute(
      "https://example.com",
      "Valid Title",
      invalidTags,
    );
    assertEquals(Result.isFailure(result), true);
    assertEquals(repository.saveCallCount, 0);
  });
});

Deno.test("AddBookmark - should handle repository save failure", () => {
  class FailingRepository implements BookmarkRepository {
    save(_bookmark: Bookmark): Result.Result<void, Error> {
      return Result.fail(new Error("Database connection failed"));
    }

    findById(_id: BookmarkId): Result.Result<Bookmark | null, Error> {
      return Result.succeed(null);
    }

    findAll(): Result.Result<Bookmark[], Error> {
      return Result.succeed([]);
    }

    findByTag(_tag: BookmarkTag): Result.Result<Bookmark[], Error> {
      return Result.succeed([]);
    }

    delete(_id: BookmarkId): Result.Result<void, Error> {
      return Result.succeed(undefined);
    }
  }

  const repository = new FailingRepository();
  const addBookmark = new AddBookmark(repository);

  const result = addBookmark.execute("https://example.com", "Valid Title", [
    "tag1",
  ]);
  assertEquals(Result.isFailure(result), true);
});

Deno.test("AddBookmark - should create bookmark with empty tags", () => {
  fc.assert(
    fc.property(
      urlStringGenerator,
      titleStringGenerator,
      (urlString, titleString) => {
        const repository = new MockBookmarkRepository();
        const addBookmark = new AddBookmark(repository);

        const result = addBookmark.execute(urlString, titleString, []);

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

Deno.test("AddBookmark - should generate unique IDs", () => {
  const repository = new MockBookmarkRepository();
  const addBookmark = new AddBookmark(repository);

  const result1 = addBookmark.execute("https://example.com", "Title 1", []);
  const result2 = addBookmark.execute("https://example.com", "Title 2", []);

  assertEquals(Result.isSuccess(result1), true);
  assertEquals(Result.isSuccess(result2), true);

  if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
    assertEquals(result1.value.id.equals(result2.value.id), false);
  }
});
