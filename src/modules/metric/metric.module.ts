import { Module } from '@nestjs/common';
import { MetricController } from './controllers/metric.controller';
import { MetricService } from './services/metric.service';

@Module({
  controllers: [MetricController],
  providers: [MetricService]
})
export class MetricModule {}
