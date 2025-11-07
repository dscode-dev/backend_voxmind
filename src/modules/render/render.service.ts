import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  private mediaRoot = process.env.MEDIA_ROOT || './media';
  private videosDir = process.env.MEDIA_VIDEOS || './media/videos';
  private assetsDir = process.env.MEDIA_ASSETS || './media/assets';
  private defaultBg = process.env.DEFAULT_BG_IMAGE || path.join(this.assetsDir, 'bg_default.jpg');

  constructor() {
    for (const dir of [this.mediaRoot, this.videosDir, this.assetsDir]) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Renderiza um vídeo 1080x1920 combinando uma imagem de fundo e um áudio.
   * Aplica um leve zoom-in na imagem e corta a duração para a duração do áudio.
   */
  async renderVerticalFromImageAndAudio(opts: {
    imagePath?: string;        // se vazio, usa default
    audioPath: string;
    outBaseName: string;       // sem extensão
    maxSeconds?: number;       // corta se ultrapassar
  }): Promise<string> {
    if (!fs.existsSync(opts.audioPath)) throw new Error(`Áudio não encontrado: ${opts.audioPath}`);
    const image = opts.imagePath && fs.existsSync(opts.imagePath) ? opts.imagePath : this.defaultBg;
    if (!fs.existsSync(image)) throw new Error(`Imagem de fundo não encontrada: ${image}`);

    const outPath = path.join(this.videosDir, `${opts.outBaseName}.mp4`);

    // Filtro: cria um leve zoom-in e ajusta para 1080x1920 (crop/scale)
    const vf = [
      // 1) escala a imagem para cobrir 1080x1920
      `scale=iw*max(1080/iw\\,1920/ih):ih*max(1080/iw\\,1920/ih)`,
      // 2) centraliza e corta
      `crop=1080:1920`,
      // 3) zoom leve de 1.0 -> 1.06 durante o tempo (assumindo 60s máx)
      `zoompan=z='min(zoom+0.0009,1.06)':d=125`,
      // 4) define fps
      `fps=30`,
      // 5) formata cor
      `format=yuv420p`,
    ].join(',');

    // Duração: limitar por -t se maxSeconds definido
    const maxArgs = opts.maxSeconds ? ['-t', String(opts.maxSeconds)] : [];

    const args = [
      '-y',
      // entrada imagem (loop)
      '-loop', '1', '-i', image,
      // entrada áudio
      '-i', opts.audioPath,
      // filtros de vídeo
      '-vf', vf,
      // codec
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '23',
      // áudio
      '-c:a', 'aac', '-b:a', '192k',
      // dura o tempo do áudio
      '-shortest',
      ...maxArgs,
      outPath,
    ];

    this.logger.log(`ffmpeg ${args.join(' ')}`);

    await new Promise<void>((resolve, reject) => {
      const ff = spawn('ffmpeg', args);
      ff.stderr.on('data', (d) => this.logger.verbose(d.toString()));
      ff.on('error', reject);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))));
    });

    if (!fs.existsSync(outPath)) throw new Error('Falha ao renderizar vídeo');
    return outPath;
  }
}
