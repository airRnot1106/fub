import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";

export function getConfigDirectory(): string {
  const homeDir = Deno.env.get("HOME") || "";
  return join(homeDir, ".config", "bkm");
}

export async function ensureConfigDirectory(configDir?: string): Promise<void> {
  const targetDir = configDir || getConfigDirectory();
  await ensureDir(targetDir);
}
