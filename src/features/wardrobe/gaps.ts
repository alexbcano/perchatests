// «Me falta esto»: qué prenda del catálogo daría más looks nuevos con lo que ya tienes.
// Se cuentan combinaciones parte de arriba + parte de abajo + calzado (+ capa en otoño/invierno)
// que pasan las mismas reglas de calidad que el generador de looks. Solo se proponen productos reales.
import type { Category, ColorKey, Outfit, Piece, Product, Profile, Season, StyleKey, Prefs, WardrobeItem } from '@/domain/types';
import { COLORS } from '@/data/demo/colors';
import { catalog, wardrobeToProduct } from '@/services/catalog';
import { evaluate, harmony, rebuildOutfit, type Cand } from '@/features/outfits/engine';

export const GOOD_LOOK = 72; // compatibilidad mínima para contar un look como «bueno»
const SLOTS: Category[] = ['top', 'bottom', 'shoes', 'layer'];
const LAYER_SEASONS: Season[] = ['otono', 'invierno'];
const BULKY = ['hoodie', 'sweatshirt'];

export interface GapPick {
  product: Product;
  color: ColorKey;
  gain: number; // looks nuevos
  quality: number; // looks nuevos ponderados por lo buenos que son (para ordenar)
  partners: { item: WardrobeItem; uses: number }[]; // prendas tuyas con las que más combina
  best: Cand[]; // el mejor look de ejemplo
  bestStyle: StyleKey;
  fillsEmpty: boolean; // cubre una categoría que no tienes
}

export interface GapReport {
  season: Season;
  baseline: number;
  missing: Category[];
  owned: number;
  picks: GapPick[];
}

interface Env { styles: StyleKey[]; prefs: Prefs; season: Season }

function clash(items: Cand[]): boolean {
  const layer = items.find((i) => i.p.category === 'layer');
  const top = items.find((i) => i.p.category === 'top');
  if (layer && top) {
    if (layer.p.type === 'blazer' && BULKY.includes(top.p.type)) return true;
    if (layer.p.type === 'cardigan' && [...BULKY, 'knit'].includes(top.p.type)) return true;
  }
  if (items.filter((i) => i.p.traits?.pattern).length > 1) return true;
  return harmony(items.map((i) => i.color)) < 0.6;
}

/** Mejor compatibilidad del look entre los estilos del usuario (sin presupuesto: lo propio no cuesta). */
function score(items: Cand[], env: Env): { compat: number; style: StyleKey } {
  let best = { compat: 0, style: env.styles[0] };
  for (const style of env.styles) {
    const basis: Outfit['basis'] = { styles: env.styles, favColors: env.prefs.favColors, boldness: env.prefs.boldness, formalityShift: 0 };
    const ev = evaluate(items, style, basis, env.season, env.prefs.occasion, 0);
    if (ev.compat > best.compat) best = { compat: ev.compat, style };
  }
  return best;
}

/** Recorre todas las combinaciones con las prendas dadas por hueco y llama a fn con las que son buenas. */
function eachGoodLook(bySlot: Record<Category, Cand[]>, env: Env, fn: (items: Cand[], compat: number, style: StyleKey) => void, must?: Cand) {
  const withLayer = LAYER_SEASONS.includes(env.season);
  // Con una capa nueva solo cuentan los looks que la llevan; los demás ya existían.
  const layers: (Cand | null)[] = must?.p.category === 'layer' ? (withLayer ? [must] : []) : withLayer ? [null, ...bySlot.layer] : [null];
  for (const t of bySlot.top) for (const b of bySlot.bottom) for (const s of bySlot.shoes) for (const l of layers) {
    const items = l ? [l, t, b, s] : [t, b, s];
    if (clash(items)) continue;
    const { compat, style } = score(items, env);
    if (compat >= GOOD_LOOK) fn(items, compat, style);
  }
}

export function analyzeGaps(wardrobe: WardrobeItem[], prefs: Prefs, profile: Profile, limit = 6): GapReport {
  const season = prefs.season;
  const env: Env = { styles: prefs.styles.length ? prefs.styles : ['casual'], prefs, season };
  const own = wardrobe.filter((w) => w.seasons.includes(season));
  const mine: Record<Category, Cand[]> = { top: [], bottom: [], shoes: [], layer: [], accessory: [] };
  for (const w of own) { const p = wardrobeToProduct(w); mine[p.category].push({ p, color: w.color, own: true }); }
  const missing = (['top', 'bottom', 'shoes'] as Category[]).filter((c) => mine[c].length === 0);

  let baseline = 0;
  eachGoodLook(mine, env, () => { baseline++; });

  // Lo que ya tienes repetido no se propone (mismo tipo y color).
  const have = new Set(own.map((w) => `${w.type}|${w.color}`));
  const byId = new Map(own.map((w) => [w.id, w]));
  const picks: GapPick[] = [];
  for (const p of catalog.list()) {
    if (p.demo || !SLOTS.includes(p.category)) continue;
    if (!p.seasons.includes(season) || !p.markets.includes(prefs.market)) continue;
    if (prefs.avoidTypes.includes(p.type) || prefs.avoidColors.includes(p.color)) continue;
    if (profile.pattern === 'masculino' && (p.type === 'skirt' || p.traits?.cropped)) continue;
    if (have.has(`${p.type}|${p.color}`)) continue;
    if (prefs.budget && p.price > prefs.budget) continue;
    const cand: Cand = { p, color: p.color, own: false };
    const slots = { ...mine, [p.category]: [cand] } as Record<Category, Cand[]>;
    let gain = 0; let quality = 0; let best: Cand[] = []; let bestCompat = 0; let bestStyle = env.styles[0];
    const uses = new Map<string, number>();
    eachGoodLook(slots, env, (items, compat, style) => {
      gain++;
      quality += 1 + (compat - GOOD_LOOK) / 10;
      for (const i of items) if (i.own) uses.set(i.p.id, (uses.get(i.p.id) ?? 0) + 1);
      if (compat > bestCompat) { bestCompat = compat; best = items; bestStyle = style; }
    }, cand);
    if (gain === 0) continue;
    const partners = [...uses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([id, n]) => ({ item: byId.get(id)!, uses: n })).filter((x) => x.item);
    // Un poco de ventaja a lo que encaja con tus estilos y marcas.
    const mineStyle = p.styles.some((x) => env.styles.includes(x));
    quality *= (mineStyle ? 1.15 : 1) * (prefs.brands.includes(p.brandId) ? 1.1 : 1);
    picks.push({ product: p, color: p.color, gain, quality, partners, best, bestStyle, fillsEmpty: missing.includes(p.category) });
  }

  // Lo que más suma primero; para variar, como mucho una por tipo y dos por categoría.
  picks.sort((a, b) => Number(b.fillsEmpty) - Number(a.fillsEmpty) || b.quality - a.quality || a.product.price - b.product.price);
  // Primera vuelta: una por categoría (para variar). Segunda: hasta dos por categoría.
  const out: GapPick[] = [];
  const types = new Set<string>();
  const perCat = new Map<Category, number>();
  for (const maxPerCat of [1, 2]) {
    for (const pk of picks) {
      if (out.length >= limit) break;
      // Si te falta una categoría entera, se enseñan más opciones de esa.
      const cap = pk.fillsEmpty ? maxPerCat * 2 : maxPerCat;
      if (out.includes(pk) || (types.has(pk.product.type) && !pk.fillsEmpty) || (perCat.get(pk.product.category) ?? 0) >= cap) continue;
      out.push(pk);
      types.add(pk.product.type);
      perCat.set(pk.product.category, (perCat.get(pk.product.category) ?? 0) + 1);
    }
  }

  return { season, baseline, missing, owned: own.length, picks: out };
}

/** Monta el look de ejemplo como un outfit normal, para abrirlo en la vista de detalle. */
export function exampleOutfit(pick: GapPick, prefs: Prefs, ctx: { profile: Profile; wardrobe: WardrobeItem[]; referents: [] }): Outfit {
  const order: Category[] = ['layer', 'top', 'bottom', 'shoes'];
  const pieces: Piece[] = [...pick.best].sort((a, b) => order.indexOf(a.p.category) - order.indexOf(b.p.category))
    .map((i) => ({ ref: i.p.id, own: i.own, color: i.color }));
  const base = {
    id: '', name: `Con ${pick.product.name.split(',')[0].toLowerCase()}`, style: pick.bestStyle, pieces,
    description: '', occasion: prefs.occasion, season: prefs.season, total: 0, compat: 0, compatParts: [], reasons: [],
    backdrop: 0, createdAt: Date.now(), budget: 0, fromWardrobe: 0,
    basis: { styles: prefs.styles, favColors: prefs.favColors, boldness: prefs.boldness, formalityShift: 0 },
  } as Outfit;
  return rebuildOutfit(base, pieces, ctx);
}

export const isNeutral = (c: ColorKey) => COLORS[c].family === 'neutro';
