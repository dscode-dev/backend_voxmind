import { Module, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { JobsService } from '../job/services/job.service';
import { PrismaModule } from 'src/providers/prisma/prisma.module';
import { JobsModule } from '../job/job.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { ElevenLabsModule } from '../elevenlabs/elevenlabs.module';
import { RenderModule } from '../render/render.module';

@Module({
  imports: [
    PrismaModule,
    JobsModule,
    YoutubeModule,
    ElevenLabsModule,
    RenderModule,
  ],
  providers: [JobsService],
})
export class SchedulerModule implements OnModuleInit {
  constructor(private jobs: JobsService) {}

  onModuleInit() {
    // 06:00, 12:00, 18:00, 23:00 America/Recife
    cron.schedule(
      '0 6,12,18,23 * * *',
      async () => {
        await this.jobs.generateDaily();
        // aqui você pode encadear voice/render automáticos se quiser
      },
      { timezone: 'America/Recife' },
    );
  }
}
