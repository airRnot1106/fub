import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { EditBookmark } from "./edit-bookmark.ts";
import { FileBookmarkRepository } from "../../gateway/bookmark/repository/file-bookmark-repository.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";
import { Bookmark } from "../../core/bookmark/bookmark.ts";

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

// Helper to create temp directory
async function createTempDirectory(): Promise<string> {
  const tempDir = await Deno.makeTempDir({ prefix: "bkm_test_" });
  return tempDir;
}

Deno.test("EditBookmark Integration - should update bookmark in file system", async () => {
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
      async (idValue, url, originalTitle, originalTags, newTitle, newTags) => {
        const tempDir = await createTempDirectory();
        const repository = new FileBookmarkRepository(tempDir);
        const editBookmark = new EditBookmark(repository);

        try {
          const id = BookmarkId.create(idValue);
          if (Result.isFailure(id)) return;

          // Create and save original bookmark
          const originalBookmark = createBookmark(
            id.value,
            originalTitle,
            url,
            originalTags,
          );

          const saveResult = await repository.save(originalBookmark);
          if (Result.isFailure(saveResult)) return;

          // Update the bookmark
          const updateResult = await editBookmark.execute(
            idValue,
            url,
            newTitle,
            newTags,
          );

          assertEquals(Result.isSuccess(updateResult), true);

          if (Result.isSuccess(updateResult)) {
            const updatedBookmark = updateResult.value;

            // Verify update
            assertEquals(updatedBookmark.id.equals(id.value), true);
            assertEquals(updatedBookmark.title.value, newTitle.trim());
            assertEquals(updatedBookmark.url.value, url.trim());
            assertEquals(updatedBookmark.tags.length, newTags.length);

            // Verify persistence
            const findResult = await repository.findById(id.value);
            assertEquals(Result.isSuccess(findResult), true);

            if (Result.isSuccess(findResult) && findResult.value) {
              const persistedBookmark = findResult.value;
              assertEquals(persistedBookmark.title.value, newTitle.trim());
              assertEquals(persistedBookmark.tags.length, newTags.length);
              for (let i = 0; i < newTags.length; i++) {
                assertEquals(
                  persistedBookmark.tags[i].value,
                  newTags[i].trim(),
                );
              }
            }
          }
        } finally {
          // Cleanup
          await Deno.remove(tempDir, { recursive: true });
        }
      },
    ),
    { numRuns: 5 },
  );
});

Deno.test("EditBookmark Integration - should fail when bookmark does not exist in file system", async () => {
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
        const tempDir = await createTempDirectory();
        const repository = new FileBookmarkRepository(tempDir);
        const editBookmark = new EditBookmark(repository);

        try {
          const result = await editBookmark.execute(idValue, url, title, tags);
          assertEquals(Result.isFailure(result), true);
        } finally {
          // Cleanup
          await Deno.remove(tempDir, { recursive: true });
        }
      },
    ),
    { numRuns: 5 },
  );
});

Deno.test("EditBookmark Integration - should handle concurrent updates", async () => {
  const tempDir = await createTempDirectory();
  const repository = new FileBookmarkRepository(tempDir);
  const editBookmark = new EditBookmark(repository);

  try {
    const id = BookmarkId.create("test-concurrent");
    if (Result.isFailure(id)) return;

    // Create and save original bookmark
    const originalBookmark = createBookmark(
      id.value,
      "Original Title",
      "https://example.com",
      ["tag1"],
    );

    const saveResult = await repository.save(originalBookmark);
    if (Result.isFailure(saveResult)) return;

    // Perform concurrent updates
    const update1 = editBookmark.execute(
      "test-concurrent",
      "https://example.com",
      "Updated Title 1",
      ["tag1", "tag2"],
    );
    const update2 = editBookmark.execute(
      "test-concurrent",
      "https://example.com",
      "Updated Title 2",
      ["tag3"],
    );

    const [result1, result2] = await Promise.all([update1, update2]);

    // Both updates should succeed (last one wins)
    assertEquals(Result.isSuccess(result1), true);
    assertEquals(Result.isSuccess(result2), true);

    // Verify final state
    const findResult = await repository.findById(id.value);
    assertEquals(Result.isSuccess(findResult), true);

    if (Result.isSuccess(findResult) && findResult.value) {
      const finalBookmark = findResult.value;
      // One of the updates should have persisted
      assertEquals(
        finalBookmark.title.value === "Updated Title 1" ||
          finalBookmark.title.value === "Updated Title 2",
        true,
      );
    }
  } finally {
    // Cleanup
    await Deno.remove(tempDir, { recursive: true });
  }
});
