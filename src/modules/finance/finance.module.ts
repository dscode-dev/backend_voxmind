import { Module } from '@nestjs/common';
import { FinanceController } from './controllers/finance.controller';
import { FinanceService } from './services/finance.service';

@Module({
  controllers: [FinanceController],
  providers: [FinanceService]
})
export class FinanceModule {}
