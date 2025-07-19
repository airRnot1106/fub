import { Result } from "@praha/byethrow";
import type { ConfigRepository } from "../../../core/config/config.ts";
import type { ConfigKey } from "../../../core/config/config-key.ts";
import { ConfigMapper } from "../mapper/config-mapper.ts";
import { ConfigDto } from "../dto/config-dto.ts";
import { join } from "https://deno.land/std@0.210.0/path/mod.ts";

export class FileConfigRepository implements ConfigRepository {
  readonly dataDir: string;
  private readonly dataFile: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.dataFile = join(dataDir, "config.json");
  }

  get(key: ConfigKey): Result.ResultAsync<string | null, Error> {
    return Result.pipe(
      Result.try({
        try: async () => {
          const configDtos = await this.loadConfigs();
          const configDto = configDtos.find((c) => c.key === key.value);
          return configDto;
        },
        catch: (error) =>
          error instanceof Error ? error : new Error(String(error)),
      })(),
      Result.andThen((configDto) => {
        if (!configDto) {
          return Result.succeed(null);
        }
        const domainResult = ConfigMapper.toDomain(configDto);
        return Result.isSuccess(domainResult)
          ? Result.succeed(domainResult.value.value)
          : Result.fail(domainResult.error);
      }),
    );
  }

  set(key: ConfigKey, value: string): Result.ResultAsync<void, Error> {
    return Result.try({
      try: async () => {
        await this.ensureDirectoryExists();
        const existingConfigs = await this.loadConfigs();
        const configDto = ConfigMapper.toDto(key, value, new Date());
        const updatedConfigs = this.upsertConfig(existingConfigs, configDto);
        await this.saveConfigs(updatedConfigs);
      },
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    })();
  }

  remove(key: ConfigKey): Result.ResultAsync<void, Error> {
    return Result.try({
      try: async () => {
        await this.ensureDirectoryExists();
        const existingConfigs = await this.loadConfigs();
        const configIndex = existingConfigs.findIndex((c) =>
          c.key === key.value
        );

        if (configIndex === -1) {
          throw new Error("Config not found");
        }

        const updatedConfigs = existingConfigs.filter((c) =>
          c.key !== key.value
        );
        await this.saveConfigs(updatedConfigs);
      },
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    })();
  }

  getAll(): Result.ResultAsync<Record<string, string>, Error> {
    return Result.pipe(
      Result.try({
        try: async () => {
          const configDtos = await this.loadConfigs();
          return configDtos;
        },
        catch: (error) =>
          error instanceof Error ? error : new Error(String(error)),
      })(),
      Result.andThen((configDtos) => {
        const configRecord: Record<string, string> = {};

        for (const dto of configDtos) {
          const domainResult = ConfigMapper.toDomain(dto);
          if (Result.isSuccess(domainResult)) {
            configRecord[domainResult.value.key.value] =
              domainResult.value.value;
          } else {
            return Result.fail(domainResult.error);
          }
        }

        return Result.succeed(configRecord);
      }),
    );
  }

  private async ensureDirectoryExists(): Promise<void> {
    await Deno.mkdir(this.dataDir, { recursive: true });
  }

  private async loadConfigs(): Promise<ConfigDto[]> {
    try {
      const content = await Deno.readTextFile(this.dataFile);
      return JSON.parse(content);
    } catch (error) {
      // If file doesn't exist, return empty array
      if (error instanceof Deno.errors.NotFound) {
        return [];
      }
      throw error;
    }
  }

  private async saveConfigs(configs: ConfigDto[]): Promise<void> {
    await Deno.writeTextFile(
      this.dataFile,
      JSON.stringify(configs, null, 2),
    );
  }

  private upsertConfig(
    existingConfigs: ConfigDto[],
    configDto: ConfigDto,
  ): ConfigDto[] {
    const existingIndex = existingConfigs.findIndex((c) =>
      c.key === configDto.key
    );

    if (existingIndex >= 0) {
      existingConfigs[existingIndex] = configDto;
      return existingConfigs;
    } else {
      return [...existingConfigs, configDto];
    }
  }
}
