import { runCLI } from "./src/cli/main.ts";

if (import.meta.main) {
  await runCLI(Deno.args);
}
