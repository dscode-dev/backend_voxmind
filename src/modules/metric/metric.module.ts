import { Module } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './services/metric.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsRepository, AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
