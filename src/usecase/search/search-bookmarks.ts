import { Result } from "@praha/byethrow";
import type {
  Bookmark,
  BookmarkRepository,
} from "../../core/bookmark/bookmark.ts";
import type { SearchQuery } from "./search-query.ts";

export class SearchBookmarks {
  constructor(private readonly repository: BookmarkRepository) {}

  async execute(query: SearchQuery): Promise<Result.Result<Bookmark[], Error>> {
    const bookmarksResult = await this.repository.findAll();

    if (Result.isFailure(bookmarksResult)) {
      return Result.fail(new Error("Failed to retrieve bookmarks"));
    }

    const bookmarks = bookmarksResult.value;
    const searchTerm = query.value.toLowerCase();

    const filteredBookmarks = bookmarks.filter((bookmark) =>
      this.matchesSearchTerm(bookmark, searchTerm)
    );

    return Result.succeed(filteredBookmarks);
  }

  private matchesSearchTerm(bookmark: Bookmark, searchTerm: string): boolean {
    return this.matchesTitle(bookmark, searchTerm) ||
      this.matchesUrl(bookmark, searchTerm) ||
      this.matchesTags(bookmark, searchTerm);
  }

  private matchesTitle(bookmark: Bookmark, searchTerm: string): boolean {
    return bookmark.title.value.toLowerCase().includes(searchTerm);
  }

  private matchesUrl(bookmark: Bookmark, searchTerm: string): boolean {
    return bookmark.url.value.toLowerCase().includes(searchTerm);
  }

  private matchesTags(bookmark: Bookmark, searchTerm: string): boolean {
    return bookmark.tags.some((tag) =>
      tag.value.toLowerCase().includes(searchTerm)
    );
  }
}
