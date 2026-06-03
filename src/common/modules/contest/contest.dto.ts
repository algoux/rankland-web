import { FromBody, FromParam, FromQuery } from 'bwcx-common';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
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

export class CreateContestReqDTO {
  @FromBody()
  @IsString()
  @IsNotEmpty()
  @Length(3, 32)
  public uk: string;

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
  public users: UserDTO[];

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

export class CreateContestRespDTO {
  public _id: string;
}

export class UpdateContestReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

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
  public users?: UserDTO[];

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

export class ResetContestEventsReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class AppendContestEventsReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

  @FromBody()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public streamRevision: number;

  @FromBody()
  @IsArray()
  @ArrayMinSize(1)
  public events: any[];
}

export class AppendContestEventsRespDTO {
  public acceptedEventIds: number[];
  public duplicateEventIds: number[];
  public lastEventId: number;
  public expectedNextEventId: number;
  public streamRevision: number;
}

export class GetPublicContestEventsReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

  @FromQuery()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  public afterEventId?: number;

  @FromQuery()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  public limit?: number;

  @FromQuery()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public streamRevision: number;

  @FromQuery()
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => (value === 'false' ? false : value === 'true' ? true : undefined))
  public compactProgress?: boolean;
}

export class GetPublicContestEventsRespDTO {
  public uk: string;
  public fromEventId: number | null;
  public toEventId: number | null;
  public checkpointEventId: number;
  public latestEventId: number;
  public streamRevision: number;
  public hasMore: boolean;
  public events: any[];
  public resetRequired: boolean;
  public resetReason?: string;
}

export class GetContestEventStreamReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class GetContestEventStreamRespDTO {
  public contestId: string;
  public uk: string;
  public lastEventId: number;
  public streamRevision: number;
  public producerId?: string | null;
}

export class GetPublicContestEventStreamReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class GetPublicContestEventStreamRespDTO {
  public uk: string;
  public lastEventId: number;
  public streamRevision: number;
}

export class DeleteContestEventStreamProducerLockReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class StreamPublicContestEventStreamNotificationsReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class GetContestReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class GetContestRespDTO {
  public _id: string;
  public uk: string;
  public name: string;
  public contest: ContestDTO;
  public problems: ProblemDTO[];
  public users: AdminUserDTO[];
  public markers: srk.Marker[];
  public series: srk.RankSeries[];
  public sorter?: srk.Sorter;
  public contributors?: string[];
}

export class GetPublicContestReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class GetPublicContestRespDTO {
  public _id: string;
  public uk: string;
  public name: string;
  public contest: ContestDTO;
  public problems: ProblemDTO[];
  public users: UserDTO[];
  public markers: srk.Marker[];
  public series: srk.RankSeries[];
  public sorter?: srk.Sorter;
  public contributors?: string[];
}

export class GetPublicContestUsersReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

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

export class GetPublicContestUsersRespDTO {
  public users: srk.User[];
}

export class GetPublicContestUserReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

  @FromParam()
  @IsString()
  @IsNotEmpty()
  public userId: string;
}

export class GetPublicContestUserRespDTO implements srk.User {
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

export class GetContestUsersReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;
}

export class GetContestUsersRespDTO {
  public users: Array<
    srk.User & {
      banned: boolean;
      broadcasterToken?: string;
    }
  >;
}

export class GetContestUserReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

  @FromParam()
  @IsString()
  @IsNotEmpty()
  public userId: string;
}

export class GetContestUserRespDTO {
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

export class UpdateContestUserReqDTO {
  @FromParam()
  @IsString()
  @IsNotEmpty()
  public uk: string;

  @FromParam()
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
