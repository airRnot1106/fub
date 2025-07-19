import { assertEquals } from "@std/assert";
import {
  ensureConfigDirectory,
  getConfigDirectory,
} from "./config-directory.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.210.0/fs/mod.ts";

Deno.test("getConfigDirectory - should return path to ~/.config/bkm", () => {
  const configDir = getConfigDirectory();
  const homeDir = Deno.env.get("HOME");

  if (homeDir) {
    const expectedPath = join(homeDir, ".config", "bkm");
    assertEquals(configDir, expectedPath);
  }
});

Deno.test("ensureConfigDirectory - should create directory if it doesn't exist", async () => {
  const tempDir = await Deno.makeTempDir();
  const configDir = join(tempDir, ".config", "bkm");

  try {
    assertEquals(existsSync(configDir), false);

    await ensureConfigDirectory(configDir);

    assertEquals(existsSync(configDir), true);

    const stats = await Deno.stat(configDir);
    assertEquals(stats.isDirectory, true);
  } finally {
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("ensureConfigDirectory - should handle existing directory", async () => {
  const tempDir = await Deno.makeTempDir();
  const configDir = join(tempDir, ".config", "bkm");

  try {
    await Deno.mkdir(configDir, { recursive: true });
    assertEquals(existsSync(configDir), true);

    await ensureConfigDirectory(configDir);

    assertEquals(existsSync(configDir), true);

    const stats = await Deno.stat(configDir);
    assertEquals(stats.isDirectory, true);
  } finally {
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
