import { forwardRef, Module } from '@nestjs/common';
import { ContentsRepository } from './contents.repository';
import { CampaignsModule } from '../campaign/campaign.module';
import { ContentsService } from './services/content.service';
import { ContentsController } from './controllers/content.controller';
import { ApprovalsController } from './controllers/approvals.controller';
import { PrismaModule } from 'src/providers/prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [CampaignsModule, PrismaModule, forwardRef(() => TelegramModule)],
  providers: [ContentsRepository, ContentsService],
  controllers: [ContentsController, ApprovalsController],
  exports: [ContentsService],
})
export class ContentsModule {}
