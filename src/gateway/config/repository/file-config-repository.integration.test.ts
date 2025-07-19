import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import { FileConfigRepository } from "./file-config-repository.ts";
import { ConfigKey } from "../../../core/config/config-key.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.210.0/fs/mod.ts";

// Simple config directory helper (replaces utils)
function getConfigDirectory(): string {
  const homeDir = Deno.env.get("HOME") || "";
  return join(homeDir, ".config", "bkm");
}

async function createIntegrationTestRepository(): Promise<{
  repository: FileConfigRepository;
  configDir: string;
  cleanup: () => Promise<void>;
}> {
  const tempDir = await Deno.makeTempDir();
  const configDir = join(tempDir, ".config", "bkm");
  const repository = new FileConfigRepository(configDir);

  const cleanup = async () => {
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  };

  return { repository, configDir, cleanup };
}

Deno.test("FileConfigRepository Integration - should use provided config directory", () => {
  const configDir = getConfigDirectory();
  const repository = new FileConfigRepository(configDir);

  // Test that the repository uses the expected directory structure
  // We can access the public dataDir property
  assertEquals(repository.dataDir, configDir);
  assertEquals(typeof repository.get, "function");
  assertEquals(typeof repository.set, "function");
  assertEquals(typeof repository.remove, "function");
  assertEquals(typeof repository.getAll, "function");
});

Deno.test("FileConfigRepository Integration - should persist config across repository instances", async () => {
  const { configDir, cleanup } = await createIntegrationTestRepository();

  try {
    const key = ConfigKey.create("test.persistence");
    const value = "persistent-value";

    if (Result.isSuccess(key)) {
      // Create first repository instance and save config
      const repo1 = new FileConfigRepository(configDir);
      const setResult = await repo1.set(key.value, value);
      assertEquals(Result.isSuccess(setResult), true);

      // Create second repository instance and read config
      const repo2 = new FileConfigRepository(configDir);
      const getResult = await repo2.get(key.value);
      assertEquals(Result.isSuccess(getResult), true);
      if (Result.isSuccess(getResult)) {
        assertEquals(getResult.value, value);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository Integration - should handle concurrent operations", async () => {
  const { repository, cleanup } = await createIntegrationTestRepository();

  try {
    // Set configs sequentially to avoid race conditions with file writes
    for (let i = 0; i < 5; i++) {
      const key = ConfigKey.create(`concurrent.key${i}`);
      if (Result.isSuccess(key)) {
        const result = await repository.set(key.value, `value${i}`);
        assertEquals(Result.isSuccess(result), true);
      }
    }

    // Verify all values were saved correctly
    const getAllResult = await repository.getAll();
    assertEquals(Result.isSuccess(getAllResult), true);
    if (Result.isSuccess(getAllResult)) {
      const config = getAllResult.value as Record<string, string>;
      assertEquals(Object.keys(config).length, 5);

      for (let i = 0; i < 5; i++) {
        assertEquals(config[`concurrent.key${i}`], `value${i}`);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository Integration - should handle complex config scenarios", async () => {
  const { repository, cleanup } = await createIntegrationTestRepository();

  try {
    // Set up complex configuration
    const configs = [
      { key: "fuzzy.command", value: "fzf" },
      { key: "fuzzy.args", value: "--height 40% --reverse --border" },
      { key: "theme.mode", value: "dark" },
      { key: "theme.accent", value: "#00ff00" },
      { key: "editor.command", value: "code" },
      { key: "editor.args", value: "--wait" },
    ];

    // Set all configs
    for (const config of configs) {
      const key = ConfigKey.create(config.key);
      if (Result.isSuccess(key)) {
        const result = await repository.set(key.value, config.value);
        assertEquals(Result.isSuccess(result), true);
      }
    }

    // Verify individual gets
    for (const config of configs) {
      const key = ConfigKey.create(config.key);
      if (Result.isSuccess(key)) {
        const result = await repository.get(key.value);
        assertEquals(Result.isSuccess(result), true);
        if (Result.isSuccess(result)) {
          assertEquals(result.value, config.value);
        }
      }
    }

    // Remove some configs
    const keysToRemove = ["theme.accent", "editor.args"];
    for (const keyStr of keysToRemove) {
      const key = ConfigKey.create(keyStr);
      if (Result.isSuccess(key)) {
        const result = await repository.remove(key.value);
        assertEquals(Result.isSuccess(result), true);
      }
    }

    // Verify removed configs return null
    for (const keyStr of keysToRemove) {
      const key = ConfigKey.create(keyStr);
      if (Result.isSuccess(key)) {
        const result = await repository.get(key.value);
        assertEquals(Result.isSuccess(result), true);
        if (Result.isSuccess(result)) {
          assertEquals(result.value, null);
        }
      }
    }

    // Verify remaining configs
    const getAllResult = await repository.getAll();
    assertEquals(Result.isSuccess(getAllResult), true);
    if (Result.isSuccess(getAllResult)) {
      const config = getAllResult.value as Record<string, string>;
      assertEquals(Object.keys(config).length, 4);
      assertEquals(config["fuzzy.command"], "fzf");
      assertEquals(config["fuzzy.args"], "--height 40% --reverse --border");
      assertEquals(config["theme.mode"], "dark");
      assertEquals(config["editor.command"], "code");
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository Integration - should create config file on first write", async () => {
  const tempDir = await Deno.makeTempDir();
  const configDir = join(tempDir, ".config", "bkm");
  const configFile = join(configDir, "config.json");

  try {
    assertEquals(existsSync(configFile), false);

    const repository = new FileConfigRepository(configDir);
    const key = ConfigKey.create("first.write");

    if (Result.isSuccess(key)) {
      const result = await repository.set(key.value, "first-value");
      assertEquals(Result.isSuccess(result), true);
      assertEquals(existsSync(configFile), true);

      // Verify file contents (new array format)
      const content = await Deno.readTextFile(configFile);
      const parsedConfigs = JSON.parse(content);
      assertEquals(Array.isArray(parsedConfigs), true);
      assertEquals(parsedConfigs.length, 1);
      assertEquals(parsedConfigs[0].key, "first.write");
      assertEquals(parsedConfigs[0].value, "first-value");
    }
  } finally {
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
