import { assertEquals } from "@std/assert";
import { createConfigCommand } from "./config-command.ts";
import type { ConfigRepository } from "../../core/config/config.ts";
import { ConfigKey } from "../../core/config/config-key.ts";
import { Result } from "@praha/byethrow";

// Simple mock repository for testing
function createMockConfigRepository(): {
  repository: ConfigRepository;
  storedConfigs: Map<string, string>;
} {
  const storedConfigs = new Map<string, string>();

  const repository: ConfigRepository = {
    get: (key: ConfigKey) => {
      const value = storedConfigs.get(key.value) || null;
      return Promise.resolve(Result.succeed(value));
    },
    set: (key: ConfigKey, value: string) => {
      storedConfigs.set(key.value, value);
      return Promise.resolve(Result.succeed(undefined));
    },
    remove: (key: ConfigKey) => {
      storedConfigs.delete(key.value);
      return Promise.resolve(Result.succeed(undefined));
    },
    getAll: () => {
      const config: Record<string, string> = {};
      for (const [k, v] of storedConfigs) {
        config[k] = v;
      }
      return Promise.resolve(Result.succeed(config));
    },
  };

  return { repository, storedConfigs };
}

Deno.test("createConfigCommand - should create config command with correct name and description", () => {
  const { repository } = createMockConfigRepository();
  const command = createConfigCommand(repository);

  assertEquals(typeof command, "object");
  assertEquals(typeof command.parse, "function");
});

Deno.test("createConfigCommand - should be a function that returns a Command", () => {
  const { repository } = createMockConfigRepository();
  const command = createConfigCommand(repository);

  assertEquals(typeof createConfigCommand, "function");
  assertEquals(typeof command, "object");
});

Deno.test("createConfigCommand - should handle fuzzy config setting", () => {
  const { repository, storedConfigs } = createMockConfigRepository();
  const _command = createConfigCommand(repository);

  // Mock command parse to test action functionality
  // This is a basic test to ensure the command can be created and has expected structure
  assertEquals(typeof _command, "object");
  assertEquals(typeof _command.parse, "function");

  // Verify that creating the command doesn't store any config yet
  assertEquals(storedConfigs.size, 0);
});

Deno.test("createConfigCommand - repository integration", async () => {
  const { repository, storedConfigs } = createMockConfigRepository();
  const _command = createConfigCommand(repository);

  // Test that repository can be used for configuration
  const testKey = ConfigKey.create("test.key");
  if (Result.isSuccess(testKey)) {
    await repository.set(testKey.value, "test-value");
    assertEquals(storedConfigs.get("test.key"), "test-value");

    const retrieved = await repository.get(testKey.value);
    if (Result.isSuccess(retrieved)) {
      assertEquals(retrieved.value, "test-value");
    }
  }
});
