import { IsInt, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContentDto {
  @Type(() => Number) @IsInt()
  campaign_id!: number;

  @IsString() @Length(3, 140)
  title!: string;

  @IsString() @IsOptional()
  script_text?: string = '';

  @IsString() @IsOptional()
  tags?: string = '';
}
