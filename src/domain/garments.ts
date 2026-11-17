import type { Category, GarmentType, Occasion, Season } from './types';

export const TYPE_INFO: Record<GarmentType, { label: string; category: Category; keywords: string[] }> = {
  tee: { label: 'Camiseta', category: 'top', keywords: ['camiseta', 'camisetas', 'tee'] },
  longsleeve: { label: 'Camiseta de manga larga', category: 'top', keywords: ['manga larga'] },
  shirt: { label: 'Camisa', category: 'top', keywords: ['camisa', 'camisas'] },
  polo: { label: 'Polo', category: 'top', keywords: ['polo', 'polos'] },
  knit: { label: 'Jersey', category: 'top', keywords: ['jersey', 'jerséis', 'jerseis', 'punto', 'suéter'] },
  turtleneck: { label: 'Cuello alto', category: 'top', keywords: ['cuello alto', 'cuello vuelto', 'cisne'] },
  hoodie: { label: 'Sudadera con capucha', category: 'top', keywords: ['sudadera', 'sudaderas', 'capucha', 'hoodie'] },
  sweatshirt: { label: 'Sudadera', category: 'top', keywords: ['sudadera', 'sudaderas', 'forro polar', 'polar'] },
  blazer: { label: 'Americana', category: 'layer', keywords: ['americana', 'blazer', 'chaqueta de traje'] },
  coat: { label: 'Abrigo', category: 'layer', keywords: ['abrigo', 'abrigos', 'parka'] },
  trench: { label: 'Gabardina', category: 'layer', keywords: ['gabardina', 'trench'] },
  bomber: { label: 'Bomber', category: 'layer', keywords: ['bomber', 'varsity', 'cazadora'] },
  puffer: { label: 'Plumífero', category: 'layer', keywords: ['plumífero', 'plumifero', 'plumas', 'acolchado'] },
  shell: { label: 'Chaqueta técnica', category: 'layer', keywords: ['impermeable', 'cortavientos', 'chaqueta técnica', 'chubasquero'] },
  overshirt: { label: 'Sobrecamisa', category: 'layer', keywords: ['sobrecamisa', 'chaqueta de trabajo'] },
  denimjacket: { label: 'Cazadora vaquera', category: 'layer', keywords: ['cazadora vaquera', 'chaqueta vaquera'] },
  gilet: { label: 'Chaleco', category: 'layer', keywords: ['chaleco'] },
  cardigan: { label: 'Cárdigan', category: 'layer', keywords: ['cárdigan', 'cardigan', 'rebeca'] },
  wide: { label: 'Pantalón ancho', category: 'bottom', keywords: ['pantalón ancho', 'pantalones anchos', 'pantalon ancho', 'wide leg', 'baggy'] },
  straight: { label: 'Pantalón recto', category: 'bottom', keywords: ['pantalón recto', 'pantalones rectos'] },
  slimpant: { label: 'Pantalón pitillo', category: 'bottom', keywords: ['pitillo', 'slim', 'ajustados', 'estrecho'] },
  chino: { label: 'Chino', category: 'bottom', keywords: ['chino', 'chinos'] },
  jeans: { label: 'Vaquero', category: 'bottom', keywords: ['vaquero', 'vaqueros', 'jeans', 'tejanos'] },
  cargo: { label: 'Cargo', category: 'bottom', keywords: ['cargo', 'cargos'] },
  jogger: { label: 'Jogger', category: 'bottom', keywords: ['jogger', 'chándal', 'chandal'] },
  shorts: { label: 'Pantalón corto', category: 'bottom', keywords: ['pantalón corto', 'pantalones cortos', 'bermuda', 'bermudas', 'short', 'shorts'] },
  skirt: { label: 'Falda', category: 'bottom', keywords: ['falda', 'faldas'] },
  tailored: { label: 'Pantalón de vestir', category: 'bottom', keywords: ['pantalón de vestir', 'pantalón de traje', 'pinzas'] },
  sneaker: { label: 'Zapatilla', category: 'shoes', keywords: ['zapatilla', 'zapatillas', 'deportivas', 'sneakers', 'bambas'] },
  chunky: { label: 'Zapatilla voluminosa', category: 'shoes', keywords: ['chunky', 'voluminosa'] },
  skate: { label: 'Zapatilla de skate', category: 'shoes', keywords: ['skate', 'lona'] },
  runner: { label: 'Zapatilla de running', category: 'shoes', keywords: ['running', 'runner'] },
  trail: { label: 'Zapatilla de trail', category: 'shoes', keywords: ['trail', 'montaña'] },
  boot: { label: 'Bota', category: 'shoes', keywords: ['bota', 'botas', 'botín', 'botines'] },
  loafer: { label: 'Mocasín', category: 'shoes', keywords: ['mocasín', 'mocasines', 'mocasin', 'náutico', 'nautico'] },
  derby: { label: 'Zapato de vestir', category: 'shoes', keywords: ['zapato', 'zapatos', 'derby', 'oxford'] },
  cap: { label: 'Gorra', category: 'accessory', keywords: ['gorra', 'gorras'] },
  beanie: { label: 'Gorro', category: 'accessory', keywords: ['gorro', 'gorros'] },
  tote: { label: 'Bolsa tote', category: 'accessory', keywords: ['tote', 'bolsa'] },
  crossbody: { label: 'Bandolera', category: 'accessory', keywords: ['bandolera', 'bolso', 'riñonera'] },
  backpack: { label: 'Mochila', category: 'accessory', keywords: ['mochila'] },
  belt: { label: 'Cinturón', category: 'accessory', keywords: ['cinturón', 'cinturon'] },
  scarf: { label: 'Bufanda', category: 'accessory', keywords: ['bufanda'] },
  sunglasses: { label: 'Gafas de sol', category: 'accessory', keywords: ['gafas'] },
  watch: { label: 'Reloj', category: 'accessory', keywords: ['reloj'] },
};

export const GARMENT_TYPES = Object.keys(TYPE_INFO) as GarmentType[];
export const typeLabel = (t: GarmentType) => TYPE_INFO[t]?.label ?? t;
export const categoryOf = (t: GarmentType) => TYPE_INFO[t].category;

export const CATEGORY_LABEL: Record<Category, string> = {
  top: 'Parte de arriba', layer: 'Capa exterior', bottom: 'Parte de abajo', shoes: 'Calzado', accessory: 'Accesorio',
};
export const CATEGORY_PLURAL: Record<Category, string> = {
  top: 'Partes de arriba', layer: 'Capas', bottom: 'Partes de abajo', shoes: 'Calzado', accessory: 'Accesorios',
};
export const CATEGORY_ORDER: Category[] = ['layer', 'top', 'bottom', 'shoes', 'accessory'];

export const SEASONS: { key: Season; label: string }[] = [
  { key: 'primavera', label: 'Primavera' }, { key: 'verano', label: 'Verano' }, { key: 'otono', label: 'Otoño' }, { key: 'invierno', label: 'Invierno' },
];
export const seasonLabel = (s: Season) => SEASONS.find((x) => x.key === s)!.label;

export const OCCASIONS: { key: Occasion; label: string; formality: number }[] = [
  { key: 'diario', label: 'Diario', formality: 2 },
  { key: 'trabajo', label: 'Trabajo', formality: 3.6 },
  { key: 'cita', label: 'Cita', formality: 3.2 },
  { key: 'fiesta', label: 'Fiesta', formality: 2.8 },
  { key: 'evento', label: 'Evento', formality: 4.5 },
  { key: 'viaje', label: 'Viaje', formality: 1.8 },
  { key: 'deporte', label: 'Deporte', formality: 1 },
];
export const occasionLabel = (o: Occasion) => OCCASIONS.find((x) => x.key === o)!.label;

export function currentSeason(d = new Date()): Season {
  const m = d.getMonth();
  if (m >= 2 && m <= 4) return 'primavera';
  if (m >= 5 && m <= 7) return 'verano';
  if (m >= 8 && m <= 10) return 'otono';
  return 'invierno';
}

export const FIT_LABEL = { slim: 'Slim', regular: 'Regular', relaxed: 'Relaxed', oversized: 'Oversized' } as const;
