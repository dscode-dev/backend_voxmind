import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FinanceModule } from './modules/finance/finance.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './providers/prisma/prisma.module';
import { CommonModule } from './modules/common/common.module';
import { GoogleModule } from './providers/google/google.module';
import { YoutubeModule } from './modules/youtube/youtube.module';
import { CampaignsModule } from './modules/campaign/campaign.module';
import { ContentsModule } from './modules/content/content.module';
import { JobsModule } from './modules/job/job.module';
import { AnalyticsModule } from './modules/metric/metric.module';
import { ElevenLabsModule } from './modules/elevenlabs/elevenlabs.module';
import { RenderModule } from './modules/render/render.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MediaModule } from './modules/media/media.module';
import { TelegramModule } from './modules/telegram/telegram.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CampaignsModule,
    ContentsModule,
    FinanceModule,
    JobsModule,
    AnalyticsModule,
    UserModule,
    AuthModule,
    PrismaModule,
    CommonModule,
    GoogleModule,
    YoutubeModule,
    ElevenLabsModule,
    RenderModule,
    SchedulerModule,
    MediaModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
