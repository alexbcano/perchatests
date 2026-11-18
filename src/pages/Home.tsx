import { useMemo, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { baseRequest, useApp } from '@/app/store';
import { generateOutfits, euro } from '@/features/outfits/engine';
import { resolveOutfit } from '@/services/catalog';
import { LookImage, useLookHasPhotos } from '@/ui/figure';
import { ConceptTag, OutfitCard } from '@/ui/cards';
import { Button } from '@/ui/primitives';

const daySeed = () => Math.floor(Date.now() / 86400000);

export function Home() {
  const profile = useApp((s) => s.profile);
  const prefs = useApp((s) => s.prefsSlice.prefs);
  const wardrobe = useApp((s) => s.wardrobe);
  const referents = useApp((s) => s.saved.referents);
  const mode = useApp((s) => s.prefsSlice.catalogMode);
  const { openOutfit } = useApp.getState();
  const [turn, setTurn] = useState(0);

  const recs = useMemo(
    () => generateOutfits(baseRequest(prefs, { seed: daySeed(), count: 4 }), { profile, wardrobe: [], referents }).outfits,
    [prefs, profile.measures, profile.pattern, referents, mode],
  );
  const hero = recs.length ? recs[turn % recs.length] : undefined;
  const rest = recs.filter((o) => o !== hero);
  const heroItems = hero ? resolveOutfit(hero.pieces, wardrobe) : [];
  const heroPhotos = useLookHasPhotos(heroItems);
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-12 pb-6">
      {hero && (
        <section className="grid gap-x-10 gap-y-5 lg:grid-cols-12 lg:grid-rows-[1fr_auto]">
          <div className="lg:col-span-5 lg:self-end">
            <p className="text-[13px] text-muted first-letter:uppercase">{today}. {profile.name && !profile.isExample ? `Hola, ${profile.name}: tu` : 'Tu'} look de hoy.</p>
            <h1 className="display mt-3 text-[3.4rem] leading-[0.92] sm:text-7xl xl:text-[5.5rem]">{hero.name}</h1>
          </div>
          <button type="button" onClick={() => openOutfit(hero)} className="group relative block overflow-hidden rounded-sm lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-end" aria-label={`Abrir ${hero.name}`}>
            <LookImage items={heroItems} backdrop={hero.backdrop} className="anim-cover aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.02] sm:hidden" />
            <LookImage items={heroItems} backdrop={hero.backdrop} wide className="anim-cover hidden aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.02] sm:block" />
            <ConceptTag photos={heroPhotos} className="absolute bottom-3 left-3" />
          </button>
          <div className="lg:col-span-5 lg:pb-2">
            <p className="tabular text-sm text-muted">{heroItems.length} prendas · <span className="font-medium text-ink">{euro(hero.total)}</span></p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="lg" onClick={() => openOutfit(hero)}>Ver el look<ArrowRight size={16} /></Button>
              {recs.length > 1 && <Button size="lg" variant="outline" onClick={() => setTurn((t) => t + 1)}><RefreshCw size={16} />Otro</Button>}
            </div>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="display text-3xl">Más looks para ti</h2>
          <div className="no-scrollbar -mx-6 mt-5 flex snap-x gap-4 overflow-x-auto px-6 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
            {rest.map((o) => <div key={o.id} className="w-[62%] shrink-0 snap-start sm:w-auto"><OutfitCard outfit={o} /></div>)}
          </div>
        </section>
      )}
    </div>
  );
}
