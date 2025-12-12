import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['percentage', 'fixed_amount'])
  discountType!: 'percentage' | 'fixed_amount';

  @IsNumber()
  discountValue!: number;

  @IsNumber()
  @IsOptional()
  minimumValue?: number;

  @IsNumber()
  @IsOptional()
  maximumDiscount?: number;

  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @IsNumber()
  @IsOptional()
  maxUsesPerUser?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(['percentage', 'fixed_amount'])
  discountType?: 'percentage' | 'fixed_amount';

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  minimumValue?: number;

  @IsNumber()
  @IsOptional()
  maximumDiscount?: number;

  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @IsNumber()
  @IsOptional()
  maxUsesPerUser?: number;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
