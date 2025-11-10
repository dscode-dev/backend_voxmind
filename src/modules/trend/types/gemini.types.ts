import { z } from 'zod';

export const GeminiTrendItem = z.object({
  title: z.string().min(4).max(140),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
  language: z.string().default('pt-BR'),  
  niche: z.string().default('tendências'),
  suggested_pexels_query: z.string().default(''),
  sentences: z.array(z.string()).min(3).max(12),   
});

export const GeminiTrendPayload = z.object({
  campaign: z.object({
    name: z.string().min(3).max(120),
    niche: z.string().default('tendências'),
    language: z.string().default('pt-BR'),
    platform: z.literal('youtube'),      
    daily_quota: z.number().int().min(1).max(200).default(50),
    max_length_sec: z.number().int().min(15).max(120).default(60),
    style_prompt: z.string().default(''),
  }),
  items: z.array(GeminiTrendItem).min(1).max(50),
});

export type TGeminiTrendPayload = z.infer<typeof GeminiTrendPayload>;