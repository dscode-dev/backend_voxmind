import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class ElevenLabsService {
  private apiKey = process.env.ELEVENLABS_API_KEY!;
  private defaultVoice = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

  async synthesizeToFile(text: string, outDir: string, baseName: string, voiceId?: string): Promise<string> {
    const vid = voiceId || this.defaultVoice;
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${vid}`;
    const res = await axios.post(
      url,
      { text, model_id: 'eleven_multilingual_v2' },
      {
        responseType: 'arraybuffer',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      },
    );

    const outPath = path.join(outDir, `${baseName}.mp3`);
    fs.writeFileSync(outPath, Buffer.from(res.data));
    return outPath;
  }
}
