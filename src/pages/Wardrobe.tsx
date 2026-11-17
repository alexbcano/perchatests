import { useMemo, useRef, useState } from 'react';
import { Camera, ExternalLink, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, ColorKey, GarmentType, Season, WardrobeItem } from '@/domain/types';
import { uid, useApp } from '@/app/store';
import { createWith } from '@/app/router';
import { CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_PLURAL, GARMENT_TYPES, SEASONS, TYPE_INFO, categoryOf, currentSeason, seasonLabel, typeLabel } from '@/domain/garments';
import { COLORS, COLOR_KEYS, colorName } from '@/data/demo/colors';
import { wardrobeToProduct } from '@/services/catalog';
import { ProductThumb } from '@/ui/figure';
import { hostOf, readStoreLink, splitLinks } from '@/features/wardrobe/fromLink';
import { Button, Chip, ColorDot, Confirm, cx, Empty, Field, IconButton, inputCls, Notice, PageHeader, Pill, readImage, Segmented, Sheet } from '@/ui/primitives';

const blank = (): WardrobeItem => ({ id: uid('w'), name: '', type: 'tee', brand: '', color: 'blanco', seasons: [currentSeason()], addedAt: Date.now() });

export function Wardrobe() {
  const wardrobe = useApp((s) => s.wardrobe);
  const { patch, notify } = useApp.getState();
  const [cat, setCat] = useState<'all' | Category>('all');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<WardrobeItem | null>(null);
  const [del, setDel] = useState<WardrobeItem | null>(null);
  const [links, setLinks] = useState(false);
  const examples = wardrobe.filter((w) => w.example).length;

  const list = wardrobe.filter((w) =>
    (cat === 'all' || categoryOf(w.type) === cat) && (!color || w.color === color) && (!season || w.seasons.includes(season as Season))
    && (!q.trim() || `${w.name} ${w.brand} ${typeLabel(w.type)}`.toLowerCase().includes(q.trim().toLowerCase())));
  const usedColors = Array.from(new Set(wardrobe.map((w) => w.color)));
  const counts = useMemo(() => CATEGORY_ORDER.map((c) => ({ c, n: wardrobe.filter((w) => categoryOf(w.type) === c).length })), [wardrobe]);
  const filtersOn = cat !== 'all' || !!color || !!season || !!q.trim();

  const save = (item: WardrobeItem) => {
    const exists = wardrobe.some((w) => w.id === item.id);
    patch('wardrobe', (cur) => (exists ? cur.map((w) => (w.id === item.id ? item : w)) : [item, ...cur]));
    setForm(null);
    notify(exists ? 'Prenda actualizada' : 'Prenda añadida a tu armario');
  };

  return (
    <div>
      <PageHeader title="Mi armario" lead="Registra lo que ya tienes. Percha lo combina primero y solo propone comprar lo que falta."
        action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setLinks(true)}><Link2 size={16} />Añadir desde enlace</Button><Button onClick={() => setForm(blank())}><Plus size={16} />Añadir prenda</Button></div>} />

      {examples > 0 && (
        <Notice>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Hay {examples} prendas de <strong>ejemplo</strong> para que puedas probar el armario. Quítalas cuando añadas las tuyas.</span>
            <Button size="sm" variant="outline" onClick={() => { patch('wardrobe', (cur) => cur.filter((w) => !w.example)); notify('Prendas de ejemplo quitadas'); }}>Quitar ejemplos</Button>
          </div>
        </Notice>
      )}

      {wardrobe.length > 0 && (
        <div className="mt-5 flex flex-col gap-4 rounded-sm bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="display text-3xl">{wardrobe.length} {wardrobe.length === 1 ? 'prenda' : 'prendas'}</p>
            <p className="mt-1 text-[13px] text-muted">{counts.filter((x) => x.n).map((x) => `${x.n} ${(x.n === 1 ? CATEGORY_LABEL[x.c] : CATEGORY_PLURAL[x.c]).toLowerCase()}`).join(', ')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" onClick={() => createWith({ source: 'wardrobe' })}>Crear looks solo con mi armario</Button>
            <Button variant="outline" onClick={() => createWith({ source: 'mix' })}>Combinar con compras</Button>
          </div>
        </div>
      )}

      {wardrobe.length === 0 ? (
        <div className="mt-6"><Empty title="Tu armario está vacío" body="Añade las prendas que más usas: con una parte de arriba, una de abajo y un calzado ya se pueden crear looks sin comprar nada." action={<div className="flex flex-wrap justify-center gap-2"><Button onClick={() => setForm(blank())}><Plus size={16} />Añadir mi primera prenda</Button><Button variant="outline" onClick={() => setLinks(true)}><Link2 size={16} />Pegar enlace de tienda</Button></div>} /></div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <Segmented label="Tipo de prenda" size="sm" value={cat} onChange={setCat} options={[{ value: 'all', label: 'Todas' }, ...CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_PLURAL[c] }))]} />
            <Field id="w-color" label="Color"><select id="w-color" className={cx(inputCls, 'h-10 w-40')} value={color} onChange={(e) => setColor(e.target.value)}><option value="">Todos</option>{usedColors.map((c) => <option key={c} value={c}>{colorName(c)}</option>)}</select></Field>
            <Field id="w-season" label="Temporada"><select id="w-season" className={cx(inputCls, 'h-10 w-36')} value={season} onChange={(e) => setSeason(e.target.value)}><option value="">Todas</option>{SEASONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
            <Field id="w-q" label="Buscar por nombre o marca"><input id="w-q" className={cx(inputCls, 'h-10 w-48')} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: vaquero" /></Field>
            {filtersOn && <Button size="sm" variant="ghost" onClick={() => { setCat('all'); setColor(''); setSeason(''); setQ(''); }}>Quitar filtros</Button>}
          </div>
          <p className="mt-4 text-[13px] text-muted">{list.length} de {wardrobe.length} prendas</p>
          {list.length === 0 && <div className="mt-3"><Empty title="Nada con estos filtros" body="Prueba con otra categoría, color o temporada." /></div>}
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {list.map((w) => (
              <li key={w.id} className="relative flex min-w-0 flex-col">
                <div className="aspect-square w-full overflow-hidden rounded-sm bg-tile"><ProductThumb product={wardrobeToProduct(w)} className="h-full w-full" /></div>
                <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                  <IconButton label={`Editar ${w.name}`} onClick={() => setForm(w)} className="h-9 w-9"><Pencil size={15} /></IconButton>
                  <IconButton label={`Eliminar ${w.name}`} onClick={() => setDel(w)} className="h-9 w-9"><Trash2 size={15} /></IconButton>
                </div>
                <p className="mt-2.5 text-sm font-medium leading-snug">{w.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted"><ColorDot color={w.color} size={12} />{typeLabel(w.type)}{w.brand && `, ${w.brand}`}{w.example && <Pill>Ejemplo</Pill>}</p>
                <p className="mt-0.5 text-2xs text-muted">{w.seasons.length === 4 ? 'Todo el año' : w.seasons.map(seasonLabel).join(', ')}</p>
                {w.url && <a href={w.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 self-start text-xs font-medium underline underline-offset-2"><ExternalLink size={12} />Ver en {hostOf(w.url)}</a>}
              </li>
            ))}
          </ul>
        </>
      )}

      <WardrobeForm value={form} onClose={() => setForm(null)} onSave={save} />
      <LinkSheet open={links} onClose={() => setLinks(false)}
        onOne={(item) => { setLinks(false); setForm(item); }}
        onMany={(items) => { patch('wardrobe', (cur) => [...items, ...cur]); setLinks(false); notify(`${items.length} prendas añadidas. Repasa el tipo y el color de cada una.`); }} />
      <Confirm open={!!del} title="Eliminar prenda" body={`«${del?.name}» se quitará de tu armario${del?.photo ? ' y su fotografía se borrará' : ''}.`} action="Eliminar" onClose={() => setDel(null)}
        onConfirm={() => { patch('wardrobe', (cur) => cur.filter((w) => w.id !== del!.id)); notify('Prenda eliminada'); }} />
    </div>
  );
}

function WardrobeForm({ value, onClose, onSave }: { value: WardrobeItem | null; onClose: () => void; onSave: (w: WardrobeItem) => void }) {
  const [d, setD] = useState<WardrobeItem | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const wasSaved = useApp((s) => !!value && s.wardrobe.some((w) => w.id === value.id));
  if (value && value.id !== key) { setKey(value.id); setD(value); setTried(false); setPhotoErr(null); }
  if (!value && key) { setKey(null); setD(null); }
  const set = (p: Partial<WardrobeItem>) => setD((cur) => (cur ? { ...cur, ...p } : cur));
  const seasonErr = tried && d && d.seasons.length === 0 ? 'Elige al menos una temporada.' : null;
  const submit = () => {
    setTried(true);
    if (!d || d.seasons.length === 0) return;
    const name = d.name.trim() || `${typeLabel(d.type)} ${colorName(d.color).toLowerCase()}`;
    onSave({ ...d, name, brand: d.brand.trim(), url: d.url?.trim() || undefined, imageUrl: d.imageUrl?.trim() || undefined, example: undefined });
  };
  return (
    <Sheet open={!!value} onClose={onClose} title={value && wasSaved ? 'Editar prenda' : 'Añadir prenda'} wide
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={submit}>Guardar prenda</Button></>}>
      {d && (
        <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
          <div className="flex flex-col gap-2">
            <div className="aspect-square w-40 overflow-hidden rounded-sm bg-tile sm:w-full"><ProductThumb product={wardrobeToProduct(d)} className="h-full w-full" /></div>
            <input ref={file} id="w-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = '';
              if (!f) return;
              try { set({ photo: await readImage(f, 520) }); setPhotoErr(null); } catch { setPhotoErr('No se pudo leer la imagen. Prueba con un JPG o PNG.'); }
            }} />
            <Button size="sm" variant="outline" onClick={() => file.current?.click()}><Camera size={14} />{d.photo ? 'Cambiar foto' : 'Subir foto'}</Button>
            {d.photo && <Button size="sm" variant="ghost" onClick={() => set({ photo: undefined })}>Quitar foto</Button>}
            {photoErr && <p className="text-2xs text-bad">{photoErr}</p>}
            <p className="text-2xs leading-relaxed text-muted">{d.photo ? 'La foto se guarda solo en este dispositivo.' : 'Sin foto se muestra un dibujo según el tipo y el color.'}</p>
          </div>
          <div className="flex flex-col gap-4">
            {d.url && !wasSaved && (
              <Notice>{d.catalogId
                ? <>Esta prenda ya está en el catálogo de Percha: hemos copiado su nombre, tipo y color de la ficha{d.imageUrl ? ', y su foto' : ' (de esta no tenemos foto)'}.</>
                : <>Percha no puede abrir la página de la tienda, así que la marca y el nombre salen del propio enlace. <strong>Repasa el tipo y el color</strong> antes de guardar.</>}</Notice>
            )}
            <Field id="w-type" label="Tipo de prenda">
              <select id="w-type" className={inputCls} value={d.type} onChange={(e) => set({ type: e.target.value as GarmentType })}>
                {CATEGORY_ORDER.map((c) => <optgroup key={c} label={CATEGORY_PLURAL[c]}>{GARMENT_TYPES.filter((t) => TYPE_INFO[t].category === c).map((t) => <option key={t} value={t}>{TYPE_INFO[t].label}</option>)}</optgroup>)}
              </select>
            </Field>
            <Field id="w-name" label="Nombre" optional hint="Si lo dejas vacío usamos el tipo y el color."><input id="w-name" className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder={`${typeLabel(d.type)} ${colorName(d.color).toLowerCase()}`} /></Field>
            <Field id="w-brand" label="Marca" optional><input id="w-brand" className={inputCls} value={d.brand} onChange={(e) => set({ brand: e.target.value })} /></Field>
            <Field id="w-url" label="Enlace de la tienda" optional hint="La ficha donde la compraste. Sale como botón en tu armario y en los looks."><input id="w-url" type="url" inputMode="url" className={inputCls} value={d.url ?? ''} onChange={(e) => set({ url: e.target.value, catalogId: undefined })} placeholder="https://…" /></Field>
            {!d.photo && <Field id="w-img" label="Enlace de la foto" optional hint="En la web de la tienda: mantén pulsada la foto (o clic derecho) y copia la dirección de la imagen."><input id="w-img" type="url" inputMode="url" className={inputCls} value={d.imageUrl ?? ''} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://…jpg" /></Field>}
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium">Color principal: <span className="font-normal text-muted">{colorName(d.color)}</span></span>
              <div role="radiogroup" aria-label="Color principal" className="flex flex-wrap gap-2">
                {COLOR_KEYS.map((c: ColorKey) => <button key={c} type="button" role="radio" aria-checked={d.color === c} aria-label={COLORS[c].name} onClick={() => set({ color: c })}><ColorDot color={c} size={28} ring={d.color === c} /></button>)}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium">Temporadas en las que la usas</span>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((s) => { const on = d.seasons.includes(s.key); return <Chip key={s.key} selected={on} onClick={() => set({ seasons: on ? d.seasons.filter((x) => x !== s.key) : [...d.seasons, s.key] })}>{s.label}</Chip>; })}
                <Chip selected={d.seasons.length === 4} onClick={() => set({ seasons: d.seasons.length === 4 ? [] : SEASONS.map((s) => s.key) })}>Todo el año</Chip>
              </div>
              {seasonErr && <p className="text-2xs text-bad">{seasonErr}</p>}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function LinkSheet({ open, onClose, onOne, onMany }: { open: boolean; onClose: () => void; onOne: (w: WardrobeItem) => void; onMany: (w: WardrobeItem[]) => void }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const found = splitLinks(text);
  const read = () => {
    const items = found.map(readStoreLink).flatMap((r) => (r.ok && r.item ? [r.item] : []));
    if (items.length === 0) { setErr('Pega al menos un enlace de una tienda, por ejemplo https://scuffers.com/products/…'); return; }
    setText(''); setErr(null);
    if (items.length === 1) onOne(items[0]);
    else onMany(items.map((w) => ({ ...w, name: w.name || `${typeLabel(w.type)} ${colorName(w.color).toLowerCase()}` })));
  };
  return (
    <Sheet open={open} onClose={onClose} title="Añadir desde enlace"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={read}>{found.length > 1 ? `Añadir ${found.length} prendas` : 'Leer enlace'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Field id="w-links" label="Enlaces de las prendas que usas" hint="Uno por línea. Con uno solo puedes repasar los datos antes de guardar; con varios se añaden de golpe y los editas después.">
          <textarea id="w-links" rows={5} className={cx(inputCls, 'h-auto py-2.5 leading-relaxed')} value={text} onChange={(e) => { setText(e.target.value); setErr(null); }} placeholder={'https://scuffers.com/products/original-black-hoodie\nhttps://www.levi.com/…'} />
        </Field>
        {err && <p className="text-[13px] text-bad">{err}</p>}
        <p className="text-[13px] leading-relaxed text-muted">Percha guarda el enlace y saca la tienda y el nombre de la propia dirección. No puede abrir la página, así que la foto y el precio no se leen solos: la foto la puedes subir o pegar su dirección al editar la prenda.</p>
      </div>
    </Sheet>
  );
}
