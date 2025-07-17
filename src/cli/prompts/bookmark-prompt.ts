import { Confirm, Input } from "@cliffy/prompt";

export interface BookmarkData {
  url: string;
  title: string;
  tags: string[];
}

export async function promptForBookmarkData(): Promise<BookmarkData> {
  console.log("📖 Add New Bookmark");
  console.log("==================");

  const url = await Input.prompt({
    message: "Enter bookmark URL:",
    validate: (value) => {
      if (!value) {
        return "URL is required";
      }
      try {
        new URL(value);
        return true;
      } catch {
        return "Please enter a valid URL";
      }
    },
  });

  const title = await Input.prompt({
    message: "Enter bookmark title:",
    default: url,
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return "Title is required";
      }
      return true;
    },
  });

  const tagsInput = await Input.prompt({
    message: "Enter tags (comma-separated, optional):",
    default: "",
  });

  const tags = tagsInput
    ? tagsInput.split(",").map((tag) => tag.trim()).filter((tag) =>
      tag.length > 0
    )
    : [];

  // Confirmation
  console.log("\n📝 Bookmark Summary:");
  console.log(`URL: ${url}`);
  console.log(`Title: ${title}`);
  console.log(`Tags: ${tags.length > 0 ? tags.join(", ") : "None"}`);

  const confirm = await Confirm.prompt({
    message: "Add this bookmark?",
    default: true,
  });

  if (!confirm) {
    throw new Error("Bookmark creation cancelled");
  }

  return {
    url,
    title,
    tags,
  };
}
