import { Injectable, Logger } from '@nestjs/common';
import { TelegramService } from '../telegram/telegram.service';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { JobsService } from '../job/services/job.service';
import { AutoRunnerService } from '../auto/auto.service';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);
  constructor(
    private prisma: PrismaService,
    private jobs: JobsService,
    private tg: TelegramService,
    private auto: AutoRunnerService,
  ) {}

  private async getContent(id: number) {
    const c = await this.prisma.content.findUnique({ where: { id } });
    if (!c) throw new Error(`content ${id} not found`);
    return c as any;
  }

  /** Ideação aprovada → voice → render (com prévia vídeo) */
  async onIdeationApproved(contentId: number) {
    const c = await this.getContent(contentId);

    if (c.approval_status !== 'approved') {
      await this.prisma.content.update({
        where: { id: c.id },
        data: { approval_status: 'approved' },
      });
    }
    if (
      ['voiced', 'rendered', 'ready_to_publish', 'published'].includes(c.status)
    ) {
      this.logger.log(`[${c.id}] skip voice: status=${c.status}`);
      return { skipped: true };
    }
    await this.safeVoice(c.id);
    return { ok: true, next: 'voice' };
  }

  async onVoiceDone(contentId: number) {
    const c = await this.getContent(contentId);
    if (c.status !== 'voiced') return { skipped: true };
    await this.safeRender(c.id, { sendPreview: true });
    return { ok: true, next: 'render' };
  }

  async onRenderDone(contentId: number) {
    const c = await this.getContent(contentId);
    if (c.status !== 'rendered') return { skipped: true };
    if (!c.telegram_message_id) {
      try {
        await this.tg.sendPreviewVideo({
          videoUrl: c.video_path,
        });
      } catch (e) {
        this.logger.error(`[${c.id}] erro ao enviar prévia vídeo: ${e}`);
      }
    }
    await this.prisma.content.update({
      where: { id: c.id },
      data: { status: 'ready_to_publish' },
    });
    return { ok: true, next: 'ready_to_publish' };
  }

  async onPostApproved(contentId: number) {
    const c = await this.getContent(contentId);
    if (c.status === 'published') return { skipped: true };
    if (!['rendered', 'ready_to_publish'].includes(c.status)) {
      throw new Error(`[${c.id}] inválido aprovar post: status=${c.status}`);
    }
    await this.jobs.publish('youtube', contentId);
    const nc = await this.getContent(c.id);
    return { ok: true, videoId: nc.platform_video_id, status: nc.status };
  }

  private async safeVoice(id: number) {
    const c = await this.getContent(id);
    if (['voiced', 'rendered', 'published'].includes(c.status)) return;

    const voiceId = process.env.ELEVENLABS_VOICE_ID;

    await this.jobs.voice(id, String(voiceId));
    await this.onVoiceDone(id);
  }
  private async safeRender(id: number, opts: { sendPreview?: boolean }) {
    const c = await this.getContent(id);
    if (['rendered', 'published'].includes(c.status)) return;
    await this.jobs.renderVideo(id);
    await this.onRenderDone(id);
  }

  async retryFrom(id: number, stage: 'voice' | 'render' | 'publish') {
    if (stage === 'voice') return this.safeVoice(id);
    if (stage === 'render') return this.safeRender(id, { sendPreview: true });
    if (stage === 'publish') return this.onPostApproved(id);
  }

  async execute() {
    return await this.auto.executeOneShot();
  }
}
