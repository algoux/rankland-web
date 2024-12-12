import { FromBody, FromQuery } from 'bwcx-common';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class CreateLiveContestReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public alias: string;

  @FromBody()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public name: string;

  @FromBody()
  @IsObject()
  public contest: any;

  @FromBody()
  @IsArray()
  public problems: any;

  @FromBody()
  @IsArray()
  public members: any;

  @FromBody()
  @IsArray()
  public markers: any;

  @FromBody()
  @IsArray()
  public series: any;

  @FromBody()
  @IsObject()
  public sorter: any;

  @FromBody()
  @IsArray()
  public contributors: any;
}

export class CreateLiveContestRespDTO {
  public _id: string;
}

export class UpdateLiveContestReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public alias: string;

  @FromBody()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public name?: string;

  @FromBody()
  @IsOptional()
  @IsObject()
  public contest?: any;

  @FromBody()
  @IsOptional()
  @IsArray()
  public problems?: any;

  @FromBody()
  @IsOptional()
  @IsArray()
  public members?: any;

  @FromBody()
  @IsOptional()
  @IsArray()
  public markers?: any;

  @FromBody()
  @IsOptional()
  @IsArray()
  public series?: any;

  @FromBody()
  @IsOptional()
  @IsObject()
  public sorter?: any;

  @FromBody()
  @IsOptional()
  @IsArray()
  public contributors?: any;
}

export class DropLiveContestEventsReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public alias: string;
}

export class GetLiveContestReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public alias: string;
}

export class GetLiveContestRespDTO {
  public _id: string;
  public alias: string;
  public name: string;
  public contest: any;
  public problems: any;
  public members: any;
  public markers: any;
  public series: any;
  public sorter: any;
  public contributors: any;
}
