import { forwardRef, Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { PrismaModule } from 'src/providers/prisma/prisma.module';
import { JobsModule } from '../job/job.module';
import { PipelineService } from './pipeline.service';
import { PipelineController } from './pipeline.controller';
import { AutoModule } from '../auto/auto.module';

@Module({
  imports: [
    PrismaModule,
    JobsModule,
    TelegramModule,
    forwardRef(() => AutoModule),
  ],
  providers: [PipelineService],
  controllers: [PipelineController],
  exports: [PipelineService],
})
export class PipelineModule {}
