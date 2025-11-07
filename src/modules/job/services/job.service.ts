import { Injectable } from '@nestjs/common';
import { JobsRepository } from '../job.repository';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CampaignsService } from 'src/modules/campaign/services/campaign.service';

@Injectable()
export class JobsService {
  constructor(
    private repo: JobsRepository,
    private prisma: PrismaService,
    private campaigns: CampaignsService,
  ) {}

  /** Gera conteúdos do dia por campanhas ativas (coleta/trends → escreve → voz → render) */
  async generateDaily() {
    const campaigns = await this.prisma.campaign.findMany({ where: { is_active: true } });
    const created: any[] = [];

    for (const camp of campaigns) {
      // TODO: checar quota/daily slot, coletar trends reais, etc.
      const content = await this.prisma.content.create({
        data: {
          campaign_id: camp.id,
          title: `Short de ${camp.niche} - ${new Date().toISOString()}`,
          script_text: 'Hook... Corpo... CTA...',
          status: 'rendered',      
          approval_status: 'pending',
          tags: '#shorts',
          preview_caption: '',
        },
      });
      created.push(content);
    }
    return { created };
  }

  /** Gera voz (ElevenLabs) e salva voice_path */
  async voice(contentId: number, voiceId?: string) {
    // TODO: integrar ElevenLabs (sintetizar e salvar em storage). Aqui apenas simula:
    const voice_path = `/media/voices/${contentId}.mp3`;
    await this.prisma.content.update({ where: { id: contentId }, data: { voice_path, status: 'voiced' } });
    return { contentId, voice_path };
  }

  /** Renderiza vídeo vertical (FFmpeg), salva video_path e status=rendered */
  async render(contentId: number) {
    // TODO: integrar FFmpeg (gerar 1080x1920), compor assets Pexels, waveform, etc.
    const video_path = `/media/videos/${contentId}.mp4`;
    await this.prisma.content.update({ where: { id: contentId }, data: { video_path, status: 'rendered' } });
    return { contentId, video_path };
  }


  async publish(platform = 'youtube') {
    const items = await this.repo.findRenderableApproved(20);
    const published: any[] = [];
    for (const c of items) {
      const fakeVideoId = `YT_${c.id}_${Date.now()}`;
      await this.prisma.content.update({
        where: { id: c.id },
        data: { platform_video_id: fakeVideoId, status: 'published' },
      });
      published.push({ content_id: c.id, platform, video_id: fakeVideoId });
    }
    return { published };
  }
}
