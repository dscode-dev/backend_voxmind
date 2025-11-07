import { Module } from '@nestjs/common';
import { FinanceRepository } from './finance.repository';
import { FinanceService } from './services/finance.service';
import { FinanceController } from './controllers/finance.controller';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FinanceRepository, FinanceService],
  controllers: [FinanceController],
})
export class FinanceModule {}
