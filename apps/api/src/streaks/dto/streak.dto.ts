import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsArray,
  MaxLength,
  Min,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Streak frequency types
const FREQUENCY_VALUES = ['daily', 'weekly'] as const;

/**
 * Milestone definition for streak rewards
 */
export class StreakMilestoneDto {
  @IsNumber()
  @Min(1)
  day!: number;

  @IsNumber()
  @Min(0)
  rewardXp!: number;

  @IsString()
  @IsOptional()
  badgeId?: string;
}

/**
 * DTO for creating a new streak rule
 */
export class CreateStreakRuleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType!: string;

  @IsString()
  @IsOptional()
  @IsIn(FREQUENCY_VALUES)
  frequency?: 'daily' | 'weekly';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StreakMilestoneDto)
  @IsOptional()
  milestones?: StreakMilestoneDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultFreezeCount?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  timezoneOffsetMinutes?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating a streak rule
 */
export class UpdateStreakRuleDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  eventType?: string;

  @IsString()
  @IsOptional()
  @IsIn(FREQUENCY_VALUES)
  frequency?: 'daily' | 'weekly';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StreakMilestoneDto)
  @IsOptional()
  milestones?: StreakMilestoneDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultFreezeCount?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  timezoneOffsetMinutes?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for SDK customer streak queries
 */
export class CustomerStreakQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

/**
 * DTO for using a freeze token
 */
export class UseFreezeDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
