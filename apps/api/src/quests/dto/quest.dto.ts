import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestStepDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventName!: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  requiredCount?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateQuestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rewardXp?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  rewardBadgeId?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestStepDto)
  @IsOptional()
  steps?: CreateQuestStepDto[];

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateQuestStepDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  eventName?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  requiredCount?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateQuestDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rewardXp?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  rewardBadgeId?: string | null;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AddQuestStepDto extends CreateQuestStepDto {}

/**
 * DTO for SDK customer quest queries
 * Validates userId is provided in query params
 */
export class CustomerQuestQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
