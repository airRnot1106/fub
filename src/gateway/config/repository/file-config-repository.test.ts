import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { FileConfigRepository } from "./file-config-repository.ts";
import { ConfigKey } from "../../../core/config/config-key.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.210.0/fs/mod.ts";

async function createTempRepository(): Promise<{
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

Deno.test("FileConfigRepository - should set and get config value", async () => {
  const { repository, cleanup } = await createTempRepository();

  try {
    const key = ConfigKey.create("test.key");
    const value = "test-value";

    if (Result.isSuccess(key)) {
      const setResult = await repository.set(key.value, value);
      assertEquals(Result.isSuccess(setResult), true);

      const getResult = await repository.get(key.value);
      assertEquals(Result.isSuccess(getResult), true);
      if (Result.isSuccess(getResult)) {
        assertEquals(getResult.value, value);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository - should return null for non-existent key", async () => {
  const { repository, cleanup } = await createTempRepository();

  try {
    const key = ConfigKey.create("nonexistent.key");

    if (Result.isSuccess(key)) {
      const result = await repository.get(key.value);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value, null);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository - should remove config value", async () => {
  const { repository, cleanup } = await createTempRepository();

  try {
    const key = ConfigKey.create("test.key");
    const value = "test-value";

    if (Result.isSuccess(key)) {
      await repository.set(key.value, value);

      const removeResult = await repository.remove(key.value);
      assertEquals(Result.isSuccess(removeResult), true);

      const getResult = await repository.get(key.value);
      assertEquals(Result.isSuccess(getResult), true);
      if (Result.isSuccess(getResult)) {
        assertEquals(getResult.value, null);
      }
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository - should get all config values", async () => {
  const { repository, cleanup } = await createTempRepository();

  try {
    const configs = [
      { key: "fuzzy.command", value: "fzf" },
      { key: "fuzzy.args", value: "--height 40%" },
      { key: "theme.mode", value: "dark" },
    ];

    for (const config of configs) {
      const key = ConfigKey.create(config.key);
      if (Result.isSuccess(key)) {
        await repository.set(key.value, config.value);
      }
    }

    const result = await repository.getAll();
    assertEquals(Result.isSuccess(result), true);
    if (Result.isSuccess(result)) {
      const config = result.value as Record<string, string>;
      assertEquals(Object.keys(config).length, 3);
      assertEquals(config["fuzzy.command"], "fzf");
      assertEquals(config["fuzzy.args"], "--height 40%");
      assertEquals(config["theme.mode"], "dark");
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository - should create config directory if not exists", async () => {
  const tempDir = await Deno.makeTempDir();
  const configDir = join(tempDir, ".config", "bkm");

  try {
    assertEquals(existsSync(configDir), false);

    const repository = new FileConfigRepository(configDir);
    const key = ConfigKey.create("test.key");

    if (Result.isSuccess(key)) {
      const result = await repository.set(key.value, "test-value");
      assertEquals(Result.isSuccess(result), true);
      assertEquals(existsSync(configDir), true);
    }
  } finally {
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("FileConfigRepository - property-based test for config operations", () => {
  fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }).filter((s) =>
        /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/.test(s)
      ),
      fc.string({ minLength: 1, maxLength: 100 }),
      async (keyStr, value) => {
        const { repository, cleanup } = await createTempRepository();

        try {
          const key = ConfigKey.create(keyStr);

          if (Result.isSuccess(key)) {
            const setResult = await repository.set(key.value, value);
            assertEquals(Result.isSuccess(setResult), true);

            const getResult = await repository.get(key.value);
            assertEquals(Result.isSuccess(getResult), true);
            if (Result.isSuccess(getResult)) {
              assertEquals(getResult.value, value);
            }
          }
        } finally {
          await cleanup();
        }
      },
    ),
    { numRuns: 20 },
  );
});
