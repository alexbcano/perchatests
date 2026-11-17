import { useEffect } from 'react';
import { Heart, House, Shirt, Sparkles, TrendingUp, UserRound } from 'lucide-react';
import { startSync, useApp } from './store';
import { go, parseRoute, useHash, type Route } from './router';
import { decodeLook } from '@/features/outfits/share';
import { catalog, seenLabel } from '@/services/catalog';
import { Home } from '@/pages/Home';
import { Create } from '@/pages/Create';
import { Trends } from '@/pages/Trends';
import { Wardrobe } from '@/pages/Wardrobe';
import { Saved, CompareBar } from '@/pages/Saved';
import { Profile } from '@/pages/Profile';
import { Onboarding } from '@/pages/Onboarding';
import { OutfitDetail } from '@/pages/OutfitDetail';
import { cx, Toast } from '@/ui/primitives';

const NAV: { route: Route; label: string; short: string; icon: typeof House }[] = [
  { route: 'inicio', label: 'Inicio', short: 'Inicio', icon: House },
  { route: 'crear', label: 'Crear outfit', short: 'Crear', icon: Sparkles },
  { route: 'tendencias', label: 'Tendencias', short: 'Tendencias', icon: TrendingUp },
  { route: 'armario', label: 'Mi armario', short: 'Armario', icon: Shirt },
  { route: 'favoritos', label: 'Favoritos', short: 'Favoritos', icon: Heart },
  { route: 'perfil', label: 'Mi perfil', short: 'Perfil', icon: UserRound },
];

const PAGES: Record<Route, () => JSX.Element> = { inicio: Home, crear: Create, tendencias: Trends, armario: Wardrobe, favoritos: Saved, perfil: Profile };

export function App() {
  const hash = useHash();
  const route = parseRoute(hash);
  const open = useApp((s) => s.open);
  const onboarding = useApp((s) => s.onboarding);
  const toast = useApp((s) => s.toast);
  const theme = useApp((s) => s.prefsSlice.theme);
  const sync = useApp((s) => s.sync);
  const mode = useApp((s) => s.prefsSlice.catalogMode);
  const isDemo = mode === 'demo';
  const savedCount = useApp((s) => s.saved.outfits.length + s.saved.productIds.length);
  const profile = useApp((s) => s.profile);

  useEffect(() => { startSync(); }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.setAttribute('data-theme', theme === 'auto' ? (mq.matches ? 'dark' : 'light') : theme);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  // Enlace compartido: #look-estilo-prendas abre ese look.
  useEffect(() => {
    if (!hash.startsWith('look-')) return;
    const s = useApp.getState();
    const outfit = decodeLook(hash, s.prefsSlice.prefs, s.ctx());
    if (outfit) s.openOutfit(outfit); else s.notify('El enlace no corresponde a ningún look');
  }, [hash]);

  useEffect(() => { document.body.style.overflow = open || onboarding ? 'hidden' : ''; }, [open, onboarding]);

  const Page = PAGES[route];
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line px-5 py-7 lg:flex">
        <button type="button" onClick={() => go('inicio')} className="text-left">
          <span className="display block text-[2.6rem] italic leading-none">Percha</span>
          <span className="mt-1 block text-xs text-muted">Tu estilista personal</span>
        </button>
        <nav aria-label="Secciones" className="mt-10 flex flex-col gap-1">
          {NAV.map(({ route: r, label, icon: Icon }) => (
            <button key={r} type="button" onClick={() => go(r)} aria-current={route === r ? 'page' : undefined}
              className={cx('flex h-11 items-center gap-3 rounded-sm px-3 text-sm transition-colors', route === r ? 'bg-ink font-medium text-paper' : 'text-ink hover:bg-tile')}>
              <Icon size={18} strokeWidth={1.75} />{label}
              {r === 'favoritos' && savedCount > 0 && <span className={cx('tabular ml-auto text-xs', route === r ? 'opacity-80' : 'text-muted')}>{savedCount}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 text-2xs leading-relaxed text-muted">
          {profile.isExample && <button type="button" onClick={() => useApp.getState().setOnboarding(true)} className="rounded-sm bg-accent-soft px-3 py-2.5 text-left text-xs text-ink">Perfil de ejemplo activo. <span className="underline underline-offset-2">Configurar el mío</span></button>}
          <p>{isDemo ? 'Catálogo de demostración: productos y precios simulados.' : `Tiendas reales. Precios vistos el ${seenLabel(catalog.seenAt)}.`}</p>
          <p>{sync === 'cloud' ? 'Datos guardados en tu cuenta.' : sync === 'memory' ? 'Este navegador no guarda datos.' : 'Datos guardados en este dispositivo.'}</p>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-line px-6 py-2.5 lg:hidden">
        <button type="button" onClick={() => go('inicio')} className="display text-[1.7rem] italic leading-none">Percha</button>
        <span className="rounded-full border border-dashed border-muted/70 px-2 py-0.5 text-[10px] text-muted">{isDemo ? 'Catálogo de demostración' : `Precios del ${seenLabel(catalog.seenAt)}`}</span>
      </header>

      <main id="main-scroll" className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="mx-auto max-w-[1400px] px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 lg:pb-12 lg:pt-8">
          <Page key={route + mode} />
        </div>
      </main>

      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {NAV.map(({ route: r, short, icon: Icon }) => (
          <button key={r} type="button" onClick={() => go(r)} aria-current={route === r ? 'page' : undefined}
            className={cx('flex h-[60px] flex-col items-center justify-center gap-1 text-[10px]', route === r ? 'font-semibold text-accent' : 'text-muted')}>
            <Icon size={20} strokeWidth={route === r ? 2.2 : 1.6} />{short}
          </button>
        ))}
      </nav>

      {open && <OutfitDetail />}
      <CompareBar />
      {onboarding && <Onboarding />}
      <Toast text={toast?.text ?? null} />
    </div>
  );
}
