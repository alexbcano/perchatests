// Consejos de estilismo calculados con reglas a partir del look y del catálogo disponible.
// Todas las sustituciones propuestas son productos que existen en el catálogo cargado.
import type { ColorKey, GarmentType, Outfit, Piece, Product, StyleKey } from '@/domain/types';
import { COLORS, colorName, hex, luminance } from '@/data/demo/colors';
import { styleByKey } from '@/data/demo/styles';
import { catalog, resolveOutfit } from '@/services/catalog';
import { harmony, euro, rebuildOutfit, type EngineCtx } from './engine';

export interface Swap { fromRef: string; to: Product; toColor: ColorKey; text: string }
export interface AddOn { product: Product; color: ColorKey; text: string }
export interface Advice {
  why: string[];
  colors: string;
  proportions: string;
  moreFormal?: Swap;
  moreCasual?: Swap;
  cheaper?: Swap;
  add: AddOn[];
  tighter: string;
  looser: string;
}

const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const ADD_REASON: Partial<Record<GarmentType, string>> = {
  belt: 'ordena la cintura y enlaza con el calzado',
  scarf: 'añade textura y color junto a la cara',
  watch: 'un detalle pulido que no compite con nada',
  sunglasses: 'da intención al look con un solo gesto',
  cap: 'baja la formalidad y enmarca la cara',
  beanie: 'abriga y añade un punto de color arriba',
  tote: 'práctica y coherente con la paleta',
  crossbody: 'cruza el torso y rompe un bloque de color liso',
  backpack: 'funcional y a tono con el resto de capas',
};

function bestColor(p: Product, others: ColorKey[]): ColorKey {
  return [...p.colors].sort((a, b) => harmony([...others, b]) - harmony([...others, a]))[0];
}

function styleOk(p: Product, style: StyleKey) {
  return p.styles.includes(style) || p.styles.some((s) => styleByKey(style).related.includes(s));
}

export function buildAdvice(outfit: Outfit, ctx: EngineCtx): Advice {
  const items = resolveOutfit(outfit.pieces, ctx.wardrobe);
  const core = items.filter((i) => i.product.category !== 'accessory');
  const find = (cat: string) => items.find((i) => i.product.category === cat);
  const top = find('top'), layer = find('layer'), bottom = find('bottom');
  const upper = layer ?? top;

  // Por qué funciona
  const why: string[] = [];
  const f = core.map((i) => i.product.formality);
  const hi = core[f.indexOf(Math.max(...f))], lo = core[f.indexOf(Math.min(...f))];
  if (Math.max(...f) - Math.min(...f) <= 1.5) why.push('Todas las prendas tienen un nivel de formalidad parecido, así que ninguna desentona.');
  else why.push(`Mezcla una pieza más arreglada (${lc(hi.product.name)}) con otra informal (${lc(lo.product.name)}): ese contraste es lo que le da interés.`);
  if (layer && top) {
    const diff = luminance(hex(layer.piece.color)) - luminance(hex(top.piece.color));
    why.push(Math.abs(diff) > 0.25
      ? `La capa abierta deja ver ${lc(top.product.name)}, que hace de punto ${diff > 0 ? 'oscuro' : 'claro'} en el centro y alarga el torso.`
      : 'Capa y parte de arriba van en tonos cercanos: se leen como un solo bloque y estilizan.');
  }
  const bold = items.filter((i) => i.product.boldness >= 4);
  if (bold.length === 1) why.push(`Solo hay una pieza llamativa (${lc(bold[0].product.name)}); el resto se mantiene sobrio para dejarle el protagonismo.`);
  if (bold.length >= 2) why.push('Varias piezas llamativas a la vez: funciona porque comparten paleta.');

  // Colores
  const used = Array.from(new Set(core.map((i) => i.piece.color)));
  const extra = styleByKey(outfit.style).palette.filter((c) => !used.includes(c)).slice(0, 2);
  const neutrals = used.filter((c) => COLORS[c].family === 'neutro');
  const accents = used.filter((c) => COLORS[c].family !== 'neutro');
  let colors = accents.length
    ? `${accents.map((c) => colorName(c)).join(' y ')} ${accents.length > 1 ? 'son los colores' : 'es el color'} con carácter; ${neutrals.length ? neutrals.map((c) => colorName(c).toLowerCase()).join(' y ') + ' hacen de fondo' : 'no hay neutros que lo rebajen'}.`
    : `Todo en neutros (${used.map((c) => colorName(c).toLowerCase()).join(', ')}): el interés está en el contraste claro-oscuro.`;
  if (extra.length) colors += ` Con esta base también combinan ${extra.map((c) => colorName(c).toLowerCase()).join(' y ')}.`;

  // Proporciones
  const wide = (fit?: string) => fit === 'relaxed' || fit === 'oversized';
  let proportions = 'Líneas rectas y cercanas al cuerpo: silueta limpia y fácil de llevar.';
  if (upper && bottom) {
    if (wide(upper.product.fit) && wide(bottom.product.fit)) proportions = 'Volumen arriba y abajo: silueta amplia y relajada. Deja ver muñeca o tobillo para que la ropa no te coma.';
    else if (wide(upper.product.fit)) proportions = 'Volumen arriba y pierna más limpia: el peso visual queda en los hombros.';
    else if (wide(bottom.product.fit)) proportions = 'Parte de arriba contenida y pierna ancha: alarga la pierna, sobre todo si metes la camiseta por dentro.';
  }
  if (layer && ['coat', 'trench'].includes(layer.product.type)) proportions += ' La capa larga dibuja una línea vertical continua que estiliza.';
  if (top?.product.traits?.cropped) proportions += ' La parte de arriba corta sube la cintura visual.';

  const season = outfit.season;
  const pool = catalog.list().filter((p) => p.availability !== 'agotado' && p.seasons.includes(season) && !items.some((i) => i.product.id === p.id));
  const restColors = (ref: string) => core.filter((i) => i.piece.ref !== ref).map((i) => i.piece.color);

  function findSwap(direction: 1 | -1): Swap | undefined {
    const order = direction === 1 ? ['shoes', 'top', 'bottom', 'layer'] : ['shoes', 'bottom', 'top', 'layer'];
    for (const cat of order) {
      const cur = items.find((i) => i.product.category === cat);
      if (!cur) continue;
      const options = pool
        .filter((p) => p.category === cat && (p.formality - cur.product.formality) * direction >= 0.9 && styleOk(p, outfit.style))
        .map((p) => { const color = bestColor(p, restColors(cur.piece.ref)); return { p, color, h: harmony([...restColors(cur.piece.ref), color]) }; })
        .filter((o) => o.h >= 0.74)
        .sort((a, b) => b.h - a.h || Math.abs(a.p.price - cur.product.price) - Math.abs(b.p.price - cur.product.price));
      if (options.length) {
        const o = options[0];
        return {
          fromRef: cur.piece.ref, to: o.p, toColor: o.color,
          text: direction === 1
            ? `Cambia ${lc(cur.product.name)} por ${lc(o.p.name)} en ${colorName(o.color).toLowerCase()}: sube el conjunto un punto de formalidad.`
            : `Cambia ${lc(cur.product.name)} por ${lc(o.p.name)} en ${colorName(o.color).toLowerCase()}: lo relaja para el día a día.`,
        };
      }
    }
    return undefined;
  }

  // Más barato: sustituir la pieza más cara
  let cheaper: Swap | undefined;
  const pricey = items.filter((i) => !i.piece.own).sort((a, b) => b.product.price - a.product.price);
  for (const cur of pricey) {
    const options = pool
      .filter((p) => p.category === cur.product.category && p.price <= cur.product.price - 10 && styleOk(p, outfit.style)
        && (cur.product.category !== 'accessory' || p.type === cur.product.type))
      .map((p) => { const color = bestColor(p, restColors(cur.piece.ref)); return { p, color, h: harmony([...restColors(cur.piece.ref), color]) }; })
      .filter((o) => o.h >= 0.74)
      .sort((a, b) => a.p.price - b.p.price);
    if (options.length) {
      const o = options[0];
      cheaper = { fromRef: cur.piece.ref, to: o.p, toColor: o.color, text: `Cambia ${lc(cur.product.name)} (${euro(cur.product.price)}) por ${lc(o.p.name)} (${euro(o.p.price)}) y ahorras ${euro(Math.round((cur.product.price - o.p.price) * 100) / 100)}.` };
      break;
    }
  }

  // Accesorios que añadir
  const bags = ['tote', 'crossbody', 'backpack'], hats = ['cap', 'beanie'];
  const hasType = (list: string[]) => items.some((i) => list.includes(i.product.type));
  const add: AddOn[] = [];
  const seen = new Set<string>();
  for (const p of pool.filter((x) => x.category === 'accessory' && x.styles.includes(outfit.style)).sort((a, b) => a.price - b.price)) {
    if (add.length >= 2) break;
    if (seen.has(p.type) || items.some((i) => i.product.type === p.type)) continue;
    if (bags.includes(p.type) && (hasType(bags) || add.some((a) => bags.includes(a.product.type)))) continue;
    if (hats.includes(p.type) && (hasType(hats) || add.some((a) => hats.includes(a.product.type)))) continue;
    if (p.type === 'scarf' && !layer) continue;
    const color = bestColor(p, core.map((i) => i.piece.color));
    seen.add(p.type);
    add.push({ product: p, color, text: `${p.name} en ${colorName(color).toLowerCase()}: ${ADD_REASON[p.type] ?? 'completa el conjunto'}.` });
  }

  const upName = upper ? lc(upper.product.name) : 'la parte de arriba';
  const lowName = bottom ? lc(bottom.product.name) : 'el pantalón';
  const looser = `Sube una talla en ${upName} y mantén la tuya en ${lowName}: ganas caída arriba sin perder la línea de la pierna. En el probador puedes ver el cambio de volumen.`;
  const tighter = bottom && wide(bottom.product.fit)
    ? `Mantén la talla recomendada arriba y baja una en ${lowName}, o cámbialo por un corte recto: la pierna queda más limpia.`
    : `Elige la talla recomendada en todo y, si dudas entre dos, la pequeña en ${upName}. Un bajo a la altura del tobillo afina la silueta.`;

  return { why, colors, proportions, moreFormal: findSwap(1), moreCasual: findSwap(-1), cheaper, add, tighter, looser };
}

export function applySwap(outfit: Outfit, swap: Swap, ctx: EngineCtx): Outfit {
  const pieces: Piece[] = outfit.pieces.map((p) => (p.ref === swap.fromRef ? { ref: swap.to.id, own: !!swap.to.own, color: swap.toColor } : p));
  return rebuildOutfit(outfit, pieces, ctx);
}

export function addPiece(outfit: Outfit, product: Product, color: ColorKey, ctx: EngineCtx): Outfit {
  return rebuildOutfit(outfit, [...outfit.pieces, { ref: product.id, own: !!product.own, color }], ctx);
}

export function removePiece(outfit: Outfit, ref: string, ctx: EngineCtx): Outfit {
  return rebuildOutfit(outfit, outfit.pieces.filter((p) => p.ref !== ref), ctx);
}
