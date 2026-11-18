import { Heart, Columns2, Shirt } from 'lucide-react';
import type { Outfit, Product } from '@/domain/types';
import { useApp } from '@/app/store';
import { resolveOutfit, seenLabel } from '@/services/catalog';
import { styleName } from '@/data/demo/styles';
import { brandById } from '@/data/demo/brands';
import { euro } from '@/features/outfits/engine';
import { LookImage, ProductThumb, useLookHasPhotos } from './figure';
import { cx, DemoTag, IconButton, Pill } from './primitives';

export const ConceptTag = ({ className, photos }: { className?: string; photos?: boolean }) => photos ? null : (
  <span className={cx('rounded-full bg-surface/85 px-2 py-0.5 text-[10px] font-medium text-ink backdrop-blur', className)} title={photos ? 'Fotos de cada prenda, de la web de su tienda' : 'Dibujo generado a partir de las prendas del look. No es una fotografía de los productos.'}>
    {photos ? 'Fotos de tienda' : 'Ilustración conceptual'}
  </span>
);

export function OutfitCard({ outfit, size = 'md' }: { outfit: Outfit; size?: 'sm' | 'md' }) {
  const wardrobe = useApp((s) => s.wardrobe);
  const saved = useApp((s) => s.saved.outfits.some((o) => o.id === outfit.id));
  const comparing = useApp((s) => s.compare.some((o) => o.id === outfit.id));
  const { openOutfit, toggleSaveOutfit, toggleCompare } = useApp.getState();
  const items = resolveOutfit(outfit.pieces, wardrobe);
  const hasPhotos = useLookHasPhotos(items);
  return (
    <article className="group relative flex min-w-0 flex-col">
      <button type="button" onClick={() => openOutfit(outfit)} className="relative block aspect-[3/4] w-full overflow-hidden rounded-sm bg-tile text-left" aria-label={`Abrir ${outfit.name}`}>
        <LookImage items={items} backdrop={outfit.backdrop} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" label={`Ilustración conceptual de ${outfit.name}`} />
        <ConceptTag photos={hasPhotos} className="absolute bottom-2 left-2" />
      </button>
      <div className="absolute right-2 top-2 flex flex-col gap-1.5">
        <IconButton label={saved ? 'Quitar de guardados' : 'Guardar look'} active={saved} onClick={() => toggleSaveOutfit(outfit)}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></IconButton>
        {comparing && <IconButton label="Quitar de la comparación" active onClick={() => toggleCompare(outfit)}><Columns2 size={17} /></IconButton>}
      </div>
      <button type="button" onClick={() => openOutfit(outfit)} className="mt-3 flex flex-col items-start gap-0.5 text-left">
        <span className={cx('display leading-tight', size === 'sm' ? 'text-lg' : 'text-[1.4rem]')}>{outfit.name}</span>
        <span className="tabular flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
          <span>{outfit.total ? euro(outfit.total) : 'Sin compras'}</span>
          {outfit.fromWardrobe > 0 && <span className="inline-flex items-center gap-1"><Shirt size={12} />{outfit.fromWardrobe} tuya{outfit.fromWardrobe > 1 ? 's' : ''}</span>}
        </span>
      </button>
    </article>
  );
}

export const AVAIL: Record<Product['availability'], { label: string; tone: 'ok' | 'warn' | 'bad' | 'neutral' }> = {
  consultar: { label: 'Existencias: ver en tienda', tone: 'neutral' },
  disponible: { label: 'Disponible', tone: 'ok' },
  pocas: { label: 'Pocas unidades', tone: 'warn' },
  agotado: { label: 'Agotado', tone: 'bad' },
};

export function ProductCard({ product, onOpen }: { product: Product; onOpen?: () => void }) {
  const saved = useApp((s) => s.saved.productIds.includes(product.id));
  const brand = brandById(product.brandId);
  return (
    <article className="relative flex min-w-0 flex-col">
      <button type="button" onClick={onOpen} className="block aspect-square w-full overflow-hidden rounded-sm bg-tile" aria-label={product.name}>
        <ProductThumb product={product} className="h-full w-full" />
      </button>
      <IconButton label={saved ? 'Quitar de favoritos' : 'Guardar prenda'} active={saved} onClick={() => useApp.getState().toggleSaveProduct(product.id)} className="absolute right-2 top-2">
        <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
      </IconButton>
      <div className="mt-2.5 flex flex-col gap-1">
        <span className="text-sm font-medium leading-snug">{product.name}</span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">{brand?.name}{product.demo ? <DemoTag /> : product.seenAt && <span>visto el {seenLabel(product.seenAt)}</span>}</span>
        <span className="tabular flex flex-wrap items-center gap-2 text-[13px]"><span className="font-medium">{euro(product.price)}</span><Pill tone={AVAIL[product.availability].tone}>{AVAIL[product.availability].label}</Pill></span>
      </div>
    </article>
  );
}
