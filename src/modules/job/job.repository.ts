import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsRepository {
  constructor(private prisma: PrismaService) {}

  async createJob(data: any) {
    return await this.prisma.job.create({ data });
  }

  async markJob(id: number, patch: any) {
    return await this.prisma.job.update({ where: { id }, data: patch });
  }

  async findRenderableApproved(limit = 10) {
    return await this.prisma.content.findMany({
      where: { status: 'rendered', approval_status: 'approved' },
      take: limit,
      orderBy: { id: 'asc' },
    });
  }
}
