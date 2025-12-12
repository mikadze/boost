import { IsString, IsUUID, IsOptional, IsObject } from 'class-validator';

export class CreateEventDto {
  @IsString()
  eventType!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}
