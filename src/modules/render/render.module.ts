import { Module } from '@nestjs/common';
import { RenderService } from './render.service';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RenderService],
  exports: [RenderService],
})
export class RenderModule {}
