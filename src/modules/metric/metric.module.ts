import { Module } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './services/metric.service';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  providers: [AnalyticsRepository, AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
