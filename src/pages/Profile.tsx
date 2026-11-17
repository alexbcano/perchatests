import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Copy, Download, Trash2, Upload } from 'lucide-react';
import type { Measurements, Prefs } from '@/domain/types';
import { uid, useApp } from '@/app/store';
import { catalog, seenLabel } from '@/services/catalog';
import { usePhotoStatus } from '@/services/catalog/photos';
import { getStylistAI } from '@/services/ai';
import { photoTryOn } from '@/services/tryon';
import { stripPhotos } from '@/services/storage';
import { fmtLen } from '@/domain/units';
import { MEASURE_FIELDS, FigureSvg } from '@/ui/figure';
import { dimsFromMeasures } from '@/ui/figure/geometry';
import { BasicsForm, BoldnessField, BudgetField, GarmentPrefs, MeasuresForm, StylePicker, validateMeasures } from '@/ui/forms';
import { Button, ColorPicker, Confirm, Notice, PageHeader, Pill, readImage, Segmented } from '@/ui/primitives';

type Tab = 'medidas' | 'gustos' | 'fotos' | 'privacidad' | 'app';
const short = (label: string) => { const t = label.replace('Contorno de ', '').replace('Longitud de ', '').replace('Ancho de ', ''); return t.charAt(0).toUpperCase() + t.slice(1); };

export function Profile() {
  const profile = useApp((s) => s.profile);
  const prefs = useApp((s) => s.prefsSlice.prefs);
  const theme = useApp((s) => s.prefsSlice.theme);
  const sync = useApp((s) => s.sync);
  const mode = useApp((s) => s.prefsSlice.catalogMode);
  const photoStatus = usePhotoStatus();
  const { setProfile, setPrefs, setTheme, notify, setOnboarding, patch } = useApp.getState();
  const [tab, setTab] = useState<Tab>('medidas');
  const [draft, setDraft] = useState<Measurements>(profile.measures);
  const [tried, setTried] = useState(false);
  const [wipe, setWipe] = useState(false);
  const [wipePhotos, setWipePhotos] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [ai, setAi] = useState<boolean | null>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(profile.measures); }, [profile.measures]);
  useEffect(() => { let on = true; getStylistAI().then((s) => on && setAi(!!s)); return () => { on = false; }; }, []);
  const errors = tried ? validateMeasures(draft) : {};
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile.measures);
  const { dims } = dimsFromMeasures(profile.measures);
  const filled = MEASURE_FIELDS.filter((f) => profile.measures[f.key] != null).length;

  const saveMeasures = () => {
    setTried(true);
    if (Object.keys(validateMeasures(draft)).length) { notify('Revisa los campos marcados'); return; }
    patch('profile', (cur) => ({ ...cur, measures: draft, isExample: false }));
    notify('Medidas guardadas');
  };
  const setP = (p: Partial<Prefs>) => setPrefs(p);
  const exportData = async () => {
    const s = useApp.getState();
    const data = JSON.stringify({ perfil: stripPhotos('profile', s.profile), preferencias: s.prefsSlice, armario: stripPhotos('wardrobe', s.wardrobe), favoritos: s.saved }, null, 2);
    try { await navigator.clipboard.writeText(data); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { notify('No se pudo copiar al portapapeles en este navegador'); }
  };
  const STORAGE: Record<typeof sync, string> = {
    local: 'En este dispositivo (almacenamiento del navegador).',
    cloud: 'En este dispositivo y en tu espacio privado de la cuenta con la que has abierto Percha. Nadie más puede leerlo, tampoco quien publicó la app.',
    'cloud-error': 'En este dispositivo. No se pudo guardar copia en tu cuenta (acceso de solo lectura o sin conexión).',
    memory: 'Solo durante esta visita: este navegador no permite guardar datos.',
  };

  return (
    <div>
      <PageHeader title="Mi perfil" lead={profile.isExample ? 'Ahora mismo ves un perfil de ejemplo. Sustitúyelo por tus datos cuando quieras.' : `${profile.name ? profile.name + ', a' : 'A'}quí están tus medidas, tus gustos y tus datos.`}
        action={profile.isExample ? <Button variant="accent" onClick={() => setOnboarding(true)}>Configurar mi perfil paso a paso</Button> : undefined} />
      <Segmented label="Sección del perfil" value={tab} onChange={setTab} options={[{ value: 'medidas', label: 'Medidas' }, { value: 'gustos', label: 'Gustos' }, { value: 'fotos', label: `Fotos (${profile.photos.length})` }, { value: 'privacidad', label: 'Privacidad y datos' }, { value: 'app', label: 'Aplicación' }]} />

      {tab === 'medidas' && (
        <div className="mt-6 flex flex-col gap-8">
          <section className="grid gap-6 rounded-sm bg-surface p-5 sm:grid-cols-[150px_1fr]">
            <div className="mx-auto h-56 w-36 rounded-sm bg-tile sm:mx-0"><FigureSvg dims={dims} items={[]} className="h-full w-full" label="Tu avatar según tus medidas" /></div>
            <div>
              <h2 className="display text-2xl">Tu perfil corporal {profile.isExample && <Pill>Ejemplo</Pill>}</h2>
              <p className="mt-1 text-[13px] text-muted">{filled} de {MEASURE_FIELDS.length} medidas guardadas. El avatar y las tallas se calculan con ellas.</p>
              <dl className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-3">
                {MEASURE_FIELDS.map((f) => <div key={f.key} className="flex justify-between gap-2 border-b border-line py-1"><dt className="text-muted">{short(f.label)}</dt><dd className="font-medium">{fmtLen(profile.measures[f.key], profile.units)}</dd></div>)}
              </dl>
            </div>
          </section>
          <section>
            <h2 className="display text-2xl">Datos básicos</h2>
            <div className="mt-4"><BasicsForm value={profile} onChange={(p) => setProfile(p)} /></div>
            <p className="mt-2 text-2xs text-muted">Los datos básicos se guardan al cambiarlos.</p>
          </section>
          <section>
            <h2 className="display text-2xl">Editar medidas</h2>
            <p className="mb-4 mt-1 text-[13px] text-muted">Mídete con una cinta flexible sobre ropa fina. Solo la altura es obligatoria; cuantas más medidas, más fiable la talla.</p>
            <MeasuresForm value={draft} onChange={setDraft} units={profile.units} errors={errors} />
            <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 -mx-6 mt-5 flex flex-wrap items-center gap-3 bg-paper/95 px-6 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:px-0">
              <Button onClick={saveMeasures} disabled={!dirty && !profile.isExample}>Guardar medidas</Button>
              {dirty && <Button variant="ghost" onClick={() => { setDraft(profile.measures); setTried(false); }}>Descartar cambios</Button>}
              <span className="text-xs text-muted">{dirty ? 'Tienes cambios sin guardar.' : profile.isExample ? 'Son las medidas de ejemplo: guárdalas para hacerlas tuyas o cámbialas.' : 'Todo guardado.'}</span>
            </div>
          </section>
        </div>
      )}

      {tab === 'gustos' && (
        <div className="mt-6 flex max-w-3xl flex-col gap-7">
          <p className="text-[13px] text-muted">Son tus preferencias por defecto: se usan en Inicio y como punto de partida en «Crear outfit». Se guardan al cambiarlas.</p>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Estilos que te gustan</span><StylePicker value={prefs.styles} onChange={(styles) => setP({ styles })} /></div>
          <BudgetField id="g-budget" value={prefs.budget} onChange={(budget) => setP({ budget })} />
          <BoldnessField id="g-bold" value={prefs.boldness} onChange={(boldness) => setP({ boldness })} />
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores favoritos</span><ColorPicker label="Colores favoritos" value={prefs.favColors} exclude={prefs.avoidColors} onChange={(favColors) => setP({ favColors })} /></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores que no quieres</span><ColorPicker label="Colores que no quieres" tone="bad" value={prefs.avoidColors} exclude={prefs.favColors} onChange={(avoidColors) => setP({ avoidColors })} /></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Prendas</span><GarmentPrefs like={prefs.likeTypes} avoid={prefs.avoidTypes} onChange={(likeTypes, avoidTypes) => setP({ likeTypes, avoidTypes })} /></div>
          <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Dónde quieres comprar</span><div><Segmented label="Mercado" value={prefs.market} onChange={(market) => setP({ market })} options={[{ value: 'ES', label: 'España' }, { value: 'UE', label: 'Unión Europea' }, { value: 'INT', label: 'Internacional' }]} /></div></div>
        </div>
      )}

      {tab === 'fotos' && (
        <div className="mt-6 flex flex-col gap-5">
          <Notice>Las fotografías de referencia son opcionales y <strong>se guardan solo en este dispositivo</strong>: no se suben a ningún servidor ni se usan para entrenar modelos. En esta versión sirven de referencia personal; el probador sobre foto llegará en la Fase 3.</Notice>
          <input ref={file} id="ref-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            try { const dataUrl = await readImage(f, 720); patch('profile', (cur) => ({ ...cur, photos: [{ id: uid('f'), dataUrl, addedAt: Date.now() }, ...cur.photos].slice(0, 6) })); setPhotoErr(null); notify('Fotografía añadida'); }
            catch { setPhotoErr('No se pudo leer la imagen. Prueba con un JPG o PNG.'); }
          }} />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => file.current?.click()} disabled={profile.photos.length >= 6}><Camera size={16} />Añadir fotografía</Button>
            {profile.photos.length > 0 && <Button variant="danger" onClick={() => setWipePhotos(true)}><Trash2 size={15} />Eliminar todas las fotos</Button>}
            <span className="text-xs text-muted">{profile.photos.length} de 6</span>
          </div>
          {photoErr && <p className="text-[13px] text-bad">{photoErr}</p>}
          {profile.photos.length === 0 ? <p className="text-sm text-muted">No has añadido ninguna fotografía.</p> : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {profile.photos.map((p) => (
                <li key={p.id} className="relative">
                  <img src={p.dataUrl} alt="Fotografía de referencia" className="aspect-[3/4] w-full rounded-sm object-cover" />
                  <button type="button" onClick={() => { patch('profile', (cur) => ({ ...cur, photos: cur.photos.filter((x) => x.id !== p.id) })); notify('Fotografía eliminada'); }} className="absolute right-2 top-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-surface/95 px-3 text-xs font-medium"><Trash2 size={13} />Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'privacidad' && (
        <div className="mt-6 flex max-w-2xl flex-col gap-7 text-sm leading-relaxed">
          <section>
            <h2 className="display text-2xl">Dónde están tus datos</h2>
            <p className="mt-2">{STORAGE[sync]}</p>
            <p className="mt-2 text-muted">Medidas, gustos, armario y favoritos son información personal. Las fotografías no salen nunca del dispositivo.</p>
          </section>
          <section>
            <h2 className="display text-2xl">Uso para mejorar modelos</h2>
            <label className="mt-2 flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={profile.consentTraining} onChange={(e) => { setProfile({ consentTraining: e.target.checked }); notify(e.target.checked ? 'Consentimiento registrado' : 'Consentimiento retirado'); }} />
              <span>Doy mi consentimiento para que mis medidas y preferencias, sin fotografías ni nombre, puedan usarse para mejorar las recomendaciones.<br /><span className="text-muted">Está desactivado por defecto. En esta versión no se envía nada: la casilla solo guarda tu decisión para cuando exista un servidor.</span></span>
            </label>
          </section>
          <section>
            <h2 className="display text-2xl">Llévate o borra tus datos</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportData}>{copied ? <><Check size={15} />Copiado al portapapeles</> : <><Copy size={15} />Copiar mis datos (JSON)</>}</Button>
              <Button variant="danger" onClick={() => setWipe(true)}><Trash2 size={15} />Eliminar todos mis datos</Button>
            </div>
          </section>
        </div>
      )}

      {tab === 'app' && (
        <div className="mt-6 flex max-w-3xl flex-col gap-8">
          <section>
            <h2 className="display text-2xl">Apariencia</h2>
            <div className="mt-3"><Segmented label="Tema" value={theme} onChange={setTheme} options={[{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }, { value: 'auto', label: 'Según el sistema' }]} /></div>
          </section>
          <section>
            <h2 className="display text-2xl">Catálogo</h2>
            <p className="mt-1 text-[13px] text-muted">{mode === 'real' ? `Tiendas reales: ${catalog.list().length} productos de hombre de ${catalog.brands().map((b) => b.name).join(', ')}. Precios leídos el ${seenLabel(catalog.seenAt)}; no se actualizan solos.` : 'Catálogo de demostración: marcas y productos ficticios, útil para probar todos los estilos y las tablas de tallas.'}</p>
            <div className="mt-3"><Segmented label="Catálogo" value={mode} onChange={(m) => { useApp.getState().setCatalog(m); notify(m === 'real' ? 'Catálogo de tiendas reales activado' : 'Catálogo de demostración activado'); }} options={[{ value: 'real', label: 'Tiendas reales' }, { value: 'demo', label: 'Demostración' }]} /></div>
          </section>
          <DataTransfer />
          <section>
            <h2 className="display text-2xl">Fotos de las tiendas</h2>
            <p className="mt-1 text-[13px] text-muted">Las fotos se piden a la web de cada tienda. Aquí ves cuáles ha podido cargar este navegador ahora mismo. Si todas salen bloqueadas, es el sitio donde está alojada la app el que lo impide.</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-[13px]">
              {Array.from(photoStatus.entries()).map(([host, st]) => (
                <li key={host} className="flex items-center justify-between gap-3 border-b border-line py-1.5"><span>{host}</span><Pill tone={st === 'ok' ? 'ok' : st === 'blocked' ? 'bad' : 'neutral'}>{st === 'ok' ? 'Se ven' : st === 'blocked' ? 'Bloqueadas' : 'Comprobando'}</Pill></li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="display text-2xl">Qué es real y qué no</h2>
            <p className="mt-1 text-[13px] text-muted">Esta tabla dice, sin adornos, qué funciona de verdad y qué tiene límites.</p>
            <table className="mt-4 w-full text-left text-[13px]">
              <thead><tr className="text-muted"><th className="py-2 pr-3 font-normal">Pieza</th><th className="py-2 pr-3 font-normal">Estado</th><th className="hidden py-2 font-normal sm:table-cell">Detalle</th></tr></thead>
              <tbody className="[&_td]:border-t [&_td]:border-line [&_td]:py-2.5 [&_td]:pr-3 [&_td]:align-top">
                <tr><td>Generador de outfits</td><td><Pill tone="ok">Funciona</Pill></td><td className="hidden sm:table-cell">Motor de reglas: estilo, color, presupuesto, temporada, ocasión y armario.</td></tr>
                <tr><td>Recomendador de tallas</td><td><Pill tone={mode === 'real' ? 'warn' : 'ok'}>{mode === 'real' ? 'Algunas marcas' : 'Funciona'}</Pill></td><td className="hidden sm:table-cell">{mode === 'real' ? "Con tabla oficial para COS, Urban Outfitters, Levi's, New Balance, Camper, Carhartt WIP y los pantalones de UNIQLO. En Scuffers, comparando con una sudadera tuya. En el resto avisa de que falta la tabla y no recomienda." : 'Compara tus medidas con la tabla de cada marca. Las tablas son de ejemplo.'}</td></tr>
                <tr><td>Avatar y probador</td><td><Pill tone="ok">Funciona</Pill></td><td className="hidden sm:table-cell">Maniquí 2D a escala, frontal y lateral. No simula tejido.</td></tr>
                <tr><td>Catálogo de productos</td><td>{mode === 'real' ? <Pill tone="ok">Real</Pill> : <Pill tone="demo">Demo</Pill>}</td><td className="hidden sm:table-cell">{mode === 'real' ? 'Productos reales con enlace a su ficha. Precio de un día concreto; existencias y colores al día, en la tienda.' : `${catalog.list().length} productos ficticios de marcas ficticias.`}</td></tr>
                <tr><td>Fotos de producto</td><td><Pill tone="warn">Según dónde la abras</Pill></td><td className="hidden sm:table-cell">Se piden a la web de cada tienda. Se ven en tu propia web y abierta como archivo en el ordenador; dentro de Claude el alojamiento las bloquea y se muestra el dibujo.</td></tr>
                <tr><td>Referentes</td><td><Pill tone="ok">Reales</Pill></td><td className="hidden sm:table-cell">Creadores reales con enlace a la fuente. Editables desde Tendencias.</td></tr>
                <tr><td>Imágenes de los looks</td><td><Pill tone="ok">Fotos de tienda</Pill></td><td className="hidden sm:table-cell">Mosaico con las fotos reales de cada prenda cuando cargan; si no, un dibujo generado por código. No hay imágenes de IA.</td></tr>
                <tr><td>Estilista con IA</td><td>{ai == null ? <Pill>Comprobando</Pill> : ai ? <Pill tone="ok">Disponible</Pill> : <Pill tone="warn">No conectado</Pill>}</td><td className="hidden sm:table-cell">Análisis redactado por un modelo, dentro de cada look. Opcional.</td></tr>
                <tr><td>Probador sobre tu foto</td><td><Pill tone="warn">{photoTryOn.available ? 'Disponible' : 'No conectado'}</Pill></td><td className="hidden sm:table-cell">Requiere un servicio externo de virtual try-on (Fase 3).</td></tr>
                <tr><td>Cuenta y guardado</td><td><Pill tone={sync === 'cloud' ? 'ok' : sync === 'memory' ? 'warn' : 'neutral'}>{sync === 'cloud' ? 'En tu cuenta' : sync === 'memory' ? 'Sin guardado' : 'En este dispositivo'}</Pill></td><td className="hidden sm:table-cell">Sin registro propio todavía: usa la sesión con la que abres la app. El inicio de sesión propio llega con el servidor.</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      )}

      <Confirm open={wipe} title="Eliminar todos mis datos" body="Se borrarán tus medidas, gustos, armario, fotografías, favoritos e historial, en este dispositivo y en tu cuenta. No se puede deshacer." action="Eliminar todo" onClose={() => setWipe(false)}
        onConfirm={() => { void useApp.getState().resetAll().then(() => notify('Datos eliminados. Has vuelto al perfil de ejemplo')); }} />
      <Confirm open={wipePhotos} title="Eliminar todas las fotos" body="Se borrarán todas tus fotografías de referencia de este dispositivo." action="Eliminar fotos" onClose={() => setWipePhotos(false)}
        onConfirm={() => { patch('profile', (cur) => ({ ...cur, photos: [] })); notify('Fotografías eliminadas'); }} />
    </div>
  );
}

function DataTransfer() {
  const notify = useApp((s) => s.notify);
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const download = async () => {
    const json = useApp.getState().exportData();
    const filename = `percha-mis-datos-${new Date().toISOString().slice(0, 10)}.json`;
    // Dentro de Claude las descargas pasan por el alojamiento; en tu web o como archivo, descarga normal.
    const claude = (window as any).claude;
    const dl = claude?.use ? await claude.use('downloads').catch(() => null) : null;
    if (dl) {
      try { await dl.save({ filename, data: json }); notify('Copia descargada'); } catch { setErr('No se ha descargado la copia. Vuelve a intentarlo y acepta la descarga.'); }
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    notify('Copia descargada');
  };
  const apply = () => {
    if (!pending) return;
    const r = useApp.getState().importData(pending);
    setPending(null);
    if (r.ok) { setErr(null); notify(`Datos importados: ${r.counts.wardrobe} prendas y ${r.counts.outfits} looks guardados`); } else setErr(r.error);
  };
  return (
    <section>
      <h2 className="display text-2xl">Pasar tus datos a otro dispositivo</h2>
      <p className="mt-1 text-[13px] text-muted">Tus medidas, gustos, armario y looks se guardan en este navegador. Para llevarlos al móvil o a tu web, descarga una copia aquí y ábrela allí con «Importar». La copia incluye tus fotos.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void download()}><Download size={15} />Exportar mis datos</Button>
        <Button variant="outline" onClick={() => file.current?.click()}><Upload size={15} />Importar una copia</Button>
        <input ref={file} type="file" accept="application/json,.json" className="sr-only" aria-label="Archivo de copia de Percha" onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = '';
          if (!f) return;
          try { setPending(await f.text()); setErr(null); } catch { setErr('No se pudo abrir el archivo.'); }
        }} />
      </div>
      {err && <p className="mt-2 text-[13px] text-bad">{err}</p>}
      <Confirm open={!!pending} title="Importar copia" body="Lo que hay ahora en este navegador (medidas, gustos, armario y looks guardados) se sustituirá por la copia." action="Importar" onClose={() => setPending(null)} onConfirm={apply} />
    </section>
  );
}
