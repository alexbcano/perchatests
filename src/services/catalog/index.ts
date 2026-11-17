// Capa de catálogo. La interfaz es la misma para el catálogo real y para el de demostración.
// Cambiar de proveedor no toca la UI ni el motor.
import type { Brand, Piece, Product, StyleKey, WardrobeItem } from '@/domain/types';
import { categoryOf } from '@/domain/garments';
import { BRANDS } from '@/data/demo/brands';
import { CATALOG } from '@/data/demo/catalog';
import { REAL_BRANDS, REAL_SEEN_AT } from '@/data/real/brands';
import { REAL_CATALOG } from '@/data/real/catalog';

export type CatalogMode = 'real' | 'demo';

export interface CatalogProvider {
  id: CatalogMode;
  label: string;
  /** true = datos simulados; la interfaz lo señala en cada producto */
  isDemo: boolean;
  /** fecha de lectura de precios (solo catálogo real) */
  seenAt?: string;
  list(): Product[];
  brands(): Brand[];
}

const PROVIDERS: Record<CatalogMode, CatalogProvider> = {
  // Productos leídos a mano en las webs de las tiendas. No se actualizan solos:
  // en producción este proveedor llamaría a un backend con feeds o APIs de tienda.
  real: { id: 'real', label: 'Tiendas reales', isDemo: false, seenAt: REAL_SEEN_AT, list: () => REAL_CATALOG, brands: () => REAL_BRANDS },
  demo: { id: 'demo', label: 'Catálogo de demostración', isDemo: true, list: () => CATALOG, brands: () => BRANDS },
};

let mode: CatalogMode = 'real';
export function setCatalogMode(m: CatalogMode) { mode = PROVIDERS[m] ? m : 'real'; }

const ALL = [...REAL_CATALOG, ...CATALOG];
export const catalog = {
  get id() { return PROVIDERS[mode].id; },
  get label() { return PROVIDERS[mode].label; },
  get isDemo() { return PROVIDERS[mode].isDemo; },
  get seenAt() { return PROVIDERS[mode].seenAt; },
  list: () => PROVIDERS[mode].list(),
  brands: () => PROVIDERS[mode].brands(),
  /** Busca en ambos catálogos para que los looks guardados sigan abriéndose al cambiar de modo. */
  get: (id: string) => ALL.find((p) => p.id === id),
};

export function seenLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 2);

/** Convierte una prenda del armario en un «producto» para que el motor pueda combinarla. */
export function wardrobeToProduct(item: WardrobeItem): Product {
  const same = ALL.filter((p) => p.type === item.type);
  const styles = Array.from(new Set(same.flatMap((p) => p.styles))) as StyleKey[];
  return {
    id: item.id, demo: false, own: true, name: item.name, brandId: item.brand || 'propia', category: categoryOf(item.type), type: item.type,
    color: item.color, colors: [item.color], price: 0, fit: 'regular', styles, seasons: item.seasons,
    formality: avg(same.map((p) => p.formality)), boldness: avg(same.map((p) => p.boldness)), warmth: avg(same.map((p) => p.warmth)),
    sizes: [], availability: 'disponible', markets: ['ES', 'UE', 'INT'], url: item.url ?? null, photo: item.photo, imageUrl: item.imageUrl,
  };
}

export function resolvePiece(piece: Piece, wardrobe: WardrobeItem[]): Product | undefined {
  if (piece.own) {
    const item = wardrobe.find((w) => w.id === piece.ref);
    return item ? wardrobeToProduct(item) : undefined;
  }
  return catalog.get(piece.ref);
}

export function resolveOutfit(pieces: Piece[], wardrobe: WardrobeItem[]): { piece: Piece; product: Product }[] {
  return pieces.flatMap((piece) => {
    const product = resolvePiece(piece, wardrobe);
    return product ? [{ piece, product }] : [];
  });
}
