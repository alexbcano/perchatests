import { useState } from 'react';
import type { GarmentType, Measurements, Prefs, Profile, StyleKey } from '@/domain/types';
import { STYLES } from '@/data/demo/styles';
import { CATEGORY_ORDER, CATEGORY_PLURAL, GARMENT_TYPES, TYPE_INFO } from '@/domain/garments';
import { lenIn, lenOut, lenUnit, weightIn, weightOut, weightUnit, type Units } from '@/domain/units';
import { MEASURE_FIELDS, MeasureGuide, type MeasureKey } from './figure';
import { Chip, cx, Field, inputCls, NumberInput } from './primitives';

export function StylePicker({ value, onChange }: { value: StyleKey[]; onChange: (v: StyleKey[]) => void }) {
  return (
    <div role="group" aria-label="Estilos" className="flex flex-wrap gap-2">
      {STYLES.map((s) => {
        const on = value.includes(s.key);
        return <Chip key={s.key} selected={on} onClick={() => onChange(on ? value.filter((x) => x !== s.key) : [...value, s.key])}>{s.name}</Chip>;
      })}
    </div>
  );
}

/** Cada prenda tiene tres estados: indiferente → me gusta → no la quiero. */
export function GarmentPrefs({ like, avoid, onChange }: { like: GarmentType[]; avoid: GarmentType[]; onChange: (like: GarmentType[], avoid: GarmentType[]) => void }) {
  const cycle = (t: GarmentType) => {
    if (like.includes(t)) onChange(like.filter((x) => x !== t), [...avoid, t]);
    else if (avoid.includes(t)) onChange(like, avoid.filter((x) => x !== t));
    else onChange([...like, t], avoid);
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-2xs text-muted">Toca una vez para marcar «me gusta», dos para «no la quiero» y tres para dejarla neutra.</p>
      {CATEGORY_ORDER.map((cat) => (
        <div key={cat}>
          <p className="mb-1.5 text-2xs text-muted">{CATEGORY_PLURAL[cat]}</p>
          <div className="flex flex-wrap gap-1.5">
            {GARMENT_TYPES.filter((t) => TYPE_INFO[t].category === cat).map((t) => {
              const state = like.includes(t) ? 'like' : avoid.includes(t) ? 'avoid' : 'none';
              return (
                <button key={t} type="button" onClick={() => cycle(t)} aria-label={`${TYPE_INFO[t].label}: ${state === 'like' ? 'me gusta' : state === 'avoid' ? 'no la quiero' : 'neutra'}`}
                  className={cx('inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs transition-colors', state === 'like' && 'border-ink bg-ink text-paper', state === 'avoid' && 'border-bad bg-bad-soft text-bad line-through', state === 'none' && 'border-line bg-surface hover:border-ink/60')}>
                  {state === 'like' && '♥ '}{TYPE_INFO[t].label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const BOLD_LABELS = ['Muy discreto', 'Discreto', 'Equilibrado', 'Atrevido', 'Muy atrevido'];
export function BoldnessField({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field id={id} label="Nivel de atrevimiento" hint="Cuánto protagonismo pueden tener el color, los estampados y las siluetas.">
      <div className="flex items-center gap-3">
        <input id={id} type="range" min={1} max={5} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-11 flex-1" aria-valuetext={BOLD_LABELS[value - 1]} />
        <span className="w-28 text-right text-[13px] font-medium">{BOLD_LABELS[value - 1]}</span>
      </div>
    </Field>
  );
}

export function BudgetField({ id, value, onChange }: { id: string; value: number; onChange: (v: number) => void }) {
  const unlimited = value === 0;
  return (
    <Field id={id} label="Presupuesto total del outfit" hint={unlimited ? 'Sin límite: se prioriza el estilo.' : 'Suma de todas las prendas que habría que comprar.'}>
      <div className="flex items-center gap-3">
        <input id={id} type="range" min={40} max={800} step={10} value={unlimited ? 800 : value} disabled={unlimited} onChange={(e) => onChange(Number(e.target.value))} className="h-11 min-w-0 flex-1 disabled:opacity-40" />
        <div className="w-24"><NumberInput id={id + '-n'} value={unlimited ? null : value} onChange={(v) => onChange(v == null ? 0 : Math.max(0, Math.min(5000, Math.round(v))))} unit="€" placeholder="∞" /></div>
      </div>
      <label className="mt-1 inline-flex items-center gap-2 text-[13px]"><input type="checkbox" checked={unlimited} onChange={(e) => onChange(e.target.checked ? 0 : 250)} className="h-4 w-4 accent-[var(--accent)]" />Sin límite de presupuesto</label>
    </Field>
  );
}

export type MeasureErrors = Partial<Record<MeasureKey, string>>;
export function validateMeasures(m: Measurements): MeasureErrors {
  const e: MeasureErrors = {};
  if (m.height == null) e.height = 'La altura es necesaria para dibujar tu avatar y calcular proporciones.';
  for (const f of MEASURE_FIELDS) {
    const v = m[f.key];
    if (v != null && (v < f.min || v > f.max)) e[f.key] = `Revisa el dato: lo habitual está entre ${f.min} y ${f.max} cm.`;
  }
  if (m.inseam != null && m.height != null && m.inseam > m.height * 0.56) e.inseam = 'La entrepierna no puede superar la mitad de tu altura por tanto margen.';
  if (m.weight != null && (m.weight < 30 || m.weight > 250)) e.weight = 'Revisa el dato: entre 30 y 250 kg.';
  if (m.footLength != null && (m.footLength < 20 || m.footLength > 33)) e.footLength = 'Revisa el dato: entre 20 y 33 cm.';
  if (m.shoeEU != null && (m.shoeEU < 34 || m.shoeEU > 50)) e.shoeEU = 'Revisa el dato: entre 34 y 50.';
  return e;
}

export function MeasuresForm({ value, onChange, units, errors, idp = 'm-' }: { value: Measurements; onChange: (m: Measurements) => void; units: Units; errors: MeasureErrors; idp?: string }) {
  const [active, setActive] = useState<MeasureKey | null>('height');
  const set = (k: MeasureKey, v: number | null) => onChange({ ...value, [k]: v });
  const help = MEASURE_FIELDS.find((f) => f.key === active);
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
      <div className="md:sticky md:top-4 md:self-start">
        <div className="rounded-sm bg-tile p-3">
          <MeasureGuide active={active} onPick={(k) => { setActive(k); document.getElementById(idp + k)?.focus(); }} className="mx-auto h-[300px] md:h-[400px]" />
        </div>
        <p className="mt-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">{help ? <><strong className="text-ink">{help.n}. {help.label}.</strong> {help.help}</> : 'Toca un número del dibujo o un campo para ver dónde medir.'}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 self-start">
        {MEASURE_FIELDS.map((f) => (
          <Field key={f.key} id={idp + f.key} label={`${f.n}. ${f.label}`} optional={f.optional} error={errors[f.key]}>
            <NumberInput id={idp + f.key} value={lenOut(value[f.key], units)} onChange={(v) => set(f.key, lenIn(v, units))} unit={lenUnit(units)} invalid={!!errors[f.key]} onFocus={() => setActive(f.key)} />
          </Field>
        ))}
        <Field id={idp + 'weight'} label="Peso" optional error={errors.weight}>
          <NumberInput id={idp + 'weight'} value={weightOut(value.weight, units)} onChange={(v) => set('weight', weightIn(v, units))} unit={weightUnit(units)} invalid={!!errors.weight} onFocus={() => setActive(null)} />
        </Field>
        <Field id={idp + 'footLength'} label="Largo de pie" optional error={errors.footLength} hint="Del talón al dedo más largo. Afina la talla de calzado.">
          <NumberInput id={idp + 'footLength'} value={lenOut(value.footLength, units)} onChange={(v) => set('footLength', lenIn(v, units))} unit={lenUnit(units)} invalid={!!errors.footLength} onFocus={() => setActive(null)} />
        </Field>
        <Field id={idp + 'shoeEU'} label="Talla de calzado habitual" optional error={errors.shoeEU}>
          <NumberInput id={idp + 'shoeEU'} value={value.shoeEU} onChange={(v) => set('shoeEU', v)} unit="EU" invalid={!!errors.shoeEU} onFocus={() => setActive(null)} />
        </Field>
      </div>
    </div>
  );
}

export const COUNTRIES = ['España', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Portugal', 'Francia', 'Italia', 'Alemania', 'Reino Unido', 'Irlanda', 'Países Bajos', 'Estados Unidos', 'Canadá', 'Otro'];

export function BasicsForm({ value, onChange, idp = 'p-' }: { value: Profile; onChange: (p: Partial<Profile>) => void; idp?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={idp + 'name'} label="Nombre" optional><input id={idp + 'name'} className={inputCls} value={value.name} onChange={(e) => onChange({ name: e.target.value })} autoComplete="given-name" /></Field>
      <Field id={idp + 'age'} label="Edad" optional><NumberInput id={idp + 'age'} value={value.age} onChange={(v) => onChange({ age: v == null ? null : Math.round(v) })} unit="años" /></Field>
      <Field id={idp + 'pattern'} label="Preferencia de patronaje" optional hint="Solo se usa para decidir qué prendas proponerte.">
        <select id={idp + 'pattern'} className={inputCls} value={value.pattern ?? ''} onChange={(e) => onChange({ pattern: (e.target.value || null) as Profile['pattern'] })}>
          <option value="">Prefiero no indicarlo</option><option value="neutro">Sin género / indistinto</option><option value="masculino">Masculino</option><option value="femenino">Femenino</option>
        </select>
      </Field>
      <Field id={idp + 'country'} label="País de residencia">
        <select id={idp + 'country'} className={inputCls} value={value.country} onChange={(e) => onChange({ country: e.target.value })}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
      <Field id={idp + 'units'} label="Unidades">
        <select id={idp + 'units'} className={inputCls} value={value.units} onChange={(e) => onChange({ units: e.target.value as Units })}><option value="metric">Centímetros y kilos</option><option value="imperial">Pulgadas y libras</option></select>
      </Field>
      <Field id={idp + 'fit'} label="Cómo te gusta que te quede la ropa" hint="Ajusta la talla recomendada cuando estás entre dos.">
        <select id={idp + 'fit'} className={inputCls} value={value.fitPreference} onChange={(e) => onChange({ fitPreference: e.target.value as Profile['fitPreference'] })}><option value="ajustado">Ajustada</option><option value="normal">Normal</option><option value="holgado">Holgada</option></select>
      </Field>
    </div>
  );
}

export type { Prefs };
