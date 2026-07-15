import { FromBody, FromParam, IsFile } from 'bwcx-common';
import { Transform } from 'class-transformer';
import { IsDefined, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const SNOWFLAKE_ID_PATTERN = /^\d+$/;

export class UploadFileReqDTO {
  @FromBody()
  @IsString()
  @Matches(SNOWFLAKE_ID_PATTERN)
  public contestId: string;

  @FromBody()
  @Transform(({ value }) => (value === 'undefined' ? undefined : value))
  @IsOptional()
  @IsString()
  @MaxLength(32)
  public category?: string;

  @FromBody()
  @IsFile()
  @IsDefined()
  public file: any;
}

export class GetFileReqDTO {
  @FromParam()
  @IsString()
  @Matches(SNOWFLAKE_ID_PATTERN)
  public id: string;
}

export class DeleteFileReqDTO {
  @FromParam()
  @IsString()
  @Matches(SNOWFLAKE_ID_PATTERN)
  public id: string;
}

export class FileRespDTO {
  public id: string;
  public contestId: string;
  public category: string;
  public name: string;
  public path: string;
  public size: number;
  public hashType: string;
  public hashValue: string;
  public url: string;
  public createdAt: string;
  public updatedAt: string;
}

export class UploadFileRespDTO extends FileRespDTO {}

export class GetFileRespDTO extends FileRespDTO {}
