import { useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import type { GenRequest, Market, SourceMode } from '@/domain/types';
import { baseRequest, useApp } from '@/app/store';
import { OCCASIONS, SEASONS } from '@/domain/garments';
import { catalog } from '@/services/catalog';
import { BudgetField, BoldnessField, GarmentPrefs, StylePicker } from '@/ui/forms';
import { Button, Chip, ColorPicker, cx, DemoTag, Empty, Field, Notice, PageHeader, Pill, Segmented } from '@/ui/primitives';
import { OutfitCard } from '@/ui/cards';

const EXAMPLE = 'Quiero un outfit streetwear para otoño, con pantalones anchos, zapatillas llamativas y una parte superior minimalista. Presupuesto máximo de 180 €';

export function Create() {
  const prefs = useApp((s) => s.prefsSlice.prefs);
  const wardrobeCount = useApp((s) => s.wardrobe.length);
  const results = useApp((s) => s.results);
  const notes = useApp((s) => s.resultNotes);
  const hints = useApp((s) => s.resultHints);
  const lastRequest = useApp((s) => s.lastRequest);
  const follows = useApp((s) => s.saved.follows);
  const referents = useApp((s) => s.saved.referents);
  const [form, setForm] = useState<GenRequest>(() => ({ ...baseRequest(prefs), ...(lastRequest ? { text: lastRequest.text, source: lastRequest.source, referentIds: lastRequest.referentIds.filter((id) => referents.some((r) => r.id === id)), count: lastRequest.count } : {}) }));
  const [more, setMore] = useState(false);
  const [ran, setRan] = useState(results.length > 0);
  const resultsRef = useRef<HTMLDivElement>(null);
  const set = (p: Partial<GenRequest>) => setForm((f) => ({ ...f, ...p }));

  const run = (req: GenRequest, scroll = true) => {
    const next = { ...req, seed: Math.floor(Math.random() * 1e9), lockRefs: undefined, tweak: null };
    setForm(next);
    const s = useApp.getState();
    s.generate(next);
    s.setPrefs({ styles: next.styles, season: next.season, occasion: next.occasion, budget: next.budget, favColors: next.favColors, avoidColors: next.avoidColors, likeTypes: next.likeTypes, avoidTypes: next.avoidTypes, boldness: next.boldness, brands: next.brands, market: next.market });
    setRan(true);
    if (scroll) window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  // Petición preparada desde Inicio, Tendencias, Armario o Favoritos.
  useEffect(() => {
    const pending = useApp.getState().pending;
    if (pending) {
      useApp.setState({ pending: null });
      run({ ...baseRequest(useApp.getState().prefsSlice.prefs), ...pending } as GenRequest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const followed = referents.filter((r) => follows.includes(r.id));
  const extraCount = form.favColors.length + form.avoidColors.length + form.likeTypes.length + form.avoidTypes.length + form.brands.length + form.referentIds.length;

  return (
    <div>
      <PageHeader title="Crear outfit" lead="Describe lo que buscas o elige estilo, ocasión y presupuesto. Combinamos tus medidas, tus gustos y tu armario para proponerte entre 3 y 6 looks." />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto xl:pb-2 xl:pr-2" onSubmit={(e) => { e.preventDefault(); run(form); }}>
          <Field id="c-text" label="Cuéntanos qué buscas" optional hint="Entiende estilo, temporada, ocasión, presupuesto, colores y prendas. Lo que escribas manda sobre las casillas.">
            <textarea id="c-text" rows={3} value={form.text} onChange={(e) => set({ text: e.target.value })} placeholder="Ej.: look minimalista para una cena en invierno, sin negro, máximo 250 €" className="w-full resize-y rounded-sm border border-line bg-surface p-3 text-sm outline-none placeholder:text-muted/70 focus:border-ink" />
            {!form.text && <button type="button" className="self-start text-xs underline decoration-line underline-offset-4" onClick={() => set({ text: EXAMPLE })}>Probar con un ejemplo</button>}
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Estilos <span className="font-normal text-muted">(puedes combinar varios)</span></span>
            <StylePicker value={form.styles} onChange={(styles) => set({ styles })} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Temporada</span>
            <div><Segmented label="Temporada" value={form.season} onChange={(season) => set({ season })} options={SEASONS.map((s) => ({ value: s.key, label: s.label }))} /></div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Ocasión</span>
            <div className="flex flex-wrap gap-2">{OCCASIONS.map((o) => <Chip key={o.key} selected={form.occasion === o.key} onClick={() => set({ occasion: o.key })}>{o.label}</Chip>)}</div>
          </div>

          <BudgetField id="c-budget" value={form.budget} onChange={(budget) => set({ budget })} />

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Con qué prendas</span>
            <div><Segmented<SourceMode> label="Origen de las prendas" value={form.source} onChange={(source) => set({ source })} options={[{ value: 'catalog', label: 'Solo compras' }, { value: 'mix', label: 'Armario + compras' }, { value: 'wardrobe', label: 'Solo mi armario' }]} /></div>
            <p className="text-2xs text-muted">{form.source === 'catalog' ? 'Todas las prendas salen del catálogo.' : form.source === 'mix' ? `Usa primero tus ${wardrobeCount} prendas y completa con compras.` : `Solo combina tus ${wardrobeCount} prendas: no compras nada.`}</p>
          </div>

          <div className="border-y border-line">
            <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="flex w-full items-center justify-between py-3 text-left text-[13px] font-medium">
              <span>Colores, prendas, marcas y referentes{extraCount > 0 && <span className="ml-2 font-normal text-muted">({extraCount} {extraCount === 1 ? 'ajuste' : 'ajustes'})</span>}</span>
              <ChevronDown size={16} className={cx('transition-transform', more && 'rotate-180')} />
            </button>
            {more && (
              <div className="anim-fade flex flex-col gap-6 pb-5">
                <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores favoritos</span><ColorPicker label="Colores favoritos" value={form.favColors} exclude={form.avoidColors} onChange={(favColors) => set({ favColors })} /></div>
                <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores que no quieres</span><ColorPicker label="Colores que no quieres" tone="bad" value={form.avoidColors} exclude={form.favColors} onChange={(avoidColors) => set({ avoidColors })} /></div>
                <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Prendas</span><GarmentPrefs like={form.likeTypes} avoid={form.avoidTypes} onChange={(likeTypes, avoidTypes) => set({ likeTypes, avoidTypes })} /></div>
                <BoldnessField id="c-bold" value={form.boldness} onChange={(boldness) => set({ boldness })} />
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-medium">Marcas preferidas {catalog.isDemo && <DemoTag label="Marcas de demostración" />}</span>
                  <div className="flex flex-wrap gap-2">{catalog.brands().map((b) => { const on = form.brands.includes(b.id); return <Chip key={b.id} selected={on} onClick={() => set({ brands: on ? form.brands.filter((x) => x !== b.id) : [...form.brands, b.id] })}>{b.name}</Chip>; })}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium">Inspirarme en mis referentes</span>
                  {followed.length === 0 ? <p className="text-xs text-muted">Sigue a algún referente en Tendencias para usar su estilo como inspiración.</p> : (
                    <div className="flex flex-wrap gap-2">{followed.map((r) => { const on = form.referentIds.includes(r.id); return <Chip key={r.id} selected={on} onClick={() => set({ referentIds: on ? form.referentIds.filter((x) => x !== r.id) : [...form.referentIds, r.id] })}>{r.name}</Chip>; })}</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium">Dónde quieres comprar</span>
                  <div><Segmented<Market> label="Mercado" value={form.market} onChange={(market) => set({ market })} options={[{ value: 'ES', label: 'España' }, { value: 'UE', label: 'Unión Europea' }, { value: 'INT', label: 'Internacional' }]} /></div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium">Número de propuestas</span>
                  <div><Segmented label="Número de propuestas" value={String(form.count)} onChange={(v) => set({ count: Number(v) })} options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))} /></div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-[76px] z-10 -mx-4 bg-paper/95 px-4 py-3 backdrop-blur lg:bottom-0 xl:static xl:mx-0 xl:bg-transparent xl:p-0">
            <Button type="submit" size="lg" variant="accent" block><Sparkles size={17} />Generar outfits</Button>
          </div>
        </form>

        <div ref={resultsRef} className="min-w-0 scroll-mt-4">
          {!ran && results.length === 0 && <Empty title="Tus propuestas aparecerán aquí" body="Elige al menos un estilo o escribe lo que buscas y pulsa «Generar outfits». Cada look incluye sus prendas, la talla recomendada y consejos para adaptarlo." action={<Button variant="outline" onClick={() => run({ ...form, text: EXAMPLE })}>Generar con el ejemplo</Button>} />}
          {ran && results.length === 0 && (
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => <Notice key={i} tone="warn">{n}</Notice>)}
              {notes.length === 0 && <Notice tone="warn">No hemos encontrado combinaciones con estos filtros.</Notice>}
            </div>
          )}
          {results.length > 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="display text-3xl">{results.length} propuestas para ti</h2>
                <Button variant="outline" size="sm" onClick={() => run(form, false)}><RefreshCw size={14} />Generar otras</Button>
              </div>
              {hints && hints.understood.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs"><span className="text-muted">De tu descripción hemos entendido:</span>{hints.understood.map((u) => <Pill key={u} tone="accent">{u}</Pill>)}</div>
              )}
              {notes.map((n, i) => <Notice key={i} tone="warn">{n}</Notice>)}
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                {results.map((o) => <OutfitCard key={o.id} outfit={o} />)}
              </div>
              <p className="text-2xs leading-relaxed text-muted">{catalog.isDemo ? 'Los looks se generan con reglas a partir de un catálogo de demostración.' : 'Los looks combinan productos reales de tiendas reales, con el precio leído en su web.'} Cada look muestra las fotos de sus prendas cuando la tienda permite cargarlas; si no, un dibujo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
