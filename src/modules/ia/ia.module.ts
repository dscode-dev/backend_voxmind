import { Module } from '@nestjs/common';
import { IaService } from './ia.service';
import { GeminiService } from './gemini.service';


@Module({
  providers: [IaService, GeminiService],
  exports: [IaService, GeminiService],
})
export class IaModule {}
