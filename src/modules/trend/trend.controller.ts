import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { TrendsService } from './trend.service';

@Controller('trends/gemini')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TrendsController {
  constructor(private service: TrendsService) {}

  @Get('preview')
  preview(
    @Query('region') region: string,
    @Query('language') language?: string,
    @Query('niche') niche?: string,
    @Query('max') max?: string,
    @Query('stylePrompt') stylePrompt?: string,
  ) {
    return this.service.previewGemini({
      region, language, niche, stylePrompt, max: max ? Number(max) : undefined,
    });
  }

  @Post('ingest')
  ingest(
    @Body() body: {
      region: string; language?: string; niche?: string; max?: number; stylePrompt?: string;
      autoCreateCampaign?: boolean; campaignId?: number; kickIdeation?: boolean;
    },
  ) {
    return this.service.ingestFromGemini(body);
  }
}