// Compartir un look: código en el hash de la URL (solo letras, dígitos y guiones) y texto resumen.
import type { Outfit, Piece, Prefs, StyleKey, WardrobeItem } from '@/domain/types';
import { catalog, resolveOutfit } from '@/services/catalog';
import { STYLES, styleName } from '@/data/demo/styles';
import { brandById } from '@/data/demo/brands';
import { colorName } from '@/data/demo/colors';
import { euro, rebuildOutfit, type EngineCtx } from './engine';

export function encodeLook(outfit: Outfit): string {
  const parts = outfit.pieces.filter((p) => !p.own).flatMap((p) => {
    const product = catalog.get(p.ref);
    if (!product) return [];
    return [`${p.ref}c${Math.max(0, product.colors.indexOf(p.color))}`];
  });
  return `look-${outfit.style}-${parts.join('-')}`;
}

export function decodeLook(code: string, prefs: Prefs, ctx: EngineCtx): Outfit | null {
  const m = code.match(/^look-([a-z0-9]+)-(.+)$/);
  if (!m) return null;
  const style = m[1] as StyleKey;
  if (!STYLES.some((s) => s.key === style)) return null;
  const pieces: Piece[] = m[2].split('-').flatMap((tok) => {
    const t = tok.match(/^([a-z]\d+)c(\d+)$/);
    const product = t ? catalog.get(t[1]) : undefined;
    if (!t || !product) return [];
    return [{ ref: product.id, own: false, color: product.colors[Number(t[2])] ?? product.color }];
  });
  if (pieces.length < 2) return null;
  const base: Outfit = {
    id: 'shared', name: 'Look compartido', style, pieces, description: '', occasion: prefs.occasion, season: prefs.season,
    total: 0, compat: 0, compatParts: [], reasons: [], backdrop: 0, createdAt: Date.now(), budget: 0, fromWardrobe: 0,
    basis: { styles: [style], favColors: prefs.favColors, boldness: prefs.boldness, formalityShift: 0 },
  };
  return rebuildOutfit(base, pieces, ctx);
}

export function lookSummary(outfit: Outfit, wardrobe: WardrobeItem[]): string {
  const lines = resolveOutfit(outfit.pieces, wardrobe).map(({ piece, product }) =>
    piece.own
      ? `· ${product.name} (ya la tengo)`
      : `· ${product.name}, ${brandById(product.brandId)?.name ?? ''}, ${(product.colorNames?.[0] ?? colorName(piece.color)).toLowerCase()}: ${euro(product.price)}${product.url ? `\n  ${product.url}` : ''}`);
  const anyDemo = outfit.pieces.some((p) => catalog.get(p.ref)?.demo);
  return [
    `${outfit.name} (${styleName(outfit.style)})`,
    outfit.description,
    '',
    ...lines,
    '',
    `Total: ${euro(outfit.total)}`,
    anyDemo ? 'Productos y precios de demostración, creados en Percha.' : 'Precios vistos el 16 nov 2026; compruébalos en cada enlace. Creado en Percha.',
  ].join('\n');
}
