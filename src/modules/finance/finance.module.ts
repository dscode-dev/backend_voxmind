import { Module } from '@nestjs/common';
import { FinanceRepository } from './finance.repository';
import { FinanceService } from './services/finance.service';
import { FinanceController } from './controllers/finance.controller';

@Module({
  providers: [FinanceRepository, FinanceService],
  controllers: [FinanceController],
})
export class FinanceModule {}
