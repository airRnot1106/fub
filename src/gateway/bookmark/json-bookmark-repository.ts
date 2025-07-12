import { Result } from "@praha/byethrow";
import { Bookmark, BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../core/bookmark/bookmark-id.ts";
import { BookmarkTitle } from "../../core/bookmark/bookmark-title.ts";
import { BookmarkUrl } from "../../core/bookmark/bookmark-url.ts";
import { BookmarkTag } from "../../core/bookmark/bookmark-tag.ts";

interface BookmarkData {
  id: string;
  title: string;
  url: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class JsonBookmarkRepository implements BookmarkRepository {
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = `${dataDir}/bookmarks.json`;
  }

  async save(bookmark: Bookmark): Promise<Result.Result<void, Error>> {
    try {
      const bookmarks = await this.loadBookmarks();
      const bookmarkData: BookmarkData = {
        id: bookmark.id.value,
        title: bookmark.title.value,
        url: bookmark.url.value,
        tags: bookmark.tags.map((tag) => tag.value),
        createdAt: bookmark.createdAt.toISOString(),
        updatedAt: bookmark.updatedAt.toISOString(),
      };

      // Update existing or add new
      const existingIndex = bookmarks.findIndex((b) =>
        b.id === bookmark.id.value
      );
      if (existingIndex >= 0) {
        bookmarks[existingIndex] = bookmarkData;
      } else {
        bookmarks.push(bookmarkData);
      }

      await this.saveBookmarks(bookmarks);
      return Result.succeed(undefined);
    } catch (error) {
      return Result.fail(
        new Error(
          `Failed to save bookmark: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  async findById(
    id: BookmarkId,
  ): Promise<Result.Result<Bookmark | null, Error>> {
    try {
      const bookmarks = await this.loadBookmarks();
      const bookmarkData = bookmarks.find((b) => b.id === id.value);

      if (!bookmarkData) {
        return Result.succeed(null);
      }

      const bookmark = this.deserializeBookmark(bookmarkData);
      return Result.isSuccess(bookmark)
        ? Result.succeed(bookmark.value)
        : Result.fail(bookmark.error);
    } catch (error) {
      return Result.fail(
        new Error(
          `Failed to find bookmark: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  async findAll(): Promise<Result.Result<Bookmark[], Error>> {
    try {
      const bookmarksData = await this.loadBookmarks();
      const bookmarks: Bookmark[] = [];

      for (const data of bookmarksData) {
        const bookmarkResult = this.deserializeBookmark(data);
        if (Result.isSuccess(bookmarkResult)) {
          bookmarks.push(bookmarkResult.value);
        }
      }

      return Result.succeed(bookmarks);
    } catch (error) {
      return Result.fail(
        new Error(
          `Failed to find all bookmarks: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  async findByTag(tag: BookmarkTag): Promise<Result.Result<Bookmark[], Error>> {
    try {
      const bookmarksData = await this.loadBookmarks();
      const matchingBookmarks: Bookmark[] = [];

      for (const data of bookmarksData) {
        if (data.tags.includes(tag.value)) {
          const bookmarkResult = this.deserializeBookmark(data);
          if (Result.isSuccess(bookmarkResult)) {
            matchingBookmarks.push(bookmarkResult.value);
          }
        }
      }

      return Result.succeed(matchingBookmarks);
    } catch (error) {
      return Result.fail(
        new Error(
          `Failed to find bookmarks by tag: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  async delete(id: BookmarkId): Promise<Result.Result<void, Error>> {
    try {
      const bookmarks = await this.loadBookmarks();
      const filteredBookmarks = bookmarks.filter((b) => b.id !== id.value);
      await this.saveBookmarks(filteredBookmarks);
      return Result.succeed(undefined);
    } catch (error) {
      return Result.fail(
        new Error(
          `Failed to delete bookmark: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }

  private async loadBookmarks(): Promise<BookmarkData[]> {
    try {
      const data = await Deno.readTextFile(this.filePath);
      return JSON.parse(data);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }
  }

  private async saveBookmarks(bookmarks: BookmarkData[]): Promise<void> {
    // Ensure directory exists
    const dir = this.filePath.substring(0, this.filePath.lastIndexOf("/"));
    await Deno.mkdir(dir, { recursive: true });

    await Deno.writeTextFile(this.filePath, JSON.stringify(bookmarks, null, 2));
  }

  private deserializeBookmark(
    data: BookmarkData,
  ): Result.Result<Bookmark, Error> {
    try {
      const idResult = BookmarkId.create(data.id);
      const titleResult = BookmarkTitle.create(data.title);
      const urlResult = BookmarkUrl.create(data.url);
      const tagResults = data.tags.map((tag) => BookmarkTag.create(tag));

      if (Result.isFailure(idResult)) {
        return Result.fail(
          new Error(`Invalid bookmark ID: ${idResult.error.message}`),
        );
      }
      if (Result.isFailure(titleResult)) {
        return Result.fail(
          new Error(`Invalid bookmark title: ${titleResult.error.message}`),
        );
      }
      if (Result.isFailure(urlResult)) {
        return Result.fail(
          new Error(`Invalid bookmark URL: ${urlResult.error.message}`),
        );
      }

      const failedTags = tagResults.filter(Result.isFailure);
      if (failedTags.length > 0) {
        return Result.fail(
          new Error(
            `Invalid bookmark tags: ${
              failedTags.map((f) => f.error.message).join(", ")
            }`,
          ),
        );
      }

      const tags = tagResults.filter(Result.isSuccess).map((r) => r.value);
      const createdAt = new Date(data.createdAt);
      const updatedAt = new Date(data.updatedAt);

      return Result.succeed(
        new Bookmark(
          idResult.value,
          titleResult.value,
          urlResult.value,
          tags,
          createdAt,
          updatedAt,
        ),
      );
    } catch (error) {
      return Result.fail(
        new Error(
          `Failed to deserialize bookmark: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
      );
    }
  }
}
