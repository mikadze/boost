import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsObject,
  IsBoolean,
  MaxLength,
  Min,
  IsArray,
  IsUrl,
  ValidateIf,
} from 'class-validator';

// Reward Item DTOs

export class CreateRewardItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @IsNumber()
  @Min(1)
  costPoints!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number | null;

  @IsString()
  @IsOptional()
  prerequisiteBadgeId?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['WEBHOOK', 'PROMO_CODE', 'MANUAL'])
  fulfillmentType!: 'WEBHOOK' | 'PROMO_CODE' | 'MANUAL';

  @IsObject()
  @IsOptional()
  fulfillmentConfig?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateRewardItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.imageUrl !== '')
  @IsUrl()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  costPoints?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number | null;

  @IsString()
  @IsOptional()
  prerequisiteBadgeId?: string | null;

  @IsString()
  @IsOptional()
  @IsIn(['WEBHOOK', 'PROMO_CODE', 'MANUAL'])
  fulfillmentType?: 'WEBHOOK' | 'PROMO_CODE' | 'MANUAL';

  @IsObject()
  @IsOptional()
  fulfillmentConfig?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// Redemption DTOs

export class RedeemRewardDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  rewardItemId!: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class QueryRedemptionsDto {
  @IsString()
  @IsOptional()
  @IsIn(['PROCESSING', 'COMPLETED', 'FAILED'])
  status?: 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @IsString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  offset?: string;
}

// Customer Store Query DTO

export class CustomerStoreQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

// Fulfillment Config DTOs for validation

export class WebhookFulfillmentConfig {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url!: string;

  @IsString()
  @IsOptional()
  secret?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}

export class PromoCodeFulfillmentConfig {
  @IsArray()
  @IsString({ each: true })
  codes!: string[];
}
