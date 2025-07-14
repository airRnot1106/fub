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
      // Ensure directory exists
      await Deno.mkdir(this.dataDir, { recursive: true });

      // Load existing bookmarks
      const existingBookmarks = await this.loadBookmarks();

      // Convert bookmark to DTO
      const bookmarkDto = BookmarkMapper.toDto(bookmark);

      // Find existing bookmark by ID and replace, or add new
      const existingIndex = existingBookmarks.findIndex((b) =>
        b.id === bookmarkDto.id
      );
      if (existingIndex >= 0) {
        existingBookmarks[existingIndex] = bookmarkDto;
      } else {
        existingBookmarks.push(bookmarkDto);
      }

      // Save to file
      await Deno.writeTextFile(
        this.dataFile,
        JSON.stringify(existingBookmarks, null, 2),
      );

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
      if (Result.isFailure(domainResult)) {
        return Result.fail(new Error("Failed to convert DTO to domain"));
      }

      return Result.succeed(domainResult.value);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async findAll(): Promise<Result.Result<Bookmark[], Error>> {
    try {
      const bookmarkDtos = await this.loadBookmarks();
      const bookmarks: Bookmark[] = [];

      for (const dto of bookmarkDtos) {
        const domainResult = BookmarkMapper.toDomain(dto);
        if (Result.isFailure(domainResult)) {
          return Result.fail(new Error("Failed to convert DTO to domain"));
        }
        bookmarks.push(domainResult.value);
      }

      return Result.succeed(bookmarks);
    } catch (error) {
      return Result.fail(error as Error);
    }
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
}
