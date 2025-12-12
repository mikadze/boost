import { IsString, IsNotEmpty, IsOptional, IsIn, IsObject, MaxLength } from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['string', 'number', 'boolean', 'date', 'array'])
  type!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
