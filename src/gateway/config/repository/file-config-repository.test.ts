import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
// import * as fc from "fast-check";
import { FileConfigRepository } from "./file-config-repository.ts";
import { ConfigKey } from "../../../core/config/config-key.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";

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

Deno.test("FileConfigRepository - should set and get config value (new pattern)", async () => {
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

Deno.test("FileConfigRepository - should return null for non-existent key (new pattern)", async () => {
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

Deno.test("FileConfigRepository - should persist with updatedAt timestamp", async () => {
  const { repository, cleanup } = await createTempRepository();

  try {
    const key = ConfigKey.create("test.timestamp");
    const value = "test-value";

    if (Result.isSuccess(key)) {
      const beforeTime = new Date();
      await repository.set(key.value, value);
      const afterTime = new Date();

      // Read the actual file to verify timestamp was persisted
      const configFile = join(repository.dataDir, "config.json");
      const content = await Deno.readTextFile(configFile);
      const configs = JSON.parse(content);

      assertEquals(configs.length, 1);
      assertEquals(configs[0].key, "test.timestamp");
      assertEquals(configs[0].value, "test-value");

      const updatedAt = new Date(configs[0].updatedAt);
      assertEquals(updatedAt >= beforeTime, true);
      assertEquals(updatedAt <= afterTime, true);
    }
  } finally {
    await cleanup();
  }
});

Deno.test("FileConfigRepository - should use Result.try pattern for error handling", async () => {
  // Test with invalid directory to trigger error
  const invalidDir = "/invalid/path/that/does/not/exist";
  const repository = new FileConfigRepository(invalidDir);
  const key = ConfigKey.create("test.key");

  if (Result.isSuccess(key)) {
    const result = await repository.set(key.value, "test-value");
    assertEquals(Result.isFailure(result), true);
  }
});
