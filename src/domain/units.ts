export type Units = 'metric' | 'imperial';
const r1 = (n: number) => Math.round(n * 10) / 10;
export const lenUnit = (u: Units) => (u === 'metric' ? 'cm' : 'in');
export const weightUnit = (u: Units) => (u === 'metric' ? 'kg' : 'lb');
export const lenOut = (cm: number | null, u: Units): number | null => (cm == null ? null : u === 'metric' ? r1(cm) : r1(cm / 2.54));
export const lenIn = (v: number | null, u: Units): number | null => (v == null ? null : u === 'metric' ? r1(v) : r1(v * 2.54));
export const weightOut = (kg: number | null, u: Units): number | null => (kg == null ? null : u === 'metric' ? r1(kg) : r1(kg * 2.20462));
export const weightIn = (v: number | null, u: Units): number | null => (v == null ? null : u === 'metric' ? r1(v) : r1(v / 2.20462));
export const fmtLen = (cm: number | null, u: Units) => (cm == null ? '—' : `${String(lenOut(cm, u)).replace('.', ',')} ${lenUnit(u)}`);
