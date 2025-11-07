import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private token = process.env.TELEGRAM_BOT_TOKEN!;
  private channelId = process.env.TELEGRAM_CHANNEL_ID!;
  private baseUrl = `https://api.telegram.org/bot${this.token}`;
  private publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

  // Envia mensagem com preview e botões inline
  async sendApprovalRequest(content: { id: number; title: string; preview_caption?: string }) {
    const videoUrl = `${this.publicBase}/media/videos/${content.id}.mp4`;
    const thumbUrl = `${this.publicBase}/media/thumbs/${content.id}.jpg`;

    const caption = `*Aprovação Voxmind*\n*ID:* ${content.id}\n*Title:* ${this.escape(content.title)}\n\n${this.escape(content.preview_caption || '')}`;
    const keyboard = {
      inline_keyboard: [[
        { text: '✅ Aprovar', callback_data: `approve:${content.id}` },
        { text: '⛔ Rejeitar', callback_data: `reject:${content.id}` },
      ]],
    };

    // pode enviar como vídeo (se URL pública) ou como mensagem com link
    try {
      const res = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: this.channelId,
        parse_mode: 'Markdown',
        text: `${caption}\n\nPrévia: ${videoUrl}`,
        reply_markup: keyboard,
        disable_web_page_preview: false,
      });
      return res.data?.result?.message_id;
    } catch (e: any) {
      this.logger.error(`sendApprovalRequest error: ${e?.response?.data ? JSON.stringify(e.response.data) : e.message}`);
      throw e;
    }
  }

  // trata callback_data "approve:<id>" | "reject:<id>"
  async handleCallback(callbackQuery: any) {
    const data: string = callbackQuery?.data || '';
    const msg = callbackQuery?.message;
    const message_id = msg?.message_id;
    const chat_id = msg?.chat?.id;

    const [action, idStr] = data.split(':');
    const contentId = Number(idStr);

    if (!['approve', 'reject'].includes(action) || !contentId) return;

    try {
      // apenas edita o texto para refletir a decisão (o controller faz o patch real)
      await axios.post(`${this.baseUrl}/editMessageReplyMarkup`, {
        chat_id,
        message_id,
        reply_markup: { inline_keyboard: [] }, // remove botões
      });
      await axios.post(`${this.baseUrl}/editMessageText`, {
        chat_id,
        message_id,
        parse_mode: 'Markdown',
        text: `*Aprovação Voxmind*\nID: ${contentId}\n*Decisão:* ${action === 'approve' ? '✅ Aprovado' : '⛔ Rejeitado'}`,
      });
    } catch (e: any) {
      this.logger.error(`editMessage error: ${e?.response?.data ? JSON.stringify(e.response.data) : e.message}`);
    }

    // responde o callback (evita "relogio" no app Telegram)
    try {
      await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQuery.id,
        text: action === 'approve' ? 'Aprovado!' : 'Rejeitado!',
        show_alert: false,
      });
    } catch {}
    return { action, contentId };
  }

  // util simples
  private escape(s: string) {
    return s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
