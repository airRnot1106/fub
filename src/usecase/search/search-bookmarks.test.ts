import { assertEquals } from "@std/assert";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { SearchBookmarks } from "./search-bookmarks.ts";
import { SearchQuery } from "./search-query.ts";
import {
  createFailingMockRepository,
  testConfig,
} from "../../core/bookmark/mocks.ts";
import { Bookmark } from "../../core/bookmark/bookmark.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import type { BookmarkRepository } from "../../core/bookmark/bookmark.ts";

// Generator for valid SearchQuery
const validSearchQueryGenerator = fc.string({ minLength: 1, maxLength: 200 })
  .filter(
    (s) => s.trim().length > 0,
  ).map((query) => {
    const result = SearchQuery.create(query);
    if (Result.isSuccess(result)) {
      return result.value;
    }
    throw new Error("Failed to create SearchQuery in generator");
  });

// Create test bookmarks for testing
const createTestBookmarks = (): Bookmark[] => {
  const bookmarks: Bookmark[] = [];

  // Test bookmark 1: "TypeScript Guide"
  const id1 = BookmarkId.generate();
  const title1Result = BookmarkTitle.create("TypeScript Guide");
  const url1Result = BookmarkUrl.create("https://example.com/typescript");
  const tag1Result = BookmarkTag.create("typescript");
  const tag2Result = BookmarkTag.create("programming");

  if (
    Result.isSuccess(title1Result) && Result.isSuccess(url1Result) &&
    Result.isSuccess(tag1Result) && Result.isSuccess(tag2Result)
  ) {
    const bookmark1Result = Bookmark.create(
      id1,
      title1Result.value,
      url1Result.value,
      [tag1Result.value, tag2Result.value],
    );
    if (Result.isSuccess(bookmark1Result)) {
      bookmarks.push(bookmark1Result.value);
    }
  }

  // Test bookmark 2: "JavaScript Tutorial"
  const id2 = BookmarkId.generate();
  const title2Result = BookmarkTitle.create("JavaScript Tutorial");
  const url2Result = BookmarkUrl.create("https://example.com/javascript");
  const tag3Result = BookmarkTag.create("javascript");

  if (
    Result.isSuccess(title2Result) && Result.isSuccess(url2Result) &&
    Result.isSuccess(tag3Result)
  ) {
    const bookmark2Result = Bookmark.create(
      id2,
      title2Result.value,
      url2Result.value,
      [tag3Result.value],
    );
    if (Result.isSuccess(bookmark2Result)) {
      bookmarks.push(bookmark2Result.value);
    }
  }

  // Test bookmark 3: "Python Basics"
  const id3 = BookmarkId.generate();
  const title3Result = BookmarkTitle.create("Python Basics");
  const url3Result = BookmarkUrl.create("https://example.com/python");
  const tag4Result = BookmarkTag.create("python");

  if (
    Result.isSuccess(title3Result) && Result.isSuccess(url3Result) &&
    Result.isSuccess(tag4Result)
  ) {
    const bookmark3Result = Bookmark.create(
      id3,
      title3Result.value,
      url3Result.value,
      [tag4Result.value],
    );
    if (Result.isSuccess(bookmark3Result)) {
      bookmarks.push(bookmark3Result.value);
    }
  }

  return bookmarks;
};

// Create custom mock repository with controllable return values
function createTestMockRepository(bookmarks: Bookmark[]): BookmarkRepository {
  const findAllSpy = spy(() => Promise.resolve(Result.succeed(bookmarks)));

  return {
    save: spy(() => Promise.resolve(Result.succeed(undefined as void))),
    findAll: findAllSpy,
    findById: spy(() =>
      Promise.resolve(Result.succeed(null as Bookmark | null))
    ),
    remove: spy(() => Promise.resolve(Result.succeed(undefined as void))),
  };
}

Deno.test("SearchBookmarks - should search bookmarks by title", async () => {
  const testBookmarks = createTestBookmarks();
  const repository = createTestMockRepository(testBookmarks);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("TypeScript");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 1);
      assertEquals(result.value[0].title.value, "TypeScript Guide");
    }

    assertSpyCalls(repository.findAll, 1);
  }
});

Deno.test("SearchBookmarks - should search bookmarks by URL", async () => {
  const testBookmarks = createTestBookmarks();
  const repository = createTestMockRepository(testBookmarks);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("javascript");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 1);
      assertEquals(result.value[0].title.value, "JavaScript Tutorial");
    }
  }
});

Deno.test("SearchBookmarks - should search bookmarks by tags", async () => {
  const testBookmarks = createTestBookmarks();
  const repository = createTestMockRepository(testBookmarks);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("programming");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 1);
      assertEquals(result.value[0].title.value, "TypeScript Guide");
    }
  }
});

Deno.test("SearchBookmarks - should return empty array when no matches found", async () => {
  const testBookmarks = createTestBookmarks();
  const repository = createTestMockRepository(testBookmarks);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("nonexistent");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 0);
    }
  }
});

Deno.test("SearchBookmarks - should be case insensitive", async () => {
  const testBookmarks = createTestBookmarks();
  const repository = createTestMockRepository(testBookmarks);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("TYPESCRIPT");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 1);
      assertEquals(result.value[0].title.value, "TypeScript Guide");
    }
  }
});

Deno.test("SearchBookmarks - should handle partial matches", async () => {
  const testBookmarks = createTestBookmarks();
  const repository = createTestMockRepository(testBookmarks);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("Script");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 2);
      // Should match both TypeScript and JavaScript
    }
  }
});

Deno.test("SearchBookmarks - should handle repository failure", async () => {
  const repository = createFailingMockRepository("Database connection failed");

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("test");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isFailure(result), true);
    assertSpyCalls(repository.findAll, 1);
  }
});

Deno.test("SearchBookmarks - should handle empty bookmark list", async () => {
  const repository = createTestMockRepository([]);

  const searchBookmarks = new SearchBookmarks(repository);
  const queryResult = SearchQuery.create("anything");

  if (Result.isSuccess(queryResult)) {
    const result = await searchBookmarks.execute(queryResult.value);

    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      assertEquals(result.value.length, 0);
    }
  }
});

Deno.test("SearchBookmarks - property-based testing", async () => {
  await fc.assert(
    fc.asyncProperty(
      validSearchQueryGenerator,
      async (searchQuery) => {
        const testBookmarks = createTestBookmarks();
        const repository = createTestMockRepository(testBookmarks);

        const searchBookmarks = new SearchBookmarks(repository);
        const result = await searchBookmarks.execute(searchQuery);

        assertEquals(Result.isSuccess(result), true);
        if (Result.isSuccess(result)) {
          // Result should always be an array
          assertEquals(Array.isArray(result.value), true);
          // Each item should be a Bookmark
          result.value.forEach((bookmark: Bookmark) => {
            assertEquals(bookmark instanceof Bookmark, true);
          });
        }

        assertSpyCalls(repository.findAll, 1);
      },
    ),
    { numRuns: testConfig.numRuns.normal },
  );
});
