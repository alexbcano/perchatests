// Servicio de IA del estilista.
// Fase 1: el generador y los consejos funcionan con reglas (features/outfits). Este servicio añade,
// solo si el alojamiento ofrece un modelo (Claude artifacts: capacidad `sample`), un análisis redactado por IA
// a partir de los datos del look. Nunca se le pide que proponga productos, precios o enlaces.
// Fase 2: sustituir por llamadas al backend propio (/api/stylist), con la clave en variables de entorno.
import type { Outfit, Profile, WardrobeItem } from '@/domain/types';
import { lookSummary } from '@/features/outfits/share';
import { styleName } from '@/data/demo/styles';
import { occasionLabel, seasonLabel } from '@/domain/garments';

type Sample = (input: string, opts?: { onText?: (t: { text: string }) => void; signal?: AbortSignal; modelTier?: string }) => Promise<{ text: string }>;

let cached: Promise<Sample | null> | null = null;
export function getStylistAI(): Promise<Sample | null> {
  if (!cached) {
    const claude = (window as any).claude;
    cached = claude?.use ? claude.use('sample').catch(() => null) : Promise.resolve(null);
  }
  return cached!;
}

export async function askStylist(
  outfit: Outfit, profile: Profile, wardrobe: WardrobeItem[], question: string,
  onText: (text: string) => void, signal?: AbortSignal,
): Promise<string> {
  const sample = await getStylistAI();
  if (!sample) throw { code: 'not_available' };
  const m = profile.measures;
  const body = [m.height && `altura ${m.height} cm`, m.chest && `pecho ${m.chest} cm`, m.waist && `cintura ${m.waist} cm`, m.hip && `cadera ${m.hip} cm`, m.inseam && `entrepierna ${m.inseam} cm`].filter(Boolean).join(', ');
  const prompt = [
    'Eres un estilista personal. Responde en español de España, en texto plano sin formato Markdown, con un máximo de 140 palabras.',
    'Reglas estrictas: comenta solo las prendas listadas. No inventes ni recomiendes productos, marcas, precios, tiendas ni enlaces que no estén en la lista. No opines sobre el cuerpo de la persona: habla de proporciones y de la ropa.',
    '',
    `Look (${styleName(outfit.style)}, ${seasonLabel(outfit.season).toLowerCase()}, ocasión: ${occasionLabel(outfit.occasion).toLowerCase()}):`,
    lookSummary(outfit, wardrobe),
    '',
    body ? `Medidas de la persona: ${body}. Preferencia de ajuste: ${profile.fitPreference}.` : 'La persona no ha dado medidas.',
    '',
    `Pregunta: ${question}`,
  ].join('\n');
  const res = await sample(prompt, { onText: ({ text }) => onText(text), signal, modelTier: 'quick' });
  return res.text;
}
