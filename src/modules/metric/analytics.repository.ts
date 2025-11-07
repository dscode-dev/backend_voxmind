import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private prisma: PrismaService) {}

  async upsertDaily(payload: {
    platform: string; channel_id: string; date: Date;
    views: number; likes: number; comments: number; watch_minutes: number; revenue_usd: number; revenue_brl: number;
  }) {
    const { platform, channel_id, date, ...rest } = payload;
    return await this.prisma.metricDaily.upsert({
      where: { platform_channel_id_date: { platform, channel_id, date } },
      create: { platform, channel_id, date, ...rest },
      update: { ...rest },
    });
  }

  async list(filter: { platform: string; channel_id: string; from?: Date; to?: Date }) {
    const where: any = { platform: filter.platform, channel_id: filter.channel_id };
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) where.date.gte = filter.from;
      if (filter.to) where.date.lte = filter.to;
    }
    return await this.prisma.metricDaily.findMany({ where, orderBy: { date: 'asc' } });
  }
}
