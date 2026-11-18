// Sección «Me falta esto» de Mi armario.
import { useEffect, useState } from 'react';
import { ExternalLink, Heart, Shirt } from 'lucide-react';
import { useApp } from '@/app/store';
import { CATEGORY_LABEL, seasonLabel } from '@/domain/garments';
import { brandById } from '@/data/demo/brands';
import { euro } from '@/features/outfits/engine';
import { analyzeGaps, exampleOutfit, type GapReport } from '@/features/wardrobe/gaps';
import { ProductThumb } from '@/ui/figure';
import { Button, IconButton, Notice } from '@/ui/primitives';

const ARTICLE: Record<string, string> = { top: 'una parte de arriba', bottom: 'una parte de abajo', shoes: 'calzado' };

export function WardrobeGaps() {
  const wardrobe = useApp((s) => s.wardrobe);
  const prefs = useApp((s) => s.prefsSlice.prefs);
  const mode = useApp((s) => s.prefsSlice.catalogMode);
  const profile = useApp((s) => s.profile);
  const saved = useApp((s) => s.saved.productIds);
  const [report, setReport] = useState<GapReport | null>(null);
  const [all, setAll] = useState(false);

  // El cálculo recorre muchas combinaciones: se hace fuera del primer pintado para no bloquear la pantalla.
  useEffect(() => {
    setReport(null);
    const t = setTimeout(() => setReport(analyzeGaps(wardrobe, prefs, profile)), 30);
    return () => clearTimeout(t);
  }, [wardrobe, prefs, profile, mode]);

  if (wardrobe.length === 0) return null;
  return (
    <section className="mt-6" aria-labelledby="gaps-h">
      <h2 id="gaps-h" className="display text-2xl">Me falta esto</h2>
      {!report ? (
        <p className="mt-1 text-[13px] text-muted">Mirando qué combina con tu armario…</p>
      ) : (
        <>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
            {report.missing.length
              ? `Para ${seasonLabel(report.season).toLowerCase()} aún no sale ningún look completo con tu armario.`
              : `Con tu armario salen ${report.baseline} ${report.baseline === 1 ? 'look' : 'looks'} buenos para ${seasonLabel(report.season).toLowerCase()}.`}{' '}
            {report.picks.length > 0 && 'Esto es lo que más looks nuevos te daría.'}
          </p>
          {report.missing.length > 0 && (
            <div className="mt-3"><Notice>Te falta {report.missing.map((c) => ARTICLE[c] ?? CATEGORY_LABEL[c].toLowerCase()).join(' y ')} para {seasonLabel(report.season).toLowerCase()}. Si ya tienes alguna prenda así, añádela al armario; si no, aquí van ideas.</Notice></div>
          )}
          {report.picks.length === 0 ? (
            <p className="mt-3 text-[13px]">No hemos encontrado ninguna prenda del catálogo que sume looks buenos con lo que tienes y tus gustos. Prueba a añadir más prendas o a ampliar estilos en Mi perfil.</p>
          ) : (
            <ul className="-mx-6 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
              {report.picks.slice(0, all ? 6 : 3).map((pk) => {
                const brand = brandById(pk.product.brandId);
                const isSaved = saved.includes(pk.product.id);
                return (
                  <li key={pk.product.id} className="relative flex w-[78%] shrink-0 snap-start flex-col rounded-sm bg-surface p-4 sm:w-auto">
                    <IconButton label={isSaved ? 'Quitar de guardados' : 'Guardar prenda'} active={isSaved} className="absolute right-3 top-3 h-8 w-8" onClick={() => useApp.getState().toggleSaveProduct(pk.product.id)}><Heart size={14} fill={isSaved ? 'currentColor' : 'none'} /></IconButton>
                    <div className="flex gap-3 pr-8">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-tile"><ProductThumb product={pk.product} className="h-full w-full" /></div>
                      <div className="min-w-0">
                        <p className="display text-3xl leading-none">+{pk.gain}</p>
                        <p className="mt-1 text-xs text-muted">{pk.gain === 1 ? 'look nuevo' : 'looks nuevos'} con tu armario</p>
                        {pk.fillsEmpty && <p className="mt-1 text-xs font-medium">Completa tu armario</p>}
                      </div>
                    </div>
                    <p className="mt-3 text-2xs text-muted">{brand?.name} · {euro(pk.product.price)}</p>
                    <p className="mt-0.5 text-sm font-medium leading-snug">{pk.product.name}</p>
                    {pk.partners.length > 0 && (
                      <p className="mt-2 text-xs leading-relaxed text-muted">Va con tu {joinEs(pk.partners.slice(0, 2).map((x) => x.item.name.toLowerCase()))}.</p>
                    )}
                    <div className="mt-auto flex flex-wrap gap-2 pt-3">
                      <Button size="sm" onClick={() => useApp.getState().openOutfit(exampleOutfit(pk, prefs, { profile, wardrobe, referents: [] }))}><Shirt size={14} />Ver un look</Button>
                      {pk.product.url && <a href={pk.product.url} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-2.5 text-xs font-medium"><ExternalLink size={13} />{brand?.store ?? 'Tienda'}</a>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {report.picks.length > 3 && <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 text-[13px] font-medium underline underline-offset-4">{all ? 'Ver menos' : `Ver ${report.picks.length - 3} más`}</button>}
        </>
      )}
    </section>
  );
}

function joinEs(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? '';
  return `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;
}
