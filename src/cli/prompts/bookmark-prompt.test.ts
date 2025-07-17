import { assertEquals } from "@std/assert";
import { promptForBookmarkData } from "./bookmark-prompt.ts";

// Note: These tests require manual input and cannot be automated
// They are kept for documentation purposes

Deno.test("promptForBookmarkData - should export the function", () => {
  // Test that the function is exported and is a function
  assertEquals(typeof promptForBookmarkData, "function");
});

Deno.test("promptForBookmarkData - should have correct interface", () => {
  // Test that the function returns a Promise
  const result = promptForBookmarkData();
  assertEquals(result instanceof Promise, true);

  // Cancel the prompt to avoid hanging
  result.catch(() => {
    // Expected to fail without user input
  });
});
