import { Result } from "@praha/byethrow";

export interface ValueObject<T> {
  readonly value: T;
  equals(other: ValueObject<T>): boolean;
  toString(): string;
}

export type ValueObjectResult<T> = Result.Result<T, Error>;
