// Estado global (zustand). La UI solo lee de aquí y llama acciones; la lógica vive en features/ y services/.
import { create } from 'zustand';
import type {
  Collection, GenRequest, Measurements, Outfit, Prefs, Profile, Referent, SearchRecord, WardrobeItem,
} from '@/domain/types';
import { currentSeason, occasionLabel, seasonLabel } from '@/domain/garments';
import { WARDROBE_SEED } from '@/data/demo/referents';
import { REAL_REFERENTS } from '@/data/real/referents';
import { setCatalogMode, type CatalogMode } from '@/services/catalog';
import { styleName } from '@/data/demo/styles';
import { generateOutfits, type EngineCtx, type GenResult } from '@/features/outfits/engine';
import type { TextHints } from '@/features/outfits/textQuery';
import { local, SLICES, type Slice, type Stored } from '@/services/storage';
import { connectCloud, type CloudHandle } from '@/services/storage/cloud';

export interface Saved {
  outfits: Outfit[];
  productIds: string[];
  collections: Collection[];
  history: SearchRecord[];
  follows: string[];
  referents: Referent[];
}
export interface PrefsSlice { prefs: Prefs; theme: 'light' | 'dark' | 'auto'; catalogMode: CatalogMode }

const EXAMPLE_MEASURES: Measurements = { height: 176, weight: 72, chest: 96, waist: 82, hip: 97, shoulders: 44, leg: 106, inseam: 80, arm: 61, neck: 38, footLength: null, shoeEU: 43 };
export const EMPTY_MEASURES: Measurements = { height: null, weight: null, chest: null, waist: null, hip: null, shoulders: null, leg: null, inseam: null, arm: null, neck: null, footLength: null, shoeEU: null };

const defaults = {
  profile: (): Profile => ({ isExample: true, name: '', age: null, pattern: 'masculino', country: 'España', units: 'metric', fitPreference: 'normal', measures: EXAMPLE_MEASURES, photos: [], consentTraining: false }),
  prefs: (): PrefsSlice => ({ prefs: { styles: ['casual', 'minimal'], season: currentSeason(), occasion: 'diario', budget: 250, favColors: [], avoidColors: [], likeTypes: [], avoidTypes: [], boldness: 3, brands: [], market: 'ES' }, theme: 'light', catalogMode: 'real' }),
  wardrobe: (): WardrobeItem[] => WARDROBE_SEED,
  saved: (): Saved => ({ outfits: [], productIds: [], collections: [], history: [], follows: REAL_REFERENTS.filter((r) => r.id.startsWith('y')).map((r) => r.id), referents: REAL_REFERENTS }),
};

function load<T>(slice: Slice, fallback: () => T): Stored<T> {
  const s = local.read<T>(slice);
  if (s && s.data != null) return s;
  return { data: fallback(), updatedAt: 0 };
}

export const uid = (p = 'x') => p + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);

interface State {
  profile: Profile;
  prefsSlice: PrefsSlice;
  wardrobe: WardrobeItem[];
  saved: Saved;
  updatedAt: Record<Slice, number>;
  sync: 'local' | 'cloud' | 'cloud-error' | 'memory';
  // sesión (no se guarda en la nube)
  results: Outfit[];
  resultNotes: string[];
  resultHints: TextHints | null;
  lastRequest: GenRequest | null;
  open: Outfit | null;
  compare: Outfit[];
  toast: { id: number; text: string } | null;
  onboarding: boolean;
  /** petición preparada desde otra pantalla para que «Crear outfit» la ejecute al abrirse */
  pending: Partial<GenRequest> | null;
  // acciones
  patch<K extends Slice>(slice: K, fn: (cur: SliceData[K]) => SliceData[K]): void;
  setProfile(p: Partial<Profile>): void;
  setMeasures(m: Partial<Measurements>): void;
  setPrefs(p: Partial<Prefs>): void;
  setTheme(t: PrefsSlice['theme']): void;
  setCatalog(m: CatalogMode): void;
  ctx(): EngineCtx;
  generate(req: GenRequest, record?: boolean): GenResult;
  openOutfit(o: Outfit | null): void;
  updateOpen(o: Outfit): void;
  toggleSaveOutfit(o: Outfit): void;
  toggleSaveProduct(id: string): void;
  toggleCompare(o: Outfit): void;
  clearCompare(): void;
  notify(text: string): void;
  setOnboarding(v: boolean): void;
  resetAll(): Promise<void>;
  exportData(): string;
  importData(json: string): { ok: true; counts: { wardrobe: number; outfits: number } } | { ok: false; error: string };
}
interface SliceData { profile: Profile; prefs: PrefsSlice; wardrobe: WardrobeItem[]; saved: Saved }

const KEY_OF: Record<Slice, 'profile' | 'prefsSlice' | 'wardrobe' | 'saved'> = { profile: 'profile', prefs: 'prefsSlice', wardrobe: 'wardrobe', saved: 'saved' };
let cloud: CloudHandle | null = null;

const boot = {
  profile: load('profile', defaults.profile),
  prefs: load('prefs', defaults.prefs),
  wardrobe: load('wardrobe', defaults.wardrobe),
  saved: load('saved', defaults.saved),
};
// Compatibilidad hacia delante: completa campos que falten en datos guardados por versiones anteriores.
boot.profile.data = { ...defaults.profile(), ...boot.profile.data, measures: { ...EMPTY_MEASURES, ...boot.profile.data.measures } };
boot.prefs.data = { ...defaults.prefs(), ...boot.prefs.data, prefs: { ...defaults.prefs().prefs, ...boot.prefs.data.prefs } };
boot.saved.data = migrateSaved({ ...defaults.saved(), ...boot.saved.data });
setCatalogMode(boot.prefs.data.catalogMode);

/** Quien aún tenga la lista de referentes ficticios sin tocar pasa a la lista real. */
function migrateSaved(s: Saved): Saved {
  if (s.referents.length > 0 && s.referents.every((r) => r.demo)) {
    s = { ...s, referents: REAL_REFERENTS, follows: [] };
  }
  // Referentes añadidos en versiones posteriores: se incorporan a la lista guardada y se siguen por defecto.
  const missing = REAL_REFERENTS.filter((r) => r.id.startsWith('y') && !s.referents.some((x) => x.id === r.id));
  if (missing.length) s = { ...s, referents: [...missing, ...s.referents], follows: [...missing.map((r) => r.id), ...s.follows] };
  return s;
}

const session = local.read<{ results: Outfit[]; lastRequest: GenRequest | null }>('session');

export const useApp = create<State>((set, get) => ({
  profile: boot.profile.data,
  prefsSlice: boot.prefs.data,
  wardrobe: boot.wardrobe.data,
  saved: boot.saved.data,
  updatedAt: { profile: boot.profile.updatedAt, prefs: boot.prefs.updatedAt, wardrobe: boot.wardrobe.updatedAt, saved: boot.saved.updatedAt },
  sync: local.available() ? 'local' : 'memory',
  results: session?.data.results ?? [],
  resultNotes: [],
  resultHints: null,
  lastRequest: session?.data.lastRequest ?? null,
  open: null,
  compare: [],
  toast: null,
  onboarding: false,
  pending: null,

  patch(slice, fn) {
    const key = KEY_OF[slice];
    const next = fn((get() as any)[key]);
    const updatedAt = Date.now();
    set({ [key]: next, updatedAt: { ...get().updatedAt, [slice]: updatedAt } } as any);
    const stored = { data: next, updatedAt };
    local.write(slice, stored);
    cloud?.push(slice, stored);
  },
  setProfile(p) { get().patch('profile', (cur) => ({ ...cur, ...p })); },
  setMeasures(m) { get().patch('profile', (cur) => ({ ...cur, measures: { ...cur.measures, ...m } })); },
  setPrefs(p) { get().patch('prefs', (cur) => ({ ...cur, prefs: { ...cur.prefs, ...p } })); },
  setTheme(theme) { get().patch('prefs', (cur) => ({ ...cur, theme })); },
  setCatalog(catalogMode) {
    setCatalogMode(catalogMode);
    get().patch('prefs', (cur) => ({ ...cur, catalogMode, prefs: { ...cur.prefs, brands: [] } }));
    set({ results: [], resultNotes: [], resultHints: null });
    local.remove('session');
  },
  ctx() { const s = get(); return { profile: s.profile, wardrobe: s.wardrobe, referents: s.saved.referents }; },

  generate(req, record = true) {
    const res = generateOutfits(req, get().ctx());
    set({ results: res.outfits, resultNotes: res.notes, resultHints: res.hints, lastRequest: req });
    local.write('session', { data: { results: res.outfits, lastRequest: req }, updatedAt: Date.now() });
    if (record && res.outfits.length) {
      const e = res.effective;
      const summary = [e.styles.map(styleName).join(' + '), seasonLabel(e.season), occasionLabel(e.occasion), e.budget ? `máx. ${e.budget} €` : 'sin límite'].join(', ');
      const rec: SearchRecord = { id: uid('h'), at: Date.now(), request: req, resultCount: res.outfits.length, summary };
      get().patch('saved', (cur) => ({ ...cur, history: [rec, ...cur.history].slice(0, 20) }));
    }
    return res;
  },
  openOutfit(o) { set({ open: o }); },
  updateOpen(o) {
    const prev = get().open;
    set({ open: o, results: get().results.map((r) => (prev && r.id === prev.id ? o : r)) });
  },
  toggleSaveOutfit(o) {
    const has = get().saved.outfits.some((x) => x.id === o.id);
    get().patch('saved', (cur) => ({
      ...cur,
      outfits: has ? cur.outfits.filter((x) => x.id !== o.id) : [o, ...cur.outfits],
      collections: has ? cur.collections.map((c) => ({ ...c, outfitIds: c.outfitIds.filter((id) => id !== o.id) })) : cur.collections,
    }));
    get().notify(has ? 'Look quitado de guardados' : 'Look guardado');
  },
  toggleSaveProduct(id) {
    const has = get().saved.productIds.includes(id);
    get().patch('saved', (cur) => ({ ...cur, productIds: has ? cur.productIds.filter((x) => x !== id) : [id, ...cur.productIds] }));
    get().notify(has ? 'Prenda quitada de guardados' : 'Prenda guardada');
  },
  toggleCompare(o) {
    const cur = get().compare;
    if (cur.some((x) => x.id === o.id)) set({ compare: cur.filter((x) => x.id !== o.id) });
    else if (cur.length >= 3) get().notify('Puedes comparar hasta 3 looks a la vez');
    else set({ compare: [...cur, o] });
  },
  clearCompare() { set({ compare: [] }); },
  notify(text) {
    const id = Date.now();
    set({ toast: { id, text } });
    window.setTimeout(() => { if (get().toast?.id === id) set({ toast: null }); }, 2600);
  },
  setOnboarding(v) { set({ onboarding: v }); },
  exportData() {
    const s = get();
    return JSON.stringify({ app: 'percha', version: 1, exportedAt: new Date().toISOString(), profile: s.profile, prefs: s.prefsSlice, wardrobe: s.wardrobe, saved: s.saved });
  },
  importData(json) {
    let d: any;
    try { d = JSON.parse(json); } catch { return { ok: false, error: 'El archivo no se puede leer. Tiene que ser el que descargaste con «Exportar mis datos».' }; }
    if (!d || d.app !== 'percha' || !d.profile || !Array.isArray(d.wardrobe)) return { ok: false, error: 'Este archivo no es una copia de Percha.' };
    const profile = { ...defaults.profile(), ...d.profile, measures: { ...EMPTY_MEASURES, ...d.profile.measures }, photos: Array.isArray(d.profile.photos) ? d.profile.photos : [] };
    const prefs = { ...defaults.prefs(), ...d.prefs, prefs: { ...defaults.prefs().prefs, ...d.prefs?.prefs } };
    const saved = migrateSaved({ ...defaults.saved(), ...d.saved });
    const wardrobe = (d.wardrobe as WardrobeItem[]).filter((w) => w && w.id && w.type);
    get().patch('profile', () => profile);
    get().patch('prefs', () => prefs);
    get().patch('wardrobe', () => wardrobe);
    get().patch('saved', () => saved);
    setCatalogMode(prefs.catalogMode);
    return { ok: true, counts: { wardrobe: wardrobe.length, outfits: saved.outfits.length } };
  },
  async resetAll() {
    SLICES.forEach((s) => local.remove(s));
    local.remove('session');
    await cloud?.wipe();
    setCatalogMode('real');
    set({
      profile: defaults.profile(), prefsSlice: defaults.prefs(), wardrobe: defaults.wardrobe(), saved: defaults.saved(),
      updatedAt: { profile: 0, prefs: 0, wardrobe: 0, saved: 0 }, results: [], resultNotes: [], lastRequest: null, open: null, compare: [],
    });
  },
}));

/** Conecta el almacén privado en la nube cuando el alojamiento lo ofrece. Las fotos nunca salen del dispositivo. */
let syncStarted = false;
export function startSync() {
  if (syncStarted) return;
  syncStarted = true;
  void connectCloud(
    (slice) => ({ data: (useApp.getState() as any)[KEY_OF[slice]], updatedAt: useApp.getState().updatedAt[slice] }),
    (slice, value) => {
      const s = useApp.getState();
      let data = value.data as any;
      if (slice === 'profile') data = { ...defaults.profile(), ...data, measures: { ...EMPTY_MEASURES, ...data.measures }, photos: s.profile.photos };
      if (slice === 'prefs') { data = { ...defaults.prefs(), ...data, prefs: { ...defaults.prefs().prefs, ...data.prefs } }; setCatalogMode(data.catalogMode); }
      if (slice === 'saved') data = migrateSaved({ ...defaults.saved(), ...data });
      if (slice === 'wardrobe') data = (data as WardrobeItem[]).map((w) => ({ ...w, photo: s.wardrobe.find((x) => x.id === w.id)?.photo }));
      useApp.setState({ [KEY_OF[slice]]: data, updatedAt: { ...useApp.getState().updatedAt, [slice]: value.updatedAt } } as any);
      local.write(slice, { data, updatedAt: value.updatedAt });
    },
    (status) => useApp.setState({ sync: status }),
  ).then((h) => { cloud = h; });
}

export const usePrefs = () => useApp((s) => s.prefsSlice.prefs);
export const isOutfitSaved = (saved: Saved, id: string) => saved.outfits.some((o) => o.id === id);
export function baseRequest(prefs: Prefs, over: Partial<GenRequest> = {}): GenRequest {
  return { ...prefs, text: '', source: 'catalog', referentIds: [], count: 4, seed: Math.floor(Math.random() * 1e9), ...over };
}
