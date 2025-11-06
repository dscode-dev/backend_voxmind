import { Module } from '@nestjs/common';
import { ContentController } from './controllers/content.controller';
import { ContentService } from './services/content.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService]
})
export class ContentModule {}
