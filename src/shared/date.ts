import { isValid, parseISO } from "date-fns";
import { Result } from "@praha/byethrow";

export const parseDate = (dateString: string): Result.Result<Date, Error> => {
  const date = parseISO(dateString);
  if (!isValid(date)) {
    return Result.fail(new Error(`Invalid date: ${dateString}`));
  }
  return Result.succeed(date);
};
