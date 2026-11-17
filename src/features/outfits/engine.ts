// Motor de outfits (Fase 1): reglas deterministas sobre el catálogo disponible.
// Combina medidas, preferencias, estilo, presupuesto, temporada, referentes y armario.
// Nunca crea productos: solo combina los que devuelve el proveedor de catálogo y las prendas del usuario.
import type {
  Category, ColorKey, CompatPart, GenRequest, Occasion, Outfit, Piece, Product, Profile, Referent, Season, StyleKey, WardrobeItem,
} from '@/domain/types';
import { OCCASIONS, seasonLabel, typeLabel } from '@/domain/garments';
import { COLORS, colorName } from '@/data/demo/colors';
import { LOOK_NAMES, styleByKey, styleName } from '@/data/demo/styles';
import { catalog, resolveOutfit, wardrobeToProduct } from '@/services/catalog';
import { parseText, type TextHints } from './textQuery';

export interface EngineCtx { profile: Profile; wardrobe: WardrobeItem[]; referents: Referent[] }
export interface Cand { p: Product; color: ColorKey; own: boolean }
export interface GenResult { outfits: Outfit[]; notes: string[]; hints: TextHints; effective: GenRequest }

const SEASON_WARMTH: Record<Season, number> = { verano: 1.2, primavera: 2.2, otono: 3.2, invierno: 4.4 };
const LAYER_NEED: Record<Season, number> = { verano: 0, primavera: 0.45, otono: 0.8, invierno: 1 };
const BAGS = ['tote', 'crossbody', 'backpack'];
const HATS = ['cap', 'beanie'];

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const euro = (n: number) => (Number.isInteger(n) ? `${n} €` : `${n.toFixed(2).replace('.', ',')} €`);

// ── Color ─────────────────────────────────────────────────────────
export function harmony(colors: ColorKey[]): number {
  const accents = uniq(colors.filter((c) => COLORS[c].family !== 'neutro'));
  if (accents.length === 0) return 0.88;
  if (accents.length === 1) return 1;
  if (accents.length === 2) {
    const [a, b] = accents.map((c) => COLORS[c].family);
    if (a === b) return 0.86;
    if ((a === 'tierra' && b === 'frio') || (a === 'frio' && b === 'tierra')) return 0.8;
    if (a === 'tierra' || b === 'tierra') return 0.74;
    return 0.6;
  }
  return 0.38;
}

// ── Petición efectiva: formulario + texto libre + referentes ─────
export function effectiveRequest(req: GenRequest, referents: Referent[]): { eff: GenRequest; hints: TextHints; refStyles: StyleKey[] } {
  const hints = parseText(req.text);
  const refStyles = uniq(referents.filter((r) => req.referentIds.includes(r.id)).flatMap((r) => r.styles));
  // Si el texto nombra estilos, mandan sobre las casillas del formulario.
  const styles = hints.styles.length ? hints.styles : req.styles;
  const eff: GenRequest = {
    ...req,
    styles: styles.length ? styles : refStyles.length ? refStyles.slice(0, 2) : ['casual'],
    budget: hints.budget ?? req.budget,
    season: hints.season ?? req.season,
    occasion: hints.occasion ?? req.occasion,
    favColors: uniq([...req.favColors, ...hints.colors]).filter((c) => !hints.avoidColors.includes(c)),
    avoidColors: uniq([...req.avoidColors, ...hints.avoidColors]),
    likeTypes: uniq([...req.likeTypes, ...hints.wantTypes]),
    avoidTypes: uniq([...req.avoidTypes, ...hints.avoidTypes]).filter((t) => !hints.wantTypes.includes(t)),
  };
  return { eff, hints, refStyles };
}

interface Env {
  eff: GenRequest; hints: TextHints; refStyles: StyleKey[];
  formalityShift: number; boldTarget: number; budget: number;
  /** amplitud de exploración al elegir piezas: sube si la primera pasada da pocas combinaciones */
  spread: number;
}

function formalityTarget(style: StyleKey, occasion: Occasion, shift: number) {
  const occ = OCCASIONS.find((o) => o.key === occasion)!.formality;
  return Math.max(1, Math.min(5, occ * 0.5 + styleByKey(style).formality * 0.5 + shift));
}

function styleFit(p: Product, style: StyleKey, env: Env): number {
  if (p.styles.includes(style)) return 1;
  const related = styleByKey(style).related;
  const viaSelected = p.styles.some((s) => env.eff.styles.includes(s));
  const viaRelated = p.styles.some((s) => related.includes(s));
  return viaRelated ? 0.42 : viaSelected ? 0.36 : 0.08;
}

function scorePiece(c: Cand, style: StyleKey, env: Env): number {
  const { p } = c;
  const { eff, hints } = env;
  let s = styleFit(p, style, env) * (c.own ? 0.75 : 1) + (c.own ? 0.3 : 0);
  if (p.styles.some((x) => env.refStyles.includes(x))) s += 0.12;
  if (eff.favColors.includes(c.color)) s += 0.22;
  if (eff.likeTypes.includes(p.type)) s += 0.45;
  if (eff.brands.includes(p.brandId)) s += 0.2;
  s -= Math.abs(p.formality - formalityTarget(style, eff.occasion, env.formalityShift)) * 0.14;
  s -= Math.abs(p.boldness - env.boldTarget) * 0.09;
  s -= Math.abs(p.warmth - SEASON_WARMTH[eff.season]) * (p.category === 'shoes' || p.category === 'accessory' ? 0.03 : 0.1);
  const tone = hints.tone[p.category];
  if (tone === 'bold') s += (p.boldness - 2.5) * 0.3;
  if (tone === 'quiet') s -= (p.boldness - 1.5) * 0.3 + (p.traits?.pattern ? 0.4 : 0);
  const vol = hints.volume[p.category];
  if (vol === 'wide') s += p.fit === 'oversized' ? 0.6 : p.fit === 'relaxed' ? 0.5 : p.fit === 'slim' ? -1 : -0.55;
  if (vol === 'wide' && (p.type === 'wide' || p.type === 'chunky')) s += 0.4;
  if (vol === 'wide' && p.type === 'jogger') s -= 0.4;
  if (vol === 'slim') s += p.fit === 'slim' ? 0.5 : p.fit === 'regular' ? 0.05 : -0.5;
  if (eff.tweak === 'color' && COLORS[c.color].family !== 'neutro') s += 0.25;
  if (p.traits?.pattern && ['minimal', 'quiet', 'formal'].includes(style) && tone !== 'bold') s -= 0.4;
  return s;
}

function chooseColor(p: Product, eff: GenRequest, rnd: () => number): ColorKey | null {
  const allowed = p.colors.filter((c) => !eff.avoidColors.includes(c));
  if (!allowed.length) return null;
  if (allowed.length === 1) return allowed[0];
  const fav = allowed.filter((c) => eff.favColors.includes(c));
  if (fav.length) return fav[Math.floor(rnd() * fav.length)];
  if (eff.tweak === 'color' && allowed.length > 1) return allowed[1 + Math.floor(rnd() * (allowed.length - 1))];
  return rnd() < 0.72 ? allowed[0] : allowed[Math.floor(rnd() * allowed.length)];
}

function pool(env: Env, ctx: EngineCtx, rnd: () => number): Cand[] {
  const { eff } = env;
  const out: Cand[] = [];
  if (eff.source !== 'wardrobe') {
    for (const p of catalog.list()) {
      if (p.availability === 'agotado') continue;
      if (!p.markets.includes(eff.market)) continue;
      if (!p.seasons.includes(eff.season)) continue;
      if (eff.avoidTypes.includes(p.type)) continue;
      // Patronaje: con preferencia masculina no se proponen faldas ni tops cortos salvo que se pidan.
      if (ctx.profile.pattern === 'masculino' && (p.type === 'skirt' || p.traits?.cropped) && !eff.likeTypes.includes(p.type)) continue;
      const color = chooseColor(p, eff, rnd);
      if (!color) continue;
      out.push({ p, color, own: false });
    }
  }
  if (eff.source !== 'catalog') {
    for (const item of ctx.wardrobe) {
      if (!item.seasons.includes(eff.season)) continue;
      out.push({ p: wardrobeToProduct(item), color: item.color, own: true });
    }
  }
  return out;
}

function pick(cands: Cand[], score: (c: Cand) => number, rnd: () => number, spread = 0.34): Cand | undefined {
  const k = spread > 0.5 ? 8 : 4;
  if (!cands.length) return undefined;
  const scored = cands.map((c) => ({ c, s: score(c) })).sort((a, b) => b.s - a.s);
  const top = scored.filter((x) => x.s >= scored[0].s - spread).slice(0, k);
  const min = top[top.length - 1].s;
  const weights = top.map((x) => (x.s - min + 0.12) ** 2);
  let r = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < top.length; i++) { r -= weights[i]; if (r <= 0) return top[i].c; }
  return top[0].c;
}

function layerClash(layer: Product, top: Product): number {
  const bulky = ['hoodie', 'sweatshirt'];
  if (layer.type === 'blazer' && bulky.includes(top.type)) return 0.7;
  if (layer.type === 'cardigan' && [...bulky, 'knit'].includes(top.type)) return 0.7;
  if (layer.type === 'overshirt' && top.type === 'shirt') return 0.35;
  if (layer.type === 'denimjacket' && top.type === 'shirt' && top.traits?.pattern) return 0.3;
  if (layer.type === 'trench' && bulky.includes(top.type)) return 0.3;
  return 0;
}

// ── Evaluación (compatibilidad) ──────────────────────────────────
export interface Evaluation { compat: number; parts: CompatPart[]; total: number; fromWardrobe: number }

export function evaluate(
  items: Cand[], style: StyleKey,
  basis: Outfit['basis'], season: Season, occasion: Occasion, budget: number,
): Evaluation {
  const core = items.filter((i) => i.p.category !== 'accessory');
  const total = Math.round(items.filter((i) => !i.own).reduce((a, i) => a + i.p.price, 0) * 100) / 100;
  const styleScore = items.reduce((a, i) => a + (i.p.styles.includes(style) ? 1 : i.p.styles.some((s) => basis.styles.includes(s)) ? 0.75 : i.own ? 0.6 : 0.3), 0) / items.length;
  const colors = items.map((i) => i.color);
  const favHit = basis.favColors.length ? (colors.some((c) => basis.favColors.includes(c)) ? 1 : 0.7) : 1;
  const colorScore = clamp01(harmony(core.map((i) => i.color)) * 0.8 + favHit * 0.2);
  const budgetScore = !budget ? 1 : total <= budget ? 1 : clamp01(1 - ((total - budget) / budget) * 3);
  const garments = items.filter((i) => i.p.category === 'top' || i.p.category === 'layer' || i.p.category === 'bottom');
  const warm = Math.max(...garments.map((i) => i.p.warmth), 1) * 0.6 + (garments.reduce((a, i) => a + i.p.warmth, 0) / Math.max(1, garments.length)) * 0.4;
  const seasonScore = clamp01(1 - Math.abs(warm - SEASON_WARMTH[season]) / 3);
  const avgFormality = core.reduce((a, i) => a + i.p.formality, 0) / Math.max(1, core.length);
  const occScore = clamp01(1 - Math.abs(avgFormality - formalityTarget(style, occasion, basis.formalityShift)) / 2.6);
  const peak = Math.max(...items.map((i) => i.p.boldness));
  const boldScore = clamp01(1 - Math.abs(peak - basis.boldness) / 4);
  const parts: CompatPart[] = [
    { key: 'style', label: 'Estilo', score: styleScore, weight: 30 },
    { key: 'color', label: 'Color', score: colorScore, weight: 15 },
    { key: 'budget', label: 'Presupuesto', score: budgetScore, weight: 15 },
    { key: 'season', label: 'Temporada', score: seasonScore, weight: 15 },
    { key: 'occasion', label: 'Ocasión', score: occScore, weight: 15 },
    { key: 'bold', label: 'Atrevimiento', score: boldScore, weight: 10 },
  ];
  const compat = Math.round(parts.reduce((a, p) => a + p.score * p.weight, 0));
  return { compat, parts, total, fromWardrobe: items.filter((i) => i.own).length };
}

// ── Textos ───────────────────────────────────────────────────────
function phrase(c: Cand): string {
  const name = lcFirst(c.p.name);
  if (c.own) return name;
  const col = colorName(c.color).toLowerCase();
  const short = col.replace('azul ', '').replace('verde ', '').replace('vaquero ', '');
  if (name.includes(col) || name.includes(short) || c.p.type === 'jeans' || c.p.type === 'denimjacket') return name;
  return `${name} en ${col}`;
}

const slot = (items: Cand[], cat: Category) => items.find((i) => i.p.category === cat);

export function describe(items: Cand[]): string {
  const top = slot(items, 'top'), layer = slot(items, 'layer'), bottom = slot(items, 'bottom'), shoes = slot(items, 'shoes');
  const acc = items.filter((i) => i.p.category === 'accessory');
  let s = '';
  if (layer && top) s = `${capFirst(phrase(layer))} sobre ${phrase(top)}`;
  else if (top) s = capFirst(phrase(top));
  else if (layer) s = capFirst(phrase(layer));
  const tail = [bottom && phrase(bottom), shoes && phrase(shoes)].filter(Boolean) as string[];
  if (tail.length) s += `${s ? ', con ' : ''}${tail.join(' y ')}`;
  s += '.';
  if (acc.length) s += ` Se remata con ${acc.map(phrase).join(' y ')}.`;
  return s;
}

function paletteLine(items: Cand[], favs: ColorKey[]): string {
  const colors = uniq(items.filter((i) => i.p.category !== 'accessory').map((i) => i.color));
  const favUsed = colors.filter((c) => favs.includes(c));
  const neutrals = colors.filter((c) => COLORS[c].family === 'neutro');
  const accents = colors.filter((c) => COLORS[c].family !== 'neutro');
  const list = (cs: ColorKey[]) => cs.map((c) => colorName(c).toLowerCase()).join(cs.length === 2 ? ' y ' : ', ');
  let line: string;
  if (!accents.length) line = `Paleta neutra (${list(neutrals.slice(0, 3))}): fácil de repetir con otras prendas.`;
  else if (accents.length === 1 && neutrals.length) line = `Base neutra en ${list(neutrals.slice(0, 2))} con un único acento en ${list(accents)}.`;
  else if (accents.length === 1) line = `Un solo color protagonista, ${list(accents)}, en todo el conjunto.`;
  else line = `${capFirst(list(accents.slice(0, 2)))} conviven porque comparten temperatura; el resto se queda en neutros.`;
  if (favUsed.length) line += ` Incluye ${list(favUsed)}, de tus colores favoritos.`;
  return line;
}

function bodyLine(items: Cand[], profile: Profile): string | null {
  const m = profile.measures;
  if (!m.height) return null;
  const layer = slot(items, 'layer'), bottom = slot(items, 'bottom'), top = slot(items, 'top');
  const legRatio = m.inseam ? m.inseam / m.height : null;
  const longLayer = layer && ['coat', 'trench'].includes(layer.p.type);
  const shortLayer = layer && ['bomber', 'puffer', 'denimjacket', 'gilet'].includes(layer.p.type);
  if (legRatio && legRatio < 0.445 && (shortLayer || top?.p.traits?.cropped)) return `Tu pierna es algo corta respecto a tu altura (${Math.round(legRatio * 100)} % de entrepierna): la capa corta sube la línea de la cintura y la alarga.`;
  if (legRatio && legRatio < 0.445 && bottom && ['wide', 'tailored', 'straight'].includes(bottom.p.type)) return 'Con tu proporción de pierna, lleva el pantalón a la cintura y con el bajo rozando el zapato para ganar longitud.';
  if (longLayer && m.height < 168) return `Con ${Math.round(m.height)} cm de altura, este abrigo te llegará por debajo de la rodilla: llévalo abierto para que no acorte la figura.`;
  if (longLayer && m.height >= 180) return `Tu altura (${Math.round(m.height)} cm) sostiene bien una capa larga sin que te corte la silueta.`;
  if (m.chest && m.waist && m.chest - m.waist >= 14 && top && top.p.fit === 'slim') return 'Tu diferencia entre pecho y cintura es marcada: el corte entallado de arriba la aprovecha.';
  if (bottom?.p.fit === 'oversized' && top && top.p.fit !== 'oversized') return 'Volumen abajo y parte de arriba contenida: la silueta queda equilibrada.';
  return null;
}

function reasonsFor(items: Cand[], style: StyleKey, env: { eff: GenRequest; hints: TextHints }, ev: Evaluation, profile: Profile): string[] {
  const out: string[] = [];
  const info = styleByKey(style);
  const top = slot(items, 'top'), layer = slot(items, 'layer'), bottom = slot(items, 'bottom'), shoes = slot(items, 'shoes');
  const matched = items.filter((i) => i.p.styles.includes(style)).length;
  out.push(matched >= Math.ceil(items.length * 0.6)
    ? `Sigue las claves de ${info.name}: ${lcFirst(info.line)}.`
    : `Se acerca a ${info.name} con ${matched} de ${items.length} prendas del estilo; el resto son básicos compatibles.`);
  const asked: string[] = [];
  const { hints } = env;
  if (hints.volume.bottom === 'wide' && bottom && (bottom.p.type === 'wide' || bottom.p.fit === 'relaxed' || bottom.p.fit === 'oversized')) asked.push('pantalón amplio');
  if (hints.tone.shoes === 'bold' && shoes && shoes.p.boldness >= 3) asked.push('calzado con protagonismo');
  const missed: string[] = [];
  if (hints.volume.bottom === 'wide' && bottom && !(bottom.p.type === 'wide' || bottom.p.fit === 'relaxed' || bottom.p.fit === 'oversized')) missed.push('un pantalón realmente ancho');
  if (hints.tone.shoes === 'bold' && shoes && shoes.p.boldness < 3) missed.push('un calzado llamativo');
  if (hints.tone.top === 'quiet' && top && top.p.boldness <= 2) asked.push('parte de arriba lisa');
  hints.wantTypes.forEach((t) => { if (items.some((i) => i.p.type === t) && !(t === 'wide' && asked.length)) asked.push(typeLabel(t).toLowerCase()); });
  if (asked.length) out.push(`Cumple lo que pedías: ${uniq(asked).join(', ')}.`);
  if (missed.length) out.push(`No cabe en este presupuesto ${missed.join(' ni ')}: es la opción más cercana.`);
  out.push(paletteLine(items, env.eff.favColors));
  if (env.eff.budget) {
    const diff = Math.round((env.eff.budget - ev.total) * 100) / 100;
    out.push(diff >= 0 ? `Total de ${euro(ev.total)}: ${diff < 1 ? 'justo en' : `${euro(Math.round(diff))} por debajo de`} tu presupuesto.` : `Supera tu presupuesto en ${euro(Math.round(-diff))}: no hay combinación más barata que mantenga el estilo.`);
  }
  const season = env.eff.season;
  if (season === 'verano') out.push('Tejidos ligeros y sin capa exterior para el calor.');
  else if (layer) out.push(`Para ${seasonLabel(season).toLowerCase()}: ${lcFirst(layer.p.name)} como capa${top && top.p.warmth >= 3 ? ` y ${lcFirst(typeLabel(top.p.type))} de abrigo debajo` : ''}.`);
  else if (top) out.push(`Para ${seasonLabel(season).toLowerCase()} basta con ${lcFirst(typeLabel(top.p.type))}; añade una capa si refresca.`);
  const body = bodyLine(items, profile);
  if (body) out.push(body);
  const own = items.filter((i) => i.own);
  if (own.length) {
    const buy = items.length - own.length;
    out.push(`Aprovecha ${own.length === 1 ? 'una prenda' : `${own.length} prendas`} que ya tienes (${own.map((i) => lcFirst(i.p.name)).join(', ')})${buy ? `: solo comprarías ${buy}.` : ': no necesitas comprar nada.'}`);
  }
  return out;
}

// ── Montaje ──────────────────────────────────────────────────────
function assemble(style: StyleKey, cands: Cand[], env: Env, rnd: () => number, locked: Cand[]): Cand[] | null {
  const by = (cat: Category) => cands.filter((c) => c.p.category === cat);
  const lockedIn = (cat: Category) => locked.find((l) => l.p.category === cat);
  const base = (c: Cand) => scorePiece(c, style, env);
  const ft = formalityTarget(style, env.eff.occasion, env.formalityShift);

  const bottom = lockedIn('bottom') ?? pick(by('bottom'), base, rnd, env.spread);
  const top = lockedIn('top') ?? pick(by('top'), (c) => base(c) + (bottom ? harmony([c.color, bottom.color]) * 0.7 : 0), rnd, env.spread);
  if (!top || !bottom) return null;
  const items: Cand[] = [top, bottom];

  let need = LAYER_NEED[env.eff.season];
  if (ft >= 4.2 && env.eff.season !== 'verano') need = Math.max(need, 0.85);
  if (env.eff.season === 'primavera' && top.p.warmth >= 4) need *= 0.4;
  if (env.eff.likeTypes.some((t) => by('layer').some((c) => c.p.type === t))) need = Math.max(need, env.eff.season === 'verano' ? 0.3 : 1);
  const lockedLayer = lockedIn('layer');
  if (lockedLayer) items.push(lockedLayer);
  else if (rnd() < need) {
    const layer = pick(by('layer'), (c) => base(c) + harmony([c.color, top.color, bottom.color]) * 0.6 - layerClash(c.p, top.p) - (c.color === top.color && COLORS[c.color].family !== 'neutro' ? 0.2 : 0), rnd, env.spread);
    if (layer) items.push(layer);
  }
  const avgF = items.reduce((a, i) => a + i.p.formality, 0) / items.length;
  const shoes = lockedIn('shoes') ?? pick(by('shoes'), (c) => base(c) + harmony([...items.map((i) => i.color), c.color]) * 0.35 - Math.abs(c.p.formality - avgF) * 0.18, rnd, env.spread);
  if (shoes) items.push(shoes);
  else if (env.eff.source !== 'wardrobe') return null;

  const lockedAcc = locked.filter((l) => l.p.category === 'accessory');
  items.push(...lockedAcc);
  let nAcc = env.boldTarget >= 4 ? 2 : env.boldTarget >= 2 ? (rnd() < 0.7 ? 1 : 0) + (rnd() < 0.2 ? 1 : 0) : rnd() < 0.35 ? 1 : 0;
  nAcc = Math.max(0, nAcc - lockedAcc.length);
  const accs = by('accessory').map((c) => ({ c, s: base(c) + harmony([...items.map((i) => i.color), c.color]) * 0.3 + rnd() * 0.55 })).sort((a, b) => b.s - a.s);
  for (const { c, s } of accs) {
    if (nAcc <= 0) break;
    if (s < 0.75) break;
    const t = c.p.type;
    const has = (list: string[]) => items.some((i) => list.includes(i.p.type));
    if (items.some((i) => i.p.type === t)) continue;
    if (BAGS.includes(t) && has(BAGS)) continue;
    if (HATS.includes(t) && has(HATS)) continue;
    if (t === 'belt' && (ft < 3 || bottom.p.type === 'jogger' || bottom.p.type === 'skirt')) continue;
    if (t === 'scarf' && !items.some((i) => i.p.category === 'layer')) continue;
    items.push(c);
    nAcc--;
  }

  // Ajuste a presupuesto: primero accesorios, luego sustituir la pieza más cara, luego la capa.
  const cost = () => items.filter((i) => !i.own).reduce((a, i) => a + i.p.price, 0);
  const budget = env.budget;
  const isLocked = (c: Cand) => locked.some((l) => l.p.id === c.p.id);
  if (budget > 0) {
    let guard = 0;
    while (cost() > budget && guard++ < 14) {
      const acc = items.filter((i) => i.p.category === 'accessory' && !i.own && !isLocked(i)).sort((a, b) => b.p.price - a.p.price)[0];
      if (acc) { items.splice(items.indexOf(acc), 1); continue; }
      const swappable = items.filter((i) => !i.own && !isLocked(i)).sort((a, b) => b.p.price - a.p.price);
      let swapped = false;
      for (const target of swappable) {
        const others = items.filter((i) => i !== target);
        const best = base(target);
        const cheaper = by(target.p.category)
          .filter((c) => (c.own || c.p.price < target.p.price) && !items.some((i) => i.p.id === c.p.id) && base(c) >= best - 1.1)
          .map((c) => ({ c, s: base(c) + harmony([...others.filter((o) => o.p.category !== 'accessory').map((o) => o.color), c.color]) * 0.6 - (target.p.category === 'layer' && top ? layerClash(c.p, top.p) : 0) }))
          .sort((a, b) => b.s - a.s)[0];
        if (cheaper) { items[items.indexOf(target)] = cheaper.c; swapped = true; break; }
      }
      if (swapped) continue;
      const layer = items.find((i) => i.p.category === 'layer' && !i.own && !isLocked(i));
      if (layer && LAYER_NEED[env.eff.season] < 1) { items.splice(items.indexOf(layer), 1); continue; }
      break;
    }
  }
  return items;
}

function toOutfit(items: Cand[], style: StyleKey, env: Env, ctx: EngineCtx, name: string, seedTag: string): Outfit {
  const basis: Outfit['basis'] = { styles: env.eff.styles, favColors: env.eff.favColors, boldness: env.boldTarget, formalityShift: env.formalityShift };
  const ev = evaluate(items, style, basis, env.eff.season, env.eff.occasion, env.budget);
  const order: Category[] = ['layer', 'top', 'bottom', 'shoes', 'accessory'];
  const sorted = [...items].sort((a, b) => order.indexOf(a.p.category) - order.indexOf(b.p.category));
  const pieces: Piece[] = sorted.map((i) => ({ ref: i.p.id, own: i.own, color: i.color }));
  const key = pieces.map((p) => p.ref + p.color).join('|');
  return {
    id: 'o' + hashStr(key + seedTag).toString(36),
    name, style, pieces,
    description: describe(sorted),
    occasion: env.eff.occasion, season: env.eff.season,
    total: ev.total, compat: ev.compat, compatParts: ev.parts,
    reasons: reasonsFor(sorted, style, env, ev, ctx.profile),
    backdrop: hashStr(key) % 8,
    createdAt: Date.now(), budget: env.budget, fromWardrobe: ev.fromWardrobe, basis,
  };
}

export function generateOutfits(req: GenRequest, ctx: EngineCtx): GenResult {
  const { eff, hints, refStyles } = effectiveRequest(req, ctx.referents);
  const notes: string[] = [];
  const rnd = mulberry(req.seed);
  const env: Env = {
    eff, hints, refStyles,
    formalityShift: eff.tweak === 'formal' ? 1.2 : eff.tweak === 'informal' ? -1.2 : 0,
    boldTarget: Math.max(1, Math.min(5, eff.boldness + (eff.tweak === 'bolder' ? 1.5 : 0))),
    budget: eff.budget,
    spread: 0.34,
  };
  const cands = pool(env, ctx, rnd);
  const locked = (eff.lockRefs ?? []).flatMap((ref) => {
    const c = cands.find((x) => x.p.id === ref);
    return c ? [c] : [];
  });

  if (eff.source === 'wardrobe') {
    const has = (cat: Category) => cands.some((c) => c.p.category === cat);
    if (!has('top') || !has('bottom')) {
      notes.push(`Para crear looks solo con tu armario necesitas al menos una parte de arriba y una de abajo válidas para ${seasonLabel(eff.season).toLowerCase()}. Añade prendas o usa el modo «Armario + compras».`);
      return { outfits: [], notes, hints, effective: eff };
    }
    if (!has('shoes')) notes.push('No hay calzado en tu armario para esta temporada: los looks se muestran sin zapatos.');
  }

  const drafts: { items: Cand[]; style: StyleKey; ev: Evaluation }[] = [];
  const seenDrafts = new Set<string>();
  const attempts = Math.max(30, eff.count * 12);
  const distinctOk = () => drafts.filter((d) => !env.budget || d.ev.total <= env.budget).length;
  for (let k = 0; k < attempts * 3; k++) {
    // Segunda y tercera pasada solo si faltan combinaciones: se abre el abanico de piezas candidatas.
    if (k === attempts || k === attempts * 2) {
      if (distinctOk() >= eff.count * 2) break;
      env.spread = k === attempts ? 0.8 : 1.3;
    }
    const style = eff.styles[k % eff.styles.length];
    const items = assemble(style, cands, env, rnd, locked);
    if (!items) continue;
    if (eff.source === 'mix' && !items.some((i) => i.own)) {
      // intenta colocar una prenda propia compatible
      const own = cands.filter((c) => c.own);
      for (const o of own) {
        const idx = items.findIndex((i) => i.p.category === o.p.category && !locked.includes(i));
        if (idx >= 0 && o.p.category !== 'accessory') {
          const trial = [...items]; trial[idx] = o;
          if (harmony(trial.filter((t) => t.p.category !== 'accessory').map((t) => t.color)) >= 0.74) { items[idx] = o; break; }
        }
      }
    }
    const dkey = items.filter((i) => i.p.category !== 'accessory').map((i) => i.p.id).sort().join('|');
    if (seenDrafts.has(dkey)) continue;
    seenDrafts.add(dkey);
    const basis: Outfit['basis'] = { styles: eff.styles, favColors: eff.favColors, boldness: env.boldTarget, formalityShift: env.formalityShift };
    drafts.push({ items, style, ev: evaluate(items, style, basis, eff.season, eff.occasion, env.budget) });
  }
  if (!drafts.length) {
    notes.push('No hemos encontrado combinaciones con estos filtros. Prueba a quitar prendas o colores excluidos, o cambia de mercado.');
    return { outfits: [], notes, hints, effective: eff };
  }

  const within = drafts.filter((d) => !env.budget || d.ev.total <= env.budget);
  let ranked = (within.length >= Math.min(3, eff.count) ? within : drafts).sort((a, b) => b.ev.compat - a.ev.compat);
  if (env.budget && within.length < Math.min(3, eff.count)) {
    const cheapest = Math.min(...drafts.map((d) => d.ev.total));
    notes.push(`Con ${euro(env.budget)} no salen suficientes looks completos para ${seasonLabel(eff.season).toLowerCase()} en este estilo. El más barato posible cuesta ${euro(cheapest)}; te mostramos los más cercanos.`);
  }
  if (eff.tweak === 'cheaper') ranked = ranked.sort((a, b) => a.ev.total - b.ev.total || b.ev.compat - a.ev.compat);

  const coreKey = (d: { items: Cand[] }) => d.items.filter((i) => i.p.category !== 'accessory').map((i) => i.p.id);
  const chosen: typeof drafts = [];
  for (const maxShared of [1, 2, 3]) {
    // primera vuelta: un look por estilo seleccionado
    for (const d of ranked) {
      if (chosen.length >= eff.count) break;
      if (chosen.includes(d)) continue;
      if (maxShared === 1 && eff.styles.length > 1 && chosen.length < eff.styles.length && chosen.some((c) => c.style === d.style)) continue;
      const ids = coreKey(d);
      const clash = chosen.some((c) => {
        const shared = coreKey(c).filter((id) => ids.includes(id)).length;
        return shared > maxShared || shared === ids.length;
      });
      if (!clash) chosen.push(d);
    }
    if (chosen.length >= eff.count) break;
  }
  if (chosen.length < eff.count && eff.source === 'wardrobe') notes.push(`Tu armario da para ${chosen.length} ${chosen.length === 1 ? 'combinación distinta' : 'combinaciones distintas'} esta temporada.`);

  // Evita repetir el mismo accesorio en varios looks de la misma tanda.
  const seenAcc = new Set<string>();
  for (const d of chosen) {
    d.items = d.items.filter((i) => i.p.category !== 'accessory' || locked.includes(i) || !seenAcc.has(i.p.id));
    d.items.filter((i) => i.p.category === 'accessory').forEach((i) => seenAcc.add(i.p.id));
  }
  const usedNames = new Set<string>();
  const outfits = chosen.map((d, i) => {
    const bank = LOOK_NAMES[d.style];
    let name = bank[Math.floor(rnd() * bank.length)];
    let guard = 0;
    while (usedNames.has(name) && guard++ < 12) name = bank[(bank.indexOf(name) + 1) % bank.length];
    usedNames.add(name);
    return toOutfit(d.items, d.style, env, ctx, name, String(req.seed) + i);
  });
  return { outfits, notes, hints, effective: eff };
}

/** Recalcula un look tras cambiar piezas (probador, consejos aplicados). */
export function rebuildOutfit(base: Outfit, pieces: Piece[], ctx: EngineCtx): Outfit {
  const resolved = resolveOutfit(pieces, ctx.wardrobe);
  const items: Cand[] = resolved.map(({ piece, product }) => ({ p: product, color: piece.color, own: piece.own }));
  const ev = evaluate(items, base.style, base.basis, base.season, base.occasion, base.budget);
  const key = pieces.map((p) => p.ref + p.color).join('|');
  const eff = { budget: base.budget, season: base.season, favColors: base.basis.favColors } as GenRequest;
  const hints: TextHints = { styles: [], wantTypes: [], avoidTypes: [], colors: [], avoidColors: [], tone: {}, volume: {}, understood: [] };
  return {
    ...base,
    id: 'o' + hashStr(key + 'r').toString(36),
    pieces: resolved.map(({ piece }) => piece),
    description: describe(items),
    total: ev.total, compat: ev.compat, compatParts: ev.parts, fromWardrobe: ev.fromWardrobe,
    reasons: reasonsFor(items, base.style, { eff, hints }, ev, ctx.profile),
    backdrop: hashStr(key) % 8,
    createdAt: Date.now(),
  };
}

export { styleName };
