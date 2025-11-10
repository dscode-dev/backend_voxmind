import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { MediaModule } from './modules/media/media.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { TrendsModule } from './modules/trend/trend.module';
import { AutoModule } from './modules/auto/auto.module';
import { IaModule } from './modules/ia/ia.module';
import { PexelsModule } from './modules/pexels/pexels.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { AppScheduleModule } from './modules/scheduler/scheduler.module';

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
    AppScheduleModule,
    MediaModule,
    TelegramModule,
    TrendsModule,
    AutoModule,
    IaModule,
    PexelsModule,
    PipelineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
