import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private mediaVoices = process.env.MEDIA_VOICES || './media/voices';
  private mediaVideos = process.env.MEDIA_VIDEOS || './media/videos';

  voicePathById(id: number) {
    const p = path.join(this.mediaVoices, `${id}.mp3`);
    if (!fs.existsSync(p)) throw new Error('voice_not_found');
    return p;
  }

  videoPathById(id: number) {
    const p = path.join(this.mediaVideos, `${id}.mp4`);
    if (!fs.existsSync(p)) throw new Error('video_not_found');
    return p;
  }

  thumbPathById(id: number) {
    return path.join(this.mediaVideos, `${id}.jpg`);
  }

  async ensureThumbnail(id: number) {
    const video = this.videoPathById(id);
    const thumb = this.thumbPathById(id);
    if (fs.existsSync(thumb)) return thumb;

    await new Promise<void>((resolve, reject) => {
      const args = ['-y', '-i', video, '-ss', '00:00:01', '-vframes', '1', '-vf', 'scale=480:-1', thumb];
      const ff = spawn('ffmpeg', args);
      ff.stderr.on('data', (d) => this.logger.verbose(d.toString()));
      ff.on('error', reject);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg code ${code}`))));
    });
    return thumb;
  }
}
