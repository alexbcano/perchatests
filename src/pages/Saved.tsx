import { useMemo, useState } from 'react';
import { FolderPlus, Pencil, RotateCw, Trash2 } from 'lucide-react';
import type { Collection, Product } from '@/domain/types';
import { useApp } from '@/app/store';
import { createWith, go } from '@/app/router';
import { catalog, resolveOutfit, seenLabel } from '@/services/catalog';
import { brandById } from '@/data/demo/brands';
import { CATEGORY_LABEL, FIT_LABEL } from '@/domain/garments';
import { colorName } from '@/data/demo/colors';
import { euro } from '@/features/outfits/engine';
import { CONFIDENCE_LABEL, recommendSize } from '@/features/sizing/recommend';
import { LookImage, ProductThumb } from '@/ui/figure';
import { AVAIL, OutfitCard, ProductCard } from '@/ui/cards';
import { Button, ColorDot, Confirm, DemoTag, Empty, inputCls, PageHeader, Pill, Segmented, Sheet } from '@/ui/primitives';
import { RefWidth } from '@/ui/RefWidth';
import { CollectionSheet } from './OutfitDetail';

type Tab = 'looks' | 'prendas' | 'colecciones' | 'busquedas';

export function Saved() {
  const saved = useApp((s) => s.saved);
  const compare = useApp((s) => s.compare);
  const wardrobe = useApp((s) => s.wardrobe);
  const { patch, notify, toggleCompare } = useApp.getState();
  const [tab, setTab] = useState<Tab>('looks');
  const [product, setProduct] = useState<Product | null>(null);
  const [collectFor, setCollectFor] = useState<string | null>(null);
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [rename, setRename] = useState<Collection | null>(null);
  const [delCol, setDelCol] = useState<Collection | null>(null);
  const [clearHist, setClearHist] = useState(false);
  const [newName, setNewName] = useState('');
  const products = saved.productIds.map((id) => catalog.get(id)).filter(Boolean) as Product[];
  const col = saved.collections.find((c) => c.id === openCol) ?? null;

  return (
    <div>
      <PageHeader title="Guardados" />
      <Segmented label="Sección de guardados" value={tab} onChange={(t) => { setTab(t); setOpenCol(null); }} options={[
        { value: 'looks', label: withCount('Looks', saved.outfits.length) }, { value: 'prendas', label: withCount('Prendas', products.length) },
        { value: 'colecciones', label: withCount('Colecciones', saved.collections.length) }, { value: 'busquedas', label: 'Historial' },
      ]} />

      <div className="mt-6">
        {tab === 'looks' && (saved.outfits.length === 0
          ? <Empty title="Aún no has guardado ningún look" body="Pulsa el corazón de cualquier propuesta para tenerla aquí. Desde «Más acciones» en un look puedes compararlo con otros." action={<Button onClick={() => go('crear')}>Crear un outfit</Button>} />
          : (
            <div className="flex flex-col gap-4">
              {saved.outfits.length >= 2 && compare.length === 0 && <div><Button size="sm" variant="outline" onClick={() => saved.outfits.slice(0, 2).forEach((o) => toggleCompare(o))}>Comparar los dos más recientes</Button></div>}
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">{saved.outfits.map((o) => <OutfitCard key={o.id} outfit={o} />)}</div>
            </div>
          ))}

        {tab === 'prendas' && (products.length === 0
          ? <Empty title="Aún no has guardado prendas" body="Dentro de cada look puedes guardar piezas sueltas para decidir más tarde." action={<Button onClick={() => go('crear')}>Crear un outfit</Button>} />
          : <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{products.map((p) => <ProductCard key={p.id} product={p} onOpen={() => setProduct(p)} />)}</div>)}

        {tab === 'colecciones' && !col && (
          <div className="flex flex-col gap-5">
            <form className="flex max-w-md gap-2" onSubmit={(e) => {
              e.preventDefault();
              const n = newName.trim(); if (!n) return;
              patch('saved', (cur) => ({ ...cur, collections: [...cur.collections, { id: 'c' + Date.now().toString(36), name: n, outfitIds: [], productIds: [], createdAt: Date.now() }] }));
              setNewName(''); notify(`Colección «${n}» creada`);
            }}>
              <input id="col-name" className={inputCls} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la colección" aria-label="Nombre de la nueva colección" />
              <Button type="submit" disabled={!newName.trim()}><FolderPlus size={16} />Crear</Button>
            </form>
            {saved.collections.length === 0
              ? <Empty title="Organiza lo que guardas" body="Agrupa looks y prendas por viaje, temporada u ocasión. Por ejemplo: «Boda de junio» u «Oficina otoño»." />
              : (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {saved.collections.map((c) => {
                    const looks = c.outfitIds.map((id) => saved.outfits.find((o) => o.id === id)).filter(Boolean).slice(0, 3);
                    return (
                      <li key={c.id} className="flex flex-col gap-3 rounded-sm bg-surface p-4">
                        <button type="button" onClick={() => setOpenCol(c.id)} className="text-left">
                          <div className="grid h-36 grid-cols-3 gap-1 overflow-hidden rounded-sm bg-tile">
                            {looks.map((o) => <LookImage key={o!.id} items={resolveOutfit(o!.pieces, wardrobe)} backdrop={o!.backdrop} className="h-36 w-full" />)}
                          </div>
                          <h3 className="display mt-3 text-2xl leading-tight">{c.name}</h3>
                          <p className="mt-0.5 text-xs text-muted">{c.outfitIds.length} looks, {c.productIds.length} prendas</p>
                        </button>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setRename(c)}><Pencil size={14} />Renombrar</Button>
                          <Button size="sm" variant="ghost" onClick={() => setDelCol(c)}><Trash2 size={14} />Eliminar</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>
        )}

        {tab === 'colecciones' && col && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="ghost" onClick={() => setOpenCol(null)} className="-ml-2">Todas las colecciones</Button>
              <h2 className="display text-3xl">{col.name}</h2>
            </div>
            {col.outfitIds.length + col.productIds.length === 0 && <Empty title="Colección vacía" body="Abre un look o una prenda guardada y usa «Añadir a una colección»." />}
            {col.outfitIds.length > 0 && <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">{col.outfitIds.map((id) => saved.outfits.find((o) => o.id === id)).filter(Boolean).map((o) => <OutfitCard key={o!.id} outfit={o!} />)}</div>}
            {col.productIds.length > 0 && <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{col.productIds.map((id) => catalog.get(id)).filter(Boolean).map((p) => <ProductCard key={p!.id} product={p!} onOpen={() => setProduct(p!)} />)}</div>}
          </div>
        )}

        {tab === 'busquedas' && (saved.history.length === 0
          ? <Empty title="Sin búsquedas todavía" body="Cada vez que generes outfits guardaremos los criterios para que puedas repetirlos." action={<Button onClick={() => go('crear')}>Crear un outfit</Button>} />
          : (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {saved.history.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="text-sm font-medium first-letter:uppercase">{h.summary}</p>
                      {h.request.text && <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">«{h.request.text}»</p>}
                      <p className="tabular mt-0.5 text-xs text-muted">{new Date(h.at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}, {h.resultCount} propuestas</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => createWith(h.request)}><RotateCw size={14} />Repetir búsqueda</Button>
                  </li>
                ))}
              </ul>
              <div><Button size="sm" variant="ghost" onClick={() => setClearHist(true)}><Trash2 size={14} />Borrar historial</Button></div>
            </div>
          ))}
      </div>

      <ProductSheet product={product} onClose={() => setProduct(null)} onCollect={(id) => { setProduct(null); setCollectFor(id); }} />
      <CollectionSheet open={!!collectFor} onClose={() => setCollectFor(null)} productId={collectFor ?? undefined} />
      <RenameSheet value={rename} onClose={() => setRename(null)} />
      <Confirm open={!!delCol} title="Eliminar colección" body={`Se eliminará «${delCol?.name}». Los looks y prendas siguen guardados.`} action="Eliminar" onClose={() => setDelCol(null)}
        onConfirm={() => { patch('saved', (cur) => ({ ...cur, collections: cur.collections.filter((c) => c.id !== delCol!.id) })); notify('Colección eliminada'); }} />
      <Confirm open={clearHist} title="Borrar historial" body="Se borrarán todas las búsquedas anteriores." action="Borrar historial" onClose={() => setClearHist(false)}
        onConfirm={() => { patch('saved', (cur) => ({ ...cur, history: [] })); notify('Historial borrado'); }} />
    </div>
  );
}

function RenameSheet({ value, onClose }: { value: Collection | null; onClose: () => void }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState<string | null>(null);
  if (value && value.id !== key) { setKey(value.id); setName(value.name); }
  if (!value && key) setKey(null);
  const save = () => {
    const n = name.trim(); if (!n || !value) return;
    useApp.getState().patch('saved', (cur) => ({ ...cur, collections: cur.collections.map((c) => (c.id === value.id ? { ...c, name: n } : c)) }));
    useApp.getState().notify('Colección renombrada'); onClose();
  };
  return (
    <Sheet open={!!value} onClose={onClose} title="Renombrar colección" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!name.trim()}>Guardar nombre</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); save(); }}><input id="rename-col" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre de la colección" /></form>
    </Sheet>
  );
}

function ProductSheet({ product, onClose, onCollect }: { product: Product | null; onClose: () => void; onCollect: (id: string) => void }) {
  const profile = useApp((s) => s.profile);
  const rec = useMemo(() => (product ? recommendSize(product, profile.measures, profile.fitPreference) : null), [product, profile]);
  if (!product) return <Sheet open={false} onClose={onClose} title="">{null}</Sheet>;
  const brand = brandById(product.brandId);
  return (
    <Sheet open onClose={onClose} title={product.name} wide
      footer={<><Button variant="outline" onClick={() => onCollect(product.id)}><FolderPlus size={15} />Añadir a una colección</Button><Button variant="accent" onClick={() => { onClose(); createWith({ lockRefs: [product.id], styles: product.styles.slice(0, 2), source: 'catalog' }); }}>Crear un look con esta prenda</Button></>}>
      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <div className="aspect-square w-full overflow-hidden rounded-sm bg-tile"><ProductThumb product={product} className="h-full w-full" /></div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="flex flex-wrap items-center gap-2 text-muted">{CATEGORY_LABEL[product.category]}, {brand?.name}{product.demo && <DemoTag />}</p>
          <p className="tabular flex flex-wrap items-center gap-2"><span className="display text-3xl">{euro(product.price)}</span><Pill tone={AVAIL[product.availability].tone}>{AVAIL[product.availability].label}</Pill></p>
          <p className="text-[13px] text-muted">Tienda: {product.url ? <a href={product.url} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-2">{brand?.store}</a> : brand?.store}. Corte {FIT_LABEL[product.fit].toLowerCase()}.{product.seenAt && ` Precio visto el ${seenLabel(product.seenAt)}.`}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">{product.colors.map((c) => <span key={c} className="flex items-center gap-1.5"><ColorDot color={c} size={14} />{colorName(c)}</span>)}</div>
          <div className="flex flex-wrap gap-1.5">{product.sizes.map((s) => <span key={s.label} className={`tabular inline-flex h-7 min-w-[2.25rem] items-center justify-center rounded-sm border border-line px-2 text-xs ${s.inStock ? '' : 'text-muted line-through opacity-60'}`}>{s.label}</span>)}</div>
          {rec && (
            <div className="rounded-sm bg-tile p-3">
              <p className="flex flex-wrap items-center gap-2 font-medium">{rec.headline}{rec.status === 'ok' && <Pill tone={rec.confidence === 'alta' ? 'ok' : rec.confidence === 'media' ? 'warn' : 'bad'}>{CONFIDENCE_LABEL[rec.confidence]}</Pill>}</p>
              <p className="mt-1 text-[13px] leading-relaxed">{rec.detail}</p>
              {product?.garment && <RefWidth id={`ref-saved-${product.id}`} />}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

export function CompareBar() {
  const compare = useApp((s) => s.compare);
  const open = useApp((s) => s.open);
  const [show, setShow] = useState(false);
  const wardrobe = useApp((s) => s.wardrobe);
  const { clearCompare, toggleCompare, openOutfit } = useApp.getState();
  if (compare.length === 0) return null;
  const cheapest = Math.min(...compare.map((o) => o.total));
  const best = Math.max(...compare.map((o) => o.compat));
  const rows = compare.map((o) => ({ o, items: resolveOutfit(o.pieces, wardrobe) }));
  const cats = ['layer', 'top', 'bottom', 'shoes', 'accessory'] as const;
  return (
    <>
      {!show && (
        <div className={`fixed inset-x-0 z-[45] flex justify-center px-4 ${open ? 'bottom-5' : 'bottom-[88px] lg:bottom-5'}`}>
          <div className="anim-sheet flex items-center gap-2 rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-paper shadow-lift">
            <span className="text-[13px]">{compare.length} {compare.length === 1 ? 'look' : 'looks'} para comparar</span>
            <button type="button" onClick={() => setShow(true)} disabled={compare.length < 2} className="h-9 rounded-full bg-accent px-4 text-[13px] font-medium text-accent-ink disabled:opacity-50">{compare.length < 2 ? 'Añade otro' : 'Comparar'}</button>
            <button type="button" onClick={clearCompare} className="h-9 rounded-full px-3 text-[13px] hover:bg-paper/15">Vaciar</button>
          </div>
        </div>
      )}
      <Sheet open={show} onClose={() => setShow(false)} title="Comparar looks" wide>
        <div className="overflow-x-auto">
          <div className="grid min-w-[520px] gap-4" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
            {rows.map(({ o, items }) => (
              <div key={o.id} className="flex min-w-0 flex-col gap-3">
                <div className="aspect-[3/4] overflow-hidden rounded-sm"><LookImage items={items} backdrop={o.backdrop} className="h-full w-full" /></div>
                <h3 className="display text-2xl leading-tight">{o.name}</h3>
                <dl className="tabular flex flex-col gap-1.5 text-[13px]">
                  <div className="flex justify-between gap-2"><dt className="text-muted">Total</dt><dd className="flex items-center gap-1.5 font-medium">{euro(o.total)}{o.total === cheapest && rows.length > 1 && <Pill tone="ok">Más barato</Pill>}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted">Compatibilidad</dt><dd className="flex items-center gap-1.5 font-medium">{o.compat} %{o.compat === best && rows.length > 1 && <Pill tone="ok">Más afín</Pill>}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted">Prendas</dt><dd>{items.length}{o.fromWardrobe > 0 && `, ${o.fromWardrobe} tuyas`}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-muted">Formalidad</dt><dd>{(items.reduce((a, i) => a + i.product.formality, 0) / Math.max(1, items.length)).toFixed(1).replace('.', ',')} de 5</dd></div>
                </dl>
                <ul className="flex flex-col gap-1.5 border-t border-line pt-3 text-xs">
                  {cats.flatMap((c) => items.filter((i) => i.product.category === c)).map((i) => (
                    <li key={i.piece.ref} className="flex items-start justify-between gap-2"><span className="flex min-w-0 items-start gap-1.5"><span className="mt-0.5"><ColorDot color={i.piece.color} size={11} /></span>{i.product.name}</span><span className="tabular shrink-0 text-muted">{i.piece.own ? 'tuya' : euro(i.product.price)}</span></li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setShow(false); openOutfit(o); }}>Abrir</Button>
                  <Button size="sm" variant="ghost" onClick={() => { toggleCompare(o); if (compare.length <= 2) setShow(false); }}>Quitar</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Sheet>
    </>
  );
}

/** El número solo se enseña cuando hay algo, para que las pestañas quepan en el móvil. */
const withCount = (label: string, n: number) => (n ? `${label} (${n})` : label);
