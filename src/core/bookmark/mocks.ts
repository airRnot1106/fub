import { spy } from "@std/testing/mock";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { Bookmark } from "./bookmark.ts";
import { BookmarkId } from "./bookmark-id.ts";
import { BookmarkTitle } from "./bookmark-title.ts";
import { BookmarkUrl } from "./bookmark-url.ts";
import { BookmarkTag } from "./bookmark-tag.ts";

/**
 * Fast-check generators for bookmark testing
 */
export const generators = {
  // Valid value generators
  validUrl: () => fc.webUrl(),
  validTitle: () =>
    fc.string({ minLength: 1, maxLength: 500 }).filter((s) =>
      s.trim().length > 0
    ),
  validTag: () =>
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
      s.trim().length > 0
    ),
  validTags: () =>
    fc.array(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
        s.trim().length > 0
      ),
      { maxLength: 10 },
    ),
  validId: () => fc.string({ minLength: 1 }),
  whitespace: () => fc.string().filter((s) => s.length > 0 && s.trim() === ""),

  // Invalid value generators
  invalidTitle: () =>
    fc.oneof(
      fc.constant(""),
      fc.string().filter((s) => s.trim().length === 0),
      fc.string({ minLength: 501 }).filter((s) => s.trim().length > 500),
    ),
  invalidTags: () =>
    fc.oneof(
      fc.array(fc.constant(""), { minLength: 1 }),
      fc.array(fc.string().filter((s) => s.trim().length === 0), {
        minLength: 1,
      }),
      fc.array(fc.string({ minLength: 51 }), { minLength: 1 }),
    ),
  invalidUrls: () =>
    fc.oneof(
      fc.constant(""),
      fc.string().filter((s) => !s.match(/^https?:\/\//)),
      fc.string({ minLength: 1 }).map((s) => `ftp://${s}`),
      fc.string({ minLength: 1 }).map((s) => `javascript:${s}`),
      fc.string().filter((s) => s.includes(" ") && !s.match(/^https?:\/\//)),
    ),
};

/**
 * Test configuration constants
 */
export const testConfig = {
  numRuns: {
    normal: 10,
    invalid: 20,
    integration: 5,
  },
};

/**
 * Create a mock repository for testing
 */
export function createMockRepository() {
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

/**
 * Create a bookmark entity from raw values
 */
export function createBookmark(
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

/**
 * Create a temporary directory for integration tests
 */
export async function createTempDirectory(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "bkm_test_" });
  return tempDir;
}

/**
 * Create a mock repository with failing save operation
 */
export function createFailingMockRepository(errorMessage: string) {
  const mockRepository = {
    save: (): Result.ResultAsync<void, Error> =>
      Promise.resolve(Result.fail(new Error(errorMessage))),
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
