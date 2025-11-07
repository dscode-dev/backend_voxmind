import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class VoiceRenderDto {
  @Type(() => Number) @IsInt()
  contentId!: number;

  @IsOptional() @IsString()
  voiceId?: string;
}

export class PublishDto {
  @IsOptional() @IsString()
  platform?: string; 
}
