// Maniquí paramétrico en SVG: cuerpo + prendas, vista frontal y de perfil.
// Es una representación de proporciones y volumen, no una simulación del tejido.
import { useId } from 'react';
import type { Category, Fit, GarmentType, Product } from '@/domain/types';
import { luminance, shade } from '@/data/demo/colors';
import { along, bodyHalfAt, landmarks, legCenterAt, lerp, mirror, poly, pt, smooth, type BodyDims, type Landmarks, type Pt } from './geometry';

export interface Worn {
  key: string;
  type: GarmentType;
  category: Category;
  fill: string;
  second?: string;
  fit: Fit;
  shift?: number;
  traits?: Product['traits'];
}

const EASE: Record<Fit, number> = { slim: 0.8, regular: 2.2, relaxed: 4, oversized: 6.4 };
const DROP: Record<Fit, number> = { slim: 0, regular: 0.6, relaxed: 2.4, oversized: 5 };
const LEG_EASE: Record<Fit, number> = { slim: 0.6, regular: 1.6, relaxed: 3, oversized: 4.6 };

const detail = (fill: string) => (luminance(fill) < 0.22 ? shade(fill, 0.26) : shade(fill, -0.24));
const edge = (fill: string) => (luminance(fill) < 0.22 ? shade(fill, 0.16) : shade(fill, -0.3));
const base = (fill: string) => ({ fill, stroke: edge(fill), strokeWidth: 0.45, strokeLinejoin: 'round' as const });
const line = (fill: string, w = 0.45) => ({ fill: 'none', stroke: detail(fill), strokeWidth: w, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

type NeckKind = 'crew' | 'v' | 'collar' | 'polo' | 'hood' | 'turtle' | 'ribcollar';
interface TopSpec {
  sleeve: 'short' | 'long' | 'none';
  neck: NeckKind;
  len: (L: Landmarks) => number;
  rib?: boolean; open?: boolean; lapel?: boolean; zip?: boolean; quilt?: boolean; placket?: boolean;
  pocket?: 'kangaroo' | 'chest' | 'flap'; belt?: boolean; deepV?: boolean;
}

const TOPS: Partial<Record<GarmentType, TopSpec>> = {
  tee: { sleeve: 'short', neck: 'crew', len: (L) => L.yHi - 1 },
  longsleeve: { sleeve: 'long', neck: 'crew', len: (L) => L.yHi - 1 },
  shirt: { sleeve: 'long', neck: 'collar', len: (L) => L.yHi + 3, placket: true },
  polo: { sleeve: 'short', neck: 'polo', len: (L) => L.yHi - 1, rib: true },
  knit: { sleeve: 'long', neck: 'crew', len: (L) => L.yHi - 1.5, rib: true },
  turtleneck: { sleeve: 'long', neck: 'turtle', len: (L) => L.yHi - 1, rib: true },
  hoodie: { sleeve: 'long', neck: 'hood', len: (L) => L.yHi + 0.5, rib: true, pocket: 'kangaroo' },
  sweatshirt: { sleeve: 'long', neck: 'crew', len: (L) => L.yHi - 1, rib: true },
  blazer: { sleeve: 'long', neck: 'v', len: (L) => L.yCr + 1, open: true, lapel: true, pocket: 'flap' },
  coat: { sleeve: 'long', neck: 'v', len: (L) => L.yKn - 3, open: true, lapel: true },
  trench: { sleeve: 'long', neck: 'v', len: (L) => L.yKn + 5, open: true, lapel: true, belt: true },
  bomber: { sleeve: 'long', neck: 'ribcollar', len: (L) => L.yHi - 4, zip: true, rib: true },
  puffer: { sleeve: 'long', neck: 'turtle', len: (L) => L.yHi - 2, zip: true, quilt: true },
  shell: { sleeve: 'long', neck: 'hood', len: (L) => L.yHi + 3, zip: true },
  overshirt: { sleeve: 'long', neck: 'collar', len: (L) => L.yHi + 2, open: true, pocket: 'chest' },
  denimjacket: { sleeve: 'long', neck: 'collar', len: (L) => L.yHi - 5, open: true, pocket: 'chest' },
  gilet: { sleeve: 'none', neck: 'turtle', len: (L) => L.yHi - 2, zip: true, quilt: true },
  cardigan: { sleeve: 'long', neck: 'v', len: (L) => L.yHi + 2, open: true, deepV: true, rib: true },
};

type LegKind = 'wide' | 'straight' | 'slim' | 'taper' | 'short' | 'skirt';
const BOTTOMS: Partial<Record<GarmentType, { kind: LegKind; cargo?: boolean; crease?: boolean; high?: boolean }>> = {
  wide: { kind: 'wide', crease: true, high: true },
  straight: { kind: 'straight' },
  slimpant: { kind: 'slim' },
  chino: { kind: 'straight' },
  jeans: { kind: 'straight' },
  cargo: { kind: 'straight', cargo: true },
  jogger: { kind: 'taper' },
  shorts: { kind: 'short' },
  skirt: { kind: 'skirt', high: true },
  tailored: { kind: 'straight', crease: true, high: true },
};

// ───────────────────────── Cuerpo ─────────────────────────
function BodyFront({ L, skin }: { L: Landmarks; skin: string }) {
  const s = { fill: skin, stroke: shade(skin, -0.16), strokeWidth: 0.35, strokeLinejoin: 'round' as const };
  const R: Pt[] = [
    [L.nk, L.head * 0.9], [L.nk + 0.4, L.ySh - 3.2], [L.sh * 0.62, L.ySh - 1.5], [L.sh - 0.6, L.ySh + 0.9], [L.sh - 1.8, L.ySh + 5],
    [L.ch, L.yCh], [L.wa, L.yWa], [L.hi, L.yHi], [L.hi * 0.98, L.yCr + 3], [L.hi * 0.5, L.yCr + 5],
  ];
  const calfY = lerp(L.yKn, L.yAn, 0.3), calfC = lerp(L.kneeC, L.ac, 0.35);
  const leg: Pt[] = [
    [L.hi, L.yHi], [L.hi * 0.99, L.yCr + 4], [L.kneeC + L.knee, L.yKn], [calfC + L.calf, calfY], [L.ac + L.ankle, L.yAn], [L.ac + L.ankle * 0.9, L.H - 2],
    [L.ac - L.ankle * 0.9, L.H - 2], [L.ac - L.ankle, L.yAn], [calfC - L.calf * 0.85, calfY], [L.kneeC - L.knee, L.yKn], [0.7, L.yCr + 2], [0.7, L.yHi],
  ];
  const arm: Pt[] = [
    along(L, -1.2, 0), along(L, 1.8, L.ua * 0.95), along(L, L.arm * 0.48, L.ua * 0.84), along(L, L.arm, L.wrist),
    along(L, L.arm, -L.wrist), along(L, L.arm * 0.48, -L.ua * 0.84), along(L, 3, -L.ua),
  ];
  const hand = (sign: number) => (
    <ellipse cx={sign * L.hand[0]} cy={L.hand[1]} rx={L.wrist * 1.05} ry={4.7} transform={`rotate(${-sign * 6} ${sign * L.hand[0]} ${L.hand[1]})`} {...s} />
  );
  return (
    <g>
      <path d={smooth(arm, 0.5)} {...s} /><path d={smooth(mirror(arm), 0.5)} {...s} />
      {hand(1)}{hand(-1)}
      <ellipse cx={L.ac + 0.9} cy={L.H - 1.5} rx={4.5} ry={1.9} {...s} /><ellipse cx={-L.ac - 0.9} cy={L.H - 1.5} rx={4.5} ry={1.9} {...s} />
      <path d={smooth(leg, 0.45)} {...s} /><path d={smooth(mirror(leg), 0.45)} {...s} />
      <path d={smooth([...R, ...mirror(R).reverse()], 0.42)} {...s} />
      <ellipse cx={0} cy={L.head / 2} rx={L.headW / 2} ry={L.head / 2} {...s} />
    </g>
  );
}

// ───────────────────────── Partes de arriba y capas (frontal) ─────────────────────────
function topGeom(L: Landmarks, spec: TopSpec, w: Worn) {
  const shift = w.shift ?? 0;
  const e = Math.max(0.3, EASE[w.fit] + shift * 1.5);
  const drop = Math.max(0, DROP[w.fit] + shift * 0.9);
  const shX = L.sh + drop, shY = L.ySh + 0.3 + drop * 0.4;
  const nX = L.nk + (spec.open ? 1.9 : 1.5), nY = L.ySh - 3.1;
  const uaX = L.ch + e + 0.6, uaY = L.yCh + 1.5 + drop * 0.5;
  let hemY = spec.len(L) + (w.fit === 'oversized' ? 3 : w.fit === 'relaxed' ? 1.2 : 0) + shift * 1.6;
  if (w.traits?.cropped) hemY = L.yWa + 2;
  const atHem = bodyHalfAt(L, Math.min(hemY, L.yHi));
  const slim = w.fit === 'slim';
  const hemX = slim ? atHem + e + 0.5 : Math.max(atHem + e * 0.75 + 0.4, uaX - 0.8);
  const waistX = slim && hemY > L.yWa + 4 ? L.wa + e + 1.4 : null;
  const sideX = (y: number) => {
    if (y <= uaY) return uaX;
    if (waistX !== null) return y <= L.yWa ? lerp(uaX, waistX, (y - uaY) / (L.yWa - uaY)) : lerp(waistX, hemX, Math.min(1, (y - L.yWa) / (hemY - L.yWa)));
    return lerp(uaX, hemX, Math.min(1, (y - uaY) / (hemY - uaY)));
  };
  const sleeve = w.traits?.shortSleeve ? 'short' : spec.sleeve;
  const A0: Pt = [L.S[0] + drop * 0.7, L.S[1] + drop * 0.35];
  const len = sleeve === 'short' ? L.arm * (0.33 + drop * 0.022) : L.arm + 0.8 + (w.fit === 'oversized' ? 1.5 : 0);
  const topHalf = L.ua + e * 0.6 + 1.3;
  const endHalf = sleeve === 'short' ? L.ua + e * 0.7 + 1 : L.wrist + e * 0.4 + 1.5;
  const sleevePts: Pt[] | null = sleeve === 'none' ? null : [
    [shX - 1.6, shY - 0.7], [A0[0] + topHalf * 0.66, A0[1] - 1.5], along(L, 3.4, topHalf, A0), along(L, len, endHalf, A0), along(L, len, -endHalf, A0), [uaX - 1.5, uaY],
  ];
  const cuff: Pt[] | null = sleeve === 'long' ? [along(L, len - 2.8, endHalf + 0.1, A0), along(L, len, endHalf, A0), along(L, len, -endHalf, A0), along(L, len - 2.8, -endHalf - 0.1, A0)] : null;
  const sidePts: Pt[] = waistX !== null ? [[uaX, uaY], [waistX, L.yWa], [hemX, hemY]] : [[uaX, uaY], [hemX, hemY]];
  return { e, drop, shX, shY, nX, nY, uaX, uaY, hemY, hemX, sideX, sleeve, sleevePts, cuff, A0, len, endHalf, sidePts };
}

function TopFront({ L, w, idp, ghost }: { L: Landmarks; w: Worn; idp: string; ghost?: boolean }) {
  const spec = TOPS[w.type];
  if (!spec) return null;
  const g = topGeom(L, spec, w);
  const { nX, nY, shX, shY, hemX, hemY, sideX } = g;
  const fill = w.fill;
  const sleeveFill = w.type === 'bomber' && w.second ? w.second : fill;
  const clip = `${idp}-${w.key}`;
  const gap = spec.open ? 2.4 + g.e * 0.35 : 0;
  const yBreak = spec.lapel ? lerp(L.yCh, L.yWa, 0.78) : spec.deepV ? L.yWa - 3 : nY + 9;
  const right: Pt[] = [[shX, shY], ...g.sidePts];
  const neckDepth = spec.neck === 'crew' ? 3 : spec.neck === 'hood' ? 3.6 : spec.neck === 'turtle' ? 1 : spec.neck === 'ribcollar' ? 2.6 : 5.5;
  let bodyD: string;
  let panelR: Pt[] | null = null;
  if (spec.open) {
    panelR = [[nX, nY], ...right, [gap, hemY], [gap, yBreak]];
    bodyD = poly(panelR) + poly(mirror(panelR));
  } else {
    const neck = spec.neck === 'collar' || spec.neck === 'polo' || spec.neck === 'v' ? `L0,${(nY + neckDepth).toFixed(1)}L${pt([nX, nY])}` : `Q0,${(nY + neckDepth * 2).toFixed(1)} ${pt([nX, nY])}`;
    bodyD = `M${pt([-nX, nY])}${neck}L${right.map(pt).join('L')}L${mirror(right).reverse().map(pt).join('L')}Z`;
  }
  const hemBand = spec.rib && !w.traits?.cropped
    ? (spec.open
      ? poly([[gap, hemY - 3], [sideX(hemY - 3), hemY - 3], [hemX, hemY], [gap, hemY]]) + poly(mirror([[gap, hemY - 3], [sideX(hemY - 3), hemY - 3], [hemX, hemY], [gap, hemY]]))
      : poly([[-sideX(hemY - 3), hemY - 3], [sideX(hemY - 3), hemY - 3], [hemX, hemY], [-hemX, hemY]]))
    : null;
  const second = w.second ?? detail(fill);
  const pattern = w.traits?.pattern;
  const stripes: JSX.Element[] = [];
  if (pattern === 'stripes') for (let y = shY + 3; y < hemY; y += 3.6) stripes.push(<line key={y} x1={-60} x2={60} y1={y} y2={y} stroke={second} strokeWidth={1.3} />);
  if (pattern === 'check') {
    for (let y = shY + 2; y < hemY + 2; y += 5.2) stripes.push(<line key={'h' + y} x1={-60} x2={60} y1={y} y2={y} stroke={second} strokeWidth={0.9} opacity={0.55} />);
    for (let x = -57.2; x < 60; x += 5.2) stripes.push(<line key={'v' + x} x1={x} x2={x} y1={0} y2={hemY + 4} stroke={second} strokeWidth={0.9} opacity={0.55} />);
  }
  const quilt: string[] = [];
  if (spec.quilt) {
    for (let y = shY + 8; y < hemY - 3; y += 7.5) quilt.push(`M${pt([-sideX(y), y])}L${pt([sideX(y), y])}`);
    if (g.sleevePts) for (let dist = 10; dist < g.len - 4; dist += 8.5) {
      const half = lerp(L.ua + g.e * 0.6 + 1.3, g.endHalf, dist / g.len);
      const a = along(L, dist, half, g.A0), b = along(L, dist, -half, g.A0);
      quilt.push(`M${pt(a)}L${pt(b)}`, `M${pt([-a[0], a[1]])}L${pt([-b[0], b[1]])}`);
    }
  }
  const collarLeaf: Pt[] = spec.open
    ? [[nX - 0.3, nY - 0.5], [nX + 4.8, nY + 4.4], [gap + 0.5, nY + 8.6], [nX - 1, nY + 3]]
    : [[0, nY + neckDepth], [nX, nY - 0.4], [nX + 1.3, nY + 2.3], [3.7, nY + neckDepth + 3.2]];
  const lapel: Pt[] = [[nX, nY], [nX + 5.8, nY + 7], [nX + 4, nY + 8.8], [gap, yBreak]];
  const pocketY = L.yCh + 1.5;

  return (
    <g>
      <defs><clipPath id={clip}><path d={bodyD} />{g.sleevePts && <><path d={poly(g.sleevePts)} /><path d={poly(mirror(g.sleevePts))} /></>}</clipPath></defs>
      {ghost && <ellipse cx={0} cy={nY + 0.6} rx={nX + 0.6} ry={3.4} fill={shade(fill, luminance(fill) < 0.22 ? 0.12 : -0.3)} />}
      {g.sleevePts && <><path d={poly(g.sleevePts)} {...base(sleeveFill)} /><path d={poly(mirror(g.sleevePts))} {...base(sleeveFill)} /></>}
      {spec.rib && g.cuff && <><path d={poly(g.cuff)} fill={detail(sleeveFill)} opacity={0.55} /><path d={poly(mirror(g.cuff))} fill={detail(sleeveFill)} opacity={0.55} /></>}
      <path d={bodyD} {...base(fill)} />
      {stripes.length > 0 && <g clipPath={`url(#${clip})`}>{stripes}</g>}
      {pattern === 'graphic' && <g><rect x={-6.2} y={L.yCh + 0.5} width={12.4} height={10} rx={1} fill={second} opacity={0.92} /><circle cx={0} cy={L.yCh + 5.5} r={3} fill={fill} /></g>}
      {hemBand && <path d={hemBand} fill={detail(fill)} opacity={0.5} />}
      {quilt.length > 0 && <path d={quilt.join('')} {...line(fill, 0.5)} />}
      {spec.zip && <path d={`M0,${nY + neckDepth}L0,${hemY}`} {...line(fill, 0.6)} />}
      {spec.placket && !spec.open && <g><path d={`M0,${nY + neckDepth}L0,${hemY}`} {...line(fill)} />{[0.2, 0.4, 0.6, 0.8].map((t) => <circle key={t} cx={0} cy={lerp(nY + neckDepth + 2, hemY - 3, t)} r={0.5} fill={detail(fill)} />)}</g>}
      {spec.neck === 'polo' && <g><path d={`M0,${nY + neckDepth}L0,${nY + neckDepth + 6.5}`} {...line(fill)} /><circle cx={0} cy={nY + neckDepth + 3} r={0.5} fill={detail(fill)} /></g>}
      {(spec.neck === 'collar' || spec.neck === 'polo') && <><path d={poly(collarLeaf)} {...base(shade(fill, luminance(fill) < 0.22 ? 0.08 : -0.06))} /><path d={poly(mirror(collarLeaf))} {...base(shade(fill, luminance(fill) < 0.22 ? 0.08 : -0.06))} /></>}
      {spec.lapel && <><path d={poly(lapel)} {...base(shade(fill, luminance(fill) < 0.22 ? 0.1 : -0.1))} /><path d={poly(mirror(lapel))} {...base(shade(fill, luminance(fill) < 0.22 ? 0.1 : -0.1))} /></>}
      {spec.neck === 'turtle' && <path d={poly([[-L.nk - 1, nY + 1.6], [-L.nk - 0.6, L.head * 0.96], [L.nk + 0.6, L.head * 0.96], [L.nk + 1, nY + 1.6]])} {...base(fill)} />}
      {spec.neck === 'hood' && <g><path d={`M${pt([-nX - 1.4, nY + 0.4])}Q0,${nY + 11.5} ${pt([nX + 1.4, nY + 0.4])}`} fill="none" stroke={edge(fill)} strokeWidth={5.4} strokeLinecap="round" /><path d={`M${pt([-nX - 1.4, nY + 0.4])}Q0,${nY + 11.5} ${pt([nX + 1.4, nY + 0.4])}`} fill="none" stroke={shade(fill, luminance(fill) < 0.22 ? 0.07 : -0.07)} strokeWidth={4.5} strokeLinecap="round" />{!spec.zip && <path d={`M-1.7,${nY + 6.6}L-1.9,${nY + 16}M1.7,${nY + 6.6}L1.9,${nY + 15}`} {...line(fill, 0.55)} />}</g>}
      {spec.neck === 'ribcollar' && <path d={`M${pt([-nX - 0.4, nY])}Q0,${nY + neckDepth * 2 + 1} ${pt([nX + 0.4, nY])}`} fill="none" stroke={detail(fill)} strokeWidth={2.3} strokeLinecap="round" />}
      {spec.pocket === 'kangaroo' && <path d={`M-7.5,${hemY - 3.4}L-5.8,${hemY - 13}L5.8,${hemY - 13}L7.5,${hemY - 3.4}`} {...line(fill)} />}
      {spec.pocket === 'chest' && <path d={`M${gap + 2.6},${pocketY}h7.2v8h-7.2zM${-gap - 2.6},${pocketY}h-7.2v8h7.2z`} {...line(fill)} />}
      {spec.pocket === 'flap' && <path d={`M${gap + 3},${L.yHi - 1}L${sideX(L.yHi - 1) - 2.5},${L.yHi - 1}M${-gap - 3},${L.yHi - 1}L${-sideX(L.yHi - 1) + 2.5},${L.yHi - 1}`} {...line(fill, 0.6)} />}
      {spec.lapel && w.type !== 'trench' && <circle cx={gap + 1.2} cy={yBreak + 2.5} r={0.6} fill={detail(fill)} />}
      {spec.belt && <g><path d={poly([[gap, L.yWa], [sideX(L.yWa), L.yWa], [sideX(L.yWa + 3.2), L.yWa + 3.2], [gap, L.yWa + 3.2]])} fill={detail(fill)} opacity={0.6} /><path d={poly(mirror([[gap, L.yWa], [sideX(L.yWa), L.yWa], [sideX(L.yWa + 3.2), L.yWa + 3.2], [gap, L.yWa + 3.2]]))} fill={detail(fill)} opacity={0.6} /></g>}
    </g>
  );
}

// ───────────────────────── Partes de abajo (frontal) ─────────────────────────
function bottomGeom(L: Landmarks, w: Worn) {
  const spec = BOTTOMS[w.type] ?? { kind: 'straight' as LegKind };
  const shift = w.shift ?? 0;
  const kind: LegKind = (w.type === 'jeans' || w.type === 'cargo') && w.fit === 'oversized' ? 'wide' : spec.kind;
  const e = Math.max(0.3, LEG_EASE[w.fit] + shift * 1.2);
  const wY = L.yWa + (spec.high ? 0.6 : 2.4);
  const wb = bodyHalfAt(L, wY) + 0.9;
  const hipX = L.hi + e;
  const full = kind !== 'short' && kind !== 'skirt';
  let hemY = L.yAn - 0.6;
  if (kind === 'wide') hemY = L.yAn + 1.8;
  if (kind === 'taper') hemY = L.yAn - 2.6;
  if (kind === 'short') hemY = L.yKn - (w.fit === 'relaxed' || w.fit === 'oversized' ? 1 : 5);
  if (kind === 'skirt') hemY = w.traits?.mini ? L.yCr + 11 : lerp(L.yKn, L.yAn, 0.42);
  const hw = kind === 'wide' ? 10.6 + e * 0.9 : kind === 'slim' ? 6.2 + e * 0.3 : kind === 'taper' ? 6.3 : kind === 'short' ? L.thigh + e * 0.9 + 1 : (spec.cargo ? 9.6 : spec.crease ? 8 : 8.6) + e * 0.5;
  const cx = full ? L.ac + (kind === 'wide' ? 1.2 : 0.3) : legCenterAt(L, hemY) + 0.6;
  const crotchY = L.yCr + 1 + e * 0.9;
  return { spec, kind, e, wY, wb, hipX, hemY, hw, cx, crotchY, full };
}

function BottomFront({ L, w, idp }: { L: Landmarks; w: Worn; idp: string }) {
  const g = bottomGeom(L, w);
  const { wY, wb, hipX, hemY, hw, cx, crotchY, kind } = g;
  const fill = w.fill;
  const clip = `${idp}-${w.key}`;
  const second = w.second ?? detail(fill);
  let d: string;
  let outer: Pt[];
  if (kind === 'skirt') {
    const flare = w.traits?.mini ? 1.5 : 5;
    outer = [[wb, wY], [hipX, L.yHi], [hipX + flare, hemY]];
    d = poly([[-wb, wY], ...outer, ...mirror(outer).reverse().slice(0, 2)]);
  } else {
    const inX = Math.max(0.55, cx - hw);
    outer = [[wb, wY], [hipX, L.yHi]];
    if (kind === 'slim' || kind === 'taper' || kind === 'straight') outer.push([L.kneeC + L.knee + g.e + (kind === 'straight' ? 2 : 0.6), L.yKn]);
    outer.push([cx + hw, hemY]);
    const rightLeg: Pt[] = [...outer, [inX, hemY], [0, crotchY]];
    d = `M${pt([-wb, wY])}L${rightLeg.map(pt).join('L')}L${mirror(rightLeg).reverse().slice(1).map(pt).join('L')}Z`;
  }
  const lines: string[] = [];
  lines.push(`M${pt([-bodyHalfAt(L, wY + 2.4) - 0.9, wY + 2.4])}L${pt([bodyHalfAt(L, wY + 2.4) + 0.9, wY + 2.4])}`);
  if (kind !== 'skirt') {
    lines.push(`M0,${wY + 2.4}L0,${Math.min(crotchY - 2, wY + 12)}`);
    lines.push(`M${pt([wb - 2, wY + 2.4])}L${pt([lerp(wb, hipX, 0.8), wY + 9.5])}`, `M${pt([-wb + 2, wY + 2.4])}L${pt([-lerp(wb, hipX, 0.8), wY + 9.5])}`);
  } else if (!w.traits?.mini) {
    for (const t of [-0.66, -0.33, 0, 0.33, 0.66]) lines.push(`M${pt([t * wb, wY + 2.4])}L${pt([t * (hipX + 5), hemY])}`);
  }
  if (g.spec.crease && kind !== 'skirt') lines.push(`M${pt([L.legC + 0.5, L.yHi - 2])}L${pt([cx, hemY])}`, `M${pt([-L.legC - 0.5, L.yHi - 2])}L${pt([-cx, hemY])}`);
  if (g.spec.cargo) {
    const y = L.yKn - 15, x = lerp(hipX, cx + hw, 0.42) - 1;
    lines.push(`M${x},${y}h-7.4v10.5h7.4M${x - 7.4},${y + 3}h7.4`, `M${-x},${y}h7.4v10.5h-7.4M${-x + 7.4},${y + 3}h-7.4`);
  }
  const cuff = kind === 'taper' ? poly([[cx + hw, hemY - 3], [cx + hw - 0.3, hemY], [Math.max(0.55, cx - hw) + 0.3, hemY], [Math.max(0.55, cx - hw), hemY - 3]]) : null;
  const grid: JSX.Element[] = [];
  if (w.traits?.pattern === 'check') {
    for (let y = wY; y < hemY + 3; y += 5.2) grid.push(<line key={'h' + y} x1={-50} x2={50} y1={y} y2={y} stroke={second} strokeWidth={0.9} opacity={0.5} />);
    for (let x = -46.8; x < 50; x += 5.2) grid.push(<line key={'v' + x} x1={x} x2={x} y1={wY} y2={hemY + 3} stroke={second} strokeWidth={0.9} opacity={0.5} />);
  }
  const track = w.type === 'jogger' && w.traits?.pattern === 'stripes';
  return (
    <g>
      <defs><clipPath id={clip}><path d={d} /></clipPath></defs>
      <path d={d} {...base(fill)} />
      {grid.length > 0 && <g clipPath={`url(#${clip})`}>{grid}</g>}
      {track && <g clipPath={`url(#${clip})`}><path d={`M${pt([hipX - 2.2, L.yHi - 6])}L${pt([cx + hw - 2.2, hemY])}M${pt([-hipX + 2.2, L.yHi - 6])}L${pt([-cx - hw + 2.2, hemY])}`} stroke={second} strokeWidth={1.5} fill="none" /></g>}
      {cuff && <><path d={cuff} fill={detail(fill)} opacity={0.5} /><path d={cuff} transform="scale(-1,1)" fill={detail(fill)} opacity={0.5} /></>}
      <path d={lines.join('')} {...line(fill)} />
    </g>
  );
}

// ───────────────────────── Calzado ─────────────────────────
const SOLE_LIGHT = '#F2F0EA';
function shoeLook(w: Worn) {
  const t = w.type;
  const lightSole = ['sneaker', 'chunky', 'skate', 'runner'].includes(t);
  const sole = lightSole ? (luminance(w.fill) > 0.75 ? '#DDD9CF' : SOLE_LIGHT) : t === 'trail' ? '#2B2C30' : shade(w.fill, luminance(w.fill) < 0.2 ? 0.12 : -0.45);
  const thick = t === 'chunky' ? 4.2 : t === 'trail' ? 3.2 : t === 'runner' ? 2.8 : t === 'skate' ? 2.3 : t === 'boot' ? 2.4 : t === 'sneaker' ? 2 : 1.4;
  const rise = t === 'boot' ? (w.traits?.high ? 15 : 10) : w.traits?.high ? 7 : t === 'loafer' ? -2 : t === 'derby' ? -1 : -0.4;
  return { sole, thick, rise };
}

function ShoesFront({ L, w }: { L: Landmarks; w: Worn }) {
  const { sole, thick, rise } = shoeLook(w);
  const topY = L.yAn - rise - 1;
  const aw = L.ankle + 1;
  const one = (sign: number) => {
    const c = L.ac + 0.5;
    const wd = w.type === 'chunky' ? 6.6 : 5.8;
    const body = `M${c - aw},${topY}Q${c - wd - 0.2},${L.H - 5} ${c - wd + 0.4},${L.H - thick}L${c + wd + 0.6},${L.H - thick}Q${c + wd + 0.8},${L.H - 5.5} ${c + aw},${topY}Z`;
    return (
      <g transform={sign < 0 ? 'scale(-1,1)' : undefined} key={sign}>
        <path d={body} {...base(w.fill)} />
        <rect x={c - wd + 0.2} y={L.H - thick} width={wd * 2 + 0.6} height={thick} rx={0.8} {...base(sole)} />
        {w.type !== 'loafer' && w.type !== 'boot' && <path d={`M${c - 1.6},${L.H - thick - 1.2}L${c - 1.2},${topY + 1.4}L${c + 1.6},${topY + 1.4}L${c + 2},${L.H - thick - 1.2}`} {...line(w.fill)} />}
        {w.type === 'loafer' && <path d={`M${c - 3},${L.H - thick - 2.6}h6.6`} {...line(w.fill, 0.8)} />}
      </g>
    );
  };
  return <g>{one(1)}{one(-1)}</g>;
}

/** Zapato de perfil. a = x del tobillo, suelo en y = H. */
export function ShoeSide({ w, a, H, yAn }: { w: Worn; a: number; H: number; yAn: number }) {
  const { sole, thick, rise } = shoeLook(w);
  const t = w.type;
  const y0 = H - thick;
  const top = yAn - rise;
  const low = t === 'loafer' || t === 'derby';
  const second = w.second ?? detail(w.fill);
  const upper = low
    ? `M${a - 7.6},${y0}L${a - 7.2},${top + 1}Q${a - 6.9},${top - 0.2} ${a - 5.4},${top}L${a - 0.5},${top + 0.6}Q${a + 3},${y0 - 4.6} ${a + 8},${y0 - 4.8}Q${a + 16.5},${y0 - 4.4} ${a + 19.2},${y0 - 1.4}L${a + 19.4},${y0}Z`
    : `M${a - 7.8},${y0}L${a - 7.3},${top + 1.6}Q${a - 6.9},${top} ${a - 5},${top}L${a + 3.4},${top}L${a + 6.6},${y0 - 6.6}Q${a + 15.5},${y0 - 6} ${a + 19.3},${y0 - 2.1}L${a + 19.6},${y0}Z`;
  const soleD = t === 'runner'
    ? `M${a - 8.6},${H}L${a - 8.4},${y0 - 1.2}L${a + 12},${y0}L${a + 20.2},${y0 + 0.6}Q${a + 20.6},${H - 0.4} ${a + 19},${H}Z`
    : t === 'chunky'
      ? `M${a - 9},${H}L${a - 9.2},${y0 - 0.6}L${a + 20.4},${y0}Q${a + 21.4},${H - 1.8} ${a + 19.6},${H}Z`
      : `M${a - 8.2},${H}L${a - 8.2},${y0}L${a + 19.9},${y0}Q${a + 20.3},${H - 0.5} ${a + 19.4},${H}Z`;
  const lugs: string[] = [];
  if (t === 'trail' || (t === 'boot' && w.traits?.high)) for (let x = a - 7.5; x < a + 18; x += 3.2) lugs.push(`M${x},${H}v-1h1.6v1z`);
  const laces: string[] = [];
  if (!low && t !== 'boot') for (let i = 0; i < 4; i++) { const x = a + 3.8 + i * 0.85, y = top + 1.2 + i * ((y0 - 7.4 - top) / 3.4); laces.push(`M${x - 1.6},${y + 0.5}L${x + 0.9},${y - 0.3}`); }
  if (t === 'boot' && w.traits?.high) for (let i = 0; i < 6; i++) { const y = top + 2 + i * 2.6; laces.push(`M${a + 1.2},${y}L${a + 3.8},${y + 0.5}`); }
  if (t === 'derby') for (let i = 0; i < 3; i++) laces.push(`M${a + 2.2 + i * 1.5},${y0 - 5.4 + i * 0.2}L${a + 3.4 + i * 1.5},${y0 - 3.6 + i * 0.2}`);
  return (
    <g>
      <path d={upper} {...base(w.fill)} />
      {(t === 'sneaker' || t === 'skate' || t === 'chunky') && <path d={`M${a + 13.2},${y0 - 5.8}Q${a + 12.4},${y0 - 2.4} ${a + 13.6},${y0}`} {...line(w.fill)} />}
      {t === 'skate' && <path d={`M${a - 4},${y0 - 2.2}Q${a + 3},${y0 - 5.4} ${a + 9.5},${y0 - 2}`} fill="none" stroke={luminance(w.fill) > 0.6 ? detail(w.fill) : SOLE_LIGHT} strokeWidth={1} strokeLinecap="round" />}
      {(t === 'runner' || t === 'trail') && <path d={`M${a - 3.5},${y0 - 1.2}L${a + 2.6},${y0 - 6}M${a - 0.5},${y0 - 1.2}L${a + 5},${y0 - 5.4}`} fill="none" stroke={luminance(w.fill) > 0.6 ? detail(w.fill) : SOLE_LIGHT} strokeWidth={1.1} strokeLinecap="round" opacity={0.9} />}
      {t === 'chunky' && <path d={`M${a - 7.4},${y0 - 2.4}Q${a + 4},${y0 - 4.6} ${a + 12.8},${y0 - 2.2}`} {...line(w.fill, 0.7)} />}
      {t === 'boot' && !w.traits?.high && <path d={poly([[a - 2.2, top + 1], [a + 0.8, top + 1], [a + 1.6, y0 - 4.4], [a - 2.6, y0 - 4.4]])} fill={detail(w.fill)} opacity={0.55} />}
      {t === 'loafer' && <path d={`M${a + 3.4},${y0 - 4.8}L${a + 7.6},${y0 - 5.2}L${a + 8.4},${y0 - 3.2}L${a + 4.6},${y0 - 2.6}Z`} {...line(w.fill, 0.5)} />}
      {laces.length > 0 && <path d={laces.join('')} fill="none" stroke={t === 'boot' && w.second ? second : luminance(w.fill) > 0.6 ? detail(w.fill) : SOLE_LIGHT} strokeWidth={0.6} strokeLinecap="round" />}
      <path d={soleD} {...base(sole)} />
      {t === 'chunky' && <path d={`M${a - 9},${H - 1.6}L${a + 20.6},${H - 1.4}`} {...line(sole, 0.5)} />}
      {(low || t === 'boot') && <rect x={a - 8.2} y={H - thick - 0.9} width={6.4} height={thick + 0.9} {...base(sole)} />}
      {lugs.length > 0 && <path d={lugs.join('')} fill={sole} />}
    </g>
  );
}

// ───────────────────────── Accesorios (frontal) ─────────────────────────
function AccessoryFront({ L, w, tuck, wY, wb }: { L: Landmarks; w: Worn; tuck: boolean; wY: number; wb: number }) {
  const hw = L.headW / 2, f = w.fill;
  switch (w.type) {
    case 'cap': {
      const yb = L.head * 0.34;
      return <g><path d={`M${-hw - 0.5},${yb}Q${-hw - 0.9},${-2.4} 0,${-2.6}Q${hw + 0.9},${-2.4} ${hw + 0.5},${yb}Z`} {...base(f)} /><path d={`M${-hw - 2.4},${yb - 0.2}Q0,${yb + 5} ${hw + 2.4},${yb - 0.2}Q0,${yb + 1.4} ${-hw - 2.4},${yb - 0.2}Z`} {...base(shade(f, luminance(f) < 0.22 ? 0.1 : -0.1))} /></g>;
    }
    case 'beanie': {
      const yb = L.head * 0.4;
      return <g><path d={`M${-hw - 0.7},${yb}Q${-hw - 0.9},${-4.4} 0,${-4.6}Q${hw + 0.9},${-4.4} ${hw + 0.7},${yb}Z`} {...base(f)} /><rect x={-hw - 1} y={yb - 3.4} width={L.headW + 2} height={3.8} rx={1} {...base(shade(f, luminance(f) < 0.22 ? 0.1 : -0.1))} /></g>;
    }
    case 'sunglasses': {
      const y = L.head * 0.42, lw = L.headW * 0.36, lh = L.head * 0.13;
      return <g><rect x={-lw - 0.7} y={y} width={lw} height={lh} rx={lh * 0.35} fill={luminance(f) > 0.5 ? '#3A3D45' : f} stroke={luminance(f) > 0.5 ? f : edge(f)} strokeWidth={0.5} /><rect x={0.7} y={y} width={lw} height={lh} rx={lh * 0.35} fill={luminance(f) > 0.5 ? '#3A3D45' : f} stroke={luminance(f) > 0.5 ? f : edge(f)} strokeWidth={0.5} /><path d={`M-0.7,${y + lh * 0.35}h1.4`} stroke={luminance(f) > 0.5 ? f : edge(f)} strokeWidth={0.5} /></g>;
    }
    case 'scarf':
      return <g><rect x={1.2} y={L.ySh - 1} width={6.6} height={L.yCh - L.ySh + 13} rx={0.8} {...base(shade(f, luminance(f) < 0.22 ? 0.08 : -0.08))} /><rect x={-L.nk - 3.2} y={L.head * 0.93} width={L.nk * 2 + 6.4} height={L.ySh - L.head * 0.93 + 1.6} rx={2.4} {...base(f)} /></g>;
    case 'tote': {
      const hx = L.hand[0], hy = L.hand[1];
      return <g><path d={`M${hx - 5},${hy + 9}L${hx},${hy}L${hx + 9},${hy + 9}`} {...line(f, 0.9)} /><rect x={hx - 9} y={hy + 8.5} width={23} height={26} rx={0.8} {...base(f)} /></g>;
    }
    case 'crossbody':
      return <g><path d={`M${L.sh - 5},${L.ySh - 1.4}L${-L.hi - 0.5},${L.yHi - 4}`} stroke={edge(f)} strokeWidth={1.5} fill="none" strokeLinecap="round" /><rect x={-L.hi - 8.5} y={L.yHi - 5} width={14} height={10} rx={2.2} {...base(f)} /><path d={`M${-L.hi - 8.5},${L.yHi - 1.6}h14`} {...line(f)} /></g>;
    case 'backpack': {
      const strap = (s: number) => <path d={poly([[s * (L.sh - 8.4), L.ySh - 1.8], [s * (L.sh - 5), L.ySh - 0.8], [s * (L.ch - 1.2), L.yCh + 9], [s * (L.ch - 4.6), L.yCh + 9]])} {...base(f)} />;
      return <g>{strap(1)}{strap(-1)}</g>;
    }
    case 'belt':
      if (!tuck) return null;
      return <g><rect x={-wb} y={wY + 0.1} width={wb * 2} height={2.5} {...base(f)} /><rect x={-1.7} y={wY - 0.2} width={3.4} height={3.1} rx={0.4} fill="none" stroke="#C9B37A" strokeWidth={0.6} /></g>;
    case 'watch': {
      const a = along(L, L.arm - 3.4, L.wrist * 1.25), b = along(L, L.arm - 3.4, -L.wrist * 1.25), c = along(L, L.arm - 1.4, -L.wrist * 1.2), d = along(L, L.arm - 1.4, L.wrist * 1.2);
      return <path d={poly(mirror([a, b, c, d]))} {...base(f)} />;
    }
    default:
      return null;
  }
}

// ───────────────────────── Perfil ─────────────────────────
function BodySide({ L, skin }: { L: Landmarks; skin: string }) {
  const s = { fill: skin, stroke: shade(skin, -0.16), strokeWidth: 0.35, strokeLinejoin: 'round' as const };
  const kF = L.hF * 0.6, kB = -L.hF * 0.62;
  const body: Pt[] = [
    [2.6, L.head * 0.9], [2.4, L.ySh - 2.4], [L.cF * 0.72, L.ySh + 4], [L.cF, L.yCh], [L.wF, L.yWa], [L.hF, L.yHi], [L.hF * 1.02, L.yCr + 2],
    [kF + 0.6, L.yKn], [kF - 1.2, lerp(L.yKn, L.yAn, 0.4)], [3.6, L.yAn], [3.4, L.H - 2],
    [-3.6, L.H - 2], [-3.8, L.yAn], [kB - 2, lerp(L.yKn, L.yAn, 0.32)], [kB, L.yKn], [L.hB * 0.82, L.yCr + 4],
    [L.hB, L.yHi], [L.wB, L.yWa], [L.cB, L.yCh], [L.cB * 0.92, L.ySh + 3], [-L.nk * 0.95, L.ySh - 2.6], [-L.nk * 0.8, L.head * 0.88],
  ];
  const arm: Pt[] = [[-0.6, L.ySh + 0.4], [L.ua * 0.95, L.ySh + 5], [L.ua * 0.8 + 0.8, L.S[1] + L.arm * 0.5], [L.wrist + 1.6, L.S[1] + L.arm], [-L.wrist + 1.6, L.S[1] + L.arm], [-L.ua * 0.8 + 0.4, L.S[1] + L.arm * 0.5], [-L.ua, L.ySh + 5]];
  return (
    <g>
      <path d={`M-7,${L.H}L-6.6,${L.H - 3.4}L4,${L.H - 4.4}Q16,${L.H - 3.4} 18.6,${L.H - 1.4}L18.6,${L.H}Z`} {...s} />
      <path d={smooth(body, 0.42)} {...s} />
      <ellipse cx={1.4} cy={L.head / 2} rx={L.head * 0.41} ry={L.head / 2} {...s} />
      <path d={smooth(arm, 0.5)} {...s} /><ellipse cx={1.8} cy={L.S[1] + L.arm + 4.4} rx={L.wrist * 0.95} ry={4.6} {...s} />
    </g>
  );
}

function TopSide({ L, w, part }: { L: Landmarks; w: Worn; part: 'body' | 'sleeve' }) {
  const spec = TOPS[w.type];
  if (!spec) return null;
  const g = topGeom(L, spec, w);
  const eS = g.e * 0.85 + 0.7;
  const openK = spec.open ? 1.5 : 0;
  const hemY = g.hemY;
  const frontAt = (y: number) => (y <= L.yCh ? L.cF : y <= L.yWa ? lerp(L.cF, L.wF, (y - L.yCh) / (L.yWa - L.yCh)) : y <= L.yHi ? lerp(L.wF, L.hF, (y - L.yWa) / (L.yHi - L.yWa)) : L.hF);
  const backAt = (y: number) => (y <= L.yCh ? L.cB : y <= L.yWa ? lerp(L.cB, L.wB, (y - L.yCh) / (L.yWa - L.yCh)) : y <= L.yHi ? lerp(L.wB, L.hB, (y - L.yWa) / (L.yHi - L.yWa)) : L.hB);
  const slim = w.fit === 'slim';
  const fHem = slim ? frontAt(hemY) + eS : Math.max(frontAt(hemY), L.cF * 0.92) + eS + openK;
  const bHem = slim ? backAt(hemY) - eS : Math.min(backAt(hemY), L.hB * 0.9, L.cB) - eS;
  const pts: Pt[] = [[-L.nk - 0.9, L.ySh - 3], [3.4, L.ySh - 1.6], [L.cF + eS, L.yCh]];
  if (slim) pts.push([L.wF + eS, L.yWa]);
  pts.push([fHem, hemY], [bHem, hemY]);
  if (slim) pts.push([L.wB - eS, L.yWa]);
  pts.push([L.cB - eS, L.yCh], [L.cB * 0.9 - eS * 0.5, L.ySh + 2]);
  const sleeve = g.sleeve;
  const len = sleeve === 'short' ? L.arm * (0.33 + g.drop * 0.022) : L.arm + 0.8;
  const tH = L.ua + g.e * 0.6 + 1.2, eH = sleeve === 'short' ? L.ua + g.e * 0.7 + 0.8 : L.wrist + g.e * 0.4 + 1.4;
  const y0 = L.ySh - 0.4, y1 = L.S[1] + len;
  const sl: Pt[] = [[-tH * 0.7, y0], [tH * 0.75, y0 + 1.5], [tH + 0.4, y0 + 7], [eH + 1.2 + (sleeve === 'long' ? 0.6 : 0), y1], [-eH + 1.2 + (sleeve === 'long' ? 0.6 : 0), y1], [-tH - 0.2, y0 + 7]];
  const fill = w.fill, sleeveFill = w.type === 'bomber' && w.second ? w.second : fill;
  if (part === 'sleeve') return sleeve !== 'none' ? <path d={poly(sl)} {...base(sleeveFill)} /> : null;
  return (
    <g>
      <path d={poly(pts)} {...base(fill)} />
      {spec.neck === 'turtle' && <path d={poly([[-L.nk - 0.8, L.ySh - 2.4], [-L.nk - 0.4, L.head * 0.95], [3.2, L.head * 0.97], [3.6, L.ySh - 1.4]])} {...base(fill)} />}
      {spec.neck === 'hood' && <path d={`M${-L.nk - 0.6},${L.ySh - 4}Q${-L.nk - 9},${L.ySh + 1} ${-L.nk - 5.5},${L.ySh + 10}Q${-L.nk - 1},${L.ySh + 9} ${L.cB * 0.6},${L.ySh + 1}Z`} {...base(shade(fill, luminance(fill) < 0.22 ? 0.07 : -0.07))} />}
      {(spec.lapel || spec.neck === 'collar') && <path d={poly([[-L.nk - 1, L.ySh - 3.4], [3.8, L.ySh - 2.2], [5.4, L.ySh + 2.6], [-L.nk + 0.5, L.ySh]])} {...base(shade(fill, luminance(fill) < 0.22 ? 0.1 : -0.1))} />}
      {spec.rib && <path d={poly([[fHem, hemY - 3], [fHem, hemY], [bHem, hemY], [bHem, hemY - 3]])} fill={detail(fill)} opacity={0.5} />}
      {spec.belt && <path d={poly([[L.wF + eS + 1, L.yWa], [L.wF + eS + 1, L.yWa + 3.2], [L.wB - eS - 0.6, L.yWa + 3.2], [L.wB - eS - 0.6, L.yWa]])} fill={detail(fill)} opacity={0.6} />}
    </g>
  );
}

function ArmSide({ L, skin }: { L: Landmarks; skin: string }) {
  const s = { fill: skin, stroke: shade(skin, -0.16), strokeWidth: 0.35, strokeLinejoin: 'round' as const };
  const arm: Pt[] = [[-0.6, L.ySh + 0.4], [L.ua * 0.95, L.ySh + 5], [L.ua * 0.8 + 0.8, L.S[1] + L.arm * 0.5], [L.wrist + 1.6, L.S[1] + L.arm], [-L.wrist + 1.6, L.S[1] + L.arm], [-L.ua * 0.8 + 0.4, L.S[1] + L.arm * 0.5], [-L.ua, L.ySh + 5]];
  return <g><path d={smooth(arm, 0.5)} {...s} /><ellipse cx={1.8} cy={L.S[1] + L.arm + 4.4} rx={L.wrist * 0.95} ry={4.6} {...s} /></g>;
}

function BottomSide({ L, w }: { L: Landmarks; w: Worn }) {
  const g = bottomGeom(L, w);
  const e = g.e * 0.9 + 0.5;
  const half = g.kind === 'wide' ? 12 + e * 0.7 : g.kind === 'slim' ? 6.6 : g.kind === 'taper' ? 6.6 : g.kind === 'short' ? L.hF * 0.86 + e : g.kind === 'skirt' ? (w.traits?.mini ? L.hF + e : L.hF + e + 4) : 9 + e * 0.4;
  const cx = g.kind === 'short' || g.kind === 'skirt' ? (L.hF + L.hB) / 2 + 1.4 : 0.4;
  const pts: Pt[] = [[lerp(L.wF, L.hF, 0.1) + 0.7, g.wY], [L.hF + e, L.yHi], [L.hF + e * 0.9, L.yCr + 1]];
  if (g.kind === 'slim' || g.kind === 'taper' || g.kind === 'straight') pts.push([L.hF * 0.6 + e + 1.2, L.yKn]);
  pts.push([cx + half, g.hemY], [cx - half, g.hemY]);
  if (g.kind === 'slim' || g.kind === 'taper' || g.kind === 'straight') pts.push([-L.hF * 0.62 - e - 1.5, L.yKn]);
  pts.push([L.hB - e, L.yHi], [L.wB - 0.7, g.wY]);
  return <g><path d={poly(pts)} {...base(w.fill)} /><path d={`M${pt([lerp(L.wF, L.hF, 0.1) + 0.7, g.wY + 2.4])}L${pt([L.wB - 0.8, g.wY + 2.4])}`} {...line(w.fill)} /></g>;
}

function AccessorySide({ L, w }: { L: Landmarks; w: Worn }) {
  const f = w.fill, hd = L.head * 0.41;
  switch (w.type) {
    case 'cap': {
      const yb = L.head * 0.34;
      return <g><path d={`M${1.4 - hd - 0.5},${yb}Q${1.4 - hd - 0.6},${-2.6} 1.4,${-2.6}Q${1.4 + hd + 0.6},${-2.4} ${1.4 + hd + 0.4},${yb}Z`} {...base(f)} /><path d={`M${1.4 + hd - 1},${yb - 1}L${1.4 + hd + 8.5},${yb + 1.2}L${1.4 + hd + 8.2},${yb + 2.2}L${1.4 + hd - 1},${yb + 0.6}Z`} {...base(shade(f, luminance(f) < 0.22 ? 0.1 : -0.1))} /></g>;
    }
    case 'beanie': {
      const yb = L.head * 0.4;
      return <g><path d={`M${1.4 - hd - 0.7},${yb}Q${1.4 - hd - 1.4},${-4.6} 1,${-4.6}Q${1.4 + hd + 0.9},${-4.2} ${1.4 + hd + 0.6},${yb}Z`} {...base(f)} /><rect x={1.4 - hd - 1} y={yb - 3.4} width={hd * 2 + 2} height={3.8} rx={1} {...base(shade(f, luminance(f) < 0.22 ? 0.1 : -0.1))} /></g>;
    }
    case 'sunglasses':
      return <rect x={1.4 + hd - 3.2} y={L.head * 0.42} width={3.6} height={L.head * 0.13} rx={0.8} fill={luminance(f) > 0.5 ? '#3A3D45' : f} stroke={edge(f)} strokeWidth={0.4} />;
    case 'scarf':
      return <g><rect x={-L.nk - 2.4} y={L.head * 0.93} width={L.nk + 7.6} height={L.ySh - L.head * 0.93 + 1.8} rx={2.4} {...base(f)} /><rect x={L.cF - 2} y={L.ySh} width={5.4} height={L.yCh - L.ySh + 12} rx={0.8} {...base(shade(f, luminance(f) < 0.22 ? 0.08 : -0.08))} /></g>;
    case 'backpack':
      return <rect x={L.cB - 13.5} y={L.ySh + 3} width={13} height={L.yWa - L.ySh + 2} rx={4} {...base(f)} />;
    case 'tote':
      return <g><path d={`M-2,${L.S[1] + L.arm + 12}L1.8,${L.S[1] + L.arm + 4}L7,${L.S[1] + L.arm + 12}`} {...line(f, 0.9)} /><rect x={-8.5} y={L.S[1] + L.arm + 11.5} width={22} height={25} rx={0.8} {...base(f)} /></g>;
    case 'crossbody':
      return <rect x={-5} y={L.yHi - 5} width={13} height={10} rx={2.2} {...base(f)} />;
    default:
      return null;
  }
}

// ───────────────────────── Composición ─────────────────────────
export interface FigureProps {
  dims: BodyDims;
  view?: 'front' | 'side';
  items: Worn[];
  body?: boolean;
  ghost?: boolean;
  skin?: string;
  tuck?: boolean;
}

export function FigureLayers({ dims, view = 'front', items, body = true, ghost, skin = '#D4C5B8', tuck = false }: FigureProps) {
  const idp = useId().replace(/[^a-zA-Z0-9]/g, '');
  const L = landmarks(dims);
  const by = (cat: Category) => items.filter((i) => i.category === cat);
  const layer = by('layer'), bottom = by('bottom'), shoes = by('shoes'), acc = by('accessory');
  // Bajo una capa con mangas, la prenda interior se dibuja como mucho un punto más ceñida que la capa.
  const ORDER: Fit[] = ['slim', 'regular', 'relaxed', 'oversized'];
  const sleeved = layer.find((l) => TOPS[l.type]?.sleeve !== 'none');
  const top = by('top').map((t) => {
    if (!sleeved) return t;
    const cap = Math.max(0, ORDER.indexOf(sleeved.fit) - 1);
    return ORDER.indexOf(t.fit) > cap ? { ...t, fit: ORDER[cap], shift: 0 } : t;
  });
  const bg = bottom[0] ? bottomGeom(L, bottom[0]) : null;
  const wY = bg?.wY ?? L.yWa + 2.4, wb = bg?.wb ?? L.wa + 0.9;
  if (view === 'side') {
    const behind = acc.filter((a) => a.type === 'backpack');
    const front = acc.filter((a) => a.type !== 'backpack');
    return (
      <g>
        {behind.map((a) => <AccessorySide key={a.key} L={L} w={a} />)}
        {body && <BodySide L={L} skin={skin} />}
        {shoes.map((s) => <ShoeSide key={s.key} w={s} a={0} H={L.H} yAn={L.yAn} />)}
        {tuck && top.map((t) => <TopSide key={t.key} L={L} w={t} part="body" />)}
        {bottom.map((b) => <BottomSide key={b.key} L={L} w={b} />)}
        {!tuck && top.map((t) => <TopSide key={t.key} L={L} w={t} part="body" />)}
        {layer.map((l) => <TopSide key={l.key} L={L} w={l} part="body" />)}
        {body && <ArmSide L={L} skin={skin} />}
        {top.map((t) => <TopSide key={t.key + 's'} L={L} w={t} part="sleeve" />)}
        {layer.map((l) => <TopSide key={l.key + 's'} L={L} w={l} part="sleeve" />)}
        {front.map((a) => <AccessorySide key={a.key} L={L} w={a} />)}
      </g>
    );
  }
  return (
    <g>
      {body && <BodyFront L={L} skin={skin} />}
      {shoes.map((s) => <ShoesFront key={s.key} L={L} w={s} />)}
      {tuck && top.map((t) => <TopFront key={t.key} L={L} w={t} idp={idp} ghost={ghost} />)}
      {bottom.map((b) => <BottomFront key={b.key} L={L} w={b} idp={idp} />)}
      {acc.filter((a) => a.type === 'belt').map((a) => <AccessoryFront key={a.key} L={L} w={a} tuck={tuck} wY={wY} wb={wb} />)}
      {!tuck && top.map((t) => <TopFront key={t.key} L={L} w={t} idp={idp} ghost={ghost} />)}
      {layer.map((l) => <TopFront key={l.key} L={L} w={l} idp={idp} ghost={ghost && top.length === 0} />)}
      {acc.filter((a) => a.type !== 'belt').map((a) => <AccessoryFront key={a.key} L={L} w={a} tuck={tuck} wY={wY} wb={wb} />)}
    </g>
  );
}

export function figureBox(dims: BodyDims, view: 'front' | 'side' = 'front'): [number, number, number, number] {
  const half = view === 'front' ? Math.max(48, dims.shoulders / 2 + 26) : 34;
  return [-half, -8, half * 2, dims.height + 14];
}

export { landmarks, topGeom as _topGeom, bottomGeom as _bottomGeom, TOPS as TOP_SPECS };
