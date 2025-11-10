import { Body, Controller, Get, HttpException, Param, Post } from '@nestjs/common';
import axios from 'axios';
import { TelegramService } from './telegram.service';
import { ContentsService } from '../content/services/content.service';

@Controller('api/v1/telegram')
export class TelegramController {
  constructor(
    private tg: TelegramService,
    private contents: ContentsService,
  ) {}

  @Post('webhook/:secret')
  async webhook(@Param('secret') secret: string, @Body() update: any) {
    if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      throw new HttpException('forbidden', 403);
    }

    if (update?.callback_query) {
      const res = await this.tg.handleCallback(update.callback_query);
      if (res?.contentId && res?.action === 'approve') {
        await this.contents.approve(res.contentId);
      } else if (res?.contentId && res?.action === 'reject') {
        await this.contents.reject(res.contentId, 'Rejected via Telegram');
      }
      return { ok: true };
    }
    return { ok: true }; 
  }

  @Post('send/:contentId')
  async sendApproval(@Param('contentId') id: string) {
    const content = await this.contents.get(Number(id));
    const messageId = await this.tg.sendApprovalRequest(content as any);

    await this.contents['repo'].update(Number(id), { telegram_message_id: String(messageId) });
    return { ok: true, messageId };
  }

  @Post('send-preview/:contentId')
  async sendPreview(
    @Param('contentId') contentId: string,
    @Body() body: { mode?: 'url' | 'upload' } = {},
  ) {
    const c = await this.contents.get(Number(contentId));
    const mode = body.mode || (process.env.PUBLIC_BASE_URL ? 'url' : 'upload');

    let messageId: number | undefined;
    if (mode === 'url') {
      messageId = await this.tg.sendApprovalVideoByUrl({
        id: c.id, title: c.title, preview_caption: c.preview_caption,
      }) as number;
    } else {
      messageId = await this.tg.sendApprovalVideoUpload({
        id: c.id, title: c.title, preview_caption: c.preview_caption,
      }) as number;
    }

    await this.contents['repo'].update(c.id, { telegram_message_id: String(messageId) });
    return { ok: true, mode, messageId };
  }

  @Get('set-webhook')
  async setWebhook() {
    const base = process.env.PUBLIC_BASE_URL!;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET!;
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const url = `https://api.telegram.org/bot${token}/setWebhook`;
    const webhookUrl = `${base}/telegram/webhook/${secret}`;
    const res = await axios.get(url, { params: { url: webhookUrl } });
    return res.data;
  }

  // 4) (opcional) deleteWebhook
  @Get('delete-webhook')
  async delWebhook() {
    const token = process.env.TELEGRAM_BOT_TOKEN!;
    const url = `https://api.telegram.org/bot${token}/deleteWebhook`;
    const res = await axios.get(url);
    return res.data;
  }
}
