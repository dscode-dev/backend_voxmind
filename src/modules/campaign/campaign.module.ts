import { Module } from '@nestjs/common';
import { CampaignsRepository } from './campaign.repository';
import { CampaignsService } from './services/campaign.service';
import { CampaignsController } from './controllers/campaign.controller';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CampaignsRepository, CampaignsService],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
