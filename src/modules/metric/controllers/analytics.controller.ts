import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AnalyticsService } from '../services/metric.service';
import { MetricsFilterDto } from '../dto/metrics-filter.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Post('collect')
  collect() { return this.service.collect(); }

  @Get('daily')
  daily(@Query() q: MetricsFilterDto) {
    return this.service.list({
      platform: q.platform,
      channel_id: q.channel_id,
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
  }
}
