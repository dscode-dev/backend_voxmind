import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString() name!: string;
  @IsString() niche!: string;
  @IsString() language!: string;
  @IsString() platform!: string;
  @IsOptional() @IsBoolean() is_active?: boolean = true;
  @IsOptional() @IsInt() @Min(0) @Max(200) daily_quota?: number = 20;
  @IsOptional() @IsInt() @Min(5) @Max(180) max_length_sec?: number = 60;
  @IsOptional() @IsString() style_prompt?: string = '';
  @IsOptional()
  cpm_override?: number | null;
}
