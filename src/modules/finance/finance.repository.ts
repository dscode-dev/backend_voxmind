import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceRepository {
  constructor(private prisma: PrismaService) {}

  createSnapshot(data: any) { return this.prisma.financeSnapshot.create({ data }); }

  list(from?: Date, to?: Date) {
    const where: any = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }
    return this.prisma.financeSnapshot.findMany({ where, orderBy: { date: 'asc' } });
  }
}
