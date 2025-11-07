import { Injectable, Logger } from '@nestjs/common';
import { google, youtube_v3, youtubeAnalytics_v2 } from 'googleapis';
import * as fs from 'node:fs';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  async uploadShort(oauth2Client: any, filePath: string, input: {
    title: string;
    description?: string;
    tags?: string[];
    madeForKids?: boolean;
  }): Promise<{ videoId: string }> {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) throw new Error(`Arquivo não encontrado: ${filePath}`);

    const res = await youtube.videos.insert(
      {
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: input.title,
            description: input.description ?? '',
            tags: input.tags ?? ['#shorts'],
            categoryId: '24',
          },
          status: {
            privacyStatus: 'public',
            madeForKids: input.madeForKids ?? false,
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      },
      {
        // forçar upload resumable (o googleapis já negocia isso internamente)
        onUploadProgress: (evt) => {
          if (evt && (evt.bytesRead ?? 0) > 0) {
            const pct = ((evt.bytesRead / stats.size) * 100).toFixed(1);
            this.logger.log(`YouTube upload progress: ${pct}%`);
          }
        },
      },
    );

    const videoId = res.data.id!;
    if (!videoId) throw new Error('YouTube não retornou videoId');
    return { videoId };
  }

  async fetchDailyAnalytics(oauth2Client: any, channelId: string, dateISO: string) {
    const yta = google.youtubeAnalytics('v2');
    // docs: https://developers.google.com/youtube/analytics/reference/reports/query
    const res = await yta.reports.query({
      auth: oauth2Client,
      ids: 'channel==MINE', // com refresh_token, MINE funciona para o canal autenticado
      startDate: dateISO,   // '2025-11-06'
      endDate: dateISO,
      metrics: 'views,likes,comments,estimatedMinutesWatched,estimatedRevenue',
      dimensions: 'day',
    });

    const rows = res.data.rows ?? [];
    if (rows.length === 0) return null;
    const [day, views, likes, comments, minutes, revenue] = rows[0];
    return {
      day,
      views: Number(views || 0),
      likes: Number(likes || 0),
      comments: Number(comments || 0),
      watch_minutes: Number(minutes || 0),
      revenue_usd: Number(revenue || 0),
    };
  }
}
