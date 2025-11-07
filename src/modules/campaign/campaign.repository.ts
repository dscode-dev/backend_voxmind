import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsRepository {
  constructor(private prisma: PrismaService) {}
  list(offset = 0, limit = 50) {
    return this.prisma.campaign.findMany({
      skip: offset,
      take: limit,
      orderBy: { id: 'desc' },
    });
  }
  async count() {
    return await this.prisma.campaign.count();
  }
  async get(id: number) {
    return await this.prisma.campaign.findUnique({ where: { id } });
  }
  async create(data: any) {
    return await this.prisma.campaign.create({ data });
  }
  async update(id: number, data: any) {
    return await this.prisma.campaign.update({ where: { id }, data });
  }
}
