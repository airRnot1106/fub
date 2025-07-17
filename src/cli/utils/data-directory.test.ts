import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import { ensureDataDirectory, getDataDirectory } from "./data-directory.ts";

Deno.test("getDataDirectory - should return path to ~/.local/share/bkm", () => {
  const result = getDataDirectory();

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    const path = result.value;
    assertEquals(path.includes(".local/share/bkm"), true);
    assertEquals(path.endsWith("bkm"), true);
  }
});

Deno.test("ensureDataDirectory - should create directory if it doesn't exist", async () => {
  const result = await ensureDataDirectory();

  assertEquals(Result.isSuccess(result), true);

  // Verify directory exists
  const dirResult = getDataDirectory();
  if (Result.isSuccess(dirResult)) {
    const stat = await Deno.stat(dirResult.value);
    assertEquals(stat.isDirectory, true);
  }
});

Deno.test("ensureDataDirectory - should handle existing directory", async () => {
  // Call twice to ensure it handles existing directory
  const result1 = await ensureDataDirectory();
  const result2 = await ensureDataDirectory();

  assertEquals(Result.isSuccess(result1), true);
  assertEquals(Result.isSuccess(result2), true);
});
