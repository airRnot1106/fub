import { Command } from "@cliffy/command";
import { Result } from "@praha/byethrow";
import { BookmarkRepository } from "../../core/bookmark/bookmark.ts";
import { AddBookmark } from "../../usecase/bookmark/add-bookmark.ts";
import { promptForBookmarkData } from "../prompts/bookmark-prompt.ts";

export function createAddCommand(repository: BookmarkRepository): Command {
  return new Command()
    .name("add")
    .description("Add a new bookmark")
    .option("--url <url:string>", "Bookmark URL")
    .option("-t, --title <title:string>", "Bookmark title")
    .option("--tags <tags:string>", "Comma-separated tags")
    .action(async (options) => {
      let bookmarkData;

      // If URL is provided, use command line mode
      if (options.url) {
        const title = options.title || options.url;
        const tags = options.tags
          ? options.tags.split(",").map((tag) => tag.trim())
          : [];

        bookmarkData = {
          url: options.url,
          title,
          tags,
        };

        console.log(`Adding bookmark: ${options.url}`);
        console.log(`Title: ${title}`);
        console.log(`Tags: ${tags.join(", ")}`);
      } else {
        // Interactive mode
        try {
          bookmarkData = await promptForBookmarkData();
        } catch (_error) {
          console.log("❌ Cancelled");
          return;
        }
      }

      // Create and execute add bookmark use case
      const addBookmark = new AddBookmark(repository);
      const result = await addBookmark.execute(
        bookmarkData.url,
        bookmarkData.title,
        bookmarkData.tags,
      );

      if (Result.isSuccess(result)) {
        console.log("✅ Bookmark added successfully!");
        console.log(`ID: ${result.value.id.toString()}`);
      } else {
        console.error("❌ Failed to add bookmark:");
        result.error.forEach((error) => console.error(`  ${error.message}`));
      }
    });
}
