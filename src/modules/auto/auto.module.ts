// apps/api/src/auto/auto.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { AppScheduleModule } from '../scheduler/scheduler.module';
import { PrismaModule } from 'src/providers/prisma/prisma.module';
import { TrendsModule } from '../trend/trend.module';
import { JobsModule } from '../job/job.module';
import { AutoRunnerService } from './auto.service';

@Module({
  imports: [
    JobsModule,
    PrismaModule,
    TrendsModule,
  ],
  providers: [AutoRunnerService],
  exports: [AutoRunnerService],
})
export class AutoModule {}
