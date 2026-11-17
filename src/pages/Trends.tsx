import { useMemo, useState } from 'react';
import { Heart, Pencil, Plus, Trash2, RotateCcw } from 'lucide-react';
import type { Referent, StyleInfo, StyleKey } from '@/domain/types';
import { baseRequest, uid, useApp } from '@/app/store';
import { createWith } from '@/app/router';
import { STYLES, styleName } from '@/data/demo/styles';
import { REAL_REFERENTS as REFERENTS } from '@/data/real/referents';
import { COLORS, luminance } from '@/data/demo/colors';
import { generateOutfits } from '@/features/outfits/engine';
import { resolveOutfit } from '@/services/catalog';
import { LookImage } from '@/ui/figure';
import { OutfitCard } from '@/ui/cards';
import { StylePicker } from '@/ui/forms';
import { Button, Chip, ColorDot, ColorPicker, Confirm, cx, DemoTag, Empty, Field, IconButton, inputCls, Notice, PageHeader, Pill, Segmented, Sheet } from '@/ui/primitives';
import { COUNTRIES } from '@/ui/forms';

const CONTENT: Referent['content'][] = ['Vídeo corto', 'Vídeo largo', 'Fotografía', 'Blog'];

export function Trends() {
  const prefs = useApp((s) => s.prefsSlice.prefs);
  const profile = useApp((s) => s.profile);
  const referents = useApp((s) => s.saved.referents);
  const follows = useApp((s) => s.saved.follows);
  const { patch, notify } = useApp.getState();
  const [tab, setTab] = useState<'estilos' | 'referentes'>('estilos');
  const [styleOpen, setStyleOpen] = useState<StyleInfo | null>(null);
  const [f, setF] = useState({ country: '', style: '', content: '', lang: 'all', onlyMine: false });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Referent | null>(null);
  const [del, setDel] = useState<Referent | null>(null);

  const samples = useMemo(() => {
    const map = new Map<StyleKey, ReturnType<typeof generateOutfits>['outfits']>();
    STYLES.forEach((s, i) => map.set(s.key, generateOutfits(baseRequest(prefs, { styles: [s.key], budget: 0, favColors: [], avoidColors: [], likeTypes: [], avoidTypes: [], brands: [], seed: 500 + i, count: 3 }), { profile, wardrobe: [], referents: [] }).outfits));
    return map;
  }, [prefs.season, prefs.market, profile.pattern]);

  const countries = Array.from(new Set(referents.map((r) => r.country))).sort();
  const list = referents.filter((r) =>
    (!f.country || r.country === f.country) && (!f.style || r.styles.includes(f.style as StyleKey)) && (!f.content || r.content === f.content)
    && (f.lang === 'all' || r.language === f.lang) && (!f.onlyMine || follows.includes(r.id)));
  const filtersOn = !!(f.country || f.style || f.content || f.lang !== 'all' || f.onlyMine);

  const toggleFollow = (r: Referent) => {
    const on = follows.includes(r.id);
    patch('saved', (cur) => ({ ...cur, follows: on ? cur.follows.filter((x) => x !== r.id) : [...cur.follows, r.id] }));
    notify(on ? `Has dejado de seguir a ${r.name}` : `Sigues a ${r.name}: su estilo ya puede inspirar tus looks`);
  };
  const saveRef = (r: Referent) => {
    patch('saved', (cur) => ({ ...cur, referents: cur.referents.some((x) => x.id === r.id) ? cur.referents.map((x) => (x.id === r.id ? r : x)) : [r, ...cur.referents] }));
    setForm(null); notify('Referente guardado');
  };

  return (
    <div>
      <PageHeader title="Tendencias" lead="Guía de estilos y referentes para inspirarte. Elige un estilo o sigue a quien vista como te gustaría vestir." />
      <Segmented label="Sección" value={tab} onChange={setTab} options={[{ value: 'estilos', label: `Estilos (${STYLES.length})` }, { value: 'referentes', label: `Referentes (${referents.length})` }]} />

      {tab === 'estilos' && (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {STYLES.map((s) => {
            const o = samples.get(s.key)?.[0];
            return (
              <button key={s.key} type="button" onClick={() => setStyleOpen(s)} className="group text-left">
                <span className="block aspect-[3/4] overflow-hidden rounded-sm bg-tile">{o && <LookImage items={resolveOutfit(o.pieces, [])} backdrop={o.backdrop} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" label={`Ilustración de un look ${s.name}`} />}</span>
                <span className="display mt-3 block text-2xl leading-tight">{s.name}</span>
                <span className="mt-0.5 block text-[13px] text-muted">{s.line}</span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'referentes' && (
        <div className="mt-6 flex flex-col gap-5">
          <Notice>
            {referents.some((r) => r.demo)
              ? <>Los perfiles marcados como «Perfil demo» <strong>no son personas reales</strong>.</>
              : <>Creadores reales tomados de listas públicas; cada uno enlaza su <strong>fuente</strong>. Los estilos asociados son una clasificación orientativa de Percha.</>}{' '}
            Sirven de inspiración: Percha nunca afirma que alguien recomiende un producto. Edita la lista con «Editar fuente».
          </Notice>
          <div className="flex flex-wrap items-end gap-3">
            <Field id="f-country" label="País"><select id="f-country" className={cx(inputCls, 'h-10 w-40')} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="">Todos</option>{countries.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field id="f-style" label="Estilo"><select id="f-style" className={cx(inputCls, 'h-10 w-44')} value={f.style} onChange={(e) => setF({ ...f, style: e.target.value })}><option value="">Todos</option>{STYLES.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}</select></Field>
            <Field id="f-content" label="Tipo de contenido"><select id="f-content" className={cx(inputCls, 'h-10 w-40')} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })}><option value="">Todos</option>{CONTENT.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Segmented label="Idioma" size="sm" value={f.lang} onChange={(lang) => setF({ ...f, lang })} options={[{ value: 'all', label: 'Todos' }, { value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
            <Chip selected={f.onlyMine} onClick={() => setF({ ...f, onlyMine: !f.onlyMine })}><Heart size={13} />Solo los que sigo</Chip>
            <div className="ml-auto flex gap-2">
              {filtersOn && <Button size="sm" variant="ghost" onClick={() => setF({ country: '', style: '', content: '', lang: 'all', onlyMine: false })}>Quitar filtros</Button>}
              <Button size="sm" variant={editing ? 'primary' : 'outline'} onClick={() => setEditing((v) => !v)}><Pencil size={14} />{editing ? 'Terminar edición' : 'Editar fuente'}</Button>
            </div>
          </div>
          {editing && (
            <div className="flex flex-wrap items-center gap-2 rounded-sm bg-surface p-3">
              <span className="mr-auto text-[13px] text-muted">Fuente editable: {referents.length} referentes guardados en tus datos.</span>
              <Button size="sm" onClick={() => setForm({ id: uid('r'), demo: false, custom: true, name: '', handle: '', country: 'España', language: 'es', content: 'Vídeo corto', styles: [], bio: '', signature: [], palette: [] })}><Plus size={14} />Añadir referente</Button>
              <Button size="sm" variant="outline" onClick={() => { patch('saved', (cur) => ({ ...cur, referents: REFERENTS, follows: cur.follows.filter((id) => REFERENTS.some((r) => r.id === id)) })); notify('Lista inicial restaurada'); }}><RotateCcw size={14} />Restaurar lista inicial</Button>
            </div>
          )}
          <p className="text-[13px] text-muted">{list.length} de {referents.length} referentes</p>
          {list.length === 0 && <Empty title="Ningún referente con estos filtros" body="Quita algún filtro o añade tus propios referentes desde «Editar fuente»." />}
          <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {list.map((r) => {
              const on = follows.includes(r.id);
              const tint = COLORS[r.palette[0] ?? 'gris'].hex;
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-sm bg-surface p-5">
                  <div className="flex items-start gap-3">
                    <span className="display flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl italic" style={{ background: tint, color: luminance(tint) > 0.55 ? '#14182b' : '#fff' }} aria-hidden>{r.name.charAt(0)}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold leading-tight">{r.name}{r.demo ? <DemoTag label="Perfil demo" /> : r.custom && <Pill tone="accent">Añadido por ti</Pill>}</h3>
                      <p className="mt-0.5 text-xs text-muted">{[r.handle, r.country, r.content, r.language === 'es' ? 'Español' : 'English'].filter(Boolean).join(', ')}</p>
                    </div>
                    <IconButton label={on ? 'Dejar de seguir' : 'Seguir'} active={on} onClick={() => toggleFollow(r)} className="border border-line"><Heart size={16} fill={on ? 'currentColor' : 'none'} /></IconButton>
                  </div>
                  <p className="text-sm leading-relaxed">{r.bio}</p>
                  <div className="flex flex-wrap gap-1.5">{r.styles.map((s) => <Pill key={s}>{styleName(s)}</Pill>)}</div>
                  {r.signature.length > 0 && <p className="text-xs text-muted">Su sello: {r.signature.join(', ').toLowerCase()}.</p>}
                  {r.palette.length > 0 && <div className="flex gap-1.5">{r.palette.map((c) => <ColorDot key={c} color={c} size={16} />)}</div>}
                  {r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-2">Fuente de estos datos</a>}
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" disabled={r.styles.length === 0} onClick={() => createWith({ styles: r.styles.slice(0, 2), referentIds: [r.id], favColors: r.palette, text: '' })}>Looks inspirados en su estilo</Button>
                    {editing && <><Button size="sm" variant="ghost" onClick={() => setForm(r)}><Pencil size={14} />Editar</Button><Button size="sm" variant="ghost" onClick={() => setDel(r)}><Trash2 size={14} />Borrar</Button></>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Sheet open={!!styleOpen} onClose={() => setStyleOpen(null)} title={styleOpen?.name ?? ''} wide
        footer={styleOpen && <Button variant="accent" onClick={() => { const k = styleOpen.key; setStyleOpen(null); createWith({ styles: [k] }); }}>Crear un outfit {styleOpen.name}</Button>}>
        {styleOpen && (
          <div className="flex flex-col gap-5">
            <p className="display text-3xl leading-tight">{styleOpen.line}</p>
            <p className="max-w-[62ch] text-sm leading-relaxed">{styleOpen.about}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div><h3 className="text-[13px] font-semibold">Prendas clave</h3><p className="mt-1 text-sm text-muted">{styleOpen.keyPieces.join(', ')}.</p></div>
              <div><h3 className="text-[13px] font-semibold">Cómo se lleva ahora</h3><p className="mt-1 text-sm text-muted">{styleOpen.trend}</p></div>
              <div><h3 className="text-[13px] font-semibold">Paleta</h3><div className="mt-2 flex flex-wrap gap-3">{styleOpen.palette.map((c) => <span key={c} className="flex items-center gap-1.5 text-xs"><ColorDot color={c} />{COLORS[c].name}</span>)}</div></div>
              <div><h3 className="text-[13px] font-semibold">Combina bien con</h3><div className="mt-2 flex flex-wrap gap-1.5">{styleOpen.related.map((k) => <Chip key={k} onClick={() => setStyleOpen(STYLES.find((s) => s.key === k)!)}>{styleName(k)}</Chip>)}</div></div>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold">Looks de ejemplo</h3>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">{(samples.get(styleOpen.key) ?? []).map((o) => <OutfitCard key={o.id} outfit={o} size="sm" />)}</div>
            </div>
            <p className="text-2xs text-muted">Guía editorial propia de Percha, no datos de tendencia en tiempo real.</p>
          </div>
        )}
      </Sheet>

      <ReferentForm value={form} onClose={() => setForm(null)} onSave={saveRef} />
      <Confirm open={!!del} title="Borrar referente" body={`Se quitará a ${del?.name} de tu lista de referentes.`} action="Borrar" onClose={() => setDel(null)}
        onConfirm={() => { patch('saved', (cur) => ({ ...cur, referents: cur.referents.filter((x) => x.id !== del!.id), follows: cur.follows.filter((x) => x !== del!.id) })); notify('Referente borrado'); }} />
    </div>
  );
}

function ReferentForm({ value, onClose, onSave }: { value: Referent | null; onClose: () => void; onSave: (r: Referent) => void }) {
  const [draft, setDraft] = useState<Referent | null>(null);
  const [tried, setTried] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [sig, setSig] = useState('');
  if (value && value.id !== key) { setKey(value.id); setDraft(value); setTried(false); setSig(value.signature.join(', ')); }
  if (!value && key) { setKey(null); setDraft(null); }
  const d = draft;
  const set = (p: Partial<Referent>) => setDraft((cur) => (cur ? { ...cur, ...p } : cur));
  const nameErr = tried && d && !d.name.trim() ? 'Escribe un nombre.' : null;
  const styleErr = tried && d && d.styles.length === 0 ? 'Elige al menos un estilo: es lo que usamos como inspiración.' : null;
  const urlErr = tried && d?.sourceUrl && !/^https?:\/\//.test(d.sourceUrl) ? 'El enlace debe empezar por https://' : null;
  return (
    <Sheet open={!!value} onClose={onClose} wide title={value?.name ? `Editar ${value.name}` : 'Añadir referente'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={() => { setTried(true); if (d && d.name.trim() && d.styles.length && (!d.sourceUrl || /^https?:\/\//.test(d.sourceUrl))) onSave({ ...d, name: d.name.trim(), demo: d.demo && !d.custom ? d.demo : false }); }}>Guardar referente</Button></>}>
      {d && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="r-name" label="Nombre" error={nameErr}><input id="r-name" className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field id="r-handle" label="Usuario o canal" optional><input id="r-handle" className={inputCls} value={d.handle} onChange={(e) => set({ handle: e.target.value })} placeholder="@usuario" /></Field>
            <Field id="r-country" label="País"><select id="r-country" className={inputCls} value={d.country} onChange={(e) => set({ country: e.target.value })}>{Array.from(new Set([d.country, ...COUNTRIES, 'Australia'])).map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field id="r-lang" label="Idioma"><select id="r-lang" className={inputCls} value={d.language} onChange={(e) => set({ language: e.target.value as 'es' | 'en' })}><option value="es">Español</option><option value="en">English</option></select></Field>
            <Field id="r-content" label="Tipo de contenido"><select id="r-content" className={inputCls} value={d.content} onChange={(e) => set({ content: e.target.value as Referent['content'] })}>{CONTENT.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field id="r-url" label="Fuente verificable" optional error={urlErr} hint="Enlace público donde se vea su estilo."><input id="r-url" className={inputCls} value={d.sourceUrl ?? ''} onChange={(e) => set({ sourceUrl: e.target.value || undefined })} placeholder="https://" inputMode="url" /></Field>
          </div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Estilos asociados</span><StylePicker value={d.styles} onChange={(styles) => set({ styles })} />{styleErr && <p className="text-2xs text-bad">{styleErr}</p>}</div>
          <Field id="r-bio" label="Descripción" optional><textarea id="r-bio" rows={2} className="w-full rounded-sm border border-line bg-surface p-3 text-sm outline-none focus:border-ink" value={d.bio} onChange={(e) => set({ bio: e.target.value })} /></Field>
          <Field id="r-sig" label="Prendas o gestos característicos" optional hint="Separados por comas."><input id="r-sig" className={inputCls} value={sig} onChange={(e) => { setSig(e.target.value); set({ signature: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) }); }} /></Field>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Paleta habitual <span className="font-normal text-muted">(opcional)</span></span><ColorPicker label="Paleta habitual" value={d.palette} onChange={(palette) => set({ palette })} /></div>
        </div>
      )}
    </Sheet>
  );
}
