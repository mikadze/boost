import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CampaignScheduleDto {
  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  daysOfWeek?: number[];

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @ValidateNested()
  @Type(() => CampaignScheduleDto)
  @IsOptional()
  schedule?: CampaignScheduleDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @ValidateNested()
  @Type(() => CampaignScheduleDto)
  @IsOptional()
  schedule?: CampaignScheduleDto;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
