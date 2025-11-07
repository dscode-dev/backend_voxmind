import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from '../analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  /** TODO: Integrar com YouTube Analytics API e preencher métricas reais */
  async collect() {
    // simulação de coleta
    const today = new Date();
    await this.repo.upsertDaily({
      platform: 'youtube',
      channel_id: 'CHANNEL_1',
      date: new Date(today.toDateString()),
      views: 1200, likes: 130, comments: 12, watch_minutes: 540, revenue_usd: 2.7, revenue_brl: 13.0,
    });
    return { ok: true };
  }

  list(filter: { platform: string; channel_id: string; from?: Date; to?: Date }) {
    return this.repo.list(filter);
  }
}
