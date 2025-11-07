import { IsDateString, IsOptional } from 'class-validator';

export class FinanceFilterDto {
  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;
}
