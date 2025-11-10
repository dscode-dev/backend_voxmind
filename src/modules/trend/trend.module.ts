import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { PrismaModule } from 'src/providers/prisma/prisma.module';
import { GoogleModule } from 'src/providers/google/google.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { TrendsService } from './trend.service';
import { TrendsController } from './trend.controller';
import { JobsModule } from '../job/job.module';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [
    PrismaModule,
    JobsModule,
    IaModule
  ],
  providers: [TrendsService],
  controllers: [TrendsController],
  exports: [TrendsService],
})
export class TrendsModule {}
