import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { baseRequest, useApp } from '@/app/store';
import { createWith, go } from '@/app/router';
import { generateOutfits, euro } from '@/features/outfits/engine';
import { resolveOutfit } from '@/services/catalog';
import { STYLES, styleName } from '@/data/demo/styles';
import { seasonLabel } from '@/domain/garments';
import { LookImage, useLookHasPhotos } from '@/ui/figure';
import { ConceptTag, OutfitCard } from '@/ui/cards';
import { Button, Notice, Pill } from '@/ui/primitives';

const daySeed = () => Math.floor(Date.now() / 86400000);

export function Home() {
  const profile = useApp((s) => s.profile);
  const prefs = useApp((s) => s.prefsSlice.prefs);
  const wardrobe = useApp((s) => s.wardrobe);
  const history = useApp((s) => s.saved.history);
  const referents = useApp((s) => s.saved.referents);
  const mode = useApp((s) => s.prefsSlice.catalogMode);
  const { openOutfit, setOnboarding } = useApp.getState();

  const recs = useMemo(
    () => generateOutfits(baseRequest(prefs, { seed: daySeed(), count: 4 }), { profile, wardrobe: [], referents }).outfits,
    [prefs, profile.measures, profile.pattern, referents, mode],
  );
  const styleTiles = useMemo(
    () => STYLES.map((s, i) => ({ style: s, outfit: generateOutfits(baseRequest(prefs, { styles: [s.key], budget: 0, favColors: [], avoidColors: [], likeTypes: [], avoidTypes: [], brands: [], seed: 1000 + i, count: 1 }), { profile, wardrobe: [], referents: [] }).outfits[0] })).filter((t) => t.outfit),
    [prefs.season, prefs.market, profile.pattern, mode],
  );
  const hero = recs[0];
  const heroItems = hero ? resolveOutfit(hero.pieces, wardrobe) : [];
  const heroPhotos = useLookHasPhotos(heroItems);
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const last = history[0];

  return (
    <div className="flex flex-col gap-12 pb-6">
      {profile.isExample && (
        <Notice tone="accent">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Estás viendo Percha con un <strong>perfil de ejemplo</strong>. Añade tus medidas y gustos para que las tallas, el avatar y las propuestas sean los tuyos.</span>
            <Button size="sm" onClick={() => setOnboarding(true)}>Configurar mi perfil</Button>
          </div>
        </Notice>
      )}

      {hero && (
        <section className="grid gap-x-10 gap-y-5 lg:grid-cols-12 lg:grid-rows-[1fr_auto]">
          <div className="lg:col-span-5 lg:self-end">
            <p className="text-[13px] text-muted first-letter:uppercase">{today}. {profile.name ? `Hola, ${profile.name}: este` : 'Este'} es tu look de hoy.</p>
            <h1 className="display mt-3 text-[3.4rem] leading-[0.92] sm:text-7xl xl:text-[5.5rem]">{hero.name}</h1>
          </div>
          <button type="button" onClick={() => openOutfit(hero)} className="group relative block overflow-hidden rounded-sm lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-end" aria-label={`Abrir ${hero.name}`}>
            <LookImage items={heroItems} backdrop={hero.backdrop} className="anim-cover aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.02] sm:hidden" />
            <LookImage items={heroItems} backdrop={hero.backdrop} wide className="anim-cover hidden aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.02] sm:block" />
            <ConceptTag photos={heroPhotos} className="absolute bottom-3 left-3" />
          </button>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="max-w-[46ch] text-[15px] leading-relaxed">{hero.description}</p>
            <p className="tabular mt-4 flex flex-wrap items-center gap-2 text-sm">
              <Pill>{styleName(hero.style)}</Pill><Pill>{seasonLabel(hero.season)}</Pill>
              <span className="font-medium">{euro(hero.total)}</span><Pill tone="ok">{hero.compat} % afín</Pill>
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button size="lg" onClick={() => openOutfit(hero)}>Ver prendas y tallas<ArrowRight size={16} /></Button>
              <Button size="lg" variant="outline" onClick={() => go('crear')}>Crear otro outfit</Button>
            </div>
          </div>
        </section>
      )}

      {recs.length > 1 && (
        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="display text-3xl">Más para ti</h2>
            <button type="button" onClick={() => go('perfil')} className="text-[13px] underline decoration-line underline-offset-4">Ajustar mis gustos</button>
          </div>
          <p className="mt-1 text-[13px] text-muted">Según tus estilos ({prefs.styles.map(styleName).join(', ') || 'sin elegir'}), {seasonLabel(prefs.season).toLowerCase()} y un máximo de {prefs.budget ? euro(prefs.budget) : 'presupuesto libre'}.</p>
          <div className="no-scrollbar -mx-6 mt-5 flex snap-x gap-4 overflow-x-auto px-6 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
            {recs.slice(1).map((o) => <div key={o.id} className="w-[62%] shrink-0 snap-start sm:w-auto"><OutfitCard outfit={o} /></div>)}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start gap-3 rounded-sm bg-surface p-6">
          <h2 className="display text-2xl">{last ? 'Sigue donde lo dejaste' : 'Empieza por una frase'}</h2>
          <p className="text-sm text-muted">{last ? `Tu última búsqueda: ${last.summary}. Dio ${last.resultCount} propuestas.` : 'Escribe lo que buscas, como se lo dirías a un estilista: estilo, ocasión, colores y presupuesto.'}</p>
          <Button variant="outline" className="mt-auto" onClick={() => (last ? createWith(last.request) : go('crear'))}>{last ? 'Repetir búsqueda' : 'Crear mi primer outfit'}</Button>
        </div>
        <div className="flex flex-col items-start gap-3 rounded-sm bg-ink p-6 text-paper">
          <h2 className="display text-2xl">Viste lo que ya tienes</h2>
          <p className="text-sm opacity-80">{wardrobe.length ? `Tienes ${wardrobe.length} prendas en tu armario${wardrobe.some((w) => w.example) ? ' (incluye ejemplos)' : ''}. Combínalas antes de comprar nada.` : 'Registra tus prendas y Percha las combinará antes de proponerte compras.'}</p>
          <div className="mt-auto flex flex-wrap gap-2">
            {wardrobe.length > 0 && <Button variant="accent" onClick={() => createWith({ source: 'wardrobe' })}>Crear looks con mi armario</Button>}
            <button type="button" onClick={() => go('armario')} className="inline-flex h-11 items-center rounded-sm border border-paper/60 px-5 text-sm font-medium hover:bg-paper hover:text-ink">{wardrobe.length ? 'Ver mi armario' : 'Añadir prendas'}</button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="display text-3xl">Explora por estilo</h2>
          <button type="button" onClick={() => go('tendencias')} className="text-[13px] underline decoration-line underline-offset-4">Ver guía de estilos</button>
        </div>
        <div className="no-scrollbar -mx-6 mt-5 flex snap-x gap-3 overflow-x-auto px-6 lg:mx-0 lg:px-0">
          {styleTiles.map(({ style, outfit }) => (
            <button key={style.key} type="button" onClick={() => createWith({ styles: [style.key] })} className="group w-36 shrink-0 snap-start text-left sm:w-44">
              <span className="block aspect-[3/4] overflow-hidden rounded-sm"><LookImage items={resolveOutfit(outfit.pieces, [])} backdrop={outfit.backdrop} className="h-full w-full transition-transform duration-500 group-hover:scale-105" label={`Ilustración de un look ${style.name}`} /></span>
              <span className="mt-2 block text-sm font-medium">{style.name}</span>
              <span className="block text-xs leading-snug text-muted">{style.line}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
