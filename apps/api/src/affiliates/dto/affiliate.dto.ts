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
} from 'class-validator';

// Commission plan types
const PLAN_TYPE_VALUES = ['PERCENTAGE', 'FIXED'] as const;

// Commission status values
const STATUS_VALUES = ['PENDING', 'PAID', 'REJECTED'] as const;

// ============================================
// Commission Plan DTOs
// ============================================

export class CreateCommissionPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(PLAN_TYPE_VALUES)
  type!: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCommissionPlanDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(PLAN_TYPE_VALUES)
  type?: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

// ============================================
// Referral DTOs
// ============================================

export class CreateReferralDto {
  @IsString()
  @IsNotEmpty()
  referrerId!: string;

  @IsString()
  @IsNotEmpty()
  referredExternalId!: string;

  @IsString()
  @IsNotEmpty()
  referralCode!: string;

  @IsString()
  @IsOptional()
  source?: string;
}

// ============================================
// Commission DTOs
// ============================================

export class RecordCommissionDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  commissionPlanId!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsNumber()
  @Min(0)
  sourceAmount!: number;

  @IsString()
  @IsOptional()
  sourceEventId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  referredUserId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCommissionStatusDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

// ============================================
// Query DTOs
// ============================================

export class CommissionQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: 'PENDING' | 'PAID' | 'REJECTED';

  @IsString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  offset?: string;
}

export class CustomerAffiliateQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  offset?: string;
}
