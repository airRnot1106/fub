import { Result } from "@praha/byethrow";
import type { BookmarkId } from "./bookmark-id.ts";
import type { BookmarkTitle } from "./bookmark-title.ts";
import type { BookmarkUrl } from "./bookmark-url.ts";
import type { BookmarkTag } from "./bookmark-tag.ts";

export class Bookmark {
  private constructor(
    public readonly id: BookmarkId,
    public readonly title: BookmarkTitle,
    public readonly url: BookmarkUrl,
    public readonly tags: readonly BookmarkTag[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    id: BookmarkId,
    title: BookmarkTitle,
    url: BookmarkUrl,
    tags: BookmarkTag[],
  ): Result.Result<Bookmark, Error> {
    const now = new Date();
    return Result.succeed(new Bookmark(id, title, url, tags, now, now));
  }

  static restore(
    id: BookmarkId,
    title: BookmarkTitle,
    url: BookmarkUrl,
    tags: BookmarkTag[],
    createdAt: Date,
    updatedAt: Date,
  ): Result.Result<Bookmark, Error> {
    return Result.succeed(
      new Bookmark(id, title, url, tags, createdAt, updatedAt),
    );
  }

  equals(other: Bookmark): boolean {
    return this.id.equals(other.id);
  }

  addTag(tag: BookmarkTag): Result.Result<Bookmark, Error> {
    // Check if tag already exists
    if (this.tags.some((existingTag) => existingTag.equals(tag))) {
      return Result.fail(new Error("Tag already exists"));
    }

    const newTags = [...this.tags, tag];
    const now = new Date(Date.now() + 1); // Ensure different timestamp
    return Result.succeed(
      new Bookmark(
        this.id,
        this.title,
        this.url,
        newTags,
        this.createdAt,
        now,
      ),
    );
  }

  removeTag(tag: BookmarkTag): Result.Result<Bookmark, Error> {
    // Check if tag exists
    if (!this.tags.some((existingTag) => existingTag.equals(tag))) {
      return Result.fail(new Error("Tag does not exist"));
    }

    const newTags = this.tags.filter((existingTag) => !existingTag.equals(tag));
    const now = new Date(Date.now() + 1); // Ensure different timestamp
    return Result.succeed(
      new Bookmark(
        this.id,
        this.title,
        this.url,
        newTags,
        this.createdAt,
        now,
      ),
    );
  }
}

// Repository interface
export interface BookmarkRepository {
  save(bookmark: Bookmark): Result.ResultAsync<void, Error>;
  findAll(): Result.ResultAsync<Bookmark[], Error>;
  findById(id: BookmarkId): Result.ResultAsync<Bookmark | null, Error>;
}
