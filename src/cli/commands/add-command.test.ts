import { assertEquals } from "@std/assert";
import { createAddCommand } from "./add-command.ts";
import { createMockRepository } from "../../core/bookmark/mocks.ts";

Deno.test("createAddCommand - should create add command with correct name and description", () => {
  const mockRepository = createMockRepository();
  const command = createAddCommand(mockRepository);

  assertEquals(command.getName(), "add");
  assertEquals(command.getDescription(), "Add a new bookmark");
});

Deno.test("createAddCommand - should be a function that returns a Command", () => {
  const mockRepository = createMockRepository();
  const command = createAddCommand(mockRepository);

  // Test that command is a Command instance
  assertEquals(typeof command, "object");
  assertEquals(typeof command.getName, "function");
  assertEquals(typeof command.getDescription, "function");
});

Deno.test("createAddCommand - should handle basic creation without errors", () => {
  const mockRepository = createMockRepository();

  // Should not throw an error
  const command = createAddCommand(mockRepository);
  assertEquals(command.getName(), "add");
});

Deno.test("createAddCommand - should have URL as option instead of argument", () => {
  const mockRepository = createMockRepository();
  const command = createAddCommand(mockRepository);

  // Test that command has no arguments (URL should be an option)
  const args = command.getArguments();
  assertEquals(args.length, 0);

  // Test that command has URL option
  const options = command.getOptions();
  const urlOption = options.find((opt) => opt.name === "url");
  const titleOption = options.find((opt) => opt.name === "title");
  const tagsOption = options.find((opt) => opt.name === "tags");

  assertEquals(urlOption !== undefined, true);
  assertEquals(titleOption !== undefined, true);
  assertEquals(tagsOption !== undefined, true);
});
