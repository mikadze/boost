import { IsString, IsNotEmpty, IsOptional, MaxLength, IsArray, IsIn } from 'class-validator';
import { ApiKeyType } from '@boost/database';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  /**
   * API key type:
   * - 'publishable': For client-side use (pk_live_*), can only send behavioral events
   * - 'secret': For server-side use (sk_live_*), can send all events including financial
   */
  @IsString()
  @IsIn(['publishable', 'secret'])
  @IsOptional()
  type?: ApiKeyType = 'secret';
}
