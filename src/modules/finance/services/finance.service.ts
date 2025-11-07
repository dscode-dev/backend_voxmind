import { Injectable } from '@nestjs/common';
import { FinanceRepository } from '../finance.repository';


@Injectable()
export class FinanceService {
  constructor(private repo: FinanceRepository) {}

  createSnapshot(data: any) { return this.repo.createSnapshot(data); }
  list(filter: { from?: Date; to?: Date }) { return this.repo.list(filter.from, filter.to); }
}
