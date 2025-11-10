import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @IsString() 
  name: string;

  @IsString() 
  niche: string;
  
  @IsString() 
  language: string;
  
  @IsString() 
  platform: string;
  
  @IsOptional() 
  @IsBoolean() 
  isActive?: boolean = true;
  
  @IsOptional() 
  @IsInt() 
  @Min(0) 
  @Max(200) 
  dailyQuota?: number = 20;
  
  @IsOptional() 
  @IsInt() 
  @Min(5) 
  @Max(180) 
  maxLengthSec?: number = 60;
  
  @IsOptional() 
  @IsString() 
  stylePrompt?: string = '';
  
  @IsOptional()
  @IsNumber()
  cpmOverride?: number | null;
}
