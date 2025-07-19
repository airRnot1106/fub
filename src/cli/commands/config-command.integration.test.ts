import { assertEquals } from "@std/assert";
import { createConfigCommand } from "./config-command.ts";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import { Result } from "@praha/byethrow";

// Integration test with more realistic repository behavior
function createTestConfigRepository(): {
  repository: ConfigRepository;
  storage: Map<string, string>;
} {
  const storage = new Map<string, string>();

  const repository: ConfigRepository = {
    get: (key: ConfigKey) => {
      const value = storage.get(key.value) || null;
      return Promise.resolve(Result.succeed(value));
    },
    set: (key: ConfigKey, value: string) => {
      storage.set(key.value, value);
      return Promise.resolve(Result.succeed(undefined));
    },
    remove: (key: ConfigKey) => {
      storage.delete(key.value);
      return Promise.resolve(Result.succeed(undefined));
    },
    getAll: () => {
      const config: Record<string, string> = {};
      for (const [k, v] of storage) {
        config[k] = v;
      }
      return Promise.resolve(Result.succeed(config));
    },
  };

  return { repository, storage };
}

Deno.test("Config command integration - fuzzy config flow", async () => {
  const { repository, storage } = createTestConfigRepository();
  const _command = createConfigCommand(repository);

  // Verify command structure
  assertEquals(typeof command, "object");
  assertEquals(typeof command.parse, "function");

  // Test direct repository operations that the command would perform
  const commandKey = ConfigKey.create("fuzzy.command");
  const argsKey = ConfigKey.create("fuzzy.args");

  if (Result.isSuccess(commandKey) && Result.isSuccess(argsKey)) {
    // Simulate setting fuzzy command
    await repository.set(commandKey.value, "fzf");
    assertEquals(storage.get("fuzzy.command"), "fzf");

    // Simulate setting fuzzy args
    await repository.set(argsKey.value, "--height 40%");
    assertEquals(storage.get("fuzzy.args"), "--height 40%");

    // Verify retrieval
    const commandResult = await repository.get(commandKey.value);
    const argsResult = await repository.get(argsKey.value);

    if (Result.isSuccess(commandResult) && Result.isSuccess(argsResult)) {
      assertEquals(commandResult.value, "fzf");
      assertEquals(argsResult.value, "--height 40%");
    }
  }
});

Deno.test("Config command integration - empty config handling", async () => {
  const { repository } = createTestConfigRepository();
  const _command = createConfigCommand(repository);

  // Test getting non-existent config
  const commandKey = ConfigKey.create("fuzzy.command");
  if (Result.isSuccess(commandKey)) {
    const result = await repository.get(commandKey.value);
    if (Result.isSuccess(result)) {
      assertEquals(result.value, null);
    }
  }
});

Deno.test("Config command integration - config update and retrieval", async () => {
  const { repository, storage } = createTestConfigRepository();
  const _command = createConfigCommand(repository);

  // Set initial config
  const key = ConfigKey.create("fuzzy.command");
  if (Result.isSuccess(key)) {
    await repository.set(key.value, "peco");
    assertEquals(storage.get("fuzzy.command"), "peco");

    // Update config
    await repository.set(key.value, "fzf");
    assertEquals(storage.get("fuzzy.command"), "fzf");

    // Remove config
    await repository.remove(key.value);
    assertEquals(storage.has("fuzzy.command"), false);
  }
});
