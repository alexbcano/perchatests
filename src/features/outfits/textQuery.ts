// Interpreta la descripción libre del usuario con reglas (Fase 1).
// En la Fase 2 esta función se sustituye por una llamada al servicio de IA con la misma salida.
import type { Category, ColorKey, GarmentType, Occasion, Season, StyleKey } from '@/domain/types';
import { TYPE_INFO, GARMENT_TYPES, typeLabel, seasonLabel, occasionLabel, CATEGORY_LABEL } from '@/domain/garments';
import { COLORS, COLOR_KEYS, colorName } from '@/data/demo/colors';
import { styleName } from '@/data/demo/styles';

export interface TextHints {
  budget?: number;
  styles: StyleKey[];
  season?: Season;
  occasion?: Occasion;
  wantTypes: GarmentType[];
  avoidTypes: GarmentType[];
  colors: ColorKey[];
  avoidColors: ColorKey[];
  tone: Partial<Record<Category, 'bold' | 'quiet'>>;
  volume: Partial<Record<Category, 'wide' | 'slim'>>;
  understood: string[];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const STYLE_WORDS: [StyleKey, string[]][] = [
  ['business', ['business casual', 'oficina informal']],
  ['smart', ['smart casual', 'arreglado informal']],
  ['quiet', ['quiet luxury', 'lujo silencioso']],
  ['oldmoney', ['old money', 'oldmoney', 'pijo', 'preppy']],
  ['street', ['streetwear', 'street', 'urbano']],
  ['tech', ['techwear', 'tecnico urbano']],
  ['gorp', ['gorpcore', 'gorp', 'montanero', 'outdoor']],
  ['y2k', ['y2k', 'dosmilero', 'anos 2000']],
  ['vintage', ['vintage', 'retro', 'segunda mano']],
  ['skater', ['skater', 'skate']],
  ['formal', ['formal', 'traje', 'elegante', 'etiqueta']],
  ['sporty', ['sporty', 'deportivo', 'athleisure']],
  ['minimal', ['minimalista', 'minimal']],
  ['casual', ['casual', 'informal']],
];

const SEASON_WORDS: [Season, string[]][] = [['otono', ['otono']], ['invierno', ['invierno', 'frio']], ['primavera', ['primavera', 'entretiempo']], ['verano', ['verano', 'calor']]];
const OCCASION_WORDS: [Occasion, string[]][] = [
  ['trabajo', ['trabajo', 'oficina', 'reunion', 'entrevista']], ['cita', ['cita']], ['fiesta', ['fiesta', 'salir de noche', 'discoteca']],
  ['evento', ['boda', 'evento', 'ceremonia', 'gala', 'cena de empresa']], ['viaje', ['viaje', 'viajar', 'aeropuerto']],
  ['deporte', ['gimnasio', 'deporte', 'entrenar', 'correr']], ['diario', ['diario', 'dia a dia', 'clase', 'universidad']],
];

const CATEGORY_WORDS: [Category, string[]][] = [
  ['top', ['parte superior', 'parte de arriba', 'arriba', 'camiseta', 'camisa', 'jersey', 'sudadera', 'polo', 'top']],
  ['bottom', ['parte inferior', 'parte de abajo', 'pantalon', 'pantalones', 'vaquero', 'vaqueros', 'falda', 'bermuda', 'cargo', 'chino', 'chinos']],
  ['shoes', ['zapatilla', 'zapatillas', 'zapato', 'zapatos', 'calzado', 'bota', 'botas', 'mocasin', 'mocasines', 'deportivas', 'sneakers']],
  ['layer', ['chaqueta', 'abrigo', 'cazadora', 'americana', 'capa', 'gabardina', 'plumifero', 'bomber']],
  ['accessory', ['accesorio', 'accesorios', 'complemento', 'complementos', 'gorra', 'bolso', 'gafas']],
];

const BOLD = ['llamativ', 'atrevid', 'colorid', 'protagonista', 'destac', 'statement', 'original'];
const QUIET = ['minimalista', 'minimal', 'sobri', 'discret', 'lis', 'basic', 'sencill', 'neutr'];
const WIDE = ['anch', 'holgad', 'oversize', 'baggy', 'amplio', 'amplia', 'suelt'];
const SLIM = ['ajustad', 'slim', 'pitillo', 'estrech', 'entallad', 'cenid'];
const NEG = /\b(sin|no quiero|nada de|evita|evitar|excepto)\b/;

const hasAny = (s: string, words: string[]) => words.some((w) => new RegExp(`(^|[^a-z0-9])${w}`).test(s));

export function parseText(raw: string): TextHints {
  const hints: TextHints = { styles: [], wantTypes: [], avoidTypes: [], colors: [], avoidColors: [], tone: {}, volume: {}, understood: [] };
  const text = norm(raw).trim();
  if (!text) return hints;

  const money = text.match(/(\d{2,4})(?:[.,]\d+)?\s*(?:€|euros?|eur\b)/);
  if (money) { hints.budget = parseInt(money[1], 10); hints.understood.push(`Máx. ${hints.budget} €`); }

  for (const [season, words] of SEASON_WORDS) if (!hints.season && hasAny(text, words)) { hints.season = season; hints.understood.push(seasonLabel(season)); }
  for (const [occ, words] of OCCASION_WORDS) if (!hints.occasion && hasAny(text, words)) { hints.occasion = occ; hints.understood.push(occasionLabel(occ)); }

  const clauses = text.split(/[,.;]| y | con | pero /).map((c) => c.trim()).filter(Boolean);
  for (const clause of clauses) {
    const negative = NEG.test(clause);
    const cats = CATEGORY_WORDS.filter(([, words]) => hasAny(clause, words)).map(([c]) => c);

    // tipos de prenda concretos
    for (const t of GARMENT_TYPES) {
      if (TYPE_INFO[t].keywords.some((k) => clause.includes(norm(k)))) {
        const list = negative ? hints.avoidTypes : hints.wantTypes;
        if (!list.includes(t)) list.push(t);
      }
    }
    // colores
    let colorText = clause;
    for (const c of [...COLOR_KEYS].sort((a, b) => COLORS[b].name.length - COLORS[a].name.length)) {
      const re = new RegExp(`(^|[^a-z])${norm(COLORS[c].name)}s?([^a-z]|$)`);
      if (re.test(colorText)) {
        colorText = colorText.replace(re, ' · ');
        const list = negative ? hints.avoidColors : hints.colors;
        if (!list.includes(c)) list.push(c);
      }
    }
    if (cats.length) {
      // «parte superior minimalista», «zapatillas llamativas», «pantalones anchos»
      for (const cat of cats) {
        if (hasAny(clause, BOLD)) hints.tone[cat] = 'bold';
        else if (hasAny(clause, QUIET)) hints.tone[cat] = 'quiet';
        if (hasAny(clause, WIDE)) hints.volume[cat] = 'wide';
        else if (hasAny(clause, SLIM)) hints.volume[cat] = 'slim';
      }
    }
    // estilos: solo si la palabra no está calificando una prenda concreta
    let rest = clause;
    for (const [style, words] of STYLE_WORDS) {
      for (const w of words) {
        if (rest.includes(w)) {
          rest = rest.replace(w, ' ');
          const qualifiesGarment = cats.length > 0 && QUIET.concat(['casual', 'formal', 'deportivo', 'elegante', 'informal']).some((q) => w.startsWith(q));
          if (!qualifiesGarment && !negative && !hints.styles.includes(style)) hints.styles.push(style);
        }
      }
    }
  }
  // «pantalones anchos» pide volumen, no excluye el resto de pantalones
  hints.styles.forEach((s) => hints.understood.unshift(styleName(s)));
  const catName = (c: Category) => CATEGORY_LABEL[c].toLowerCase();
  (Object.keys(hints.volume) as Category[]).forEach((c) => hints.understood.push(`${CATEGORY_LABEL[c]} ${hints.volume[c] === 'wide' ? 'amplia' : 'ajustada'}`.replace('Calzado amplia', 'Calzado voluminoso')));
  (Object.keys(hints.tone) as Category[]).forEach((c) => hints.understood.push(hints.tone[c] === 'bold' ? `${CATEGORY_LABEL[c]} con protagonismo` : `${CATEGORY_LABEL[c]} sobria`.replace('Calzado sobria', 'Calzado sobrio').replace('Accesorio sobria', 'Accesorios sobrios')));
  hints.wantTypes.filter((t) => !hints.volume[TYPE_INFO[t].category] && !hints.tone[TYPE_INFO[t].category]).forEach((t) => hints.understood.push(typeLabel(t)));
  hints.avoidTypes.forEach((t) => hints.understood.push(`Sin ${typeLabel(t).toLowerCase()}`));
  hints.colors.forEach((c) => hints.understood.push(colorName(c)));
  hints.avoidColors.forEach((c) => hints.understood.push(`Sin ${colorName(c).toLowerCase()}`));
  void catName;
  hints.understood = Array.from(new Set(hints.understood));
  return hints;
}
