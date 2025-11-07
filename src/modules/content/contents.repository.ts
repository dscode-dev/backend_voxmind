import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) { return await this.prisma.content.create({ data }); }

  async get(id: number) { return await this.prisma.content.findUnique({ where: { id } }); }

  async list(params: { status?: string; approval?: string; campaign_id?: number; offset: number; limit: number; }) {
    const { status, approval, campaign_id, offset, limit } = params;
    const where: any = {};
    if (status) where.status = status;
    if (approval) where.approval_status = approval;
    if (campaign_id) where.campaign_id = campaign_id;

    const [items, total] = await Promise.all([
      this.prisma.content.findMany({ where, skip: offset, take: limit, orderBy: { id: 'desc' } }),
      this.prisma.content.count({ where }),
    ]);
    return { items, total };
  }

  update(id: number, data: any) {
    return this.prisma.content.update({ where: { id }, data });
  }
}
