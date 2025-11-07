import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import PaginationDto from 'src/modules/common/dto/pagination.dto';


export class FilterContentsDto extends PaginationDto {
  @IsOptional() @IsString()
  status?: string; // planned|scripted|voiced|rendered|published|failed

  @IsOptional() @IsString()
  approval?: string; // pending|approved|rejected

  @IsOptional() @Type(() => Number) @IsInt()
  campaign_id?: number;
}
