import { SchemaType } from '@google/generative-ai';

export const systemPrompt = `
Você é um planner/editor de conteúdo para vídeos curtos (≤60s) de um canal de curiosidades brand-safe.
Gere ideias atuais, com apelo amplo (ciência, história, fatos curiosos, cultura pop inofensiva, fisica quantica, inteligencia artificial generativa, futebol), evitando fake news,
política partidária, sexo explícito, violência gráfica, desinformação ou saúde sem consenso científico.
Retorne SOMENTE JSON válido (application/json), sem comentários, sem backticks.
`.trim();

export function userPrompt(params: {
  region: string; 
  language: string; 
  niche: string;
  stylePrompt?: string;
  max: number;
}) {
  const { region, language, niche, stylePrompt, max } = params;

  return `
Objetivo: gerar uma CAMPANHA e uma lista de ITENS (trends/curiosidades) prontos para um pipeline de produção de Shorts do YouTube.

Região-alvo: ${region}
Idioma-alvo: ${language}
Nicho/campanha: ${niche}
${stylePrompt ? `Estilo do canal (opcional): ${stylePrompt}` : ''}

Quantidade máxima de itens: ${max}

Regras editoriais:
- Cada item deve caber em vídeo de até 60 segundos (máx. ~115 palavras).
- Escreva "sentences" como frases curtas e sequenciais (1–2 linhas cada), já no idioma-alvo.
- As "sentences" devem formar um roteiro claro com início, meio e fim, sem jargões nem promessas irreais.
- "suggested_pexels_query" deve ser uma query curta e coerente com as sentences (para imagens livres do Pexels).
- "tags" deve ter 5–10 termos relevantes e brand-safe.
- Preencha também "youtube_metadata":
  - title (≤100 chars, chamativo e honesto)
  - description (2–3 linhas)
  - keywords (5–12)
- Evite temas sensíveis, afirmações sem fonte ou dados controversos.
- Não inclua links.

Formato EXATO de saída (JSON):
{
  "campaign": {
    "name": string,
    "niche": string,
    "language": string,
    "platform": "youtube",
    "daily_quota": number,
    "max_length_sec": number,
    "style_prompt": string
  },
  "items": [
    {
      "title": string,
      "description": string,
      "tags": [string, ...],
      "language": string,
      "niche": string,
      "suggested_pexels_query": string,
      "sentences": [string, ...],         // 3–12 frases curtas
      "preview_caption": string,          // legenda curta para aprovação
      "youtube_metadata": {
        "title": string,
        "description": string,
        "keywords": [string, ...]
      }
    }
  ]
}
`.trim();
}

/**
 * Schema (igual ao que seu backend espera). Mantemos aqui para ficar 100% centralizado.
 */
export const geminiTrendsResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    campaign: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        niche: { type: SchemaType.STRING },
        language: { type: SchemaType.STRING },
        platform: { type: SchemaType.STRING },
        daily_quota: { type: SchemaType.NUMBER },
        max_length_sec: { type: SchemaType.NUMBER },
        style_prompt: { type: SchemaType.STRING },
      },
      required: ['name', 'platform'],
    },
    items: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          language: { type: SchemaType.STRING },
          niche: { type: SchemaType.STRING },
          suggested_pexels_query: { type: SchemaType.STRING },
          sentences: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
          preview_caption: { type: SchemaType.STRING },
          youtube_metadata: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              keywords: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
          },
        },
        required: ['title', 'sentences'],
      },
    },
  },
  required: ['campaign', 'items'],
} as const;
