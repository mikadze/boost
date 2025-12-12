import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateLoyaltyTierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsNumber()
  minPoints!: number;

  @IsObject()
  @IsOptional()
  benefits?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class UpdateLoyaltyTierDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsNumber()
  @IsOptional()
  minPoints?: number;

  @IsObject()
  @IsOptional()
  benefits?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AddPointsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['earn', 'redeem', 'adjust', 'bonus'])
  type!: 'earn' | 'redeem' | 'adjust' | 'bonus';

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class RedeemPointsDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
