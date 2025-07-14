import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { FileBookmarkRepository } from "./file-bookmark-repository.ts";
import { Bookmark } from "../../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../../core/bookmark/bookmark-tag.ts";

const bookmarkIdGenerator = fc.uuid().map((uuid) => BookmarkId.create(uuid))
  .filter(Result.isSuccess).map((r) => r.value);
const bookmarkTitleGenerator = fc.string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0)
  .map((title) => BookmarkTitle.create(title)).filter(Result.isSuccess).map(
    (r) => r.value,
  );
const bookmarkUrlGenerator = fc.constantFrom(
  "https://example.com",
  "http://localhost:3000",
  "https://github.com/user/repo",
).map((url) => BookmarkUrl.create(url)).filter(Result.isSuccess).map((r) =>
  r.value
);
const bookmarkTagGenerator = fc.string({ minLength: 1, maxLength: 50 }).filter(
  (s) => s.trim().length > 0,
)
  .map((tag) => BookmarkTag.create(tag)).filter(Result.isSuccess).map((r) =>
    r.value
  );

const bookmarkGenerator = fc.record({
  id: bookmarkIdGenerator,
  title: bookmarkTitleGenerator,
  url: bookmarkUrlGenerator,
  tags: fc.array(bookmarkTagGenerator, { maxLength: 3 }),
}).map(({ id, title, url, tags }) => {
  const result = Bookmark.create(id, title, url, tags);
  return Result.isSuccess(result) ? result.value : null;
}).filter((bookmark): bookmark is Bookmark => bookmark !== null);

Deno.test("FileBookmarkRepository - should save and retrieve bookmark", async () => {
  await fc.assert(
    fc.asyncProperty(bookmarkGenerator, async (bookmark) => {
      const tempDir = await Deno.makeTempDir();
      const repository = new FileBookmarkRepository(tempDir);

      const saveResult = await repository.save(bookmark);
      assertEquals(Result.isSuccess(saveResult), true);

      const findResult = await repository.findById(bookmark.id);
      assertEquals(Result.isSuccess(findResult), true);

      if (Result.isSuccess(findResult)) {
        const foundBookmark = findResult.value as Bookmark | null;
        assertEquals(foundBookmark?.equals(bookmark), true);
      }

      await Deno.remove(tempDir, { recursive: true });
    }),
  );
});

Deno.test("FileBookmarkRepository - should return null for non-existent bookmark", async () => {
  await fc.assert(
    fc.asyncProperty(bookmarkIdGenerator, async (id) => {
      const tempDir = await Deno.makeTempDir();
      const repository = new FileBookmarkRepository(tempDir);

      const result = await repository.findById(id);
      assertEquals(Result.isSuccess(result), true);

      if (Result.isSuccess(result)) {
        assertEquals(result.value as Bookmark | null, null);
      }

      await Deno.remove(tempDir, { recursive: true });
    }),
  );
});

Deno.test("FileBookmarkRepository - should retrieve all saved bookmarks", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(bookmarkGenerator, { minLength: 1, maxLength: 3 }),
      async (bookmarks) => {
        const tempDir = await Deno.makeTempDir();
        const repository = new FileBookmarkRepository(tempDir);

        // Save all bookmarks
        for (const bookmark of bookmarks) {
          const saveResult = await repository.save(bookmark);
          assertEquals(Result.isSuccess(saveResult), true);
        }

        // Retrieve all bookmarks
        const findAllResult = await repository.findAll();
        assertEquals(Result.isSuccess(findAllResult), true);

        if (Result.isSuccess(findAllResult)) {
          const allBookmarks = findAllResult.value as Bookmark[];
          assertEquals(allBookmarks.length, bookmarks.length);

          // Check that all saved bookmarks are found
          for (const bookmark of bookmarks) {
            const found = allBookmarks.find((b) => b.equals(bookmark));
            assertEquals(found !== undefined, true);
          }
        }

        await Deno.remove(tempDir, { recursive: true });
      },
    ),
  );
});

Deno.test("FileBookmarkRepository - should return empty array when no bookmarks exist", async () => {
  const tempDir = await Deno.makeTempDir();
  const repository = new FileBookmarkRepository(tempDir);

  const result = await repository.findAll();
  assertEquals(Result.isSuccess(result), true);

  if (Result.isSuccess(result)) {
    assertEquals((result.value as Bookmark[]).length, 0);
  }

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("FileBookmarkRepository - should overwrite existing bookmark when saved again", async () => {
  await fc.assert(
    fc.asyncProperty(
      bookmarkGenerator,
      bookmarkTitleGenerator,
      async (bookmark, newTitle) => {
        const tempDir = await Deno.makeTempDir();
        const repository = new FileBookmarkRepository(tempDir);

        // Save original bookmark
        const saveResult1 = await repository.save(bookmark);
        assertEquals(Result.isSuccess(saveResult1), true);

        // Create updated bookmark with same ID but different title
        const updatedBookmarkResult = Bookmark.reconstitute(
          bookmark.id,
          newTitle,
          bookmark.url,
          [...bookmark.tags], // Convert readonly array to mutable array
          bookmark.createdAt,
          new Date(),
        );

        if (Result.isSuccess(updatedBookmarkResult)) {
          const updatedBookmark = updatedBookmarkResult.value;

          // Save updated bookmark
          const saveResult2 = await repository.save(updatedBookmark);
          assertEquals(Result.isSuccess(saveResult2), true);

          // Verify updated bookmark is stored
          const findResult = await repository.findById(bookmark.id);
          assertEquals(Result.isSuccess(findResult), true);

          if (Result.isSuccess(findResult)) {
            const foundBookmark = findResult.value as Bookmark | null;
            assertEquals(foundBookmark?.title.equals(newTitle), true);
          }
        }

        await Deno.remove(tempDir, { recursive: true });
      },
    ),
  );
});
