import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import * as fc from "fast-check";
import { FuzzyFinderCommand } from "./fuzzy-finder-command.ts";

Deno.test("FuzzyFinderCommand - should create valid command", () => {
  const result = FuzzyFinderCommand.create("fzf");
  
  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.value, "fzf");
    assertEquals(result.value.toString(), "fzf");
  }
});

Deno.test("FuzzyFinderCommand - should reject empty string", () => {
  const result = FuzzyFinderCommand.create("");
  
  assertEquals(Result.isFailure(result), true);
  if (Result.isFailure(result)) {
    assertEquals(result.error.message.includes("empty"), true);
  }
});

Deno.test("FuzzyFinderCommand - should reject whitespace-only string", () => {
  const result = FuzzyFinderCommand.create("   ");
  
  assertEquals(Result.isFailure(result), true);
});

Deno.test("FuzzyFinderCommand - should accept valid commands", () => {
  const validCommands = [
    "fzf",
    "peco",
    "percol",
    "fzy",
    "sk",
    "rofi"
  ];
  
  validCommands.forEach(command => {
    const result = FuzzyFinderCommand.create(command);
    assertEquals(Result.isSuccess(result), true);
  });
});

Deno.test("FuzzyFinderCommand - should reject commands with invalid characters", () => {
  const invalidCommands = [
    "fzf&",          // ampersand
    "fzf|peco",      // pipe
    "fzf; rm",       // semicolon
    "fzf && echo",   // command injection
    "fzf$(rm)",      // command substitution
  ];
  
  invalidCommands.forEach(command => {
    const result = FuzzyFinderCommand.create(command);
    assertEquals(Result.isFailure(result), true);
  });
});

Deno.test("FuzzyFinderCommand - equals method should work correctly", () => {
  const cmd1Result = FuzzyFinderCommand.create("fzf");
  const cmd2Result = FuzzyFinderCommand.create("fzf");
  const cmd3Result = FuzzyFinderCommand.create("peco");
  
  if (Result.isSuccess(cmd1Result) && Result.isSuccess(cmd2Result) && Result.isSuccess(cmd3Result)) {
    assertEquals(cmd1Result.value.equals(cmd2Result.value), true);
    assertEquals(cmd1Result.value.equals(cmd3Result.value), false);
  }
});

Deno.test("FuzzyFinderCommand - property-based test for valid commands", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
        /^[a-zA-Z0-9_-]+$/.test(s)
      ),
      (command) => {
        const result = FuzzyFinderCommand.create(command);
        assertEquals(Result.isSuccess(result), true);
        
        if (Result.isSuccess(result)) {
          assertEquals(result.value.value, command);
        }
      }
    ),
    { numRuns: 100 }
  );
});