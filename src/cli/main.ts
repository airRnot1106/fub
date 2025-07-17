import { Command } from "@cliffy/command";
import { createAddCommand } from "./commands/add-command.ts";
import { FileBookmarkRepository } from "../gateway/bookmark/repository/file-bookmark-repository.ts";
import {
  ensureDataDirectory,
  getDataDirectory,
} from "./utils/data-directory.ts";
import { Result } from "@praha/byethrow";

export async function createCLI(): Promise<Command> {
  // Setup data directory
  const dataDirectoryResult = getDataDirectory();
  if (Result.isFailure(dataDirectoryResult)) {
    throw dataDirectoryResult.error;
  }

  const ensureResult = await ensureDataDirectory();
  if (Result.isFailure(ensureResult)) {
    throw ensureResult.error;
  }

  // Create repository
  const repository = new FileBookmarkRepository(dataDirectoryResult.value);

  // Create add command
  const addCommand = createAddCommand(repository);

  const mainCommand = new Command()
    .name("bkm")
    .version("0.1.0")
    .description("Bookmark CLI tool with fuzzy finder")
    .action(() => {
      // Default action: show fuzzy finder (to be implemented)
      console.log("Default fuzzy finder action (not implemented yet)");
    });

  // Add subcommand
  mainCommand.command("add", addCommand);

  return mainCommand;
}

export async function runCLI(args: string[]): Promise<void> {
  const cli = await createCLI();
  await cli.parse(args);
}
