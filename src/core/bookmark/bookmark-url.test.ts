import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import { Result } from "@praha/byethrow";
import { BookmarkUrl } from "./bookmark-url.ts";

// Custom generator for valid URLs
const validUrlGenerator = fc.oneof(
  fc.constant("https://example.com"),
  fc.constant("http://example.com"),
  fc.constant("https://www.example.com/path?query=value"),
  fc.constant("http://localhost:3000"),
  fc.constant("https://github.com/user/repo"),
  fc.webUrl(),
);

// Custom generator for invalid URLs
const invalidUrlGenerator = fc.oneof(
  fc.constant(""),
  fc.constant("not-a-url"),
  fc.constant("ftp://example.com"),
  fc.constant("file:///path/to/file"),
  fc.constant("javascript:alert('xss')"),
  fc.constant("mailto:user@example.com"),
  fc.string().filter((s) =>
    !s.includes("://") ||
    (!s.startsWith("http://") && !s.startsWith("https://"))
  ),
);

Deno.test("BookmarkUrl - should create from valid URL string", () => {
  fc.assert(
    fc.property(validUrlGenerator, (url) => {
      const result = BookmarkUrl.create(url);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, url.trim());
      }
    }),
  );
});

Deno.test("BookmarkUrl - should reject invalid URL string", () => {
  fc.assert(
    fc.property(invalidUrlGenerator, (invalidUrl) => {
      const result = BookmarkUrl.create(invalidUrl);
      assertEquals(Result.isFailure(result), true);
    }),
  );
});

Deno.test("BookmarkUrl - should reject empty string", () => {
  const result = BookmarkUrl.create("");
  assertEquals(Result.isFailure(result), true);
});

Deno.test("BookmarkUrl - should reject non-http/https protocols", () => {
  const protocols = ["ftp://", "file://", "mailto:", "javascript:", "data:"];
  protocols.forEach((protocol) => {
    const result = BookmarkUrl.create(`${protocol}example.com`);
    assertEquals(Result.isFailure(result), true);
  });
});

Deno.test("BookmarkUrl - should trim whitespace", () => {
  fc.assert(
    fc.property(validUrlGenerator, (url) => {
      const withWhitespace = `  ${url}  `;
      const result = BookmarkUrl.create(withWhitespace);
      assertEquals(Result.isSuccess(result), true);
      if (Result.isSuccess(result)) {
        assertEquals(result.value.value, url.trim());
      }
    }),
  );
});

Deno.test("BookmarkUrl - should implement ValueObject interface", () => {
  fc.assert(
    fc.property(validUrlGenerator, (url) => {
      const result = BookmarkUrl.create(url);
      if (Result.isSuccess(result)) {
        const bookmarkUrl = result.value;
        // Should have value property
        assertEquals(bookmarkUrl.value, url.trim());
        // Should implement toString
        assertEquals(bookmarkUrl.toString(), url.trim());
        // Should implement equals
        const result2 = BookmarkUrl.create(url);
        if (Result.isSuccess(result2)) {
          assertEquals(bookmarkUrl.equals(result2.value), true);
        }
      }
    }),
  );
});

Deno.test("BookmarkUrl - equals should be reflexive", () => {
  fc.assert(
    fc.property(validUrlGenerator, (url) => {
      const result = BookmarkUrl.create(url);
      if (Result.isSuccess(result)) {
        const bookmarkUrl = result.value;
        assertEquals(bookmarkUrl.equals(bookmarkUrl), true);
      }
    }),
  );
});

Deno.test("BookmarkUrl - equals should be symmetric", () => {
  fc.assert(
    fc.property(validUrlGenerator, (url) => {
      const result1 = BookmarkUrl.create(url);
      const result2 = BookmarkUrl.create(url);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(
          result1.value.equals(result2.value),
          result2.value.equals(result1.value),
        );
      }
    }),
  );
});

Deno.test("BookmarkUrl - different URLs should not be equal", () => {
  fc.assert(
    fc.property(validUrlGenerator, validUrlGenerator, (url1, url2) => {
      fc.pre(url1.trim() !== url2.trim());
      const result1 = BookmarkUrl.create(url1);
      const result2 = BookmarkUrl.create(url2);
      if (Result.isSuccess(result1) && Result.isSuccess(result2)) {
        assertEquals(result1.value.equals(result2.value), false);
      }
    }),
  );
});
