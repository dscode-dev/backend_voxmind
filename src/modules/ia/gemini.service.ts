import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { geminiTrendsResponseSchema, systemPrompt, userPrompt } from './prompts/gemin-trends';


@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  getModel() {
    return this.client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      // 👇 coloque o system aqui, não como "role: system" no generateContent
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.6,
        responseMimeType: 'application/json',
        responseSchema: geminiTrendsResponseSchema as any,
      },
    });
  }

  async trendsPayload(params: {
    region: string;
    language?: string;
    niche?: string;
    stylePrompt?: string;
    max?: number;
  }) {
    const language = params.language ?? (params.region === 'BR' ? 'pt-BR' : 'en-US');
    const niche = params.niche ?? 'curiosidades e fatos rápidos';
    const max = Math.min(Math.max(params.max ?? 10, 3), 30);

    const model = this.getModel();

    // ✅ use "contents: Content[]" (cada Content tem role + parts)
    const contents: Content[] = [
      {
        role: 'user',
        parts: [{ text: userPrompt({
          region: params.region,
          language,
          niche,
          stylePrompt: params.stylePrompt,
          max,
        }) }],
      },
    ];

    const res = await model.generateContent({ contents });

    const txt = res.response?.text() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(txt);
    } catch (e) {
      this.logger.error(`Gemini retornou JSON inválido: ${txt}`);
      throw e;
    }

    // normalizações
    parsed.campaign = {
      language,
      niche,
      platform: 'youtube',
      daily_quota: 50,
      max_length_sec: 60,
      style_prompt: params.stylePrompt || '',
      ...(parsed.campaign || {}),
    };
    parsed.items = (parsed.items || []).slice(0, max).map((it: any) => ({
      language,
      niche,
      preview_caption: it?.preview_caption || `Storyboard • ${it?.title || 'Ideia'}`,
      suggested_pexels_query: it?.suggested_pexels_query || it?.title || niche,
      youtube_metadata: {
        title: it?.youtube_metadata?.title || it?.title || '',
        description: it?.youtube_metadata?.description || it?.description || '',
        keywords: it?.youtube_metadata?.keywords || it?.tags || [],
      },
      ...it,
    }));

    return parsed;
  }
}