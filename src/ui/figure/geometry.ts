// Geometría del maniquí paramétrico. Todas las cotas están en centímetros:
// el dibujo sale directamente de las medidas del usuario, sin 3D ni simulación de tejido.
import type { Measurements } from '@/domain/types';

export interface BodyDims { height: number; shoulders: number; chest: number; waist: number; hip: number; inseam: number; arm: number; neck: number }

export const DEFAULT_BODY: BodyDims = { height: 176, shoulders: 44, chest: 96, waist: 82, hip: 97, inseam: 80, arm: 61, neck: 38 };
/** Proporciones de figurín de moda para las ilustraciones editoriales (no representan al usuario). */
export const EDITORIAL_BODY: BodyDims = { height: 186, shoulders: 43, chest: 90, waist: 74, hip: 91, inseam: 92, arm: 65, neck: 36 };

const LABELS: Record<keyof BodyDims, string> = { height: 'altura', shoulders: 'hombros', chest: 'pecho', waist: 'cintura', hip: 'cadera', inseam: 'entrepierna', arm: 'brazo', neck: 'cuello' };

export function dimsFromMeasures(m: Measurements): { dims: BodyDims; estimated: string[] } {
  const H = m.height ?? DEFAULT_BODY.height;
  const est: string[] = [];
  const pickOr = (key: keyof BodyDims, v: number | null, ratio: number) => {
    if (v && v > 0) return v;
    est.push(LABELS[key]);
    return Math.round(H * ratio * 10) / 10;
  };
  if (!m.height) est.push(LABELS.height);
  const dims: BodyDims = {
    height: H,
    shoulders: pickOr('shoulders', m.shoulders, 0.25),
    chest: pickOr('chest', m.chest, 0.545),
    waist: pickOr('waist', m.waist, 0.465),
    hip: pickOr('hip', m.hip, 0.55),
    inseam: pickOr('inseam', m.inseam, 0.455),
    arm: pickOr('arm', m.arm, 0.345),
    neck: pickOr('neck', m.neck, 0.215),
  };
  return { dims, estimated: est };
}

export type Pt = [number, number];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const f = (n: number) => (Math.round(n * 10) / 10).toString();
export const pt = (p: Pt) => `${f(p[0])},${f(p[1])}`;
export const poly = (pts: Pt[], close = true) => 'M' + pts.map(pt).join('L') + (close ? 'Z' : '');
export const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as Pt);

/** Curva suave cerrada que pasa por los puntos (Catmull-Rom → Bézier). */
export function smooth(pts: Pt[], tension = 0.5): string {
  const n = pts.length;
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) * tension) / 3, p1[1] + ((p2[1] - p0[1]) * tension) / 3];
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) * tension) / 3, p2[1] - ((p3[1] - p1[1]) * tension) / 3];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d + 'Z';
}

export interface Landmarks {
  H: number; head: number; headW: number;
  ySh: number; yCh: number; yWa: number; yHi: number; yCr: number; yKn: number; yAn: number;
  sh: number; ch: number; wa: number; hi: number; nk: number;
  legC: number; kneeC: number; ac: number; thigh: number; knee: number; calf: number; ankle: number;
  S: Pt; dir: Pt; nrm: Pt; ua: number; wrist: number; arm: number; hand: Pt;
  // perfil
  cF: number; cB: number; wF: number; wB: number; hF: number; hB: number;
}

export function landmarks(d: BodyDims): Landmarks {
  const H = d.height;
  const head = H * 0.128, headW = head * 0.74;
  const ySh = H * 0.182;
  const inseam = clamp(d.inseam, H * 0.38, H * 0.53);
  const yCr = H - inseam;
  const torso = yCr - ySh;
  const yCh = ySh + torso * 0.27, yWa = ySh + torso * 0.6, yHi = ySh + torso * 0.9;
  const yKn = yCr + inseam * 0.46, yAn = H - H * 0.04;
  const sh = d.shoulders / 2, ch = d.chest * 0.168, wa = d.waist * 0.168, hi = d.hip * 0.176;
  const nk = d.neck * 0.15;
  const legC = hi * 0.52, ac = hi * 0.46, kneeC = lerp(legC, ac, 0.55);
  const theta = 0.11;
  const dir: Pt = [Math.sin(theta), Math.cos(theta)], nrm: Pt = [Math.cos(theta), -Math.sin(theta)];
  const S: Pt = [sh - 2.4, ySh + 2.6];
  const ua = clamp(d.chest * 0.046, 3.6, 6.4), wrist = ua * 0.6;
  const arm = clamp(d.arm, H * 0.28, H * 0.4);
  const hand: Pt = [S[0] + dir[0] * (arm + 4.6), S[1] + dir[1] * (arm + 4.6)];
  const cD = d.chest * 0.235, wD = d.waist * 0.25, hD = d.hip * 0.262;
  return {
    H, head, headW, ySh, yCh, yWa, yHi, yCr, yKn, yAn, sh, ch, wa, hi, nk,
    legC, kneeC, ac, thigh: hi * 0.5, knee: hi * 0.27, calf: hi * 0.29, ankle: hi * 0.17,
    S, dir, nrm, ua, wrist, arm, hand,
    cF: cD * 0.56, cB: -cD * 0.44, wF: wD * 0.54, wB: -wD * 0.42, hF: hD * 0.44, hB: -hD * 0.56,
  };
}

/** Ancho medio del cuerpo (vista frontal) a una altura dada, de hombros a cadera. */
export function bodyHalfAt(L: Landmarks, y: number): number {
  if (y <= L.yCh) return lerp(L.sh - 2, L.ch, clamp((y - L.ySh) / (L.yCh - L.ySh), 0, 1));
  if (y <= L.yWa) return lerp(L.ch, L.wa, (y - L.yCh) / (L.yWa - L.yCh));
  if (y <= L.yHi) return lerp(L.wa, L.hi, (y - L.yWa) / (L.yHi - L.yWa));
  return L.hi;
}

/** Centro de cada pierna (vista frontal) a una altura dada. */
export function legCenterAt(L: Landmarks, y: number): number {
  if (y <= L.yKn) return lerp(L.legC, L.kneeC, clamp((y - L.yCr) / (L.yKn - L.yCr), 0, 1));
  return lerp(L.kneeC, L.ac, clamp((y - L.yKn) / (L.yAn - L.yKn), 0, 1));
}

export function along(L: Landmarks, dist: number, off = 0, origin: Pt = L.S): Pt {
  return [origin[0] + L.dir[0] * dist + L.nrm[0] * off, origin[1] + L.dir[1] * dist + L.nrm[1] * off];
}
