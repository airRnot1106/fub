import { Command } from "@cliffy/command";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import { Result } from "@praha/byethrow";

export function createConfigCommand(repository: ConfigRepository): Command {
  const fuzzyCommand = new Command()
    .name("fuzzy")
    .description("Configure fuzzy finder settings")
    .option(
      "--command <command:string>",
      "Fuzzy finder command (e.g., fzf, peco)",
    )
    .option("--args <args:string>", "Fuzzy finder arguments")
    .action(async (options: { command?: string; args?: string }) => {
      if (options.command) {
        const keyResult = ConfigKey.create("fuzzy.command");
        if (Result.isSuccess(keyResult)) {
          const setResult = await repository.set(
            keyResult.value,
            options.command,
          );
          if (Result.isSuccess(setResult)) {
            console.log(`✅ Fuzzy finder command set to: ${options.command}`);
          } else {
            console.error("❌ Failed to save fuzzy finder command");
          }
        }
      }

      if (options.args) {
        const keyResult = ConfigKey.create("fuzzy.args");
        if (Result.isSuccess(keyResult)) {
          const setResult = await repository.set(keyResult.value, options.args);
          if (Result.isSuccess(setResult)) {
            console.log(`✅ Fuzzy finder args set to: ${options.args}`);
          } else {
            console.error("❌ Failed to save fuzzy finder args");
          }
        }
      }

      if (!options.command && !options.args) {
        // Show current configuration
        const commandKeyResult = ConfigKey.create("fuzzy.command");
        const argsKeyResult = ConfigKey.create("fuzzy.args");

        if (
          Result.isSuccess(commandKeyResult) && Result.isSuccess(argsKeyResult)
        ) {
          const commandResult = await repository.get(commandKeyResult.value);
          const argsResult = await repository.get(argsKeyResult.value);

          console.log("Current fuzzy finder configuration:");
          if (Result.isSuccess(commandResult) && commandResult.value) {
            console.log(`  Command: ${commandResult.value}`);
          } else {
            console.log("  Command: not set");
          }

          if (Result.isSuccess(argsResult) && argsResult.value) {
            console.log(`  Args: ${argsResult.value}`);
          } else {
            console.log("  Args: not set");
          }
        }
      }
    });

  return new Command()
    .name("config")
    .description("Manage configuration settings")
    .command("fuzzy", fuzzyCommand) as unknown as Command;
}
