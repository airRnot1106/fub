import { assertEquals, assertExists } from "@std/assert";
import { Result } from "@praha/byethrow";
import { JsonBookmarkRepository } from "./json-bookmark-repository.ts";
import { Bookmark } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";

// Test data generators
const createValidBookmark = (): Bookmark => {
  const id = BookmarkId.generate();
  const titleResult = BookmarkTitle.create("Test Title");
  const urlResult = BookmarkUrl.create("https://example.com");
  const tagResult = BookmarkTag.create("test");

  if (
    Result.isSuccess(titleResult) &&
    Result.isSuccess(urlResult) &&
    Result.isSuccess(tagResult)
  ) {
    const bookmarkResult = Bookmark.create(
      id,
      titleResult.value,
      urlResult.value,
      [tagResult.value],
    );
    if (Result.isSuccess(bookmarkResult)) {
      return bookmarkResult.value;
    }
  }

  throw new Error("Failed to create valid bookmark");
};

const testDataDir = "/tmp/bkm-test";

Deno.test("JsonBookmarkRepository - should save and find bookmark by ID", async () => {
  const repository = new JsonBookmarkRepository(testDataDir);
  const bookmark = createValidBookmark();

  // Clean up before test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Directory might not exist
  }

  const saveResult = await repository.save(bookmark);
  assertEquals(Result.isSuccess(saveResult), true);

  const findResult = await repository.findById(bookmark.id);
  assertEquals(Result.isSuccess(findResult), true);

  if (Result.isSuccess(findResult)) {
    assertExists(findResult.value);
    assertEquals(findResult.value!.equals(bookmark), true);
  }

  // Clean up after test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
});

Deno.test("JsonBookmarkRepository - should return null for non-existent ID", async () => {
  const repository = new JsonBookmarkRepository(testDataDir);
  const nonExistentId = BookmarkId.generate();

  // Clean up before test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Directory might not exist
  }

  const findResult = await repository.findById(nonExistentId);
  assertEquals(Result.isSuccess(findResult), true);

  if (Result.isSuccess(findResult)) {
    assertEquals(findResult.value, null);
  }

  // Clean up after test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
});

Deno.test("JsonBookmarkRepository - should find all bookmarks", async () => {
  const repository = new JsonBookmarkRepository(testDataDir);
  const bookmark1 = createValidBookmark();
  const bookmark2 = createValidBookmark();

  // Clean up before test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Directory might not exist
  }

  await repository.save(bookmark1);
  await repository.save(bookmark2);

  const findAllResult = await repository.findAll();
  assertEquals(Result.isSuccess(findAllResult), true);

  if (Result.isSuccess(findAllResult)) {
    assertEquals(findAllResult.value.length, 2);

    const found1 = findAllResult.value.some((b) => b.equals(bookmark1));
    const found2 = findAllResult.value.some((b) => b.equals(bookmark2));
    assertEquals(found1, true);
    assertEquals(found2, true);
  }

  // Clean up after test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
});

Deno.test("JsonBookmarkRepository - should find bookmarks by tag", async () => {
  const repository = new JsonBookmarkRepository(testDataDir);

  // Create bookmarks with different tags
  const tagResult1 = BookmarkTag.create("javascript");
  const tagResult2 = BookmarkTag.create("typescript");

  if (Result.isSuccess(tagResult1) && Result.isSuccess(tagResult2)) {
    const id1 = BookmarkId.generate();
    const id2 = BookmarkId.generate();
    const id3 = BookmarkId.generate();

    const titleResult = BookmarkTitle.create("Test Title");
    const urlResult = BookmarkUrl.create("https://example.com");

    if (Result.isSuccess(titleResult) && Result.isSuccess(urlResult)) {
      const bookmark1Result = Bookmark.create(
        id1,
        titleResult.value,
        urlResult.value,
        [tagResult1.value],
      );
      const bookmark2Result = Bookmark.create(
        id2,
        titleResult.value,
        urlResult.value,
        [tagResult2.value],
      );
      const bookmark3Result = Bookmark.create(
        id3,
        titleResult.value,
        urlResult.value,
        [tagResult1.value, tagResult2.value],
      );

      if (
        Result.isSuccess(bookmark1Result) &&
        Result.isSuccess(bookmark2Result) &&
        Result.isSuccess(bookmark3Result)
      ) {
        // Clean up before test
        try {
          await Deno.remove(testDataDir, { recursive: true });
        } catch {
          // Directory might not exist
        }

        await repository.save(bookmark1Result.value);
        await repository.save(bookmark2Result.value);
        await repository.save(bookmark3Result.value);

        const findByTagResult = await repository.findByTag(tagResult1.value);
        assertEquals(Result.isSuccess(findByTagResult), true);

        if (Result.isSuccess(findByTagResult)) {
          assertEquals(findByTagResult.value.length, 2); // bookmark1 and bookmark3

          const found1 = findByTagResult.value.some((b) =>
            b.equals(bookmark1Result.value)
          );
          const found3 = findByTagResult.value.some((b) =>
            b.equals(bookmark3Result.value)
          );
          assertEquals(found1, true);
          assertEquals(found3, true);
        }

        // Clean up after test
        try {
          await Deno.remove(testDataDir, { recursive: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }
});

Deno.test("JsonBookmarkRepository - should delete bookmark", async () => {
  const repository = new JsonBookmarkRepository(testDataDir);
  const bookmark = createValidBookmark();

  // Clean up before test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Directory might not exist
  }

  await repository.save(bookmark);

  const deleteResult = await repository.delete(bookmark.id);
  assertEquals(Result.isSuccess(deleteResult), true);

  const findResult = await repository.findById(bookmark.id);
  assertEquals(Result.isSuccess(findResult), true);

  if (Result.isSuccess(findResult)) {
    assertEquals(findResult.value, null);
  }

  // Clean up after test
  try {
    await Deno.remove(testDataDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
});

Deno.test("JsonBookmarkRepository - should handle file system errors gracefully", async () => {
  const invalidPath = "/root/invalid/path/that/should/not/exist";
  const repository = new JsonBookmarkRepository(invalidPath);
  const bookmark = createValidBookmark();

  const saveResult = await repository.save(bookmark);
  assertEquals(Result.isFailure(saveResult), true);
});
