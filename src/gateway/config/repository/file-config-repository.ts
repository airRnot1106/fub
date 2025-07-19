import { Result } from "@praha/byethrow";
import type { ConfigRepository } from "../../../core/config/config.ts";
import type { ConfigKey } from "../../../core/config/config-key.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.210.0/fs/mod.ts";

export class FileConfigRepository implements ConfigRepository {
  private readonly configFile: string;

  constructor(configDir: string = "~/.config/bkm") {
    const expandedDir = configDir.replace("~", Deno.env.get("HOME") || "");
    this.configFile = join(expandedDir, "config.json");
  }

  async get(key: ConfigKey): Result.ResultAsync<string | null, Error> {
    try {
      const config = await this.loadConfig();
      return Result.succeed(config[key.value] || null);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async set(key: ConfigKey, value: string): Result.ResultAsync<void, Error> {
    try {
      const config = await this.loadConfig();
      config[key.value] = value;
      await this.saveConfig(config);
      return Result.succeed(undefined);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async remove(key: ConfigKey): Result.ResultAsync<void, Error> {
    try {
      const config = await this.loadConfig();
      delete config[key.value];
      await this.saveConfig(config);
      return Result.succeed(undefined);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  async getAll(): Result.ResultAsync<Record<string, string>, Error> {
    try {
      const config = await this.loadConfig();
      return Result.succeed(config);
    } catch (error) {
      return Result.fail(error as Error);
    }
  }

  private async loadConfig(): Promise<Record<string, string>> {
    try {
      const content = await Deno.readTextFile(this.configFile);
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {};
      }
      throw error;
    }
  }

  private async saveConfig(config: Record<string, string>): Promise<void> {
    await ensureDir(join(this.configFile, ".."));
    const content = JSON.stringify(config, null, 2);
    await Deno.writeTextFile(this.configFile, content);
  }
}
