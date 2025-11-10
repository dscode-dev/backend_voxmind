import * as fs from 'node:fs';
import * as path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import FormData from 'form-data';
import axios from 'axios';

function isHttpUrl(s?: string | null) {
  return !!s && /^https?:\/\//i.test(s);
}

type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};
type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

const TG_ON =
  (process.env.TELEGRAM_ENABLED ?? 'false').toLowerCase() === 'true';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private token = process.env.TELEGRAM_BOT_TOKEN!;
  private channelId = process.env.TELEGRAM_CHANNEL_ID!;
  private baseUrl = `https://api.telegram.org/bot${this.token}`;
  private publicBase = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  private readonly chatId = process.env.TELEGRAM_CHANNEL_ID; // ex: -1001234567890
  private readonly base = this.token
    ? `https://api.telegram.org/bot${this.token}`
    : '';

  constructor(private media: MediaService) {
    if (!TG_ON) {
      this.logger.warn('TELEGRAM_ENABLED=false — envios desativados.');
    }
    if (!this.token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN ausente.');
    }
    if (!this.chatId) {
      this.logger.warn('TELEGRAM_CHANNEL_ID ausente.');
    }
  }

  private keyboard(contentId: number) {
    return {
      inline_keyboard: [
        [
          { text: '✅ Aprovar', callback_data: `approve:${contentId}` },
          { text: '⛔ Rejeitar', callback_data: `reject:${contentId}` },
        ],
      ],
    };
  }

  private caption(content: {
    id: number;
    title: string;
    preview_caption?: string;
  }) {
    const esc = (s: string) => s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    return `*Aprovação Voxmind*\n*ID:* ${content.id}\n*Title:* ${esc(content.title)}\n\n${esc(content.preview_caption || '')}`;
  }

  async sendApprovalRequest(content: {
    id: number;
    title: string;
    preview_caption?: string;
  }) {
    const videoUrl = `${this.publicBase}/media/videos/${content.id}.mp4`;
    const thumbUrl = `${this.publicBase}/media/thumbs/${content.id}.jpg`;

    const caption = `*Aprovação Voxmind*\n*ID:* ${content.id}\n*Title:* ${this.escape(content.title)}\n\n${this.escape(content.preview_caption || '')}`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Aprovar', callback_data: `approve:${content.id}` },
          { text: '⛔ Rejeitar', callback_data: `reject:${content.id}` },
        ],
      ],
    };

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
      this.logger.error(
        `sendApprovalRequest error: ${e?.response?.data ? JSON.stringify(e.response.data) : e.message}`,
      );
      throw e;
    }
  }

  async sendApprovalVideoByUrl(content: {
    id: number;
    title: string;
    preview_caption?: string;
  }) {
    const videoUrl = `${this.publicBase}/media/videos/${content.id}.mp4`;
    const thumbUrl = `${this.publicBase}/media/thumbs/${content.id}.jpg`;
    const payload = {
      chat_id: this.channelId,
      video: videoUrl,
      caption: this.caption(content),
      parse_mode: 'Markdown',
      reply_markup: this.keyboard(content.id),
      thumbnail: thumbUrl,
      supports_streaming: true,
    };
    const res = await axios.post(`${this.baseUrl}/sendVideo`, payload);
    return res.data?.result?.message_id;
  }

  async sendApprovalVideoUpload(content: {
    id: number;
    title: string;
    preview_caption?: string;
  }) {
    const videoPath = this.media.videoPathById(content.id);
    let thumbPath: string | undefined;
    try {
      thumbPath = await this.media.ensureThumbnail(content.id);
    } catch {}

    const form = new FormData();
    form.append('chat_id', this.channelId);
    form.append('caption', this.caption(content));
    form.append('parse_mode', 'Markdown');
    form.append('supports_streaming', 'true');
    form.append('reply_markup', JSON.stringify(this.keyboard(content.id)));
    form.append('video', fs.createReadStream(videoPath));
    if (thumbPath) form.append('thumbnail', fs.createReadStream(thumbPath));

    const res = await axios.post(`${this.baseUrl}/sendVideo`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return res.data?.result?.message_id;
  }

  async handleCallback(callbackQuery: any) {
    const data: string = callbackQuery?.data || '';
    const msg = callbackQuery?.message;
    const message_id = msg?.message_id;
    const chat_id = msg?.chat?.id;

    const [action, idStr] = data.split(':');
    const contentId = Number(idStr);

    if (!['approve', 'reject'].includes(action) || !contentId) return;

    try {
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
      this.logger.error(
        `editMessage error: ${e?.response?.data ? JSON.stringify(e.response.data) : e.message}`,
      );
    }

    try {
      await axios.post(`${this.baseUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQuery.id,
        text: action === 'approve' ? 'Aprovado!' : 'Rejeitado!',
        show_alert: false,
      });
    } catch {}
    return { action, contentId };
  }

  private escape(s: string) {
    return s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  approveRejectKeyboard(contentId: number): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          { text: '✅ Aprovar', callback_data: `approve:${contentId}` },
          { text: '❌ Rejeitar', callback_data: `reject:${contentId}` },
        ],
      ],
    };
  }

  /** Envia texto simples (prévia sem imagem) */
  async sendPreviewText(p: {
    caption: string;
    replyMarkup?: InlineKeyboardMarkup;
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  }) {
    if (!TG_ON || !this.ready()) return { ok: false, skipped: true };

    const body = {
      chat_id: this.chatId,
      text: this.truncate(p.caption, 4096),
      parse_mode: p.parseMode ?? 'Markdown',
      reply_markup: p.replyMarkup,
      disable_web_page_preview: true,
    };

    const res = await this.call('sendMessage', body);
    return res;
  }

  /** Envia foto com legenda (usada na Prévia #1) */
  async sendPreviewPhoto(p: {
    photoUrl: string;
    caption?: string;
    replyMarkup?: InlineKeyboardMarkup;
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  }) {
    if (!TG_ON || !this.ready()) return { ok: false, skipped: true };

    const body = {
      chat_id: this.chatId,
      photo: p.photoUrl,
      caption: p.caption ? this.truncate(p.caption, 1024) : undefined,
      parse_mode: p.parseMode ?? 'Markdown',
      reply_markup: p.replyMarkup,
    };

    const res = await this.call('sendPhoto', body);
    if (!res.ok) {
      // fallback para texto se a foto falhar (ex.: URL inválida)
      this.logger.warn(
        `sendPhoto falhou, fallback para sendMessage: ${res.description ?? ''}`,
      );
      return this.sendPreviewText({
        caption: p.caption ?? 'Prévia',
        replyMarkup: p.replyMarkup,
        parseMode: p.parseMode,
      });
    }
    return res;
  }

  async sendPreviewVideo(p: {
    videoUrl: string; 
    caption?: string;
    replyMarkup?: InlineKeyboardMarkup;
    parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  }) {
    if (!TG_ON || !this.ready()) return { ok: false, skipped: true };

    const endpoint = `${this.base}/sendVideo`;
    const parseMode = p.parseMode ?? 'Markdown';

    // Caso 1: URL pública -> JSON normal (como já estava)
    if (isHttpUrl(p.videoUrl)) {
      const body = {
        chat_id: this.chatId,
        video: p.videoUrl,
        caption: p.caption ? this.truncate(p.caption, 1024) : undefined,
        parse_mode: parseMode,
        reply_markup: p.replyMarkup,
        // supports_streaming: true,
      };
      const res = await this.call('sendVideo', body);
      if (!res.ok)
        this.logger.warn(`sendVideo via URL falhou: ${res.description ?? ''}`);
      else this.logger.log('sendVideo via URL OK');
      return res;
    }

    // Caso 2: caminho local -> upload multipart
    try {
      if (!fs.existsSync(p.videoUrl)) {
        this.logger.error(`Arquivo de vídeo não encontrado em: ${p.videoUrl}`);
        return { ok: false, description: 'vídeo não encontrado' };
      }

      const form = new FormData();
      form.append('chat_id', this.chatId);
      form.append('video', fs.createReadStream(p.videoUrl), {
        filename: path.basename(p.videoUrl),
        contentType: 'video/mp4',
      });
      if (p.caption) form.append('caption', this.truncate(p.caption, 1024));
      form.append('parse_mode', parseMode);
      if (p.replyMarkup)
        form.append('reply_markup', JSON.stringify(p.replyMarkup));

      const res = await fetch(endpoint, {
        method: 'POST',
        // @ts-ignore (tipagem do fetch+form-data pode variar conforme runtime)
        body: form,
        // headers injetados pelo form automaticamente
      });

      const json = await res.json().catch(() => ({}));
      if (!json.ok) {
        this.logger.error(
          `Telegram sendVideo multipart ERROR: ${json.description ?? res.statusText}`,
        );
      } else {
        this.logger.log('Telegram sendVideo multipart OK');
      }
      return json;
    } catch (e: any) {
      this.logger.error(`sendVideo multipart EXCEPTION: ${e?.message || e}`);
      return { ok: false, description: e?.message || String(e) };
    }
  }

  /** Utilitário: responder callback query (quando tratar webhook) */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert = false,
  ) {
    if (!TG_ON || !this.ready()) return { ok: false, skipped: true };
    const body = {
      callback_query_id: callbackQueryId,
      text,
      show_alert: showAlert,
    };
    return this.call('answerCallbackQuery', body);
  }

  private async call<T = any>(
    method: string,
    body: any,
  ): Promise<{ ok: boolean; result?: T; description?: string }> {
    try {
      const res = await fetch(`${this.base}/${method}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!json.ok) {
        this.logger.error(
          `Telegram ${method} ERROR: ${json.description ?? res.statusText}`,
        );
      } else {
        this.logger.log(`Telegram ${method} OK`);
      }
      return json;
    } catch (e: any) {
      this.logger.error(`Telegram ${method} EXCEPTION: ${e?.message || e}`);
      return { ok: false, description: e?.message || String(e) };
    }
  }

  private ready() {
    const ok = Boolean(this.token && this.chatId);
    if (!ok)
      this.logger.error('Telegram não configurado (BOT_TOKEN/CHANNEL_ID).');
    return ok;
  }

  private truncate(s: string, max: number) {
    if (!s) return s;
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }
}
