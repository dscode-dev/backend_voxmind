import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { google } from 'googleapis';
import { ElevenLabsService } from 'src/modules/elevenlabs/elevenlabs.service';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { RenderService } from 'src/modules/render/render.service';
import { YoutubeService } from 'src/modules/youtube/youtube.service';
import { IaService } from 'src/modules/ia/ia.service';
import { PexelsService } from 'src/modules/pexels/pexels.service';
import { TelegramService } from 'src/modules/telegram/telegram.service';

const TG_ON =
  (process.env.TELEGRAM_ENABLED ?? 'false').toLowerCase() === 'true';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private yt: YoutubeService,
    private tts: ElevenLabsService,
    private render: RenderService,
    private ai: IaService,
    private pexels: PexelsService,
    private telegram: TelegramService,
  ) {}

  private readonly logger = new Logger(JobsService.name);

  private async getOAuth2Client() {
    const client = new google.auth.OAuth2({
      clientId: process.env.YT_CLIENT_ID,
      clientSecret: process.env.YT_CLIENT_SECRET,
      redirect_uris: [
        'http://localhost:8000/oauth2callback',
        'http://localhost:8000',
      ],
    });
    client.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN! });
    return client;
  }

  /** Gera 1 conteúdo por campanha ativa (simples). Você pode trocar por captura de trends. */
  async generateDaily() {
    const campaigns = await this.prisma.campaign.findMany({
      where: { isActive: true },
    });
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
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!content) throw new Error('content_not_found');

    const voicesDir = process.env.MEDIA_VOICES || './media/voices';
    const voice_path = await this.tts.synthesizeToFile(
      content.script_text || content.title,
      voicesDir,
      String(contentId),
      voiceId,
    );

    await this.prisma.content.update({
      where: { id: contentId },
      data: { voice_path, status: 'voiced' },
    });
    return { contentId, voice_path };
  }

  /** Render real com FFmpeg */
  async renderVideo(contentId: number, imagePath?: string | null) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!content) throw new Error('content_not_found');
    if (!content.voice_path) throw new Error('voice_path_missing');

    const renders =
      await this.render.renderVerticalFromImageAndAudio(contentId);

    await this.prisma.content.update({
      where: { id: contentId },
      data: { video_path: renders.video_path ?? '', status: 'rendered' },
    });
    return { contentId, video_path: renders.video_path };
  }

  /** Publica todos os approved+rendered no YouTube */
  async publish(platform = 'youtube', contentId?: number) {
    if (platform !== 'youtube')
      throw new Error('only_youtube_supported_for_now');
    const oauth2 = await this.getOAuth2Client();

    const content = await this.prisma.content.findUnique({
      where: {
        status: 'ready_to_publish',
        approval_status: 'approved',
        id: contentId,
      },
    });

    const published = await this.yt.uploadShort(oauth2, content?.video_path ?? "./media/videos", {
      title: content?.title ?? "Curiosidades",
      description: content?.preview_caption,
      // tags: content?.tags ?? ["#curiosidades", "#fantastico"]
    })

    return { published };
  }

  async analyticsCollect() {
    const oauth2 = await this.getOAuth2Client();
    const channelId = process.env.YT_CHANNEL_ID!;
    const day = new Date();
    const dateISO = day.toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const row = await this.yt.fetchDailyAnalytics(oauth2, channelId, dateISO);
    if (!row) return { ok: true, message: 'no data for today' };

    await this.prisma.metricDaily.upsert({
      where: {
        platform_channel_id_date: {
          platform: 'youtube',
          channel_id: channelId,
          date: new Date(`${dateISO}T00:00:00Z`),
        },
      },
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

  /** IA + Pexels + Storyboard → preview #1 (texto+imagens) */
  async ideateAndAssets(
    contentId: number,
    p: { language?: string; tone?: string },
  ) {
    this.logger.log(
      `[jobs/ideate] start content=${contentId} lang=${p.language ?? 'pt-BR'} tone=${p.tone ?? 'curioso'}`,
    );

    const c = await this.prisma.content.findUnique({
      where: { id: contentId },
    });
    if (!c) {
      this.logger.error(`[jobs/ideate] content not found id=${contentId}`);
      throw new NotFoundException('content not found');
    }

    // 1) IA
    this.logger.log(
      `[jobs/ideate] step:ai storyboard start content=${contentId}`,
    );
    const sb = await this.ai.generateStoryboard({
      title: c.title,
      description: c.script_text || '',
      language: p.language || 'pt-BR',
      tone: p.tone || 'curioso',
    });
    this.logger.log(
      `[jobs/ideate] step:ai storyboard done content=${contentId} sentences=${sb?.sentences?.length ?? 0}`,
    );

    // 2) Pexels
    this.logger.log(
      `[jobs/ideate] step:pexels search start content=${contentId} q="${sb.pexels_query}"`,
    );
    const images = await this.pexels.searchPortrait(sb.pexels_query, 8);
    this.logger.log(
      `[jobs/ideate] step:pexels search done content=${contentId} images=${images?.length ?? 0}`,
    );

    // 3) Persistir
    this.logger.log(`[jobs/ideate] step:persist start content=${contentId}`);
    await this.prisma.content.update({
      where: { id: c.id },
      data: {
        context: sb.context?.tone,
        sentences: sb.sentences?.[0],
        pexels_query: sb.pexels_query,
        image_assets: images?.[0]?.url,
        status: 'assets_ready',
        approval_status: 'pending',
        preview_caption: c.preview_caption || `Storyboard • ${c.title}`,
        review_source: 'auto',
        script_text: c.script_text || sb.context.summary,
      },
    });
    await this.prisma.content.update({
      where: { id: c.id },
      data: { status: 'preview_pending' },
    });
    this.logger.log(
      `[jobs/ideate] step:persist done content=${contentId} status=preview_pending`,
    );

    // 4) PRÉVIA #1 no Telegram (NOVIDADE) — sem alterar nada do restante do fluxo
    this.logger.log(
      `[jobs/ideate] step:telegram check TG_ON=${TG_ON} content=${contentId}`,
    );
    if (TG_ON) {
      try {
        const updated = await this.prisma.content.findUnique({
          where: { id: c.id },
        });
        const caption = [
          `*Prévia #1 — Storyboard*`,
          `*Título:* ${updated?.title ?? ''}`,
          updated?.preview_caption
            ? `*Legenda:* ${updated.preview_caption}`
            : '',
          '',
          `Aprovar para enviar voz (ElevenLabs) e renderizar vídeo?`,
        ]
          .filter(Boolean)
          .join('\n');

        const keyboard = this.telegram.approveRejectKeyboard(contentId);
        const previewUrl = updated?.image_assets || images?.[0]?.url || null;

        if (previewUrl && previewUrl.startsWith('http')) {
          this.logger.log(
            `[jobs/ideate] step:telegram sendPhoto content=${contentId}`,
          );
          await this.telegram.sendPreviewPhoto({
            photoUrl: previewUrl,
            caption,
            replyMarkup: keyboard,
          });
        } else {
          this.logger.log(
            `[jobs/ideate] step:telegram sendMessage content=${contentId}`,
          );
          await this.telegram.sendPreviewText({
            caption,
            replyMarkup: keyboard,
          });
        }
        this.logger.log(
          `[jobs/ideate] step:telegram done content=${contentId}`,
        );
      } catch (e: any) {
        this.logger.error(
          `[jobs/ideate] telegram ERROR content=${contentId}: ${e?.message || e}`,
        );
      }
    } else {
      this.logger.warn(
        `[jobs/ideate] telegram disabled via env content=${contentId}`,
      );
    }

    this.logger.log(`[jobs/ideate] end content=${contentId}`);
    return {
      ok: true,
      contentId: c.id,
      images: images.length,
      sentences: sb.sentences.length,
    };
  }

  // voice(contentId) → ElevenLabs (seta status='voiced' + voice_path)
  // render(contentId, {sendPreview}) → FFmpeg (seta status='rendered' + video_path; envia prévia #2 se sendPreview)
  // publish({platform:'youtube', contentId}) → YouTube Shorts (seta status='published' + platform_video_id)
}
