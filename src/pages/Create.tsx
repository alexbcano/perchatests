import { useEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import type { GenRequest, Market, SourceMode } from '@/domain/types';
import { baseRequest, useApp } from '@/app/store';
import { OCCASIONS, SEASONS } from '@/domain/garments';
import { catalog } from '@/services/catalog';
import { BudgetField, BoldnessField, GarmentPrefs, StylePicker } from '@/ui/forms';
import { Button, Chip, ColorPicker, cx, DemoTag, Field, Notice, PageHeader, Pill, Segmented } from '@/ui/primitives';
import { go } from '@/app/router';
import { styleName } from '@/data/demo/styles';
import { euro } from '@/features/outfits/engine';
import { OutfitCard } from '@/ui/cards';


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

  const budgets = [100, 150, 250, 400];
  const styleSummary = form.styles.map(styleName).join(', ') || 'sin elegir';

  return (
    <div>
      <PageHeader title="Crear outfit" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-y-auto xl:pb-2 xl:pr-2" onSubmit={(e) => { e.preventDefault(); run(form); }}>
          <Field id="c-text" label="¿Qué buscas?" optional>
            <textarea id="c-text" rows={2} value={form.text} onChange={(e) => set({ text: e.target.value })} placeholder="Ej.: algo streetwear para salir, con pantalón ancho, máximo 150 €" className="w-full resize-y rounded-sm border border-line bg-surface p-3 text-sm outline-none placeholder:text-muted/70 focus:border-ink" />
          </Field>

          {followed.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="flex items-baseline justify-between text-[13px] font-medium">Inspírate en<button type="button" onClick={() => go('referentes')} className="text-xs font-normal text-muted underline underline-offset-4">Ver referentes</button></span>
              <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 xl:mx-0 xl:flex-wrap xl:px-0 [&>*]:shrink-0 [&>*]:whitespace-nowrap">{followed.map((r) => { const on = form.referentIds.includes(r.id); return <Chip key={r.id} selected={on} onClick={() => set({ referentIds: on ? form.referentIds.filter((x) => x !== r.id) : [...form.referentIds, r.id] })}>{r.name}</Chip>; })}</div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Para</span>
            <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 xl:mx-0 xl:flex-wrap xl:px-0 [&>*]:shrink-0 [&>*]:whitespace-nowrap">{OCCASIONS.map((o) => <Chip key={o.key} selected={form.occasion === o.key} onClick={() => set({ occasion: o.key })}>{o.label}</Chip>)}</div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">Presupuesto máximo</span>
            <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 xl:mx-0 xl:flex-wrap xl:px-0 [&>*]:shrink-0 [&>*]:whitespace-nowrap">
              {form.budget > 0 && !budgets.includes(form.budget) && <Chip selected onClick={() => {}}>{euro(form.budget)}</Chip>}
              {budgets.map((b) => <Chip key={b} selected={form.budget === b} onClick={() => set({ budget: b })}>{b} €</Chip>)}
              <Chip selected={form.budget === 0} onClick={() => set({ budget: 0 })}>Sin límite</Chip>
            </div>
          </div>

          {wardrobeCount > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium">Con qué prendas</span>
              <div><Segmented<SourceMode> label="Origen de las prendas" value={form.source} onChange={(source) => set({ source })} options={[{ value: 'catalog', label: 'Comprar' }, { value: 'mix', label: 'Mi ropa + comprar' }, { value: 'wardrobe', label: 'Solo mi ropa' }]} /></div>
            </div>
          )}

          <div className="border-y border-line">
            <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={more} className="flex w-full items-center justify-between gap-3 py-3 text-left text-[13px] font-medium">
              <span>Más opciones<span className="ml-2 font-normal text-muted">{styleSummary}{extraCount > 0 ? ` · ${extraCount} ${extraCount === 1 ? 'ajuste' : 'ajustes'}` : ''}</span></span>
              <ChevronDown size={16} className={cx('shrink-0 transition-transform', more && 'rotate-180')} />
            </button>
            {more && (
              <div className="anim-fade flex flex-col gap-6 pb-5">
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium">Estilos <span className="font-normal text-muted">(puedes combinar varios)</span></span>
                  <StylePicker value={form.styles} onChange={(styles) => set({ styles })} />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[13px] font-medium">Temporada</span>
                  <div><Segmented label="Temporada" value={form.season} onChange={(season) => set({ season })} options={SEASONS.map((x) => ({ value: x.key, label: x.label }))} /></div>
                </div>
                <BudgetField id="c-budget" value={form.budget} onChange={(budget) => set({ budget })} />
                <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores favoritos</span><ColorPicker label="Colores favoritos" value={form.favColors} exclude={form.avoidColors} onChange={(favColors) => set({ favColors })} /></div>
                <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores que no quieres</span><ColorPicker label="Colores que no quieres" tone="bad" value={form.avoidColors} exclude={form.favColors} onChange={(avoidColors) => set({ avoidColors })} /></div>
                <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Prendas</span><GarmentPrefs like={form.likeTypes} avoid={form.avoidTypes} onChange={(likeTypes, avoidTypes) => set({ likeTypes, avoidTypes })} /></div>
                <BoldnessField id="c-bold" value={form.boldness} onChange={(boldness) => set({ boldness })} />
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[13px] font-medium">Marcas preferidas {catalog.isDemo && <DemoTag label="Marcas de demostración" />}</span>
                  <div className="flex flex-wrap gap-2">{catalog.brands().map((b) => { const on = form.brands.includes(b.id); return <Chip key={b.id} selected={on} onClick={() => set({ brands: on ? form.brands.filter((x) => x !== b.id) : [...form.brands, b.id] })}>{b.name}</Chip>; })}</div>
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

          <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 -mx-6 bg-paper/95 px-6 py-3 backdrop-blur lg:bottom-0 xl:static xl:mx-0 xl:bg-transparent xl:p-0">
            <Button type="submit" size="lg" variant="accent" block><Sparkles size={17} />Generar looks</Button>
          </div>
        </form>

        <div ref={resultsRef} className="min-w-0 scroll-mt-4">
          {ran && results.length === 0 && (
            <div className="flex flex-col gap-3">
              {notes.map((n, i) => <Notice key={i} tone="warn">{n}</Notice>)}
              {notes.length === 0 && <Notice tone="warn">No hemos encontrado combinaciones con estos filtros.</Notice>}
            </div>
          )}
          {results.length > 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="display text-3xl">{results.length} looks para ti</h2>
                <Button variant="outline" size="sm" onClick={() => run(form, false)}><RefreshCw size={14} />Generar otras</Button>
              </div>
              {hints && hints.understood.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs"><span className="text-muted">Hemos entendido:</span>{hints.understood.map((u) => <Pill key={u} tone="accent">{u}</Pill>)}</div>
              )}
              {notes.map((n, i) => <Notice key={i} tone="warn">{n}</Notice>)}
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                {results.map((o) => <OutfitCard key={o.id} outfit={o} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
