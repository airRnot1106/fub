import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { Bookmark } from "./bookmark.ts";
import { BookmarkId } from "./bookmark-id.ts";
import { BookmarkTitle } from "./bookmark-title.ts";
import { BookmarkUrl } from "./bookmark-url.ts";
import { BookmarkTag } from "./bookmark-tag.ts";

// Custom generators for testing
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
const bookmarkTagGenerator = fc.string({ minLength: 1, maxLength: 30 }).filter(
  (s) => s.trim().length > 0,
)
  .map((tag) => BookmarkTag.create(tag)).filter(Result.isSuccess).map((r) =>
    r.value
  );

Deno.test("Bookmark - should create with required fields", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      fc.array(bookmarkTagGenerator, { maxLength: 5 }),
      (id, title, url, tags) => {
        const result = Bookmark.create(id, title, url, tags);
        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          assertEquals(bookmark.id, id);
          assertEquals(bookmark.title, title);
          assertEquals(bookmark.url, url);
          assertEquals(bookmark.tags.length, tags.length);
          assertEquals(typeof bookmark.createdAt, "object");
          assertEquals(typeof bookmark.updatedAt, "object");
          assertEquals(bookmark.createdAt instanceof Date, true);
          assertEquals(bookmark.updatedAt instanceof Date, true);
        }
      },
    ),
  );
});

Deno.test("Bookmark - should create with empty tags", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      (id, title, url) => {
        const result = Bookmark.create(id, title, url, []);
        assertEquals(Result.isSuccess(result), true);

        if (Result.isSuccess(result)) {
          assertEquals(result.value.tags.length, 0);
        }
      },
    ),
  );
});

Deno.test("Bookmark - should have entity equality based on ID", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      fc.array(bookmarkTagGenerator, { maxLength: 3 }),
      bookmarkTitleGenerator, // different title
      (id, title1, url, tags, title2) => {
        const result1 = Bookmark.create(id, title1, url, tags);
        const result2 = Bookmark.create(id, title2, url, tags);

        if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
          assertEquals(result1.value.equals(result2.value), true);
        }
      },
    ),
  );
});

Deno.test("Bookmark - different IDs should not be equal", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      fc.array(bookmarkTagGenerator, { maxLength: 3 }),
      (id1, id2, title, url, tags) => {
        fc.pre(!id1.equals(id2));

        const result1 = Bookmark.create(id1, title, url, tags);
        const result2 = Bookmark.create(id2, title, url, tags);

        if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
          assertEquals(result1.value.equals(result2.value), false);
        }
      },
    ),
  );
});

Deno.test("Bookmark - should add tag", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      fc.array(bookmarkTagGenerator, { maxLength: 3 }),
      bookmarkTagGenerator,
      (id, title, url, initialTags, newTag) => {
        fc.pre(!initialTags.some((tag) => tag.equals(newTag)));

        const result = Bookmark.create(id, title, url, initialTags);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          const updatedResult = bookmark.addTag(newTag);

          assertEquals(Result.isSuccess(updatedResult), true);

          if (Result.isSuccess(updatedResult)) {
            const updatedBookmark = updatedResult.value;
            assertEquals(updatedBookmark.tags.length, initialTags.length + 1);
            assertEquals(
              updatedBookmark.tags.some((tag) => tag.equals(newTag)),
              true,
            );
            assertEquals(updatedBookmark.updatedAt > bookmark.updatedAt, true);
          }
        }
      },
    ),
  );
});

Deno.test("Bookmark - should not add duplicate tag", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      bookmarkTagGenerator,
      (id, title, url, tag) => {
        const result = Bookmark.create(id, title, url, [tag]);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          const updatedResult = bookmark.addTag(tag);

          assertEquals(Result.isFailure(updatedResult), true);
        }
      },
    ),
  );
});

Deno.test("Bookmark - should remove tag", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      bookmarkTagGenerator,
      fc.array(bookmarkTagGenerator, { maxLength: 3 }),
      (id, title, url, tagToRemove, otherTags) => {
        fc.pre(!otherTags.some((tag) => tag.equals(tagToRemove)));

        const allTags = [tagToRemove, ...otherTags];
        const result = Bookmark.create(id, title, url, allTags);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          const updatedResult = bookmark.removeTag(tagToRemove);

          assertEquals(Result.isSuccess(updatedResult), true);

          if (Result.isSuccess(updatedResult)) {
            const updatedBookmark = updatedResult.value;
            assertEquals(updatedBookmark.tags.length, otherTags.length);
            assertEquals(
              updatedBookmark.tags.some((tag) => tag.equals(tagToRemove)),
              false,
            );
            assertEquals(updatedBookmark.updatedAt > bookmark.updatedAt, true);
          }
        }
      },
    ),
  );
});

Deno.test("Bookmark - should fail to remove non-existent tag", () => {
  fc.assert(
    fc.property(
      bookmarkIdGenerator,
      bookmarkTitleGenerator,
      bookmarkUrlGenerator,
      fc.array(bookmarkTagGenerator, { maxLength: 3 }),
      bookmarkTagGenerator,
      (id, title, url, tags, nonExistentTag) => {
        fc.pre(!tags.some((tag) => tag.equals(nonExistentTag)));

        const result = Bookmark.create(id, title, url, tags);

        if (Result.isSuccess(result)) {
          const bookmark = result.value;
          const updatedResult = bookmark.removeTag(nonExistentTag);

          assertEquals(Result.isFailure(updatedResult), true);
        }
      },
    ),
  );
});
