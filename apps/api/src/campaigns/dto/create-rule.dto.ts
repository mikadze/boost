import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RuleConditionDto {
  @IsString()
  @IsNotEmpty()
  field!: string;

  @IsString()
  @IsNotEmpty()
  operator!: string;

  value!: unknown;
}

export class RuleConditionGroupDto {
  @IsString()
  @IsNotEmpty()
  logic!: 'and' | 'or';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions!: RuleConditionDto[];
}

export class RuleEffectDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  params!: Record<string, unknown>;
}

export class CreateRuleDto {
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventTypes?: string[];

  @ValidateNested()
  @Type(() => RuleConditionGroupDto)
  conditions!: RuleConditionGroupDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleEffectDto)
  effects!: RuleEffectDto[];
}

export class UpdateRuleDto {
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventTypes?: string[];

  @ValidateNested()
  @Type(() => RuleConditionGroupDto)
  @IsOptional()
  conditions?: RuleConditionGroupDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleEffectDto)
  @IsOptional()
  effects?: RuleEffectDto[];
}
