// DATOS DE DEMOSTRACIÓN — Catálogo ficticio.
// Ningún producto, precio, talla o disponibilidad de este archivo es real.
// Todos llevan demo: true y url: null; la interfaz los marca como «Demo».
import type { ColorKey, Fit, GarmentType, Product, Season, StyleKey } from '@/domain/types';
import { categoryOf } from '@/domain/garments';
import { brandById, chartFor, type ChartGroup } from './brands';

const SEASON_CODE: Record<string, Season> = { P: 'primavera', V: 'verano', O: 'otono', I: 'invierno' };

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

export function chartGroupFor(p: Pick<Product, 'type' | 'brandId' | 'category'>): ChartGroup | null {
  if (p.category === 'top') return 'tops';
  if (p.category === 'layer') return p.brandId === 'ribera' || ['blazer', 'coat', 'trench'].includes(p.type) ? 'tailoring' : 'tops';
  if (p.category === 'bottom') return 'bottoms';
  if (p.category === 'shoes') return 'shoes';
  if (p.type === 'belt') return 'belts';
  return null;
}

type Traits = Product['traits'];

function p(
  id: string, name: string, brandId: string, type: GarmentType, color: ColorKey, alts: ColorKey[], price: number,
  fit: Fit, styles: string, seasons: string, lvl: [number, number, number], traits?: Traits,
): Product {
  const category = categoryOf(type);
  const brand = brandById(brandId)!;
  const group = chartGroupFor({ type, brandId, category });
  const chart = group ? chartFor(brandId, group) : undefined;
  const availabilityRoll = hash(id + 'av');
  const availability = availabilityRoll < 0.06 ? 'agotado' : availabilityRoll < 0.22 ? 'pocas' : 'disponible';
  const sizes = chart
    ? chart.rows.map((r, i) => ({ label: r.size, inStock: availability !== 'agotado' && hash(id + r.size) > (i === 0 || i === chart.rows.length - 1 ? 0.3 : 0.12) }))
    : [{ label: 'Única', inStock: availability !== 'agotado' }];
  return {
    id, demo: true, name, brandId, category, type, color, colors: [color, ...alts], price, fit,
    styles: styles.split(' ') as StyleKey[],
    seasons: seasons.split('').map((c) => SEASON_CODE[c]),
    formality: lvl[0], boldness: lvl[1], warmth: lvl[2],
    sizes, availability, markets: brand.markets, traits, url: null,
  };
}

export const CATALOG: Product[] = [
  // ── Partes de arriba ─────────────────────────────────────────────
  p('t01', 'Camiseta de algodón grueso', 'basico', 'tee', 'blanco', ['negro', 'gris', 'marino'], 19.9, 'regular', 'casual minimal street smart skater sporty', 'PVO', [2, 1, 1]),
  p('t02', 'Camiseta boxy con gráfico', 'kalle', 'tee', 'negro', ['crudo'], 34.9, 'oversized', 'street skater y2k', 'PVO', [1, 4, 1], { pattern: 'graphic' }),
  p('t03', 'Camiseta de punto fino', 'norte', 'tee', 'crudo', ['negro', 'salvia'], 45, 'regular', 'minimal quiet smart oldmoney', 'PV', [3, 1, 1]),
  p('t04', 'Camiseta marinera de manga larga', 'lunes', 'longsleeve', 'marino', ['rojo'], 32, 'regular', 'vintage casual skater', 'PO', [2, 3, 2], { pattern: 'stripes', second: 'crudo' }),
  p('t05', 'Camisa Oxford', 'ribera', 'shirt', 'azulclaro', ['blanco'], 69, 'regular', 'oldmoney business smart formal casual', 'PVOI', [4, 1, 2]),
  p('t06', 'Camisa de popelín', 'ribera', 'shirt', 'blanco', [], 75, 'slim', 'formal business quiet minimal', 'PVOI', [5, 1, 1]),
  p('t07', 'Camisa de lino', 'norte', 'shirt', 'beige', ['blanco', 'azulclaro'], 59, 'relaxed', 'oldmoney minimal casual smart quiet', 'PV', [3, 1, 1]),
  p('t08', 'Polo de punto', 'ribera', 'polo', 'bosque', ['marino', 'crudo'], 65, 'regular', 'oldmoney smart quiet business', 'PVO', [3, 2, 2]),
  p('t09', 'Jersey de lana merino', 'norte', 'knit', 'gris', ['camel', 'marino', 'negro'], 89, 'regular', 'minimal quiet smart business oldmoney', 'OI', [3, 1, 4]),
  p('t10', 'Jersey trenzado', 'ribera', 'knit', 'crudo', ['marino'], 95, 'regular', 'oldmoney vintage casual', 'OI', [3, 2, 4]),
  p('t11', 'Cuello alto de punto fino', 'norte', 'turtleneck', 'negro', ['crudo', 'chocolate'], 55, 'slim', 'minimal quiet smart formal business', 'OI', [4, 2, 3]),
  p('t12', 'Sudadera con capucha de felpa gruesa', 'kalle', 'hoodie', 'gris', ['negro', 'bosque'], 69, 'oversized', 'street skater casual sporty', 'POI', [1, 2, 4]),
  p('t13', 'Sudadera lavada de cuello redondo', 'lunes', 'sweatshirt', 'burdeos', ['gris', 'azul'], 49, 'relaxed', 'vintage casual skater sporty', 'POI', [1, 2, 3]),
  p('t14', 'Camiseta técnica transpirable', 'altavia', 'tee', 'negro', ['gris', 'lima'], 35, 'regular', 'sporty tech gorp', 'PVO', [1, 2, 1]),
  p('t15', 'Camiseta corta ajustada', 'kalle', 'tee', 'rosa', ['blanco', 'lila'], 24.9, 'slim', 'y2k', 'PV', [1, 4, 1], { cropped: true }),
  p('t16', 'Polo de piqué', 'basico', 'polo', 'blanco', ['marino', 'negro'], 29.9, 'regular', 'sporty casual smart', 'PV', [2, 1, 1]),
  p('t17', 'Camisa de franela a cuadros', 'lunes', 'shirt', 'rojo', ['bosque'], 45, 'relaxed', 'vintage skater gorp casual', 'OI', [2, 3, 3], { pattern: 'check', second: 'negro' }),
  p('t18', 'Camisa de manga corta estampada', 'lunes', 'shirt', 'mostaza', [], 42, 'relaxed', 'vintage y2k street', 'V', [2, 4, 1], { shortSleeve: true }),
  p('t19', 'Forro polar de media cremallera', 'altavia', 'sweatshirt', 'salvia', ['crudo', 'carbon'], 75, 'regular', 'gorp sporty casual', 'OI', [1, 2, 5]),
  p('t20', 'Camiseta térmica de manga larga', 'altavia', 'longsleeve', 'carbon', ['negro'], 39, 'slim', 'tech gorp sporty', 'OI', [1, 1, 3]),
  p('t21', 'Camiseta ajustada de canalé', 'basico', 'tee', 'blanco', ['negro'], 14.9, 'slim', 'y2k street casual sporty', 'V', [1, 2, 1]),
  p('t22', 'Sudadera técnica con capucha', 'altavia', 'hoodie', 'negro', ['carbon'], 95, 'regular', 'tech sporty street', 'POI', [1, 3, 4]),
  // ── Capas ────────────────────────────────────────────────────────
  p('l01', 'Americana de lana sin estructura', 'ribera', 'blazer', 'marino', ['carbon'], 189, 'regular', 'formal business smart oldmoney quiet', 'POI', [5, 1, 3]),
  p('l02', 'Americana príncipe de Gales', 'ribera', 'blazer', 'gris', [], 199, 'regular', 'oldmoney business vintage smart', 'OI', [4, 3, 3], { pattern: 'check', second: 'carbon' }),
  p('l03', 'Abrigo largo de paño', 'norte', 'coat', 'camel', ['negro', 'carbon'], 229, 'relaxed', 'minimal quiet oldmoney formal smart business', 'OI', [4, 2, 5]),
  p('l04', 'Gabardina clásica', 'ribera', 'trench', 'beige', [], 179, 'regular', 'oldmoney smart business minimal vintage quiet', 'PO', [4, 2, 3]),
  p('l05', 'Bomber de nailon', 'kalle', 'bomber', 'oliva', ['negro'], 99, 'regular', 'street skater casual y2k', 'PO', [2, 3, 3]),
  p('l06', 'Plumífero corto', 'kalle', 'puffer', 'negro', ['plata', 'azul'], 129, 'oversized', 'street y2k sporty casual', 'I', [1, 3, 5]),
  p('l07', 'Chaqueta impermeable de tres capas', 'altavia', 'shell', 'negro', ['naranja', 'bosque'], 219, 'regular', 'tech gorp sporty', 'POI', [1, 3, 3]),
  p('l08', 'Sobrecamisa de pana', 'lunes', 'overshirt', 'marron', ['oliva'], 79, 'relaxed', 'vintage casual skater gorp smart', 'PO', [2, 2, 3]),
  p('l09', 'Cazadora vaquera', 'lunes', 'denimjacket', 'denim', ['denimoscuro'], 85, 'regular', 'vintage casual street y2k skater', 'PO', [2, 2, 2]),
  p('l10', 'Chaleco acolchado', 'altavia', 'gilet', 'marino', ['oliva'], 89, 'regular', 'gorp oldmoney business casual sporty', 'POI', [2, 2, 3]),
  p('l11', 'Cárdigan de punto grueso', 'norte', 'cardigan', 'carbon', ['crudo'], 119, 'relaxed', 'minimal quiet casual vintage smart', 'OI', [3, 2, 4]),
  p('l12', 'Sobrecamisa de lana', 'norte', 'overshirt', 'gris', [], 135, 'regular', 'minimal smart quiet business', 'OI', [3, 1, 4]),
  p('l13', 'Cortavientos ligero', 'altavia', 'shell', 'plata', ['negro'], 89, 'regular', 'tech sporty y2k street', 'PV', [1, 4, 2]),
  p('l14', 'Chaqueta de trabajo de lona', 'basico', 'overshirt', 'azul', ['crudo', 'negro'], 69, 'relaxed', 'casual skater street vintage', 'PO', [2, 2, 2]),
  p('l15', 'Parka técnica larga', 'altavia', 'coat', 'negro', [], 259, 'regular', 'tech minimal gorp', 'OI', [2, 3, 5]),
  p('l16', 'Chaqueta varsity', 'kalle', 'bomber', 'burdeos', [], 119, 'regular', 'street y2k vintage skater', 'POI', [1, 4, 3], { second: 'crudo' }),
  // ── Partes de abajo ──────────────────────────────────────────────
  p('b01', 'Pantalón ancho de pinzas', 'norte', 'wide', 'carbon', ['negro', 'crudo', 'beige'], 89, 'relaxed', 'minimal quiet smart street business', 'PVOI', [4, 2, 2]),
  p('b02', 'Vaquero recto de lavado medio', 'lunes', 'jeans', 'denim', ['denimoscuro'], 69, 'regular', 'casual vintage street smart skater', 'PVOI', [2, 1, 2]),
  p('b03', 'Vaquero ancho', 'kalle', 'wide', 'azulclaro', ['denim', 'negro'], 79, 'oversized', 'street skater y2k', 'PVOI', [1, 3, 2]),
  p('b04', 'Chino recto', 'basico', 'chino', 'beige', ['marino', 'oliva', 'carbon'], 45, 'regular', 'casual smart business oldmoney', 'PVO', [3, 1, 2]),
  p('b05', 'Pantalón de traje de lana', 'ribera', 'tailored', 'marino', ['carbon', 'gris'], 119, 'slim', 'formal business oldmoney quiet', 'PVOI', [5, 1, 3]),
  p('b06', 'Cargo técnico', 'altavia', 'cargo', 'negro', ['oliva', 'carbon'], 99, 'relaxed', 'tech gorp street', 'POI', [1, 3, 2]),
  p('b07', 'Jogger de felpa', 'basico', 'jogger', 'gris', ['negro', 'marino'], 39, 'regular', 'sporty casual street', 'POI', [1, 1, 3]),
  p('b08', 'Bermuda de lino', 'norte', 'shorts', 'beige', ['marino', 'blanco'], 49, 'regular', 'oldmoney casual minimal smart quiet', 'V', [2, 1, 1]),
  p('b09', 'Pantalón corto deportivo', 'altavia', 'shorts', 'negro', ['azul'], 29.9, 'regular', 'sporty gorp tech', 'PV', [1, 1, 1]),
  p('b10', 'Pantalón ancho de pana', 'lunes', 'wide', 'marron', ['bosque', 'crudo'], 75, 'relaxed', 'vintage skater casual oldmoney', 'OI', [2, 2, 3]),
  p('b11', 'Pantalón paracaídas', 'kalle', 'cargo', 'grisclaro', ['negro', 'oliva'], 65, 'oversized', 'y2k street tech', 'PVO', [1, 4, 1]),
  p('b12', 'Pantalón de lino con cordón', 'norte', 'straight', 'crudo', ['negro'], 79, 'relaxed', 'minimal quiet oldmoney casual', 'PV', [3, 1, 1]),
  p('b13', 'Vaquero pitillo negro', 'basico', 'slimpant', 'negro', [], 49, 'slim', 'casual smart minimal street', 'PVOI', [2, 1, 2]),
  p('b14', 'Pantalón de senderismo', 'altavia', 'straight', 'oliva', ['carbon'], 85, 'regular', 'gorp tech', 'PVO', [1, 2, 2]),
  p('b15', 'Falda midi plisada', 'norte', 'skirt', 'negro', ['crudo', 'burdeos'], 69, 'regular', 'minimal quiet smart oldmoney formal business', 'PVOI', [4, 2, 2]),
  p('b16', 'Minifalda vaquera', 'kalle', 'skirt', 'denim', [], 39, 'regular', 'y2k street casual vintage', 'PV', [1, 3, 1], { mini: true }),
  p('b17', 'Pantalón de vestir a cuadros', 'ribera', 'tailored', 'gris', [], 109, 'regular', 'oldmoney vintage business smart', 'OI', [4, 3, 3], { pattern: 'check', second: 'carbon' }),
  p('b18', 'Pantalón corto de trabajo', 'kalle', 'shorts', 'carbon', ['beige'], 45, 'relaxed', 'skater street casual', 'V', [1, 2, 1]),
  p('b19', 'Pantalón de chándal retro', 'lunes', 'jogger', 'marino', [], 55, 'regular', 'sporty vintage y2k street', 'POI', [1, 3, 2], { pattern: 'stripes', second: 'blanco' }),
  // ── Calzado ──────────────────────────────────────────────────────
  p('s01', 'Zapatilla lisa de piel', 'zancada', 'sneaker', 'blanco', ['negro'], 95, 'regular', 'casual minimal smart quiet business oldmoney', 'PVOI', [3, 1, 2]),
  p('s02', 'Zapatilla voluminosa retro', 'zancada', 'chunky', 'grisclaro', ['crudo', 'lima'], 119, 'regular', 'street y2k sporty tech', 'PVOI', [1, 4, 2]),
  p('s03', 'Zapatilla de skate de ante', 'zancada', 'skate', 'negro', ['marino', 'burdeos'], 75, 'regular', 'skater street casual vintage', 'PVOI', [1, 2, 2]),
  p('s04', 'Zapatilla de running retro', 'zancada', 'runner', 'azul', ['gris', 'naranja'], 99, 'regular', 'sporty vintage casual gorp street', 'PVO', [1, 3, 2]),
  p('s05', 'Mocasín penny', 'paso', 'loafer', 'marron', ['negro', 'burdeos'], 135, 'regular', 'oldmoney smart business formal quiet vintage', 'PVO', [4, 2, 2]),
  p('s06', 'Zapato derby', 'paso', 'derby', 'negro', ['marron'], 149, 'regular', 'formal business minimal quiet', 'PVOI', [5, 1, 2]),
  p('s07', 'Bota Chelsea', 'paso', 'boot', 'chocolate', ['negro'], 159, 'regular', 'smart minimal oldmoney quiet business casual', 'OI', [4, 2, 4]),
  p('s08', 'Bota de montaña ligera', 'altavia', 'boot', 'marron', ['carbon'], 145, 'regular', 'gorp vintage casual tech', 'OI', [1, 3, 4], { second: 'rojo' }),
  p('s09', 'Zapatilla de trail', 'altavia', 'trail', 'carbon', ['naranja', 'bosque'], 129, 'regular', 'gorp tech sporty', 'PVOI', [1, 3, 2]),
  p('s10', 'Zapatilla alta de lona', 'zancada', 'skate', 'crudo', ['negro', 'rojo'], 65, 'regular', 'casual vintage skater y2k street', 'PVO', [1, 2, 1], { high: true }),
  p('s11', 'Bota militar', 'paso', 'boot', 'negro', [], 139, 'regular', 'street tech vintage', 'OI', [2, 3, 4], { high: true }),
  p('s12', 'Zapatilla técnica de suela gruesa', 'zancada', 'chunky', 'negro', ['plata'], 149, 'regular', 'tech street y2k', 'PVOI', [1, 5, 2]),
  p('s13', 'Náutico de piel', 'paso', 'loafer', 'marino', ['marron'], 99, 'regular', 'oldmoney casual smart', 'PV', [3, 2, 1]),
  // ── Accesorios ───────────────────────────────────────────────────
  p('a01', 'Gorra de seis paneles', 'kalle', 'cap', 'negro', ['bosque', 'crudo', 'marino'], 25, 'regular', 'street skater casual sporty y2k gorp', 'PVO', [1, 2, 1]),
  p('a02', 'Gorro de lana', 'basico', 'beanie', 'gris', ['negro', 'mostaza', 'burdeos'], 15, 'regular', 'street skater casual gorp tech minimal', 'OI', [1, 2, 4]),
  p('a03', 'Bolsa tote de lona', 'basico', 'tote', 'crudo', ['negro'], 19, 'regular', 'casual minimal vintage smart', 'PVOI', [2, 1, 1]),
  p('a04', 'Bandolera técnica', 'altavia', 'crossbody', 'negro', ['oliva'], 45, 'regular', 'tech gorp street sporty', 'PVOI', [1, 3, 1]),
  p('a05', 'Cinturón de piel', 'paso', 'belt', 'marron', ['negro'], 39, 'regular', 'oldmoney formal business smart quiet casual', 'PVOI', [4, 1, 1]),
  p('a06', 'Bufanda de lana', 'norte', 'scarf', 'camel', ['gris', 'burdeos', 'marino'], 49, 'regular', 'oldmoney minimal quiet smart business formal vintage casual', 'OI', [3, 2, 5]),
  p('a07', 'Gafas de sol de pasta', 'lunes', 'sunglasses', 'negro', ['marron'], 35, 'regular', 'casual vintage oldmoney smart minimal quiet street skater', 'PV', [2, 2, 1]),
  p('a08', 'Reloj de correa de piel', 'norte', 'watch', 'marron', ['negro'], 89, 'regular', 'oldmoney minimal quiet business formal smart', 'PVOI', [4, 1, 1]),
  p('a09', 'Mochila de cierre enrollable', 'altavia', 'backpack', 'negro', ['oliva'], 79, 'regular', 'tech gorp street casual sporty', 'PVOI', [1, 2, 1]),
  p('a10', 'Bandolera de piel', 'paso', 'crossbody', 'chocolate', ['negro'], 99, 'regular', 'quiet minimal oldmoney smart business', 'PVOI', [4, 1, 1]),
  p('a11', 'Gafas de sol estrechas', 'kalle', 'sunglasses', 'plata', [], 29, 'regular', 'y2k tech street', 'PV', [1, 5, 1]),
  p('a12', 'Cinturón de lona', 'kalle', 'belt', 'negro', [], 18, 'regular', 'skater street tech gorp y2k', 'PVOI', [1, 2, 1]),
];
