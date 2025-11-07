import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ContentModule } from './modules/content/content.module';
import { FinanceModule } from './modules/finance/finance.module';
import { JobModule } from './modules/job/job.module';
import { MetricModule } from './modules/metric/metric.module';
import { UserModule } from './modules/user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CampaignModule,
    ContentModule,
    FinanceModule,
    JobModule,
    MetricModule,
    UserModule,
    AuthModule,
    PrismaModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
