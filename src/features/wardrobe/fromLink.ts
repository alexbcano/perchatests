// Convierte un enlace de tienda en una prenda del armario.
// La app no puede abrir la página de la tienda (el navegador lo impide), así que solo usa lo que
// dice el propio enlace: la tienda sale del dominio y el nombre, tipo y color del texto de la dirección.
// Si el enlace es de una prenda que ya está en el catálogo, se copian sus datos reales.
import type { ColorKey, GarmentType, WardrobeItem } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { currentSeason } from '@/domain/garments';
import { uid } from '@/app/store';

const STORES: Record<string, string> = {
  'cos.com': 'COS', 'uniqlo.com': 'UNIQLO', 'camper.com': 'Camper', 'newbalance.es': 'New Balance', 'newbalance.com': 'New Balance',
  'levi.com': "Levi's", 'carhartt-wip.com': 'Carhartt WIP', 'massimodutti.com': 'Massimo Dutti', 'urbanoutfitters.com': 'Urban Outfitters',
  'milfshakes.es': 'Milfshakes', 'scuffers.com': 'Scuffers', 'emestudios.com': 'Eme Studios', 'nude-project.com': 'Nude Project',
  'zara.com': 'Zara', 'mango.com': 'Mango', 'pullandbear.com': 'Pull&Bear', 'bershka.com': 'Bershka', 'stradivarius.com': 'Stradivarius',
  'hm.com': 'H&M', 'zalando.es': 'Zalando', 'asos.com': 'ASOS', 'elcorteingles.es': 'El Corte Inglés', 'nike.com': 'Nike', 'adidas.es': 'Adidas',
  'adidas.com': 'Adidas', 'vans.com': 'Vans', 'converse.com': 'Converse', 'stussy.com': 'Stüssy', 'jdsports.es': 'JD Sports', 'footlocker.es': 'Foot Locker',
  'amazon.es': 'Amazon', 'vinted.es': 'Vinted', 'shein.com': 'SHEIN', 'lefties.com': 'Lefties', 'springfield.com': 'Springfield', 'jackjones.com': 'Jack & Jones',
  'thenorthface.es': 'The North Face', 'salomon.com': 'Salomon', 'puma.com': 'Puma', 'reebok.eu': 'Reebok', 'ralphlauren.es': 'Ralph Lauren', 'lacoste.com': 'Lacoste',
  'dickies.com': 'Dickies', 'drmartens.com': 'Dr. Martens', 'blueban.es': 'Blue Banana', 'bluebananabrand.com': 'Blue Banana', 'pompeiibrand.com': 'Pompeii',
};

// Del más concreto al más general: gana la primera palabra que aparezca.
const TYPES: [RegExp, GarmentType][] = [
  [/manga larga|long sleeve|longsleeve/, 'longsleeve'], [/sobrecamisa|overshirt/, 'overshirt'], [/cazadora vaquera|denim jacket|trucker/, 'denimjacket'],
  [/cuello alto|turtleneck|roll neck|cuello vuelto/, 'turtleneck'], [/cardigan|rebeca/, 'cardigan'], [/chaleco|gilet|vest\b/, 'gilet'],
  [/hoodie|sweathoodie|capucha|hooded/, 'hoodie'], [/sudadera|sweatshirt|crewneck|crew neck/, 'sweatshirt'],
  [/camiseta|t shirt|tshirt|\btee\b/, 'tee'], [/\bpolo\b/, 'polo'], [/camisa|\bshirt\b/, 'shirt'], [/jersey|sueter|jumper|sweater|\bknit|punto/, 'knit'],
  [/americana|blazer/, 'blazer'], [/gabardina|trench/, 'trench'], [/abrigo|\bcoat\b|parka/, 'coat'], [/bomber/, 'bomber'],
  [/plumifero|plumas|puffer|acolchad|padded|down jacket/, 'puffer'], [/cortavientos|anorak|windbreaker|impermeable|shell|chubasquero/, 'shell'],
  [/chaqueta|cazadora|jacket/, 'bomber'],
  [/bermuda|shorts?\b|pantalon corto/, 'shorts'], [/vaquero|jeans?\b|denim/, 'jeans'], [/cargo/, 'cargo'], [/jogger|sweatpants?|track pants?|chandal/, 'jogger'],
  [/chinos?\b/, 'chino'], [/wide leg|baggy|ancho|loose/, 'wide'], [/slim|skinny|pitillo/, 'slimpant'], [/traje|tailored|de vestir|pinzas/, 'tailored'],
  [/pantalon|pants?\b|trousers?/, 'straight'],
  [/mocasin|loafer/, 'loafer'], [/chelsea|botas?\b|botin|boots?\b/, 'boot'], [/derby|oxford shoe|zapato/, 'derby'], [/trail/, 'trail'],
  [/running|runner|\b(574|530|1906|2002|9060|327|550)\b/, 'runner'], [/zapatilla|sneaker|trainer|deportiva/, 'sneaker'],
  [/gorra|\bcap\b/, 'cap'], [/gorro|beanie/, 'beanie'], [/tote/, 'tote'], [/bandolera|crossbody|rinonera/, 'crossbody'], [/mochila|backpack/, 'backpack'],
  [/cinturon|\bbelt\b/, 'belt'], [/bufanda|scarf/, 'scarf'], [/gafas|sunglasses/, 'sunglasses'], [/reloj|watch/, 'watch'],
];

const COLORS: [RegExp, ColorKey][] = [
  [/azul marino|navy|marino/, 'marino'], [/azul claro|light blue|celeste|baby ?blue|sky/, 'azulclaro'], [/gris claro|light gr[ae]y/, 'grisclaro'],
  [/verde bosque|forest|dark green/, 'bosque'], [/oliva|olive|khaki|caqui|kaki|camo|army/, 'oliva'], [/salvia|sage|mint|menta/, 'salvia'],
  [/negro|black|\bdark\b/, 'negro'], [/blanco|white/, 'blanco'], [/crudo|ecru|cream|crema|off white|ivory|bone|hueso/, 'crudo'],
  [/carbon|charcoal|antracita|washed black/, 'carbon'], [/gris|gr[ae]y|heather|melange/, 'gris'], [/beige|sand|arena|stone|piedra/, 'beige'],
  [/camel|tan\b|tostado/, 'camel'], [/chocolate/, 'chocolate'], [/marron|brown|mocha|cafe/, 'marron'], [/burdeos|burgundy|granate|wine|vino/, 'burdeos'],
  [/rojo|\bred\b/, 'rojo'], [/naranja|orange/, 'naranja'], [/mostaza|mustard|amarillo|yellow/, 'mostaza'], [/rosa|pink/, 'rosa'],
  [/lila|lilac|purple|morado|violeta/, 'lila'], [/plata|silver/, 'plata'], [/lima|lime|neon/, 'lima'], [/verde|green/, 'bosque'],
  [/indigo|denim|vaquero/, 'denim'], [/azul|blue/, 'azul'],
];

const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const path = (u: URL) => plain(u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/+$/, ''));

export interface LinkRead { ok: boolean; item?: WardrobeItem; exact: boolean; store: string; guessed: { type: boolean; color: boolean }; error?: string }

function storeName(host: string): string {
  const h = host.replace(/^www\d*\./, '');
  const hit = Object.keys(STORES).find((d) => h === d || h.endsWith('.' + d));
  if (hit) return STORES[hit];
  const parts = h.split('.');
  const core = parts.length > 2 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2] ?? h;
  return core.charAt(0).toUpperCase() + core.slice(1);
}

/** Texto legible que lleva la dirección: el tramo con más palabras, sin códigos ni extensiones. */
function slugText(u: URL): string {
  const skip = /^(es|en|es-es|es_es|en-us|es-us|en_gb|shop|products?|p|pd|ropa|hombre|mujer|men|mens|women|collections?|item|items|dp|c|t|html|productpage|product-page|producto|articulo)$/i;
  const segs = u.pathname.split('/').map((s) => decodeURIComponent(s).replace(/\.(html?|php|aspx)$/i, '')).filter((s) => s && !skip.test(s));
  const best = segs.map((s) => s.replace(/[-_+.]+/g, ' ').trim()).sort((a, b) => b.replace(/[^a-záéíóúñ ]/gi, '').length - a.replace(/[^a-záéíóúñ ]/gi, '').length)[0] ?? '';
  return best.split(' ').filter((w) => !/^(p?\d{4,}|[a-z]{0,2}\d{3,}[a-z\d]*)$/i.test(w)).join(' ').replace(/\s+/g, ' ').trim();
}

export function readStoreLink(raw: string): LinkRead {
  const text = raw.trim();
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(text) ? text : 'https://' + text); } catch { return { ok: false, exact: false, store: '', guessed: { type: false, color: false }, error: 'No parece un enlace.' }; }
  if (!u.hostname.includes('.')) return { ok: false, exact: false, store: '', guessed: { type: false, color: false }, error: 'No parece un enlace.' };
  const store = storeName(u.hostname);
  const base = { id: uid('w'), seasons: [currentSeason()], addedAt: Date.now(), url: u.href };

  // ¿Es una prenda que ya conocemos? Entonces sus datos son los de la ficha, no una suposición.
  const here = path(u);
  const known = catalog.list().find((p) => { if (!p.url) return false; try { return path(new URL(p.url)) === here; } catch { return false; } });
  if (known) {
    return { ok: true, exact: true, store, guessed: { type: false, color: false },
      item: { ...base, name: known.name, type: known.type, brand: catalog.brands().find((b) => b.id === known.brandId)?.name ?? store, color: known.color, seasons: known.seasons, imageUrl: known.imageUrl, catalogId: known.id } };
  }

  const words = plain(slugText(u));
  const all = plain(decodeURIComponent(u.pathname + ' ' + u.search)).replace(/[-_+./=&?]+/g, ' ');
  const type = TYPES.find(([re]) => re.test(all))?.[1];
  const color = COLORS.find(([re]) => re.test(all))?.[1];
  const name = words ? words.charAt(0).toUpperCase() + words.slice(1) : '';
  return { ok: true, exact: false, store, guessed: { type: !!type, color: !!color },
    item: { ...base, name, type: type ?? 'tee', brand: store, color: color ?? 'negro' } };
}

/** Separa un texto pegado en enlaces (uno por línea o separados por espacios). */
export function splitLinks(text: string): string[] {
  return Array.from(new Set(text.split(/[\s,;]+/).map((s) => s.trim()).filter((s) => /\.[a-z]{2,}/i.test(s))));
}

export function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\d*\./, ''); } catch { return 'la tienda'; }
}

/** Con el título real de la ficha se afinan nombre, tipo y color (el título manda sobre la dirección). */
export function refineWithPreview(item: WardrobeItem, p: { title?: string; image?: string }, opts: { keepName?: boolean } = {}): WardrobeItem {
  const next = { ...item };
  if (p.image && !item.photo) next.imageUrl = item.imageUrl || p.image;
  if (p.title && !item.catalogId) {
    const t = plain(p.title);
    const type = TYPES.find(([re]) => re.test(t))?.[1];
    const color = COLORS.find(([re]) => re.test(t))?.[1];
    if (type) next.type = type;
    if (color) next.color = color;
    if (!opts.keepName) next.name = p.title.length > 70 ? p.title.slice(0, 70).trim() + '…' : p.title;
  }
  return next;
}

/** Dos enlaces son la misma prenda si coinciden tienda y ruta (sin parámetros ni barra final). */
export function sameLink(a: string, b: string): boolean {
  try { return path(new URL(a)) === path(new URL(b)); } catch { return a === b; }
}
