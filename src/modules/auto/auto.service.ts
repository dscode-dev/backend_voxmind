import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TrendsService } from '../trend/trend.service';
import { PrismaService } from 'src/providers/prisma/prisma.service';
import { JobsService } from '../job/services/job.service';

type OneShotOpts = {
  region?: string;
  language?: string;
  max?: number;
  stylePrompt?: string;
};

@Injectable()
export class AutoRunnerService {
  private readonly logger = new Logger(AutoRunnerService.name);

  constructor(
    private readonly trends: TrendsService,
  ) {}

  /**
   * Executa imediatamente uma “rodada” de ingestão por Gemini.
   * - Cria (ou reusa) campanha automaticamente
   * - Grava conteúdos (status=planned, approval=pending)
   * - Dispara ideation+assets (prévia #1 no Telegram) se kickIdeation=true no service
   */
  async executeOneShot(opts: OneShotOpts = {}) {
    const enabled = (process.env.AUTO_RUN_ENABLED ?? 'true').toLowerCase() === 'true';
    if (!enabled) {
      this.logger.warn('AutoRunner desabilitado (AUTO_RUN_ENABLED=false). Saindo.');
      return { skipped: true, reason: 'disabled' };
    }

    const source = (process.env.AUTO_TRENDS_SOURCE ?? 'gemini').toLowerCase();
    if (source !== 'gemini') {
      this.logger.warn(`AUTO_TRENDS_SOURCE=${source} não suportado neste runner. Use "gemini".`);
      return { skipped: true, reason: 'unsupported_source' };
    }

    // Parâmetros com defaults sensatos
    const region = opts.region ?? process.env.AUTO_REGION ?? 'BR';
    const language = opts.language ?? process.env.AUTO_LANGUAGE ?? (region === 'BR' ? 'pt-BR' : 'en-US');
    const max = Number.isFinite(opts.max) ? (opts.max as number) :
      parseInt(process.env.AUTO_TRENDS_PER_RUN ?? '6', 10);
    const stylePrompt = opts.stylePrompt ?? process.env.CHANNEL_STYLE_PROMPT ?? '';

    this.logger.log(`Iniciando executeOneShot (source=gemini, region=${region}, lang=${language}, max=${max})`);

    try {
      const result = await this.trends.ingestFromGemini({
        region,
        language,
        max,
        stylePrompt,
        autoCreateCampaign: true,
        kickIdeation: true, // dispara IA+Pexels e envia prévia #1 para aprovação
      });

      this.logger.log(
        `Ingest concluído: campaignId=${result.campaignId} created=${result.createdCount} ids=${result.createdIds?.join(',')}`,
      );

      return {
        ok: true,
        campaignId: result.campaignId,
        createdCount: result.createdCount,
        createdIds: result.createdIds,
      };
    } catch (err: any) {
      this.logger.error(`Falha no executeOneShot: ${err?.message || err}`, err?.stack);
      return { ok: false, error: err?.message || 'unknown_error' };
    }
  }

  /**
   * Agenda 4 execuções por dia (America/Recife): 09:05, 13:05, 17:05, 21:05
   * Ajuste os horários se preferir.
   */
  @Cron('5 9,13,17,21 * * *', { timeZone: process.env.TZ || 'America/Recife' })
  async scheduledRun() {
    this.logger.log('⏱️ Rodando AutoRunner (agendado) …');
    await this.executeOneShot();
  }
}