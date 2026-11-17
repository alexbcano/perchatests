// Campo para el ancho en plano de una prenda tuya: sirve para elegir talla en marcas que solo dan medidas de la prenda.
import { useApp } from '@/app/store';
import { NumberInput } from './primitives';

export function RefWidth({ id }: { id: string }) {
  const value = useApp((s) => s.profile.measures.refChestFlat ?? null);
  const set = (v: number | null) => useApp.getState().patch('profile', (p) => ({ ...p, measures: { ...p.measures, refChestFlat: v != null && v >= 35 && v <= 95 ? v : null } }));
  return (
    <div className="mt-3 flex flex-wrap items-end gap-3">
      <label htmlFor={id} className="flex max-w-[16rem] flex-col gap-1 text-xs">
        <span className="font-medium">Ancho de tu sudadera favorita</span>
        <span className="text-muted">Extendida sobre una mesa, de axila a axila.</span>
      </label>
      <div className="w-28"><NumberInput id={id} value={value} onChange={set} unit="cm" min={35} max={95} placeholder="p. ej. 62" /></div>
    </div>
  );
}
