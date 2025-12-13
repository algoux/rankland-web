import { FromBody, FromQuery } from 'bwcx-common';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import type * as srk from '@algoux/standard-ranklist';

// #region Nested DTOs

export class LinkWithTitleDTO {
  @IsString()
  @IsNotEmpty()
  public link: string;

  @IsString()
  @IsNotEmpty()
  public title: string;
}

export class ImageWithLinkDTO {
  @IsString()
  @IsNotEmpty()
  public image: string;

  @IsString()
  @IsNotEmpty()
  public link: string;
}

export class StyleDTO {
  @IsOptional()
  @IsString()
  public textColor?: string | { light: string; dark: string };

  @IsOptional()
  @IsString()
  public backgroundColor?: string | { light: string; dark: string };
}

export class ContestDTO {
  @IsNotEmpty()
  public title: string | srk.I18NStringSet;

  @IsString()
  @IsNotEmpty()
  public startAt: string;

  @IsArray()
  @IsNotEmpty()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  public duration: srk.TimeDuration;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  public frozenDuration?: srk.TimeDuration;

  @IsOptional()
  public banner?: srk.Image | srk.ImageWithLink;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkWithTitleDTO)
  public refLinks?: LinkWithTitleDTO[];
}

export class ProblemStatisticsDTO {
  @IsNumber()
  public accepted: number;

  @IsNumber()
  public submitted: number;
}

export class ProblemDTO {
  @IsOptional()
  public title?: string | srk.I18NStringSet;

  @IsOptional()
  @IsString()
  public alias?: string;

  @IsOptional()
  @IsString()
  public link?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProblemStatisticsDTO)
  public statistics?: ProblemStatisticsDTO;

  @IsOptional()
  public style?: StyleDTO | srk.RankSeriesSegmentStylePreset;
}

export class ExternalUserDTO {
  @IsNotEmpty()
  public name: string | srk.I18NStringSet;

  @IsOptional()
  @IsString()
  public avatar?: string;

  @IsOptional()
  @IsString()
  public link?: string;
}

export class UserDTO {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsNotEmpty()
  public name: string | srk.I18NStringSet;

  @IsOptional()
  @IsBoolean()
  public official?: boolean;

  @IsOptional()
  @IsString()
  public avatar?: string;

  @IsOptional()
  @IsString()
  public photo?: string;

  @IsOptional()
  public organization?: string | srk.I18NStringSet;

  @IsOptional()
  @IsString()
  public location?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalUserDTO)
  public teamMembers?: ExternalUserDTO[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public markers?: string[];
}

export class AdminUserDTO extends UserDTO {
  @IsOptional()
  @IsBoolean()
  public banned?: boolean;

  @IsOptional()
  @IsString()
  public broadcasterToken?: string;
}

export class MarkerDTO {
  @IsString()
  @IsNotEmpty()
  public id: string;

  @IsNotEmpty()
  @IsNotEmpty()
  public label: string | srk.I18NStringSet;

  public style: srk.Style | srk.MarkerStylePreset;
}

// #endregion Nested DTOs

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
  @ValidateNested()
  @Type(() => ContestDTO)
  public contest: ContestDTO;

  @FromBody()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemDTO)
  public problems: ProblemDTO[];

  @FromBody()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDTO)
  public members: UserDTO[];

  @FromBody()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkerDTO)
  public markers: MarkerDTO[];

  @FromBody()
  @IsArray()
  @Type(() => Object)
  public series: srk.RankSeries[];

  @FromBody()
  @IsOptional()
  @IsObject()
  public sorter?: srk.Sorter;

  @FromBody()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public contributors?: srk.Contributor[];
}

export class CreateLiveContestRespDTO {
  public _id: string;
}

export class UpdateLiveContestReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  public alias: string;

  @FromBody()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public name?: string;

  @FromBody()
  @IsOptional()
  @ValidateNested()
  @Type(() => ContestDTO)
  public contest?: ContestDTO;

  @FromBody()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProblemDTO)
  public problems?: ProblemDTO[];

  @FromBody()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDTO)
  public members?: UserDTO[];

  @FromBody()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkerDTO)
  public markers?: MarkerDTO[];

  @FromBody()
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  public series?: srk.RankSeries[];

  @FromBody()
  @IsOptional()
  @IsObject()
  public sorter?: srk.Sorter;

  @FromBody()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public contributors?: srk.Contributor[];
}

export class DropLiveContestEventsReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  public alias: string;
}

export class GetLiveContestReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public alias: string;
}

export class GetLiveContestRespDTO {
  public _id: string;
  public alias: string;
  public name: string;
  public contest: ContestDTO;
  public problems: ProblemDTO[];
  public members: AdminUserDTO[];
  public markers: srk.Marker[];
  public series: srk.RankSeries[];
  public sorter?: srk.Sorter;
  public contributors?: string[];
}

export class GetPublicLiveContestReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public alias: string;
}

export class GetPublicLiveContestRespDTO {
  public _id: string;
  public alias: string;
  public name: string;
  public contest: ContestDTO;
  public problems: ProblemDTO[];
  public members: UserDTO[];
  public markers: srk.Marker[];
  public series: srk.RankSeries[];
  public sorter?: srk.Sorter;
  public contributors?: string[];
}

export class GetPublicContestMembersReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public alias: string;

  @FromQuery()
  @IsString()
  @IsOptional()
  public userId?: string;

  @FromQuery()
  @IsString()
  @IsOptional()
  public name?: string;

  @FromQuery()
  @IsString()
  @IsOptional()
  public organization?: string;

  @FromQuery()
  @IsString()
  @IsOptional()
  public location?: string;

  @FromQuery()
  @IsString()
  @IsOptional()
  public markerId?: string;

  @FromQuery()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  public official?: boolean;

  @FromQuery()
  @IsString()
  @IsOptional()
  public teamMemberName?: string;

  @FromQuery()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : undefined))
  public banned?: boolean;
}

export class GetPublicContestMembersRespDTO {
  public members: srk.User[];
}

export class GetPublicContestMemberReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public alias: string;

  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public userId: string;
}

export class GetPublicContestMemberRespDTO implements srk.User {
  public id: string;
  public name: srk.Text;
  public official?: boolean;
  public avatar?: srk.Image;
  public photo?: srk.Image;
  public organization?: srk.Text;
  public location?: string;
  public teamMembers?: srk.ExternalUser[];
  public markers?: string[];
  public broadcasterToken?: string;
  public banned?: boolean;
}

export class GetContestMembersReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public alias: string;
}

export class GetContestMembersRespDTO {
  public members: Array<
    srk.User & {
      banned: boolean;
      broadcasterToken?: string;
    }
  >;
}

export class GetContestMemberReqDTO {
  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public alias: string;

  @FromQuery()
  @IsString()
  @IsNotEmpty()
  public userId: string;
}

export class GetContestMemberRespDTO {
  public id: string;
  public name: srk.Text;
  public official?: boolean;
  public avatar?: srk.Image;
  public photo?: srk.Image;
  public organization?: srk.Text;
  public location?: string;
  public teamMembers?: srk.ExternalUser[];
  public markers?: string[];
  public banned: boolean;
  public broadcasterToken?: string;
}

export class UpdateContestMemberReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  public alias: string;

  @FromBody()
  @IsString()
  @IsNotEmpty()
  public userId: string;

  @FromBody()
  @IsOptional()
  @IsString()
  public name?: string | srk.I18NStringSet | null;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  public official?: boolean | null;

  @FromBody()
  @IsOptional()
  @IsString()
  public avatar?: string | srk.Image | null;

  @FromBody()
  @IsOptional()
  @IsString()
  public photo?: string | srk.Image | null;

  @FromBody()
  @IsOptional()
  public organization?: string | srk.I18NStringSet | null;

  @FromBody()
  @IsOptional()
  @IsString()
  public location?: string | null;

  @FromBody()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalUserDTO)
  public teamMembers?: ExternalUserDTO[] | null;

  @FromBody()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public markers?: string[] | null;

  @FromBody()
  @IsOptional()
  @IsBoolean()
  public banned?: boolean | null;

  @FromBody()
  @IsOptional()
  @IsString()
  public broadcasterToken?: string | null;
}
