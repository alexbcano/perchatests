// DATOS DE DEMOSTRACIÓN — Marcas y tablas de tallas ficticias.
// Sirven para probar el recomendador con patrones distintos por marca.
// En la Fase 2 se sustituyen por las tablas reales de cada marca/producto.
import type { Brand } from '@/domain/types';

export const BRANDS: Brand[] = [
  { id: 'basico', name: 'Básico Común', demo: true, blurb: 'Básicos diarios a precio contenido.', sizingNote: 'Tallaje estándar.', store: 'Escaparate Demo', markets: ['ES', 'UE'] },
  { id: 'norte', name: 'Norte Estudio', demo: true, blurb: 'Minimalismo y materiales nobles.', sizingNote: 'Talla ligeramente grande: patrón con holgura.', store: 'Pasarela Demo', markets: ['ES', 'UE', 'INT'] },
  { id: 'kalle', name: 'Kalle Nueve', demo: true, blurb: 'Streetwear de siluetas amplias.', sizingNote: 'Corte amplio: los rangos de talla se solapan.', store: 'Escaparate Demo', markets: ['ES', 'UE'] },
  { id: 'ribera', name: 'Casa Ribera', demo: true, blurb: 'Sastrería y clásicos de armario.', sizingNote: 'Talla pequeña: patrón entallado. Sastrería en tallas numéricas.', store: 'Pasarela Demo', markets: ['ES', 'UE'] },
  { id: 'lunes', name: 'Lunes Vintage', demo: true, blurb: 'Reediciones de archivo y lavados.', sizingNote: 'Tallaje vintage: varía entre prendas, la confianza baja un nivel.', store: 'Ultramar Demo', markets: ['ES', 'UE', 'INT'] },
  { id: 'altavia', name: 'Altavía Técnica', demo: true, blurb: 'Capas técnicas para ciudad y monte.', sizingNote: 'Tallaje estándar con espacio para capas.', store: 'Ultramar Demo', markets: ['ES', 'UE', 'INT'] },
  { id: 'zancada', name: 'Zancada', demo: true, blurb: 'Zapatillas.', sizingNote: 'Horma pequeña: suele pedir media talla más.', store: 'Escaparate Demo', markets: ['ES', 'UE', 'INT'] },
  { id: 'paso', name: 'Paso Firme', demo: true, blurb: 'Calzado de piel y marroquinería.', sizingNote: 'Horma estándar.', store: 'Pasarela Demo', markets: ['ES', 'UE'] },
];

const EXTRA_BRANDS: Brand[] = [];
const EXTRA_CHARTS: SizeChart[] = [];
/** Permite que otros catálogos (p. ej. el real) registren sus marcas y tablas de tallas. */
export function registerBrands(brands: Brand[], charts: SizeChart[]) { EXTRA_BRANDS.push(...brands); EXTRA_CHARTS.push(...charts); }
export const brandById = (id: string) => BRANDS.find((b) => b.id === id) ?? EXTRA_BRANDS.find((b) => b.id === id);

export type ChartGroup = 'tops' | 'tailoring' | 'bottoms' | 'shoes' | 'belts';
export type Range = [number, number];
export interface SizeRow { size: string; chest?: Range; shoulders?: Range; waist?: Range; hip?: Range; foot?: Range; inseam?: number }
export interface SizeChart { brandId: string; group: ChartGroup; title: string; rows: SizeRow[]; lengths?: { label: string; inseam: number }[]; note: string; demo?: boolean; derived?: boolean; sourceUrl?: string }

const r1 = (n: number) => Math.round(n * 10) / 10;

function tops(labels: string[], start: number, step: number, overlap = 0, shoulderStart = 0, shoulderStep = 1.5): SizeRow[] {
  return labels.map((size, i) => {
    const lo = start + i * step;
    const row: SizeRow = { size, chest: [lo - overlap, lo + step - 1 + overlap] };
    if (shoulderStart) row.shoulders = [r1(shoulderStart + i * shoulderStep - 0.7), r1(shoulderStart + i * shoulderStep + 0.7)];
    return row;
  });
}

function bottoms(labels: string[], start: number, step: number, hipOffset: number, inseam?: number): SizeRow[] {
  return labels.map((size, i) => {
    const lo = start + i * step;
    return { size, waist: [lo, lo + step - 1], hip: [lo + hipOffset, lo + step - 1 + hipOffset], inseam };
  });
}

function shoes(offsetEU: number): SizeRow[] {
  const rows: SizeRow[] = [];
  for (let eu = 36; eu <= 47; eu++) {
    const c = (eu - offsetEU) / 1.5 - 1.5;
    rows.push({ size: String(eu), foot: [r1(c - 0.33), r1(c + 0.33)] });
  }
  return rows;
}

export const SIZE_CHARTS: SizeChart[] = [
  // Partes de arriba
  { brandId: 'basico', group: 'tops', title: 'Básico Común · partes de arriba', rows: tops(['XS', 'S', 'M', 'L', 'XL', 'XXL'], 82, 6), note: 'Contorno de pecho del cuerpo, en cm.' },
  { brandId: 'norte', group: 'tops', title: 'Norte Estudio · partes de arriba', rows: tops(['XS', 'S', 'M', 'L', 'XL'], 84, 6, 0, 41), note: 'Patrón con holgura. Pecho y hombros del cuerpo, en cm.' },
  { brandId: 'kalle', group: 'tops', title: 'Kalle Nueve · partes de arriba', rows: tops(['S', 'M', 'L', 'XL'], 86, 8, 2), note: 'Corte amplio: los rangos se solapan a propósito.' },
  { brandId: 'ribera', group: 'tops', title: 'Casa Ribera · camisería y punto', rows: tops(['XS', 'S', 'M', 'L', 'XL', 'XXL'], 80, 6), note: 'Patrón entallado. Pecho del cuerpo, en cm.' },
  { brandId: 'ribera', group: 'tailoring', title: 'Casa Ribera · sastrería', rows: tops(['44', '46', '48', '50', '52', '54', '56'], 86, 4, 0, 41.5, 1), note: 'Tallas numéricas. El hombro manda: una americana no se ajusta bien de hombros.' },
  { brandId: 'lunes', group: 'tops', title: 'Lunes Vintage · partes de arriba', rows: tops(['S', 'M', 'L', 'XL'], 86, 8), note: 'Tallaje vintage: medidas orientativas, cada lavado cambia la prenda.' },
  { brandId: 'altavia', group: 'tops', title: 'Altavía Técnica · capas', rows: tops(['XS', 'S', 'M', 'L', 'XL', 'XXL'], 82, 6.5, 0, 40), note: 'Pensado para llevar una capa debajo.' },
  // Partes de abajo
  { brandId: 'basico', group: 'bottoms', title: 'Básico Común · pantalones', rows: bottoms(['36', '38', '40', '42', '44', '46', '48', '50'], 68, 4, 17, 80), note: 'Talla española. Largo único de 80 cm de entrepierna.' },
  { brandId: 'norte', group: 'bottoms', title: 'Norte Estudio · pantalones', rows: bottoms(['XS', 'S', 'M', 'L', 'XL'], 68, 6, 18, 82), note: 'Tallas por letras. Largo único de 82 cm.' },
  { brandId: 'kalle', group: 'bottoms', title: 'Kalle Nueve · pantalones', rows: bottoms(['W28', 'W30', 'W32', 'W34', 'W36', 'W38'], 70, 5, 19), lengths: [{ label: 'L30', inseam: 76 }, { label: 'L32', inseam: 81 }, { label: 'L34', inseam: 86 }], note: 'Cintura en pulgadas y tres largos.' },
  { brandId: 'ribera', group: 'bottoms', title: 'Casa Ribera · pantalón de vestir', rows: bottoms(['36', '38', '40', '42', '44', '46', '48', '50', '52'], 66, 4, 16, 84), note: 'Se entrega con bajo sin terminar (84 cm) para ajustar en sastre.' },
  { brandId: 'lunes', group: 'bottoms', title: 'Lunes Vintage · pantalones', rows: bottoms(['W28', 'W30', 'W32', 'W34', 'W36', 'W38'], 68, 5, 18), lengths: [{ label: 'L30', inseam: 76 }, { label: 'L32', inseam: 81 }, { label: 'L34', inseam: 86 }], note: 'Talla pequeña respecto a la etiqueta.' },
  { brandId: 'altavia', group: 'bottoms', title: 'Altavía Técnica · pantalones', rows: bottoms(['XS', 'S', 'M', 'L', 'XL'], 66, 7, 18, 81), note: 'Cintura elástica: rangos amplios.' },
  // Calzado
  { brandId: 'zancada', group: 'shoes', title: 'Zancada · calzado', rows: shoes(-0.5), note: 'Horma pequeña. Largo de pie en cm.' },
  { brandId: 'paso', group: 'shoes', title: 'Paso Firme · calzado', rows: shoes(0), note: 'Horma estándar. Largo de pie en cm.' },
  { brandId: 'altavia', group: 'shoes', title: 'Altavía Técnica · calzado', rows: shoes(-0.3), note: 'Deja espacio para calcetín técnico.' },
  // Cinturones
  { brandId: 'paso', group: 'belts', title: 'Paso Firme · cinturones', rows: [{ size: '85', waist: [72, 81] }, { size: '95', waist: [82, 91] }, { size: '105', waist: [92, 101] }, { size: '115', waist: [102, 112] }], note: 'Largo del cinturón en cm hasta el agujero central.' },
  { brandId: 'kalle', group: 'belts', title: 'Kalle Nueve · cinturones', rows: [{ size: 'Única', waist: [68, 110] }], note: 'Hebilla deslizante: talla única ajustable.' },
];

export function chartFor(brandId: string, group: ChartGroup): SizeChart | undefined {
  const all = [...SIZE_CHARTS, ...EXTRA_CHARTS];
  return all.find((c) => c.brandId === brandId && c.group === group)
    ?? (group === 'tailoring' ? all.find((c) => c.brandId === brandId && c.group === 'tops') : undefined);
}
