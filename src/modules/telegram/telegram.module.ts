import { forwardRef, Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { ContentsModule } from '../content/content.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [forwardRef(() => ContentsModule), MediaModule],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
