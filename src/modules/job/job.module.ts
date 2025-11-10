import { forwardRef, Module } from '@nestjs/common';
import { CampaignsModule } from '../campaign/campaign.module';
import { JobsRepository } from './job.repository';
import { JobsService } from './services/job.service';
import { JobsController } from './controllers/job.controller';
import { PrismaModule } from 'src/providers/prisma/prisma.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { ElevenLabsModule } from '../elevenlabs/elevenlabs.module';
import { RenderModule } from '../render/render.module';
import { IaModule } from '../ia/ia.module';
import { PexelsModule } from '../pexels/pexels.module';
import { TelegramModule } from '../telegram/telegram.module';
@Module({
  imports: [
    CampaignsModule,
    PrismaModule,
    YoutubeModule,
    ElevenLabsModule,
    RenderModule,
    IaModule,
    PexelsModule,
    TelegramModule
  ],
  providers: [JobsRepository, JobsService],
  controllers: [JobsController],
  exports: [JobsRepository, JobsService],
})
export class JobsModule {}
