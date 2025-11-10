import { Controller, Get, Header, HttpException, Param, Req, Res } from '@nestjs/common';
import { MediaService } from './media.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Request, Response } from 'express';

@Controller('api/v1/media')
export class MediaController {
  constructor(private media: MediaService) {}

  @Get('voices/:id.mp3')
  async getVoice(@Param('id') id: string, @Res() res: Response) {
    try {
      const p = this.media.voicePathById(Number(id));
      res.setHeader('Content-Type', 'audio/mpeg');
      fs.createReadStream(p).pipe(res);
    } catch {
      throw new HttpException('voice_not_found', 404);
    }
  }

  @Get('videos/:id.mp4')
  async getVideo(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    try {
      const p = this.media.videoPathById(Number(id));
      const stat = fs.statSync(p);
      const range = req.headers.range;

      if (!range) {
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Type', 'video/mp4');
        return fs.createReadStream(p).pipe(res);
      }

      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      });
      fs.createReadStream(p, { start, end }).pipe(res);
    } catch {
      throw new HttpException('video_not_found', 404);
    }
  }

  @Get('thumbs/:id.jpg')
  @Header('Cache-Control', 'public, max-age=86400, immutable')
  async getThumb(@Param('id') id: string, @Res() res: Response) {
    try {
      const t = await this.media.ensureThumbnail(Number(id));
      res.setHeader('Content-Type', 'image/jpeg');
      fs.createReadStream(t).pipe(res);
    } catch {
      throw new HttpException('thumb_not_found', 404);
    }
  }
}
