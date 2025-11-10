// src/modules/render/render.service.ts
import { Injectable, Logger } from '@nestjs/common';
import ffprobePath from 'ffprobe-static';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as os from 'os';
import * as fsp from 'fs/promises';
import { spawn } from 'child_process';
import { PrismaService } from 'src/providers/prisma/prisma.service';

// ---------- Utils ----------
function isHttpUrl(s?: string | null) {
  return !!s && /^https?:\/\//i.test(s);
}

// configura os binários locais do npm
ffmpeg.setFfmpegPath(ffmpegPath!);
ffmpeg.setFfprobePath(ffprobePath.path);

/** baixa uma URL para arquivo temporário, preservando a extensão quando possível */
async function fetchToTemp(url: string, fallbackExt = '.jpg'): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar: ${url}`);
  const ct = r.headers.get('content-type') || '';
  let ext = fallbackExt;
  if (ct.includes('png')) ext = '.png';
  else if (ct.includes('jpeg') || ct.includes('jpg')) ext = '.jpg';
  else if (ct.includes('webp')) ext = '.webp';
  const buf = Buffer.from(await r.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `vox_${Date.now()}${ext}`);
  await fsp.writeFile(tmp, buf);
  return tmp;
}

/** obtém a duração (segundos) usando ffprobe */
async function ffprobeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ];

    const p = spawn(ffprobePath.path, args);

    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));

    p.on('close', (code) => {
      if (code === 0) {
        const sec = parseFloat(out.trim());
        resolve(isFinite(sec) ? sec : 0);
      } else {
        reject(new Error(`ffprobe code=${code} err=${err}`));
      }
    });

    p.on('error', (err) => {
      reject(new Error(`spawn error: ${err.message}`));
    });
  });
}

/** gera SRT temporário distribuindo o tempo total do áudio pelas sentenças */
async function makeTempSrtFromSentences(
  sentences: string[],
  totalDurationSec: number,
): Promise<string> {
  const clamp = (n: number, min = 0) => (n < min ? min : n);
  const parts = sentences.filter((s) => s && s.trim().length > 0);
  if (parts.length === 0) throw new Error('no sentences for subtitles');

  const per = clamp(Math.floor((totalDurationSec * 1000) / parts.length), 1200); // min ~1.2s
  const srtLines: string[] = [];
  let idx = 1;
  let t0 = 0;

  const toTS = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const msR = ms % 1000;
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    const mmm = String(msR).padStart(3, '0');
    return `${hh}:${mm}:${ss},${mmm}`;
  };

  for (const line of parts) {
    const start = t0;
    const end = Math.min(t0 + per, totalDurationSec * 1000);
    srtLines.push(String(idx++));
    srtLines.push(`${toTS(start)} --> ${toTS(end)}`);
    srtLines.push(line.trim());
    srtLines.push('');
    t0 = end;
  }

  const srt = srtLines.join('\n');
  const tmp = path.join(os.tmpdir(), `vox_${Date.now()}.srt`);
  await fsp.writeFile(tmp, srt, 'utf8');
  return tmp;
}

/** renderiza com/sem legendas. Se falhar queimar legendas, faz fallback sem travar */
async function ffmpegRenderImageAudio(
  imagePath: string,
  audioPath: string,
  outPath: string,
  durationSec: number,
  srtPath?: string,
): Promise<void> {
  const vfBase = [
    'scale=1080:-1:force_original_aspect_ratio=decrease',
    'pad=1080:1920:(1080-iw)/2:(1920-ih)/2',
    'format=yuv420p',
  ].join(',');

  const common = [
    '-y',
    '-loop',
    '1',
    '-i',
    imagePath,
    '-i',
    audioPath,
    '-t',
    String(Math.max(1, Math.ceil(durationSec))),
    '-r',
    '30',
    '-c:v',
    'libx264',
    '-tune',
    'stillimage',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
  ];

  const bin = ffmpegPath as string;
  if (!bin) throw new Error('FFmpeg binary not found (ffmpeg-static). Did you install it?)');

  // tentativa 1: com legendas
  if (srtPath) {
    const args = [
      ...common,
      '-vf',
      `${vfBase},subtitles='${srtPath.replace(/'/g, "\\'")}'`,
      outPath,
    ];

    try {
      await new Promise<void>((resolve, reject) => {
        const p = spawn(bin, args);
        let err = '';
        p.stderr.on('data', (d) => (err += d.toString()));
        p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err))));
        p.on('error', (e) => reject(e));
      });
      return; // sucesso com legendas
    } catch {
      // cai para render sem legendas
    }
  }

  // tentativa 2: sem legendas
  const argsNoSubs = [...common, '-vf', vfBase, outPath];
  await new Promise<void>((resolve, reject) => {
    const p = spawn(bin, argsNoSubs);
    let err = '';
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err))));
    p.on('error', (e) => reject(e));
  });
}

// ---------- Service ----------
@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Renderiza um vídeo vertical (1080x1920) a partir de uma imagem (URL ou arquivo)
   * e um áudio (URL ou arquivo). Atualiza content.video_path e status='rendered'.
   * Queima legendas se 'sentences' existir (fallback silencioso se faltar lib de subtitles).
   */
  async renderVerticalFromImageAndAudio(contentId: number) {
    this.logger.log(`[render] start content=${contentId}`);

    const c = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!c) throw new Error('content not found');

    if (!c.image_assets) throw new Error('image_assets vazio');
    if (!c.voice_path) throw new Error('voice_path vazio');

    let imagePath = c.image_assets;
    let audioPath = c.voice_path;
    const temps: string[] = [];

    try {
      // Baixa imagem se for URL
      if (isHttpUrl(imagePath)) {
        this.logger.log(`[render] baixando imagem: ${imagePath}`);
        imagePath = await fetchToTemp(imagePath);
        temps.push(imagePath);
      }

      // Baixa áudio se for URL
      if (isHttpUrl(audioPath)) {
        this.logger.log(`[render] baixando áudio: ${audioPath}`);
        const r = await fetch(audioPath);
        if (!r.ok) throw new Error(`HTTP ${r.status} ao baixar áudio`);
        const buf = Buffer.from(await r.arrayBuffer());
        const tmp = path.join(os.tmpdir(), `vox_audio_${Date.now()}.mp3`);
        await fsp.writeFile(tmp, buf);
        audioPath = tmp;
        temps.push(audioPath);
      }

      const duration = await ffprobeDuration(audioPath);

      // tenta gerar SRT a partir de sentences
      let srtPath: string | undefined;
      try {
        const sentences = (c.sentences || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        if (sentences.length > 0) {
          srtPath = await makeTempSrtFromSentences(sentences, duration);
          temps.push(srtPath);
        }
      } catch (e: any) {
        this.logger.warn(`[render] legendas desabilitadas: ${e?.message || e}`);
      }

      // saída persistente em media/videos
      const mediaDir = path.join(process.cwd(), 'media', 'videos');
      await fsp.mkdir(mediaDir, { recursive: true });
      const outName = `vox_${contentId}_${Date.now()}.mp4`;
      const outPath = path.join(mediaDir, outName);

      this.logger.log(
        `[render] ffmpeg image=${path.basename(imagePath)} audio=${path.basename(
          audioPath,
        )} dur=${duration.toFixed(1)}s subs=${!!srtPath}`,
      );
      await ffmpegRenderImageAudio(imagePath, audioPath, outPath, duration, srtPath);

      await this.prisma.content.update({
        where: { id: contentId },
        data: {
          video_path: outPath, // se mover para storage/URL pública, atualize aqui
          status: 'rendered',
        },
      });

      this.logger.log(`[render] done content=${contentId} -> ${outPath}`);
      return { ok: true, video_path: outPath };
    } finally {
      // Limpa temporários
      await Promise.allSettled(temps.map((t) => fsp.unlink(t).catch(() => {})));
    }
  }
}