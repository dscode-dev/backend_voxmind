import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FinanceService } from '../services/finance.service';
import { FinanceFilterDto } from '../dto/finance-filter.dto';

@Controller('finance')
export class FinanceController {
  constructor(private service: FinanceService) {}

  @Post('snapshots')
  create(@Body() body: any) {
    return this.service.createSnapshot(body);
  }

  @Get('snapshots')
  list(@Query() q: FinanceFilterDto) {
    return this.service.list({
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
  }
}
