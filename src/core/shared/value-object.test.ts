import { assertEquals } from "@std/assert";
import * as fc from "fast-check";
import type { ValueObject } from "./value-object.ts";

// Test implementation of ValueObject for testing
class TestValueObject implements ValueObject<string> {
  constructor(public readonly value: string) {}

  equals(other: ValueObject<string>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

Deno.test("ValueObject - should have value property", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const vo = new TestValueObject(str);
      assertEquals(vo.value, str);
    }),
  );
});

Deno.test("ValueObject - should implement equals method", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const vo1 = new TestValueObject(str);
      const vo2 = new TestValueObject(str);
      const vo3 = new TestValueObject(str + "different");

      // Same value should be equal
      assertEquals(vo1.equals(vo2), true);
      // Different value should not be equal
      assertEquals(vo1.equals(vo3), false);
    }),
  );
});

Deno.test("ValueObject - should implement toString method", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const vo = new TestValueObject(str);
      assertEquals(vo.toString(), str);
    }),
  );
});

Deno.test("ValueObject - equals should be reflexive", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const vo = new TestValueObject(str);
      assertEquals(vo.equals(vo), true);
    }),
  );
});

Deno.test("ValueObject - equals should be symmetric", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const vo1 = new TestValueObject(str);
      const vo2 = new TestValueObject(str);
      assertEquals(vo1.equals(vo2), vo2.equals(vo1));
    }),
  );
});

Deno.test("ValueObject - equals should be transitive", () => {
  fc.assert(
    fc.property(fc.string(), (str) => {
      const vo1 = new TestValueObject(str);
      const vo2 = new TestValueObject(str);
      const vo3 = new TestValueObject(str);

      if (vo1.equals(vo2) && vo2.equals(vo3)) {
        assertEquals(vo1.equals(vo3), true);
      }
    }),
  );
});
