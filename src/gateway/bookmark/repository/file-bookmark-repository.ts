import { Result } from "@praha/byethrow";
import {
  Bookmark,
  BookmarkRepository,
} from "../../../core/bookmark/bookmark.ts";
import { BookmarkId } from "../../../core/bookmark/bookmark-id.ts";
import { BookmarkMapper } from "../mapper/bookmark-mapper.ts";
import { BookmarkDto } from "../dto/bookmark-dto.ts";

export class FileBookmarkRepository implements BookmarkRepository {
  private readonly dataDir: string;
  private readonly dataFile: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.dataFile = `${dataDir}/bookmarks.json`;
  }

  async save(bookmark: Bookmark): Promise<Result.Result<void, Error>> {
    try {
      await this.ensureDirectoryExists();
      const existingBookmarks = await this.loadBookmarks();
      const bookmarkDto = BookmarkMapper.toDto(bookmark);
      const updatedBookmarks = this.upsertBookmark(
        existingBookmarks,
        bookmarkDto,
      );
      await this.saveBookmarks(updatedBookmarks);
      return Result.succeed(undefined);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findById(
    id: BookmarkId,
  ): Promise<Result.Result<Bookmark | null, Error>> {
    try {
      const bookmarks = await this.loadBookmarks();
      const bookmarkDto = bookmarks.find((b) => b.id === id.value);

      if (!bookmarkDto) {
        return Result.succeed(null);
      }

      const domainResult = BookmarkMapper.toDomain(bookmarkDto);
      return Result.pipe(
        domainResult,
        Result.mapError((errors) => Array.isArray(errors) ? errors[0] : errors),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findAll(): Promise<Result.Result<Bookmark[], Error>> {
    try {
      const bookmarkDtos = await this.loadBookmarks();
      const domainResults = bookmarkDtos.map((dto) =>
        BookmarkMapper.toDomain(dto)
      );
      const combinedResult = Result.combine(domainResults);

      return Result.pipe(
        combinedResult,
        Result.mapError((errors) => Array.isArray(errors) ? errors[0] : errors),
      );
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    await Deno.mkdir(this.dataDir, { recursive: true });
  }

  private async loadBookmarks(): Promise<BookmarkDto[]> {
    try {
      const content = await Deno.readTextFile(this.dataFile);
      return JSON.parse(content);
    } catch (error) {
      // If file doesn't exist, return empty array
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }
  }

  private async saveBookmarks(bookmarks: BookmarkDto[]): Promise<void> {
    await Deno.writeTextFile(
      this.dataFile,
      JSON.stringify(bookmarks, null, 2),
    );
  }

  private upsertBookmark(
    existingBookmarks: BookmarkDto[],
    bookmarkDto: BookmarkDto,
  ): BookmarkDto[] {
    const existingIndex = existingBookmarks.findIndex((b) =>
      b.id === bookmarkDto.id
    );

    if (existingIndex >= 0) {
      existingBookmarks[existingIndex] = bookmarkDto;
      return existingBookmarks;
    } else {
      return [...existingBookmarks, bookmarkDto];
    }
  }
}
