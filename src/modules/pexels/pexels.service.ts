import { Injectable } from '@nestjs/common';
import axios from 'axios';

export type PexelsAsset = {
  url: string;
  photographer?: string;
  width?: number;
  height?: number;
  pexels_id?: number;
  license?: string;
};

@Injectable()
export class PexelsService {
  private apiKey = process.env.PEXELS_API_KEY!;

  async searchPortrait(query: string, count = 8): Promise<PexelsAsset[]> {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, per_page: Math.min(count, 15), orientation: 'portrait' },
      headers: { Authorization: this.apiKey },
    });
    const photos = res.data?.photos ?? [];
    return photos.slice(0, count).map((p: any) => ({
      url: p.src?.large2x || p.src?.original || p.url,
      photographer: p.photographer,
      width: p.width, height: p.height,
      pexels_id: p.id, license: 'Pexels',
    }));
  }
}
