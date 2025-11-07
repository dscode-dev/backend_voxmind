import { Module } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { GoogleModule } from 'src/providers/google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [YoutubeService],
  exports: [YoutubeService],
})
export class YoutubeModule {}
