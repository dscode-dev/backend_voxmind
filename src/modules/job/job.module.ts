import { Module } from '@nestjs/common';
import { CampaignsModule } from '../campaign/campaign.module';
import { JobsRepository } from './job.repository';
import { JobsService } from './services/job.service';
import { JobsController } from './controllers/job.controller';
@Module({
  imports: [CampaignsModule],
  providers: [JobsRepository, JobsService],
  controllers: [JobsController],
})
export class JobsModule {}