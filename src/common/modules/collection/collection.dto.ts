import { FromBody, FromParam } from 'bwcx-common';
import {
  IsString,
  Length,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

@ValidatorConstraint({ name: 'isJsonValue', async: false })
class IsJsonValueConstraint implements ValidatorConstraintInterface {
  public validate(value: unknown): boolean {
    return isJsonValue(value, new WeakSet());
  }

  public defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid JSON value`;
  }
}

export class CreateCollectionReqDTO {
  @FromBody()
  @IsString()
  @Length(1, 64)
  public uk: string;

  @FromBody()
  @Validate(IsJsonValueConstraint)
  public content: JsonValue;
}

export class CreateCollectionRespDTO {
  public _id: string;
}

export class UpdateCollectionReqDTO {
  @FromParam()
  @IsString()
  @Length(1, 64)
  public uk: string;

  @FromBody()
  @Validate(IsJsonValueConstraint)
  public content: JsonValue;
}

export class GetCollectionReqDTO {
  @FromParam()
  @IsString()
  @Length(1, 64)
  public uk: string;
}

export class GetPublicCollectionReqDTO {
  @FromParam()
  @IsString()
  @Length(1, 64)
  public uk: string;
}

export class CollectionSummaryDTO {
  public _id: string;
  public uk: string;
  public createdAt: string;
  public updatedAt: string;
}

export class AdminCollectionSummaryDTO extends CollectionSummaryDTO {
  public deletedAt: string | null;
}

export class GetCollectionsRespDTO {
  public collections: AdminCollectionSummaryDTO[];
}

export class GetPublicCollectionsRespDTO {
  public collections: CollectionSummaryDTO[];
}

export class GetPublicCollectionRespDTO {
  public _id: string;
  public uk: string;
  public content: JsonValue;
  public createdAt: string;
  public updatedAt: string;
}

export class GetCollectionRespDTO extends GetPublicCollectionRespDTO {
  public deletedAt: string | null;
}

export class DeleteCollectionReqDTO {
  @FromParam()
  @IsString()
  @Length(1, 64)
  public uk: string;
}

function isJsonValue(value: unknown, seen: WeakSet<object>): value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  if (typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }

  seen.add(value);
  const values = Array.isArray(value) ? value : Object.values(value);
  const valid = values.every((item) => isJsonValue(item, seen));
  seen.delete(value);
  return valid;
}
