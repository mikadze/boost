import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  coupons?: string[];

  @IsString()
  @IsOptional()
  currency?: string;
}

export class UpdateSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  @IsOptional()
  items?: CartItemDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  coupons?: string[];
}

export class ApplyCouponDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}
