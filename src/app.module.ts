import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampagnModule } from './modules/campagn/campagn.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { ContentModule } from './modules/content/content.module';
import { FinanceModule } from './modules/finance/finance.module';
import { JobModule } from './modules/job/job.module';
import { MetricModule } from './modules/metric/metric.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [CampagnModule, CampaignModule, ContentModule, FinanceModule, JobModule, MetricModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
