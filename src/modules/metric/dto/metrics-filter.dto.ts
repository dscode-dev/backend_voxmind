import { IsDateString, IsOptional, IsString } from 'class-validator';

export class MetricsFilterDto {
  @IsString()
  platform!: string;

  @IsString()
  channel_id!: string;

  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;
}
