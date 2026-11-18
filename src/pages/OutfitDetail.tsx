import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Heart, Share2, Columns2, ChevronDown, MoreHorizontal, ExternalLink, Repeat2, Trash2, Sparkles, Minus, Plus, FolderPlus, Pin, Copy, Check, Wand2 } from 'lucide-react';
import type { ColorKey, Outfit, Piece, Product } from '@/domain/types';
import { useApp, uid } from '@/app/store';
import { catalog, resolveOutfit, seenLabel } from '@/services/catalog';
import { styleName } from '@/data/demo/styles';
import { brandById } from '@/data/demo/brands';
import { colorName } from '@/data/demo/colors';
import { CATEGORY_LABEL, FIT_LABEL, occasionLabel, seasonLabel } from '@/domain/garments';
import { euro, generateOutfits, harmony, rebuildOutfit } from '@/features/outfits/engine';
import { addPiece, applySwap, buildAdvice, removePiece, type Swap } from '@/features/outfits/styling';
import { encodeLook, lookSummary } from '@/features/outfits/share';
import { CONFIDENCE_LABEL, recommendSize } from '@/features/sizing/recommend';
import { askStylist, getStylistAI } from '@/services/ai';
import { photoTryOn } from '@/services/tryon';
import { fmtLen } from '@/domain/units';
import { FigureSvg, LookImage, OutfitCover, ProductThumb, useLookHasPhotos, type Resolved } from '@/ui/figure';
import { dimsFromMeasures } from '@/ui/figure/geometry';
import { AVAIL, ConceptTag, OutfitCard } from '@/ui/cards';
import { Button, ColorDot, cx, DemoTag, IconButton, Meter, Notice, Pill, Segmented, Sheet } from '@/ui/primitives';
import { RefWidth } from '@/ui/RefWidth';

type Tab = 'porque' | 'probador' | 'consejos';

export function OutfitDetail() {
  const outfit = useApp((s) => s.open)!;
  const wardrobe = useApp((s) => s.wardrobe);
  const saved = useApp((s) => s.saved.outfits.some((o) => o.id === outfit.id));
  const comparing = useApp((s) => s.compare.some((o) => o.id === outfit.id));
  const { openOutfit, toggleSaveOutfit, toggleCompare } = useApp.getState();
  const [share, setShare] = useState(false);
  const [collect, setCollect] = useState(false);
  const [more, setMore] = useState(false);
  const [section, setSection] = useState<Tab | null>(null);
  const items = useMemo(() => resolveOutfit(outfit.pieces, wardrobe), [outfit, wardrobe]);
  const hasPhotos = useLookHasPhotos(items);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); setSection(null); }, [outfit.name, outfit.style]);
  const buyCount = items.filter((i) => !i.piece.own).length;
  const real = items.some((i) => !i.product.demo && !i.piece.own);

  return (
    <div ref={scroller} className="anim-fade fixed inset-0 z-40 overflow-y-auto bg-paper">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-paper/90 px-6 py-2.5 backdrop-blur sm:px-8">
        <Button variant="ghost" size="sm" onClick={() => openOutfit(null)} className="-ml-2"><ArrowLeft size={17} />Volver</Button>
        <div className="flex items-center gap-1.5">
          <IconButton label="Más acciones" onClick={() => setMore(true)}><MoreHorizontal size={18} /></IconButton>
          <IconButton label="Compartir look" onClick={() => setShare(true)}><Share2 size={17} /></IconButton>
          <Button size="sm" variant={saved ? 'primary' : 'outline'} onClick={() => toggleSaveOutfit(outfit)}><Heart size={15} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Guardado' : 'Guardar'}</Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-6 px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-sm lg:max-w-none">
            <LookImage items={items} backdrop={outfit.backdrop} className="anim-cover h-full w-full" label={`Imagen de ${outfit.name}`} />
            <ConceptTag photos={hasPhotos} className="absolute bottom-3 left-3" />
            {outfit.total > 0 && <span className="sticker tabular absolute bottom-4 right-4 text-lg">{euro(outfit.total)}</span>}
          </div>
        </div>

        <div className="min-w-0">
          <h1 className="display text-[2.5rem] leading-none sm:text-6xl">{outfit.name}</h1>
          <p className="tabular mt-3 text-sm text-muted">
            {buyCount > 0 ? <><span className="font-medium text-ink">{euro(outfit.total)}</span> · {buyCount} {buyCount === 1 ? 'prenda por comprar' : 'prendas por comprar'}</> : 'Todo de tu armario'}
          </p>

          <div className="mt-5"><PiecesTab outfit={outfit} items={items} /></div>

          <div className="mt-8 border-t border-line">
            {([
              ['porque', 'Por qué te lo recomendamos'],
              ['consejos', 'Consejos y variaciones'],
              ['probador', 'Probador'],
            ] as [Tab, string][]).map(([key, label]) => (
              <div key={key} className="border-b border-line">
                <button type="button" onClick={() => setSection(section === key ? null : key)} aria-expanded={section === key} className="flex w-full items-center justify-between py-4 text-left text-[15px] font-medium">
                  {label}<ChevronDown size={18} className={cx('text-muted transition-transform', section === key && 'rotate-180')} />
                </button>
                {section === key && (
                  <div className="anim-fade pb-6">
                    {key === 'porque' && <WhySection outfit={outfit} />}
                    {key === 'consejos' && <AdviceTab outfit={outfit} />}
                    {key === 'probador' && <TryOnTab outfit={outfit} items={items} />}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mt-6 text-2xs leading-relaxed text-muted">
            {real ? `Precios vistos el ${seenLabel(catalog.seenAt ?? items.find((i) => i.product.seenAt)?.product.seenAt)}; el vigente es el de cada tienda. ` : ''}
            {items.some((i) => i.product.demo) ? 'Incluye productos de demostración. ' : ''}
            {hasPhotos ? 'Fotos de cada prenda tomadas de su tienda.' : 'Dibujo orientativo, no es una foto de los productos.'}
          </p>
        </div>
      </div>
      <ShareSheet open={share} onClose={() => setShare(false)} outfit={outfit} />
      <CollectionSheet open={collect} onClose={() => setCollect(false)} outfit={outfit} />
      <Sheet open={more} onClose={() => setMore(false)} title="Más acciones">
        <div className="flex flex-col gap-2">
          <Button variant="outline" block onClick={() => { setMore(false); setCollect(true); }}><FolderPlus size={16} />Añadir a una colección</Button>
          <Button variant="outline" block onClick={() => { toggleCompare(outfit); setMore(false); }}><Columns2 size={16} />{comparing ? 'Quitar de la comparación' : 'Comparar con otro look'}</Button>
        </div>
      </Sheet>
    </div>
  );
}

function WhySection({ outfit }: { outfit: Outfit }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] leading-relaxed">{outfit.description}</p>
      <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
        {outfit.reasons.map((r, i) => <li key={i} className="flex gap-2.5"><span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />{r}</li>)}
      </ul>
      <div>
        <p className="tabular text-sm"><span className="font-medium">{outfit.compat} %</span> de compatibilidad contigo · {styleName(outfit.style)} · {occasionLabel(outfit.occasion)} · {seasonLabel(outfit.season)}</p>
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {outfit.compatParts.map((p) => (
            <div key={p.key} className="flex flex-col gap-1.5">
              <div className="tabular flex justify-between text-xs"><span>{p.label}</span><span>{Math.round(p.score * 100)} %</span></div>
              <Meter value={p.score} tone={p.score >= 0.8 ? 'ok' : p.score >= 0.55 ? 'ink' : 'warn'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── Prendas ─────────────────────────
function PiecesTab({ outfit, items }: { outfit: Outfit; items: Resolved[] }) {
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [swapFor, setSwapFor] = useState<Resolved | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {items.map((it) => (
          <PieceRow key={it.piece.ref} outfit={outfit} item={it} open={openRef === it.piece.ref} onToggle={() => setOpenRef(openRef === it.piece.ref ? null : it.piece.ref)} onSwap={() => setSwapFor(it)} canRemove={items.length > 2} />
        ))}
      </ul>
      <div><Button variant="ghost" size="sm" className="-ml-2" onClick={() => setAddOpen(true)}><Plus size={15} />Añadir una prenda o accesorio</Button></div>
      <SwapSheet outfit={outfit} target={swapFor} onClose={() => setSwapFor(null)} />
      <SwapSheet outfit={outfit} target={null} adding={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function PieceRow({ outfit, item, open, onToggle, onSwap, canRemove }: { outfit: Outfit; item: Resolved; open: boolean; onToggle: () => void; onSwap: () => void; canRemove: boolean }) {
  const { piece, product } = item;
  const profile = useApp((s) => s.profile);
  const savedProduct = useApp((s) => s.saved.productIds.includes(product.id));
  const [table, setTable] = useState(false);
  const [store, setStore] = useState(false);
  const brand = brandById(product.brandId);
  const rec = useMemo(() => (piece.own ? null : recommendSize(product, profile.measures, profile.fitPreference)), [product, profile, piece.own]);
  const ctx = useApp.getState().ctx;
  const setColor = (c: ColorKey) => useApp.getState().updateOpen(rebuildOutfit(outfit, outfit.pieces.map((p) => (p.ref === piece.ref ? { ...p, color: c } : p)), ctx()));
  const confTone = rec?.confidence === 'alta' ? 'ok' : rec?.confidence === 'media' ? 'warn' : 'bad';
  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3.5 py-3 text-left">
        <span className="block h-[76px] w-[76px] shrink-0 overflow-hidden rounded-sm bg-tile"><ProductThumb product={product} color={piece.color} className="h-full w-full" /></span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium leading-snug">{product.name}</span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            {piece.own ? <Pill tone="accent">De tu armario</Pill> : <>{brand?.name}{product.demo && <DemoTag />}</>}
            {rec && rec.status === 'ok' && <Pill tone={confTone}>Talla {rec.size}</Pill>}
            {rec && rec.status === 'insufficient' && <Pill tone="bad">Faltan medidas</Pill>}
            {rec && rec.status === 'nochart' && <Pill>Talla: ver guía</Pill>}
          </span>
        </span>
        <span className="tabular shrink-0 text-sm font-medium">{piece.own ? 'Ya la tienes' : euro(product.price)}</span>
        <ChevronDown size={17} className={cx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="anim-fade flex flex-col gap-4 pb-5">
          {!piece.own && product.availability !== 'consultar' && product.availability !== 'disponible' && <p><Pill tone={AVAIL[product.availability].tone}>{AVAIL[product.availability].label}</Pill></p>}
          {!piece.own && product.colors.length > 1 && (
            <div>
              <p className="text-2xs text-muted">Color: <span className="text-ink">{colorName(piece.color)}</span></p>
              {product.colorNames && <p className="mt-1 text-xs">En la tienda: {product.colorNames.join(', ')}.</p>}
              <div className="mt-2 flex flex-wrap gap-2.5">
                {product.colors.map((c) => <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Ver en ${colorName(c)}`} aria-pressed={c === piece.color}><ColorDot color={c} size={24} ring={c === piece.color} /></button>)}
              </div>
            </div>
          )}
          {!piece.own && product.sizes.length > 0 && !rec?.chart && (
            <div>
              <p className="text-2xs text-muted">{product.demo ? 'Tallas disponibles' : 'Tallas del modelo (existencias al día: en la ficha)'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.sizes.map((s) => {
                  const recd = rec?.size?.split(' ')[0] === s.label;
                  return <span key={s.label} className={cx('tabular inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-sm border px-2 text-xs', recd ? 'border-accent bg-accent text-accent-ink' : s.inStock ? 'border-line' : 'border-line text-muted line-through opacity-60')} title={s.inStock ? (recd ? 'Tu talla recomendada' : 'Disponible') : 'Sin existencias'}>{s.label}</span>;
                })}
              </div>
            </div>
          )}
          {rec && (
            <div className="rounded-sm bg-surface p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <h3 className="text-[15px] font-semibold">{rec.headline}</h3>
                {(rec.status === 'ok' || rec.status === 'insufficient') && <Pill tone={confTone}>{CONFIDENCE_LABEL[rec.confidence]}</Pill>}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed">{rec.detail}</p>
              {product.garment && <RefWidth id={`ref-${piece.ref}`} />}
              {rec.alt && <p className="mt-2 text-[13px]"><strong>O la {rec.alt.size}.</strong> {rec.alt.why}</p>}
              {rec.missing.length > 0 && (
                <p className="mt-2 text-xs text-warn">Para afinar falta: {rec.missing.join(', ').toLowerCase()}. <button type="button" className="underline underline-offset-2" onClick={() => { useApp.getState().openOutfit(null); window.location.hash = 'perfil'; }}>Completar en Mi perfil</button></p>
              )}
              {rec.stockWarning && <p className="mt-2 text-xs text-warn">{rec.stockWarning}</p>}
              {(rec.chart || (rec.measures.length > 0 && rec.status === 'ok') || rec.margins.length > 0) && (
                <div className="mt-3">
                  <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="inline-flex items-center gap-1 text-xs font-medium underline decoration-line underline-offset-4">Ver detalles{rec.chart ? ' y tabla' : ''}<ChevronDown size={13} className={cx('transition-transform', table && 'rotate-180')} /></button>
                  {table && (
                    <div className="anim-fade mt-3 flex flex-col gap-3">
                      {rec.status !== 'onesize' && <p className="text-xs text-muted">Corte {FIT_LABEL[rec.fit].toLowerCase()}.{rec.brandNote && rec.status === 'ok' ? ` ${rec.brandNote}` : ''}</p>}
                      {rec.measures.length > 0 && rec.status === 'ok' && !product.garment && (
                        <table className="tabular w-full text-left text-xs">
                          <thead><tr className="text-muted"><th className="py-1 font-normal">Medida</th><th className="py-1 font-normal">Tú</th><th className="py-1 font-normal">Rango de la talla</th><th className="py-1 font-normal" /></tr></thead>
                          <tbody>
                            {rec.measures.map((m) => (
                              <tr key={m.label} className="border-t border-line">
                                <td className="py-1.5">{m.label}</td><td>{m.user == null ? <span className="text-muted">sin dato</span> : fmtLen(m.user, profile.units)}</td><td>{m.range} cm</td>
                                <td className="text-right">{m.inRange == null ? <Pill>Sin comprobar</Pill> : m.inRange ? <Pill tone="ok">Encaja</Pill> : <Pill tone="warn">Fuera de rango</Pill>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                      {rec.margins.map((m) => <p key={m.label} className="tabular text-xs text-muted">Margen de ajuste: {m.label.toLowerCase()} de unos {m.cm} cm.</p>)}
                      {rec.chart && (
                        <div className="overflow-x-auto">
                          <p className="mb-1.5 flex flex-wrap items-center gap-2 text-2xs text-muted">{rec.chart.title} {product.demo ? <DemoTag label="Tabla de ejemplo" /> : rec.chart.sourceUrl && <a href={rec.chart.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{product.garment && !chartOfficialBody(rec) ? 'Fuente: ficha de la tienda' : 'Fuente: guía oficial'}</a>}</p>
                          {rec.chart.note && <p className="mb-1.5 text-2xs text-muted">{rec.chart.note}</p>}
                          <table className="tabular w-full min-w-[320px] text-left text-xs">
                            <thead><tr className="text-muted"><th className="py-1 pr-3 font-normal">Talla</th>{rec.chart.columns.map((c) => <th key={c} className="py-1 pr-3 font-normal">{c}</th>)}</tr></thead>
                            <tbody>{rec.chart.rows.map((r) => (
                              <tr key={r.size} className={cx('border-t border-line', r.recommended && 'bg-accent-soft font-medium')}>
                                <td className="py-1.5 pl-1 pr-3">{r.size}{!r.inStock && product.demo && <span className="font-normal text-muted"> (agotada)</span>}</td>{r.cells.map((c, i) => <td key={i} className="pr-3">{c}</td>)}
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {!piece.own && (product.url
              ? <a href={product.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-sm bg-accent px-3 text-[13px] font-medium text-accent-ink"><ExternalLink size={14} />Ver en {brand?.store}</a>
              : <Button size="sm" onClick={() => setStore(true)}><ExternalLink size={14} />Ver en tienda</Button>)}
            {piece.own && product.url && <a href={product.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full border-[1.5px] border-ink px-3 text-[13px] font-medium"><ExternalLink size={14} />Ver donde la compré</a>}
            {!piece.own && <Button size="sm" variant="outline" onClick={() => useApp.getState().toggleSaveProduct(product.id)}><Heart size={14} fill={savedProduct ? 'currentColor' : 'none'} />{savedProduct ? 'Prenda guardada' : 'Guardar prenda'}</Button>}
            <Button size="sm" variant="outline" onClick={onSwap}><Repeat2 size={14} />Cambiar prenda</Button>
            {canRemove && product.category !== 'top' && product.category !== 'bottom' && <Button size="sm" variant="ghost" onClick={() => useApp.getState().updateOpen(removePiece(outfit, piece.ref, ctx()))}><Trash2 size={14} />Quitar</Button>}
          </div>
          <Sheet open={store} onClose={() => setStore(false)} title="Enlace a tienda no disponible" footer={<Button onClick={() => setStore(false)}>Entendido</Button>}>
            <p className="text-sm leading-relaxed">«{product.name}» es un <strong>producto de demostración</strong> de la marca ficticia {brand?.name}. No existe una ficha real a la que enlazar.</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">Cuando se conecte un catálogo real (Fase 2), este botón abrirá la página del producto en la tienda, con precio y existencias actualizados.</p>
          </Sheet>
        </div>
      )}
    </li>
  );
}

function SwapSheet({ outfit, target, adding, onClose }: { outfit: Outfit; target: Resolved | null; adding?: boolean; onClose: () => void }) {
  const wardrobe = useApp((s) => s.wardrobe);
  const ctx = useApp.getState().ctx;
  const open = !!target || !!adding;
  const options = useMemo(() => {
    if (!open) return [];
    const current = resolveOutfit(outfit.pieces, wardrobe);
    const rest = current.filter((i) => i.piece.ref !== target?.piece.ref && i.product.category !== 'accessory').map((i) => i.piece.color);
    const inLook = new Set(current.map((i) => i.product.id));
    const hasLayer = current.some((i) => i.product.category === 'layer');
    const own = ctx().wardrobe.map((w) => resolveOutfit([{ ref: w.id, own: true, color: w.color }], wardrobe)[0]).filter(Boolean).map((r) => r.product);
    return [...own, ...catalog.list()]
      .filter((p) => !inLook.has(p.id) && p.availability !== 'agotado' && p.seasons.includes(outfit.season))
      .filter((p) => (target ? p.category === target.product.category : p.category === 'accessory' || (p.category === 'layer' && !hasLayer)))
      .map((p) => {
        const color = [...p.colors].sort((a, b) => harmony([...rest, b]) - harmony([...rest, a]))[0];
        return { p, color, score: (p.styles.includes(outfit.style) ? 1 : 0) + harmony([...rest, color]) + (p.own ? 0.4 : 0) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);
  }, [open, outfit, target, wardrobe]);
  const choose = (p: Product, color: ColorKey) => {
    const next = target ? applySwap(outfit, { fromRef: target.piece.ref, to: p, toColor: color, text: '' }, ctx()) : addPiece(outfit, p, color, ctx());
    useApp.getState().updateOpen(next);
    useApp.getState().notify(target ? 'Prenda cambiada' : 'Prenda añadida al look');
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} wide title={target ? `Cambiar ${target.product.name.toLowerCase()}` : 'Añadir al look'}>
      <p className="mb-4 text-[13px] text-muted">Ordenadas por afinidad con el estilo y con los colores del resto del conjunto.</p>
      {options.length === 0 && <p className="text-sm">No hay más opciones de esta categoría para {seasonLabel(outfit.season).toLowerCase()}.</p>}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        {options.map(({ p, color }) => (
          <li key={p.id}>
            <button type="button" onClick={() => choose(p, color)} className="group flex w-full flex-col text-left">
              <span className="block aspect-square w-full overflow-hidden rounded-sm bg-tile ring-accent group-hover:ring-2"><ProductThumb product={p} color={color} className="h-full w-full" /></span>
              <span className="mt-2 text-[13px] font-medium leading-snug">{p.name}</span>
              <span className="tabular mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">{p.own ? <Pill tone="accent">De tu armario</Pill> : <>{euro(p.price)}{p.demo ? <DemoTag /> : <span>{brandById(p.brandId)?.name}</span>}</>}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

// ───────────────────────── Probador ─────────────────────────
function TryOnTab({ outfit, items }: { outfit: Outfit; items: Resolved[] }) {
  const profile = useApp((s) => s.profile);
  const [view, setView] = useState<'front' | 'side'>('front');
  const [pinned, setPinned] = useState<Outfit | null>(null);
  const [swapFor, setSwapFor] = useState<Resolved | null>(null);
  const wardrobe = useApp((s) => s.wardrobe);
  const { dims, estimated } = useMemo(() => dimsFromMeasures(profile.measures), [profile.measures]);
  const pinnedItems = pinned ? resolveOutfit(pinned.pieces, wardrobe) : null;
  const setShift = (ref: string, shift: number) => useApp.getState().updateOpen({ ...outfit, pieces: outfit.pieces.map((p) => (p.ref === ref ? { ...p, sizeShift: shift } : p)) });
  const garments = items.filter((i) => ['top', 'layer', 'bottom'].includes(i.product.category));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Vista del avatar" size="sm" value={view} onChange={setView} options={[{ value: 'front', label: 'Frontal' }, { value: 'side', label: 'Lateral' }]} />
        {pinned
          ? <Button size="sm" variant="outline" onClick={() => setPinned(null)}>Dejar de comparar</Button>
          : <Button size="sm" variant="outline" onClick={() => { setPinned(outfit); useApp.getState().notify('Combinación fijada: cambia tallas o prendas y compara'); }}><Pin size={14} />Fijar para comparar</Button>}
      </div>
      <div className={cx('grid gap-3 rounded-sm bg-tile p-3', pinnedItems ? 'grid-cols-2' : 'grid-cols-1')}>
        {pinnedItems && (
          <figure className="flex flex-col items-center"><FigureSvg dims={dims} view={view} items={pinnedItems} className="h-[380px] w-full sm:h-[460px]" label="Combinación fijada" /><figcaption className="mt-1 text-xs text-muted">A. Fijada ({euro(pinned!.total)})</figcaption></figure>
        )}
        <figure className="flex flex-col items-center"><FigureSvg dims={dims} view={view} items={items} className="h-[380px] w-full sm:h-[460px]" label="Combinación actual sobre tu avatar" />{pinnedItems && <figcaption className="mt-1 text-xs text-muted">B. Actual ({euro(outfit.total)})</figcaption>}</figure>
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Avatar dibujado a escala con {profile.isExample ? 'las medidas del perfil de ejemplo' : 'tus medidas'} ({fmtLen(dims.height, profile.units)} de altura).
        {estimated.length > 0 && <> Sin dato de {estimated.join(', ')}: se ha estimado a partir de la altura.</>} Muestra proporciones, largos y volumen según el corte y la talla; no simula la caída del tejido ni el color exacto.
      </p>
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {garments.map((it) => <FitRow key={it.piece.ref} item={it} onShift={(s) => setShift(it.piece.ref, s)} onSwap={() => setSwapFor(it)} />)}
      </ul>
      <Notice>
        <strong>Probador sobre tu fotografía.</strong> {photoTryOn.available ? 'Disponible.' : 'Todavía no está conectado: requiere un servicio externo de virtual try-on (Fase 3). Preferimos no mostrar un resultado simulado que no represente bien las prendas.'}
      </Notice>
      <SwapSheet outfit={outfit} target={swapFor} onClose={() => setSwapFor(null)} />
    </div>
  );
}

function FitRow({ item, onShift, onSwap }: { item: Resolved; onShift: (s: number) => void; onSwap: () => void }) {
  const profile = useApp((s) => s.profile);
  const { piece, product } = item;
  const rec = useMemo(() => (piece.own ? null : recommendSize(product, profile.measures, profile.fitPreference)), [product, profile, piece.own]);
  const shift = piece.sizeShift ?? 0;
  const labels = product.sizes.map((s) => s.label);
  const base = rec?.size ? labels.indexOf(rec.size.split(' ')[0]) : -1;
  const label = base >= 0 ? labels[base + shift] : null;
  const can = (d: number) => Math.abs(shift + d) <= 1 && (base < 0 || !!labels[base + shift + d]);
  const text = shift === 0 ? (label ? `Talla ${label} (recomendada)` : 'Tu talla') : label ? `Talla ${label} (${shift > 0 ? 'una más' : 'una menos'})` : shift > 0 ? 'Una talla más' : 'Una talla menos';
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="min-w-0 flex-1 basis-40">
        <span className="block text-sm font-medium leading-snug">{product.name}</span>
        <span className="text-xs text-muted">Corte {FIT_LABEL[product.fit].toLowerCase()}, {colorName(piece.color).toLowerCase()}</span>
      </span>
      <span className="flex items-center gap-2">
        <IconButton label="Probar una talla menos" disabled={!can(-1)} onClick={() => onShift(shift - 1)} className="h-8 w-8 border border-line disabled:opacity-30"><Minus size={14} /></IconButton>
        <span className="tabular w-[11.5rem] text-center text-xs">{text}</span>
        <IconButton label="Probar una talla más" disabled={!can(1)} onClick={() => onShift(shift + 1)} className="h-8 w-8 border border-line disabled:opacity-30"><Plus size={14} /></IconButton>
      </span>
      <Button size="sm" variant="ghost" onClick={onSwap}><Repeat2 size={14} />Cambiar</Button>
    </li>
  );
}

// ───────────────────────── Consejos ─────────────────────────
const TWEAKS: { key: NonNullable<Parameters<typeof variations>[1]>; label: string }[] = [
  { key: 'formal', label: 'Más formal' }, { key: 'informal', label: 'Más informal' }, { key: 'cheaper', label: 'Más barato' }, { key: 'bolder', label: 'Más atrevido' }, { key: 'color', label: 'Otros colores' },
];

function variations(outfit: Outfit, tweak: 'formal' | 'informal' | 'cheaper' | 'bolder' | 'color'): Outfit[] {
  const s = useApp.getState();
  const prefs = s.prefsSlice.prefs;
  const keep = tweak === 'cheaper' || tweak === 'color' ? [] : outfit.pieces.filter((p) => { const pr = resolveOutfit([p], s.wardrobe)[0]?.product; return pr?.category === (tweak === 'bolder' ? 'bottom' : 'top'); }).map((p) => p.ref);
  const res = generateOutfits({
    ...prefs, styles: [outfit.style], season: outfit.season, occasion: outfit.occasion,
    budget: tweak === 'cheaper' ? Math.max(40, Math.floor(outfit.total * 0.8)) : outfit.budget,
    favColors: outfit.basis.favColors, boldness: Math.round(outfit.basis.boldness),
    text: '', source: outfit.fromWardrobe ? 'mix' : 'catalog', referentIds: [], count: 3, seed: Math.floor(Math.random() * 1e9), lockRefs: keep, tweak,
  }, s.ctx());
  return res.outfits.filter((o) => o.pieces.map((p) => p.ref).join() !== outfit.pieces.map((p) => p.ref).join());
}

function AdviceTab({ outfit }: { outfit: Outfit }) {
  const wardrobe = useApp((s) => s.wardrobe);
  const ctx = useApp.getState().ctx;
  const advice = useMemo(() => buildAdvice(outfit, ctx()), [outfit, wardrobe]);
  const [vars, setVars] = useState<{ label: string; list: Outfit[] } | null>(null);
  const apply = (swap: Swap) => { useApp.getState().updateOpen(applySwap(outfit, swap, ctx())); useApp.getState().notify('Cambio aplicado al look'); };
  const Block = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="border-t border-line py-4 first:border-t-0 first:pt-0"><h3 className="text-sm font-semibold">{title}</h3><div className="mt-1.5 flex flex-col gap-2 text-sm leading-relaxed">{children}</div></section>;
  const SwapLine = ({ swap }: { swap?: Swap }) => swap
    ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="min-w-0 flex-1 basis-56">{swap.text}</p><Button size="sm" variant="outline" onClick={() => apply(swap)}>Aplicar cambio</Button></div>
    : <p className="text-muted">No hay una sustitución clara en el catálogo actual para esta temporada.</p>;
  return (
    <div className="flex flex-col">
      <section className="mb-5 rounded-sm bg-surface p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Wand2 size={15} />Pedir variaciones de este look</h3>
        <p className="mt-1 text-[13px] text-muted">Genera alternativas sin empezar una búsqueda nueva.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TWEAKS.map((t) => <Button key={t.key} size="sm" variant="outline" onClick={() => setVars({ label: t.label, list: variations(outfit, t.key) })}>{t.label}</Button>)}
        </div>
        {vars && (
          <div className="anim-fade mt-4">
            <p className="text-[13px] font-medium">{vars.label}: {vars.list.length ? `${vars.list.length} ${vars.list.length === 1 ? 'variación' : 'variaciones'}` : 'no hay variaciones distintas con el catálogo actual'}</p>
            {vars.list.length > 0 && <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">{vars.list.map((o) => <OutfitCard key={o.id} outfit={o} size="sm" />)}</div>}
          </div>
        )}
      </section>
      <Block title="Por qué funcionan juntas">{advice.why.map((w, i) => <p key={i}>{w}</p>)}</Block>
      <Block title="Colores"><p>{advice.colors}</p></Block>
      <Block title="Proporciones"><p>{advice.proportions}</p></Block>
      <Block title="Para hacerlo más formal"><SwapLine swap={advice.moreFormal} /></Block>
      <Block title="Para hacerlo más informal"><SwapLine swap={advice.moreCasual} /></Block>
      <Block title="Accesorios que puedes añadir">
        {advice.add.length === 0 && <p className="text-muted">El look ya lleva los accesorios que le convienen.</p>}
        {advice.add.map((a) => (
          <div key={a.product.id} className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1 basis-56">{a.text} <span className="tabular text-muted">{euro(a.product.price)}</span></p>
            <Button size="sm" variant="outline" onClick={() => { useApp.getState().updateOpen(addPiece(outfit, a.product, a.color, ctx())); useApp.getState().notify('Accesorio añadido al look'); }}>Añadir al look</Button>
          </div>
        ))}
      </Block>
      <Block title="Para reducir el precio"><SwapLine swap={advice.cheaper} /></Block>
      <Block title="Si lo quieres más holgado"><p>{advice.looser}</p></Block>
      <Block title="Si lo quieres más ajustado"><p>{advice.tighter}</p></Block>
      <StylistAI outfit={outfit} />
    </div>
  );
}

function StylistAI({ outfit }: { outfit: Outfit }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [question, setQuestion] = useState('');
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { let on = true; getStylistAI().then((s) => on && setAvailable(!!s)); return () => { on = false; abort.current?.abort(); }; }, []);
  const ask = async (q: string) => {
    abort.current?.abort();
    abort.current = new AbortController();
    setState('loading'); setText('');
    try {
      const s = useApp.getState();
      const out = await askStylist(outfit, s.profile, s.wardrobe, q, setText, abort.current.signal);
      setText(out); setState('done');
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      if (e?.code === 'not_granted' || e?.code === 'not_available') setAvailable(false);
      setState('error');
    }
  };
  return (
    <section className="mt-2 rounded-sm border border-line p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={15} />Estilista con IA</h3>
      {available === false && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">El análisis redactado por IA no está disponible en esta vista. Los consejos de arriba se calculan con reglas y no dependen de él. En la Fase 2 se conecta a un modelo desde el servidor.</p>}
      {available === null && <p className="mt-1.5 text-[13px] text-muted">Comprobando si hay un modelo disponible…</p>}
      {available && (
        <>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">Pide una segunda opinión redactada por Claude a partir de las prendas de este look. Solo comenta lo que ves aquí: no propone productos ni precios.</p>
          <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); ask(question.trim() || '¿Cómo llevarías este look y qué cuidarías al ponértelo?'); }}>
            <input id="ai-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ej.: ¿sirve para una cena informal?" aria-label="Pregunta para el estilista" className="h-9 min-w-0 flex-1 basis-52 rounded-sm border border-line bg-surface px-3 text-[13px] outline-none focus:border-ink" />
            <Button size="sm" type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Pensando…' : question.trim() ? 'Preguntar' : 'Pedir análisis'}</Button>
          </form>
          {text && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{text}</p>}
          {state === 'error' && <p className="mt-3 text-[13px] text-bad">No se pudo obtener la respuesta. Vuelve a intentarlo en unos segundos.</p>}
        </>
      )}
    </section>
  );
}

// ───────────────────────── Compartir y colecciones ─────────────────────────
function ShareSheet({ open, onClose, outfit }: { open: boolean; onClose: () => void; outfit: Outfit }) {
  const wardrobe = useApp((s) => s.wardrobe);
  const [copied, setCopied] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const summary = lookSummary(outfit, wardrobe);
  const code = encodeLook(outfit);
  const embedded = !!(window as any).claude || window.self !== window.top;
  const link = `${window.location.href.split('#')[0]}#${code}`;
  const shareable = outfit.pieces.some((p) => !p.own);
  useEffect(() => { if (!open) { setImage(null); setImageError(false); setCopied(null); } }, [open]);
  const copy = async (what: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(what); }
    catch { setCopied(null); useApp.getState().notify('No se pudo copiar: selecciona el texto y cópialo a mano'); }
  };
  const makeImage = async () => {
    try {
      const svg = holder.current?.querySelector('svg');
      if (!svg) throw new Error('sin svg');
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', '900'); clone.setAttribute('height', '1200');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement('canvas'); c.width = 900; c.height = 1500;
      const g = c.getContext('2d')!;
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 900, 1500);
      g.drawImage(img, 0, 0, 900, 1200);
      URL.revokeObjectURL(url);
      g.fillStyle = '#14182b';
      g.font = 'italic 64px "Bodoni Moda", Didot, Georgia, serif'; g.fillText(outfit.name, 48, 1300);
      g.font = '28px "Instrument Sans", Arial, sans-serif'; g.fillText(`${styleName(outfit.style)}, ${outfit.pieces.length} prendas, ${euro(outfit.total)}`, 48, 1356);
      g.fillStyle = '#5d6279'; g.font = '22px "Instrument Sans", Arial, sans-serif';
      g.fillText(outfit.pieces.some((p) => catalog.get(p.ref)?.demo) ? 'Ilustración conceptual. Productos y precios de demostración. Percha.' : `Ilustración conceptual. Precios vistos el ${seenLabel(catalog.seenAt)}. Percha.`, 48, 1440);
      setImage(c.toDataURL('image/png'));
    } catch { setImageError(true); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Compartir look" wide>
      <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
        <div ref={holder} className="mx-auto w-40 sm:w-full">
          {image ? <img src={image} alt={`Tarjeta de ${outfit.name}`} className="w-full rounded-sm border border-line" /> : <div className="aspect-[3/4] overflow-hidden rounded-sm"><OutfitCover items={resolveOutfit(outfit.pieces, wardrobe)} backdrop={outfit.backdrop} className="h-full w-full" /></div>}
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <h3 className="text-sm font-semibold">Como imagen</h3>
            {image
              ? <p className="mt-1 text-[13px] text-muted">Imagen lista. Mantén pulsada la imagen (o clic derecho) y elige «Guardar» o «Compartir».</p>
              : <><p className="mt-1 text-[13px] text-muted">Crea una tarjeta con la ilustración, el nombre y el total.</p><Button size="sm" variant="outline" className="mt-2" onClick={makeImage}>Crear imagen</Button></>}
            {imageError && <p className="mt-2 text-[13px] text-bad">Este navegador no permite generar la imagen. Usa el resumen en texto.</p>}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Como enlace</h3>
            {!shareable ? <p className="mt-1 text-[13px] text-muted">Este look solo usa prendas de tu armario, que son privadas: no se puede abrir desde otro dispositivo.</p> : embedded ? (
              <>
                <p className="mt-1 text-[13px] text-muted">Pulsa el botón y después usa «Compartir» o «Copiar enlace» de la página: el enlace abrirá este look. {outfit.fromWardrobe > 0 && 'Las prendas de tu armario no se incluyen.'}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { window.location.hash = code; setCopied('hash'); }}>{copied === 'hash' ? <><Check size={14} />Enlace de la página actualizado</> : 'Preparar enlace a este look'}</Button>
              </>
            ) : (
              <div className="mt-2 flex gap-2"><input readOnly value={link} aria-label="Enlace al look" className="h-9 min-w-0 flex-1 rounded-sm border border-line bg-tile px-3 text-xs" onFocus={(e) => e.currentTarget.select()} /><Button size="sm" variant="outline" onClick={() => copy('link', link)}>{copied === 'link' ? <><Check size={14} />Copiado</> : <><Copy size={14} />Copiar</>}</Button></div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Como texto</h3>
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-sm bg-tile p-3 font-sans text-xs leading-relaxed">{summary}</pre>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => copy('text', summary)}>{copied === 'text' ? <><Check size={14} />Copiado</> : <><Copy size={14} />Copiar resumen</>}</Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

export function CollectionSheet({ open, onClose, outfit, productId }: { open: boolean; onClose: () => void; outfit?: Outfit; productId?: string }) {
  const collections = useApp((s) => s.saved.collections);
  const [name, setName] = useState('');
  const { patch, notify } = useApp.getState();
  const has = (c: { outfitIds: string[]; productIds: string[] }) => (outfit ? c.outfitIds.includes(outfit.id) : c.productIds.includes(productId!));
  const toggle = (id: string) => {
    patch('saved', (cur) => {
      const col = cur.collections.find((c) => c.id === id)!;
      const inside = has(col);
      const outfits = outfit && !inside && !cur.outfits.some((o) => o.id === outfit.id) ? [outfit, ...cur.outfits] : cur.outfits;
      const productIds = productId && !inside && !cur.productIds.includes(productId) ? [productId, ...cur.productIds] : cur.productIds;
      return {
        ...cur, outfits, productIds,
        collections: cur.collections.map((c) => c.id !== id ? c : outfit
          ? { ...c, outfitIds: inside ? c.outfitIds.filter((x) => x !== outfit.id) : [...c.outfitIds, outfit.id] }
          : { ...c, productIds: inside ? c.productIds.filter((x) => x !== productId) : [...c.productIds, productId!] }),
      };
    });
  };
  const create = () => {
    const n = name.trim();
    if (!n) return;
    const id = uid('c');
    patch('saved', (cur) => ({ ...cur, collections: [...cur.collections, { id, name: n, outfitIds: [], productIds: [], createdAt: Date.now() }] }));
    toggle(id);
    setName('');
    notify(`Colección «${n}» creada`);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Añadir a una colección" footer={<Button onClick={onClose}>Listo</Button>}>
      {collections.length === 0 && <p className="mb-4 text-sm text-muted">Aún no tienes colecciones. Crea la primera, por ejemplo «Viaje a Lisboa» o «Oficina otoño».</p>}
      <ul className="flex flex-col gap-2">
        {collections.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => toggle(c.id)} aria-pressed={has(c)} className={cx('flex w-full items-center justify-between rounded-sm border px-4 py-3 text-left text-sm', has(c) ? 'border-ink bg-tile' : 'border-line')}>
              <span><span className="font-medium">{c.name}</span><span className="ml-2 text-xs text-muted">{c.outfitIds.length} looks, {c.productIds.length} prendas</span></span>
              {has(c) && <Check size={16} />}
            </button>
          </li>
        ))}
      </ul>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <input id="new-collection" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la nueva colección" aria-label="Nombre de la nueva colección" className="h-10 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-sm outline-none focus:border-ink" />
        <Button type="submit" variant="outline" size="sm" className="h-10" disabled={!name.trim()}>Crear y añadir</Button>
      </form>
    </Sheet>
  );
}

export type { Piece };

const chartOfficialBody = (rec: { chart: { title: string } | null }) => !!rec.chart && !rec.chart.title.startsWith('Medidas de la prenda');
