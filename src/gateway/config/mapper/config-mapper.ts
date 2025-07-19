import { Result } from "@praha/byethrow";
import { ConfigKey } from "../../../core/config/config-key.ts";
import { ConfigDto } from "../dto/config-dto.ts";
import { parseDate } from "../../../shared/date.ts";

export interface ConfigDomainData {
  key: ConfigKey;
  value: string;
  updatedAt: Date;
}

export class ConfigMapper {
  static toDomain(dto: ConfigDto): Result.Result<ConfigDomainData, Error> {
    return Result.pipe(
      Result.do(),
      Result.bind("key", () => ConfigKey.create(dto.key)),
      Result.bind("updatedAt", () => parseDate(dto.updatedAt)),
      Result.andThen(({ key, updatedAt }) =>
        Result.succeed({
          key,
          value: dto.value,
          updatedAt,
        })
      ),
    );
  }

  static toDto(key: ConfigKey, value: string, updatedAt: Date): ConfigDto {
    return {
      key: key.value,
      value: value,
      updatedAt: updatedAt.toISOString(),
    };
  }
}
