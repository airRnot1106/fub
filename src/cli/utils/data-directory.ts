import { Result } from "@praha/byethrow";

export function getDataDirectory(): Result.Result<string, Error> {
  try {
    const homeDir = Deno.env.get("HOME");
    if (!homeDir) {
      return Result.fail(new Error("HOME environment variable not found"));
    }

    const dataDir = `${homeDir}/.local/share/bkm`;
    return Result.succeed(dataDir);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

export function ensureDataDirectory(): Result.ResultAsync<void, Error> {
  return Result.try({
    try: async () => {
      const dirResult = getDataDirectory();
      if (Result.isFailure(dirResult)) {
        throw dirResult.error;
      }

      const dataDir = dirResult.value;
      await Deno.mkdir(dataDir, { recursive: true });
    },
    catch: (error) => error instanceof Error ? error : new Error(String(error)),
  })();
}
