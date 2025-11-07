import { Body, Controller, Get, HttpException, Param, Post } from '@nestjs/common';
import axios from 'axios';
import { TelegramService } from './telegram.service';
import { ContentsService } from '../content/services/content.service';

@Controller('telegram')
export class TelegramController {
  constructor(
    private tg: TelegramService,
    private contents: ContentsService,
  ) {}

  // 1) webhook: set pelo BotFather via setWebhook
  // URL final:  POST /telegram/webhook/:secret
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
    return { ok: true }; // ignore mensagens comuns
  }

  // 2) enviar solicitação de aprovação para um contentId
  @Post('send/:contentId')
  async sendApproval(@Param('contentId') id: string) {
    const content = await this.contents.get(Number(id));
    const messageId = await this.tg.sendApprovalRequest(content as any);
    // salva o messageId se quiser referenciar depois:
    await this.contents['repo'].update(Number(id), { telegram_message_id: String(messageId) });
    return { ok: true, messageId };
  }

  // 3) (opcional) setWebhook helper (requer PUBLIC_BASE_URL e SECRET)
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
