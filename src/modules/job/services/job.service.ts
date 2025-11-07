import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { ElevenLabsService } from 'src/modules/elevenlabs/elevenlabs.service';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { RenderService } from 'src/modules/render/render.service';
import { YoutubeService } from 'src/modules/youtube/youtube.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private yt: YoutubeService,
    private tts: ElevenLabsService,
    private render: RenderService,
  ) {}

  private async getOAuth2Client() {
    const client = new google.auth.OAuth2({
      clientId: process.env.YT_CLIENT_ID!,
      clientSecret: process.env.YT_CLIENT_SECRET!,
    });
    client.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN! });
    return client;
  }

  /** Gera 1 conteúdo por campanha ativa (simples). Você pode trocar por captura de trends. */
  async generateDaily() {
    const campaigns = await this.prisma.campaign.findMany({ where: { isActive: true } });
    const created: any[] = [];

    for (const camp of campaigns) {
      const c = await this.prisma.content.create({
        data: {
          campaign_id: camp.id,
          title: `(${camp.niche}) Você sabia disso? #shorts`,
          script_text: 'Hook forte! ... conhecimento rápido ... CTA final.',
          tags: '#shorts, ' + camp.niche,
          status: 'planned',
          approval_status: 'pending',
          preview_caption: '',
        },
      });
      created.push(c);
    }
    return { created };
  }

  /** Usa ElevenLabs para sintetizar e salvar em /media/voices/{id}.mp3 */
  async voice(contentId: number, voiceId?: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new Error('content_not_found');

    const voicesDir = process.env.MEDIA_VOICES || './media/voices';
    const voice_path = await this.tts.synthesizeToFile(content.script_text || content.title, voicesDir, String(contentId), voiceId);

    await this.prisma.content.update({ where: { id: contentId }, data: { voice_path, status: 'voiced' } });
    return { contentId, voice_path };
  }

  /** Render real com FFmpeg */
  async renderVideo(contentId: number, imagePath?: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw new Error('content_not_found');
    if (!content.voice_path) throw new Error('voice_path_missing');

    const video_path = await this.render.renderVerticalFromImageAndAudio({
      imagePath,
      audioPath: content.voice_path,
      outBaseName: String(contentId),
      maxSeconds: 60,
    });

    await this.prisma.content.update({ where: { id: contentId }, data: { video_path, status: 'rendered' } });
    return { contentId, video_path };
  }

  /** Publica todos os approved+rendered no YouTube */
  async publish(platform = 'youtube') {
    if (platform !== 'youtube') throw new Error('only_youtube_supported_for_now');
    const oauth2 = await this.getOAuth2Client();

    const items = await this.prisma.content.findMany({
      where: { status: 'rendered', approval_status: 'approved' },
      orderBy: { id: 'asc' },
      take: 10,
    });

    const published: any[] = [];
    for (const c of items) {
      if (!c.video_path) continue;

      const { videoId } = await this.yt.uploadShort(oauth2, c.video_path, {
        title: c.title,
        description: c.preview_caption ?? '',
        tags: (c.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      });

      await this.prisma.content.update({
        where: { id: c.id },
        data: { platform_video_id: videoId, status: 'published' },
      });
      published.push({ content_id: c.id, video_id: videoId });
    }
    return { published };
  }

  /** Coleta analytics do dia (UTC 00:00 do dia) e upsert em MetricDaily */
  async analyticsCollect() {
    const oauth2 = await this.getOAuth2Client();
    const channelId = process.env.YT_CHANNEL_ID!;
    const day = new Date(); // hoje
    const dateISO = day.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const row = await this.yt.fetchDailyAnalytics(oauth2, channelId, dateISO);
    if (!row) return { ok: true, message: 'no data for today' };

    await this.prisma.metricDaily.upsert({
      where: { platform_channel_id_date: { platform: 'youtube', channel_id: channelId, date: new Date(`${dateISO}T00:00:00Z`) } },
      create: {
        platform: 'youtube',
        channel_id: channelId,
        date: new Date(`${dateISO}T00:00:00Z`),
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        watch_minutes: row.watch_minutes,
        revenue_usd: row.revenue_usd,
        revenue_brl: 0,
      },
      update: {
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        watch_minutes: row.watch_minutes,
        revenue_usd: row.revenue_usd,
      },
    });

    return { ok: true, date: dateISO };
  }
}
