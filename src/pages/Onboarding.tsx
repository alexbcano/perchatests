import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Trash2, X } from 'lucide-react';
import type { Prefs, Profile } from '@/domain/types';
import { EMPTY_MEASURES, uid, useApp } from '@/app/store';
import { BasicsForm, BoldnessField, BudgetField, MeasuresForm, StylePicker, validateMeasures } from '@/ui/forms';
import { Button, ColorPicker, IconButton, Notice, readImage } from '@/ui/primitives';

const STEPS = ['Sobre ti', 'Tus medidas', 'Tu estilo', 'Fotos y privacidad'];

export function Onboarding() {
  const s = useApp.getState();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(() => ({ ...s.profile, measures: s.profile.isExample ? EMPTY_MEASURES : s.profile.measures }));
  const [prefs, setPrefs] = useState<Prefs>(s.prefsSlice.prefs);
  const [tried, setTried] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const errors = tried ? validateMeasures(profile.measures) : {};
  const close = () => s.setOnboarding(false);
  const move = (n: number) => { setStep(n); scroller.current?.scrollTo({ top: 0 }); };
  const next = () => {
    if (step === 1) {
      setTried(true);
      if (Object.keys(validateMeasures(profile.measures)).length) { s.notify('Revisa los campos marcados'); return; }
    }
    if (step === 2 && prefs.styles.length === 0) { s.notify('Elige al menos un estilo'); return; }
    if (step < STEPS.length - 1) return move(step + 1);
    s.patch('profile', () => ({ ...profile, isExample: false }));
    s.setPrefs(prefs);
    s.setOnboarding(false);
    s.notify('Perfil guardado. Ya puedes crear tu primer outfit');
  };
  return (
    <div ref={scroller} className="anim-fade fixed inset-0 z-50 overflow-y-auto bg-paper">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 pb-28 pt-4 sm:px-8">
        <div className="flex items-center justify-between">
          <span className="display text-2xl italic">Percha</span>
          <IconButton label="Salir sin guardar" onClick={close} className="bg-transparent"><X size={19} /></IconButton>
        </div>
        <ol className="mt-5 flex gap-1.5" aria-label="Pasos">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <div className={`h-1 rounded-full ${i <= step ? 'bg-ink' : 'bg-line'}`} />
              <span className={`mt-1.5 block text-2xs ${i === step ? 'font-medium text-ink' : 'text-muted'}`}>{i + 1}. {label}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex-1">
          {step === 0 && (
            <section>
              <h1 className="display text-4xl leading-tight sm:text-5xl">Empecemos por lo básico</h1>
              <p className="mb-6 mt-3 max-w-[56ch] text-sm text-muted">Con estos datos adaptamos unidades, mercado y tipo de prendas. Todo lo marcado como opcional puedes dejarlo vacío.</p>
              <BasicsForm idp="op-" value={profile} onChange={(p) => setProfile((cur) => ({ ...cur, ...p }))} />
            </section>
          )}
          {step === 1 && (
            <section>
              <h1 className="display text-4xl leading-tight sm:text-5xl">Tus medidas</h1>
              <p className="mb-6 mt-3 max-w-[60ch] text-sm text-muted">Usa una cinta métrica flexible. Toca cada número del dibujo para ver dónde medir. Solo la altura es obligatoria; si te falta alguna, te avisaremos cuando una talla no sea fiable.</p>
              <MeasuresForm idp="om-" value={profile.measures} onChange={(measures) => setProfile((cur) => ({ ...cur, measures }))} units={profile.units} errors={errors} />
            </section>
          )}
          {step === 2 && (
            <section className="flex flex-col gap-7">
              <div><h1 className="display text-4xl leading-tight sm:text-5xl">Tu estilo</h1><p className="mt-3 max-w-[56ch] text-sm text-muted">Elige los estilos que te atraen. Podrás cambiarlos en cada búsqueda.</p></div>
              <StylePicker value={prefs.styles} onChange={(styles) => setPrefs({ ...prefs, styles })} />
              <BudgetField id="o-budget" value={prefs.budget} onChange={(budget) => setPrefs({ ...prefs, budget })} />
              <BoldnessField id="o-bold" value={prefs.boldness} onChange={(boldness) => setPrefs({ ...prefs, boldness })} />
              <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores favoritos <span className="font-normal text-muted">(opcional)</span></span><ColorPicker label="Colores favoritos" value={prefs.favColors} exclude={prefs.avoidColors} onChange={(favColors) => setPrefs({ ...prefs, favColors })} /></div>
              <div className="flex flex-col gap-2"><span className="text-[13px] font-medium">Colores que no quieres <span className="font-normal text-muted">(opcional)</span></span><ColorPicker label="Colores que no quieres" tone="bad" value={prefs.avoidColors} exclude={prefs.favColors} onChange={(avoidColors) => setPrefs({ ...prefs, avoidColors })} /></div>
            </section>
          )}
          {step === 3 && (
            <section className="flex flex-col gap-6">
              <div><h1 className="display text-4xl leading-tight sm:text-5xl">Fotos y privacidad</h1><p className="mt-3 max-w-[60ch] text-sm text-muted">Las fotos son opcionales. Puedes terminar sin añadir ninguna.</p></div>
              <Notice>Tus medidas y fotografías son información personal. Las fotos se guardan <strong>solo en este dispositivo</strong> y puedes borrarlas, junto con el resto de tus datos, desde Mi perfil.</Notice>
              <input ref={file} id="o-photo" type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = '';
                if (!f) return;
                try { const dataUrl = await readImage(f, 720); setProfile((cur) => ({ ...cur, photos: [{ id: uid('f'), dataUrl, addedAt: Date.now() }, ...cur.photos].slice(0, 6) })); } catch { s.notify('No se pudo leer la imagen'); }
              }} />
              <div><Button variant="outline" onClick={() => file.current?.click()}><Camera size={16} />Añadir fotografía de referencia</Button></div>
              {profile.photos.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {profile.photos.map((p) => (
                    <li key={p.id} className="relative"><img src={p.dataUrl} alt="Fotografía de referencia" className="aspect-[3/4] w-full rounded-sm object-cover" />
                      <IconButton label="Eliminar fotografía" className="absolute right-1.5 top-1.5 h-8 w-8" onClick={() => setProfile((cur) => ({ ...cur, photos: cur.photos.filter((x) => x.id !== p.id) }))}><Trash2 size={14} /></IconButton></li>
                  ))}
                </ul>
              )}
              <label className="flex items-start gap-3 text-sm leading-relaxed">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={profile.consentTraining} onChange={(e) => setProfile((cur) => ({ ...cur, consentTraining: e.target.checked }))} />
                <span>Permito que mis medidas y preferencias, sin fotografías ni nombre, se usen para mejorar las recomendaciones. <span className="text-muted">Opcional y desactivado por defecto.</span></span>
              </label>
            </section>
          )}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          {step > 0 ? <Button variant="ghost" onClick={() => move(step - 1)}><ArrowLeft size={16} />Atrás</Button> : <Button variant="ghost" onClick={close}>Ahora no</Button>}
          <Button variant={step === STEPS.length - 1 ? 'accent' : 'primary'} onClick={next}>{step === STEPS.length - 1 ? 'Guardar mi perfil' : <>Continuar<ArrowRight size={16} /></>}</Button>
        </div>
      </div>
    </div>
  );
}
