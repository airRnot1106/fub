import { assertEquals } from "@std/assert";
import { Result } from "@praha/byethrow";
import { ConfigMapper } from "./config-mapper.ts";
import { ConfigDto } from "../dto/config-dto.ts";
import { ConfigKey } from "../../../core/config/config-key.ts";

Deno.test("ConfigMapper - should convert valid ConfigDto to domain objects", () => {
  const dto: ConfigDto = {
    key: "fuzzy.command",
    value: "fzf",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = ConfigMapper.toDomain(dto);

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.key.value, "fuzzy.command");
    assertEquals(result.value.value, "fzf");
    assertEquals(
      result.value.updatedAt.toISOString(),
      "2024-01-01T00:00:00.000Z",
    );
  }
});

Deno.test("ConfigMapper - should handle empty value", () => {
  const dto: ConfigDto = {
    key: "editor.args",
    value: "",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = ConfigMapper.toDomain(dto);

  assertEquals(Result.isSuccess(result), true);
  if (Result.isSuccess(result)) {
    assertEquals(result.value.value, "");
  }
});

Deno.test("ConfigMapper - should fail with invalid key", () => {
  const dto: ConfigDto = {
    key: "invalid..key",
    value: "test-value",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = ConfigMapper.toDomain(dto);

  assertEquals(Result.isFailure(result), true);
});

Deno.test("ConfigMapper - should fail with invalid date", () => {
  const dto: ConfigDto = {
    key: "fuzzy.command",
    value: "fzf",
    updatedAt: "invalid-date",
  };

  const result = ConfigMapper.toDomain(dto);

  assertEquals(Result.isFailure(result), true);
});

Deno.test("ConfigMapper - should convert domain objects to ConfigDto", () => {
  const keyResult = ConfigKey.create("theme.mode");
  const value = "dark";
  const updatedAt = new Date("2024-01-01T00:00:00.000Z");

  if (Result.isSuccess(keyResult)) {
    const dto = ConfigMapper.toDto(keyResult.value, value, updatedAt);

    assertEquals(dto.key, "theme.mode");
    assertEquals(dto.value, "dark");
    assertEquals(dto.updatedAt, "2024-01-01T00:00:00.000Z");
  }
});

Deno.test("ConfigMapper - should handle special characters in value", () => {
  const keyResult = ConfigKey.create("fuzzy.args");
  const value = '--height 40% --reverse --border="rounded"';
  const updatedAt = new Date("2024-01-01T00:00:00.000Z");

  if (Result.isSuccess(keyResult)) {
    const dto = ConfigMapper.toDto(keyResult.value, value, updatedAt);

    assertEquals(dto.value, '--height 40% --reverse --border="rounded"');
  }
});

Deno.test("ConfigMapper - should round-trip conversion", () => {
  const originalDto: ConfigDto = {
    key: "editor.command",
    value: "code",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const domainResult = ConfigMapper.toDomain(originalDto);
  assertEquals(Result.isSuccess(domainResult), true);

  if (Result.isSuccess(domainResult)) {
    const { key, value, updatedAt } = domainResult.value;
    const convertedDto = ConfigMapper.toDto(key, value, updatedAt);

    assertEquals(convertedDto.key, originalDto.key);
    assertEquals(convertedDto.value, originalDto.value);
    assertEquals(convertedDto.updatedAt, originalDto.updatedAt);
  }
});
