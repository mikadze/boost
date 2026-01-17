import {
  IsBoolean,
  IsString,
  IsNumber,
  IsIn,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for referral program settings
 */
export class ReferralSettingsDto {
  @IsBoolean()
  enabled!: boolean;

  @IsString()
  @IsUrl({}, { message: 'referralLinkBase must be a valid URL' })
  referralLinkBase!: string;

  @IsNumber()
  @Min(1)
  @Max(365)
  cookieDuration!: number;

  @IsString()
  @IsIn(['purchase', 'signup', 'subscription'])
  commissionTrigger!: 'purchase' | 'signup' | 'subscription';

  @IsNumber()
  @Min(0)
  minPayout!: number;

  @IsBoolean()
  autoApprove!: boolean;
}

/**
 * DTO for referral incentive settings
 */
export class IncentiveSettingsDto {
  @IsString()
  @IsIn(['percentage', 'fixed', 'points'])
  type!: 'percentage' | 'fixed' | 'points';

  @IsNumber()
  @Min(0)
  value!: number;

  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for updating project settings
 * All fields are optional to allow partial updates
 */
export class UpdateProjectSettingsDto {
  @ValidateNested()
  @Type(() => ReferralSettingsDto)
  @IsOptional()
  referral?: ReferralSettingsDto;

  @ValidateNested()
  @Type(() => IncentiveSettingsDto)
  @IsOptional()
  incentive?: IncentiveSettingsDto;
}

/**
 * Response DTO for project settings
 */
export class ProjectSettingsResponseDto {
  referral?: {
    enabled: boolean;
    referralLinkBase: string;
    cookieDuration: number;
    commissionTrigger: 'purchase' | 'signup' | 'subscription';
    minPayout: number;
    autoApprove: boolean;
  };

  incentive?: {
    type: 'percentage' | 'fixed' | 'points';
    value: number;
    description: string;
  };
}
