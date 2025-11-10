import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AutoRunnerService } from '../auto/auto.service';
import { AutoModule } from '../auto/auto.module';
import { Logger } from '@nestjs/common';

@Module({
  imports: [ScheduleModule.forRoot(), AutoModule],
  providers: [
    {
      provide: 'SCHEDULE_RUNNER',
      useFactory: (autoRunner: AutoRunnerService) => {
        const logger = new Logger('ScheduleRunner');
        const enabled =
          (process.env.AUTO_RUN_ENABLED ?? 'true').toLowerCase() === 'true';

        if (!enabled) {
          logger.warn(
            '⏸️ Auto-run desativado via .env (AUTO_RUN_ENABLED=false)',
          );
          return null;
        }

        // dispara o cron configurado internamente no AutoRunner
        logger.log('✅ ScheduleModule iniciado — cron ativo');
        return autoRunner;
      },
      inject: [AutoRunnerService],
    },
  ],
  exports: [],
})
export class AppScheduleModule {}
