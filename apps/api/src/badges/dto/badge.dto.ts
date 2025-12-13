import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
  IsIn,
  IsUrl,
} from 'class-validator';

// Badge rarity levels
const RARITY_VALUES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;

// Badge visibility
const VISIBILITY_VALUES = ['PUBLIC', 'HIDDEN'] as const;

// Badge rule types
const RULE_TYPE_VALUES = ['METRIC_THRESHOLD', 'EVENT_COUNT', 'MANUAL'] as const;

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  iconUrl?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(RARITY_VALUES)
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

  @IsString()
  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  visibility?: 'PUBLIC' | 'HIDDEN';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @IsIn(RULE_TYPE_VALUES)
  ruleType?: 'METRIC_THRESHOLD' | 'EVENT_COUNT' | 'MANUAL';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  triggerMetric?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  threshold?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateBadgeDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  iconUrl?: string | null;

  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @IsString()
  @IsOptional()
  @IsIn(RARITY_VALUES)
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

  @IsString()
  @IsOptional()
  @IsIn(VISIBILITY_VALUES)
  visibility?: 'PUBLIC' | 'HIDDEN';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string | null;

  @IsString()
  @IsOptional()
  @IsIn(RULE_TYPE_VALUES)
  ruleType?: 'METRIC_THRESHOLD' | 'EVENT_COUNT' | 'MANUAL';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  triggerMetric?: string | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  threshold?: number | null;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for manually awarding a badge to a user
 */
export class AwardBadgeDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  awardedBy?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for SDK customer badge queries
 */
export class CustomerBadgeQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  category?: string;
}

/**
 * DTO for user search (admin grant tool)
 */
export class UserSearchDto {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
