import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { JobsService } from '../job/services/job.service';
import { GeminiService } from '../ia/gemini.service';

@Injectable()
export class TrendsService {
  constructor(
    private prisma: PrismaService,
    private jobs: JobsService,
    private gemini: GeminiService,
  ) {}

  async previewGemini(p: {
    region: string;
    language?: string;
    niche?: string;
    max?: number;
    stylePrompt?: string;
  }) {
    return this.gemini.trendsPayload(p);
  }

  async ingestFromGemini(p: {
    region: string;
    language?: string;
    niche?: string;
    max?: number;
    stylePrompt?: string;
    autoCreateCampaign?: boolean;
    campaignId?: number;
    kickIdeation?: boolean;
  }) {
    const data = await this.gemini.trendsPayload(p);
    let campaignId = p.campaignId;

    if (!campaignId) {
      if (p.autoCreateCampaign === false)
        throw new Error('campaignId missing and autoCreateCampaign=false');
      const name =
        data.campaign.name || `Voxmind • ${p.region} • ${Date.now()}`;
      const camp = await this.prisma.campaign.create({
        data: {
          name,
          niche: data.campaign.niche,
          language: data.campaign.language,
          platform: 'youtube',
          isActive: true,
          dailyQuota: data.campaign.daily_quota,
          maxLengthSec: data.campaign.max_length_sec,
          stylePrompt: data.campaign.style_prompt,
        },
      });
      campaignId = camp.id;
    }

    const createdIds: number[] = [];

    for (const item of data.items as any[]) {
      const dupe = await this.prisma.content.findFirst({
        where: { campaign_id: campaignId!, title: item.title },
        select: { id: true },
      });
      if (dupe) continue;

      const content = await this.prisma.content.create({
        data: {
          campaign_id: campaignId!,
          title: item.title,
          script_text: item.description || '',
          tags: (item.tags || []).slice(0, 10).join(', '),
          preview_caption: item.preview_caption || `Storyboard • ${item.title}`,
          approval_status: 'pending',
          review_source: 'auto',
          status: 'planned',
          // context_json: {
          //   seed_language: item.language,
          //   seed_niche: item.niche,
          // },
          sentences: item.sentences ?? [],
          pexels_query: item.suggested_pexels_query || item.title,
          //youtube_metadata: item.youtube_metadata || undefined,
        },
      });

      if (p.kickIdeation !== false) {
        await this.jobs.ideateAndAssets(content.id, {
          language: item.language || data.campaign.language || 'pt-BR',
          tone: 'curioso',
        } as any);
      }
      createdIds.push(content.id);
    }

    return {
      campaignId,
      createdCount: createdIds.length,
      createdIds,
      payload: data,
    };
  }
}
