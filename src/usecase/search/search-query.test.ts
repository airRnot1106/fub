import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { SearchQuery } from "./search-query.ts";

// Custom generator for valid search query strings
const validQueryGenerator = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0,
);

// Custom generator for invalid search query strings
const invalidQueryGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("   "),
  fc.constant("  \t  \n  "), // Only whitespace characters
  fc.string({ minLength: 201, maxLength: 300 }).filter((s) =>
    s.trim().length > 200
  ), // Too long after trim
  fc.string().filter((s) => s.trim().length === 0 && s.length > 0), // Non-empty but only whitespace
);

Deno.test("SearchQuery - should create from valid string", () => {
  fc.assert(
    fc.property(validQueryGenerator, (query) => {
      const result = SearchQuery.create(query);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, query.trim());
      }
    }),
  );
});

Deno.test("SearchQuery - should reject invalid string", () => {
  fc.assert(
    fc.property(invalidQueryGenerator, (invalidQuery) => {
      const result = SearchQuery.create(invalidQuery);
      assertEquals(Result.isFailure(result), true);
    }),
  );
});

Deno.test("SearchQuery - should reject empty string", () => {
  const result = SearchQuery.create("");
  assertEquals(Result.isFailure(result), true);
});

Deno.test("SearchQuery - should reject whitespace-only string", () => {
  fc.assert(
    fc.property(
      fc.string().filter((s) => s.trim() === "" && s.length > 0),
      (whitespaceOnly) => {
        const result = SearchQuery.create(whitespaceOnly);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("SearchQuery - should reject too long string", () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 201 }).filter((s) => s.trim().length > 200),
      (longQuery) => {
        const result = SearchQuery.create(longQuery);
        assertEquals(Result.isFailure(result), true);
      },
    ),
  );
});

Deno.test("SearchQuery - should trim whitespace", () => {
  fc.assert(
    fc.property(validQueryGenerator, (query) => {
      const withWhitespace = `  ${query}  `;
      const result = SearchQuery.create(withWhitespace);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, query.trim());
      }
    }),
  );
});

Deno.test("SearchQuery - should implement ValueObject interface", () => {
  fc.assert(
    fc.property(validQueryGenerator, (query) => {
      const result = SearchQuery.create(query);
      if (Result.isSuccess(result)) {
        const searchQuery = result.value;
        const trimmed = query.trim();
        // Should have value property
        assertEquals(searchQuery.value, trimmed);
        // Should implement toString
        assertEquals(searchQuery.toString(), trimmed);
        // Should implement equals
        const result2 = SearchQuery.create(query);
        if (Result.isSuccess(result2)) {
          assertEquals(searchQuery.equals(result2.value), true);
        }
      }
    }),
  );
});

Deno.test("SearchQuery - equals should be reflexive", () => {
  fc.assert(
    fc.property(validQueryGenerator, (query) => {
      const result = SearchQuery.create(query);
      if (Result.isSuccess(result)) {
        const searchQuery = result.value;
        assertEquals(searchQuery.equals(searchQuery), true);
      }
    }),
  );
});

Deno.test("SearchQuery - equals should be symmetric", () => {
  fc.assert(
    fc.property(validQueryGenerator, (query) => {
      const result1 = SearchQuery.create(query);
      const result2 = SearchQuery.create(query);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(
          result1.value.equals(result2.value),
          result2.value.equals(result1.value),
        );
      }
    }),
  );
});

Deno.test("SearchQuery - different queries should not be equal", () => {
  fc.assert(
    fc.property(validQueryGenerator, validQueryGenerator, (query1, query2) => {
      fc.pre(query1.trim() !== query2.trim());
      const result1 = SearchQuery.create(query1);
      const result2 = SearchQuery.create(query2);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(result1.value.equals(result2.value), false);
      }
    }),
  );
});
