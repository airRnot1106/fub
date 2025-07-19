import { assertEquals } from "@std/assert";
import { ConfigDto } from "./config-dto.ts";

Deno.test("ConfigDto - should have key property", () => {
  const dto: ConfigDto = {
    key: "fuzzy.command",
    value: "fzf",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  assertEquals(typeof dto.key, "string");
  assertEquals(dto.key, "fuzzy.command");
});

Deno.test("ConfigDto - should have value property", () => {
  const dto: ConfigDto = {
    key: "fuzzy.args",
    value: "--height 40%",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  assertEquals(typeof dto.value, "string");
  assertEquals(dto.value, "--height 40%");
});

Deno.test("ConfigDto - should have updatedAt property", () => {
  const dto: ConfigDto = {
    key: "theme.mode",
    value: "dark",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  assertEquals(typeof dto.updatedAt, "string");
  assertEquals(dto.updatedAt, "2024-01-01T00:00:00.000Z");
});

Deno.test("ConfigDto - should support empty value", () => {
  const dto: ConfigDto = {
    key: "editor.args",
    value: "",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  assertEquals(dto.value, "");
});

Deno.test("ConfigDto - should be JSON serializable", () => {
  const dto: ConfigDto = {
    key: "test.key",
    value: "test value",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const json = JSON.stringify(dto);
  const parsed = JSON.parse(json);

  assertEquals(parsed.key, dto.key);
  assertEquals(parsed.value, dto.value);
  assertEquals(parsed.updatedAt, dto.updatedAt);
});

Deno.test("ConfigDto - should handle special characters in value", () => {
  const dto: ConfigDto = {
    key: "fuzzy.args",
    value: '--height 40% --reverse --border="rounded"',
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  assertEquals(dto.value, '--height 40% --reverse --border="rounded"');
});
