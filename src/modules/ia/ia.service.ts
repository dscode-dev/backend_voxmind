import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';


type Storyboard = {
  context: { summary: string; tags: string[]; tone: string };
  sentences: string[];
  pexels_query: string;
};

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  async generateStoryboard(input: {
    title: string;
    description?: string;
    language?: string;
    tone?: string;
  }): Promise<Storyboard> {
    const language = input.language || 'pt-BR';
    const tone = input.tone || 'curioso';

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'Você é um roteirista conciso de vídeos curtos (≤60s). Produza linguagem clara, instigante e positiva.',
      },
      {
        role: 'user',
        content: [
          `Título: "${input.title}"`,
          `Descrição: "${input.description ?? ''}"`,
          `Gere JSON válido com este formato exato:`,
          `{"context":{"summary":string,"tags":string[],"tone":string},"sentences":string[],"pexels_query":string}`,
          `Regras:`,
          `- Idioma: ${language}`,
          `- Tom: ${tone}`,
          `- Máximo 115 palavras somando todas as frases.`,
          `- Frases curtas (1-2 linhas), pausas naturais.`,
          `- Evite jargões, “clique aqui”, promessas irreais.`,
        ].join('\n'),
      },
    ];

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.5,
      response_format: { type: 'json_object' } as any,
    });

    const raw = res.choices[0]?.message?.content || '{}';
    let parsed: Storyboard;
    try {
      parsed = JSON.parse(raw) as Storyboard;
    } catch (e) {
      this.logger.error(`JSON inválido da IA: ${raw}`);
      throw e;
    }

    parsed.sentences = (parsed.sentences || []).map(s => s.trim()).filter(Boolean);
    parsed.context = parsed.context || { summary: '', tags: [], tone };
    parsed.pexels_query = parsed.pexels_query || input.title;

    return parsed;
  }
}
