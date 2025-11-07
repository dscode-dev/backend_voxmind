import { Module } from '@nestjs/common';
import { ContentsRepository } from './contents.repository';
import { CampaignsModule } from '../campaign/campaign.module';
import { ContentsService } from './services/content.service';
import { ContentsController } from './controllers/content.controller';
import { ApprovalsController } from './controllers/approvals.controller';

@Module({
  imports: [CampaignsModule],
  providers: [ContentsRepository, ContentsService],
  controllers: [ContentsController, ApprovalsController],
  exports: [ContentsService],
})
export class ContentsModule {}
