import { Command } from "@cliffy/command";
import { createAddCommand } from "./commands/add-command.ts";
import { createConfigCommand } from "./commands/config-command.ts";
import { FileBookmarkRepository } from "../gateway/bookmark/repository/file-bookmark-repository.ts";
import { FileConfigRepository } from "../gateway/config/repository/file-config-repository.ts";
import {
  ensureDataDirectory,
  getDataDirectory,
} from "./utils/data-directory.ts";
import { Result } from "@praha/byethrow";

export async function createCLI() {
  // Setup data directory
  const dataDirectoryResult = getDataDirectory();
  if (Result.isFailure(dataDirectoryResult)) {
    throw dataDirectoryResult.error;
  }

  const ensureResult = await ensureDataDirectory();
  if (Result.isFailure(ensureResult)) {
    throw ensureResult.error;
  }

  // Create repositories
  const bookmarkRepository = new FileBookmarkRepository(
    dataDirectoryResult.value,
  );
  const configRepository = new FileConfigRepository(dataDirectoryResult.value);

  // Create commands
  const addCommand = createAddCommand(bookmarkRepository);
  const configCommand = createConfigCommand(configRepository);

  const mainCommand = new Command()
    .name("bkm")
    .version("0.1.0")
    .description("Bookmark CLI tool with fuzzy finder")
    .action(() => {
      // Default action: show fuzzy finder (to be implemented)
      console.log("Default fuzzy finder action (not implemented yet)");
    });

  // Add subcommands
  mainCommand.command("add", addCommand);
  mainCommand.command("config", configCommand);

  return mainCommand;
}

export async function runCLI(args: string[]) {
  const cli = await createCLI();
  await cli.parse(args);
}
