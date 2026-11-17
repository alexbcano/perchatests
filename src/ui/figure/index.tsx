import { useState } from 'react';
import type { Measurements, Outfit, Piece, Product } from '@/domain/types';
import { BACKDROPS, hex, luminance, shade } from '@/data/demo/colors';
import { photoOk, usePhotoStatus } from '@/services/catalog/photos';
import { typeLabel } from '@/domain/garments';
import { FigureLayers, ShoeSide, figureBox, landmarks, _bottomGeom, _topGeom, TOP_SPECS, type Worn } from './Figure';
import { DEFAULT_BODY, EDITORIAL_BODY, along, type BodyDims } from './geometry';

export type Resolved = { piece: Piece; product: Product };

export function toWorn(items: Resolved[]): Worn[] {
  return items.map(({ piece, product }) => ({
    key: product.id,
    type: product.type,
    category: product.category,
    fill: hex(piece.color),
    second: product.traits?.second ? hex(product.traits.second) : undefined,
    fit: product.fit,
    shift: piece.sizeShift ?? 0,
    traits: product.traits,
  }));
}

export function shouldTuck(items: Resolved[]): boolean {
  const top = items.find((i) => i.product.category === 'top')?.product;
  const bottom = items.find((i) => i.product.category === 'bottom')?.product;
  if (!top || !bottom) return false;
  if (!['shirt', 'polo', 'turtleneck', 'tee', 'longsleeve'].includes(top.type) || top.traits?.cropped) return false;
  if (top.fit === 'oversized') return false;
  const belt = items.some((i) => i.product.type === 'belt');
  return belt || bottom.type === 'skirt' || (top.formality + bottom.formality) / 2 >= 3.3;
}

export function FigureSvg({ dims, view = 'front', items, className, label }: { dims: BodyDims; view?: 'front' | 'side'; items: Resolved[]; className?: string; label?: string }) {
  const [x, y, w, h] = figureBox(dims, view);
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} className={className} role="img" aria-label={label ?? 'Avatar con el look'} preserveAspectRatio="xMidYMax meet">
      <ellipse cx={view === 'side' ? 4 : 0} cy={dims.height + 0.6} rx={view === 'side' ? 18 : 24} ry={2.2} fill="rgb(20 24 43 / 0.12)" />
      <FigureLayers dims={dims} view={view} items={toWorn(items)} tuck={shouldTuck(items)} />
    </svg>
  );
}

// ───────────── Miniatura de producto (ilustración, no fotografía) ─────────────
function AccessoryIcon({ w }: { w: Worn }) {
  const f = w.fill;
  const e = luminance(f) < 0.22 ? shade(f, 0.2) : shade(f, -0.3);
  const d = luminance(f) < 0.22 ? shade(f, 0.28) : shade(f, -0.22);
  const s = { fill: f, stroke: e, strokeWidth: 1.2, strokeLinejoin: 'round' as const };
  const l = { fill: 'none', stroke: d, strokeWidth: 1.2, strokeLinecap: 'round' as const };
  switch (w.type) {
    case 'cap':
      return <g><path d="M22,60Q20,28 50,28Q76,28 78,58Z" {...s} /><path d="M70,56L96,62Q97,67 92,68L24,62L22,58Z" {...s} fill={d} /><path d="M50,28Q46,44 47,60" {...l} /></g>;
    case 'beanie':
      return <g><path d="M26,62Q24,22 50,22Q76,22 74,62Z" {...s} /><rect x="22" y="58" width="56" height="15" rx="3" {...s} fill={d} /><path d="M34,58v15M44,58v15M54,58v15M64,58v15" {...l} opacity={0.6} /></g>;
    case 'tote':
      return <g><path d="M36,40Q36,14 50,14Q64,14 64,40" {...l} strokeWidth={2.4} /><path d="M24,38H76L80,88H20Z" {...s} /></g>;
    case 'crossbody':
      return <g><path d="M30,48Q50,2 70,48" {...l} strokeWidth={2.2} /><rect x="24" y="46" width="52" height="38" rx="8" {...s} /><path d="M24,60H76" {...l} /><rect x="46" y="57" width="8" height="6" rx="1" fill={d} /></g>;
    case 'backpack':
      return <g><path d="M40,24Q50,8 60,24" {...l} strokeWidth={2.2} /><rect x="26" y="22" width="48" height="66" rx="12" {...s} /><rect x="26" y="22" width="48" height="13" rx="6" {...s} fill={d} /><rect x="35" y="56" width="30" height="22" rx="4" {...l} /></g>;
    case 'belt':
      return <g><path d="M10,44H78Q88,50 78,56H10Z" {...s} /><rect x="14" y="40" width="16" height="20" rx="2" fill="none" stroke="#B89E5E" strokeWidth={2.4} /><path d="M52,50h2M62,50h2M72,50h2" {...l} strokeWidth={2} /></g>;
    case 'scarf':
      return <g><path d="M22,26H78V44H22Z" {...s} /><path d="M54,38H74V84H54Z" {...s} fill={d} /><path d="M56,84v6M61,84v6M66,84v6M71,84v6" {...l} /></g>;
    case 'sunglasses': {
      const lens = luminance(f) > 0.5 ? '#3A3D45' : f;
      const frame = luminance(f) > 0.5 ? f : e;
      return <g><rect x="12" y="40" width="32" height="22" rx="8" fill={lens} stroke={frame} strokeWidth={2.4} /><rect x="56" y="40" width="32" height="22" rx="8" fill={lens} stroke={frame} strokeWidth={2.4} /><path d="M44,47Q50,43 56,47" fill="none" stroke={frame} strokeWidth={2.4} /></g>;
    }
    case 'watch':
      return <g><rect x="41" y="8" width="18" height="84" rx="3" {...s} /><circle cx="50" cy="50" r="17" fill="#F1EFE9" stroke="#8D8F96" strokeWidth={2.4} /><path d="M50,50V39M50,50L58,54" stroke="#43454C" strokeWidth={1.8} strokeLinecap="round" fill="none" /></g>;
    default:
      return <circle cx="50" cy="50" r="20" {...s} />;
  }
}

export function ProductThumb(props: { product: Product; color?: Product['color']; className?: string }) {
  const { product, color, className } = props;
  const [failed, setFailed] = useState(false);
  const st = usePhotoStatus();
  if (product.photo) return <img src={product.photo} alt={product.name} className={`${className ?? ''} object-cover`} />;
  // Foto real de la ficha: se pide a la web de la tienda. Si el alojamiento o la tienda no la sirven, se usa el dibujo.
  const sameColor = !color || color === product.color;
  if (product.imageUrl && sameColor && !failed && (product.own || photoOk(product.imageUrl, st) || st.size === 0)) {
    return <img src={product.imageUrl} alt={product.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${className ?? ''} bg-white object-cover`} />;
  }
  return <ProductDrawing {...props} />;
}

function ProductDrawing({ product, color, className }: { product: Product; color?: Product['color']; className?: string }) {
  const w = toWorn([{ piece: { ref: product.id, own: !!product.own, color: color ?? product.color }, product }])[0];
  const common = { className, role: 'img' as const, 'aria-label': `Ilustración de ${product.name}`, preserveAspectRatio: 'xMidYMid meet' };
  if (product.category === 'accessory') return <svg viewBox="0 0 100 100" {...common}><g transform="translate(10 10) scale(0.8)"><AccessoryIcon w={w} /></g></svg>;
  if (product.category === 'shoes') {
    const H = 100, yAn = 93;
    return <svg viewBox="-13 68 37 37" {...common}><ShoeSide w={w} a={0} H={H} yAn={yAn} /></svg>;
  }
  const L = landmarks(DEFAULT_BODY);
  if (product.category === 'bottom') {
    const g = _bottomGeom(L, w);
    const top = g.wY - 5, h = g.hemY - top + 6, size = Math.max(h, 62);
    return <svg viewBox={`${-size / 2} ${top - (size - h) / 2} ${size} ${size}`} {...common}><FigureLayers dims={DEFAULT_BODY} items={[w]} body={false} /></svg>;
  }
  const spec = TOP_SPECS[product.type]!;
  const g = _topGeom(L, spec, w);
  const top = L.ySh - 11, h = g.hemY - top + 6, size = Math.max(h, 86);
  return <svg viewBox={`${-size / 2} ${top - (size - h) / 2} ${size} ${size}`} {...common}><FigureLayers dims={DEFAULT_BODY} items={[w]} body={false} ghost /></svg>;
}

// ───────────── Ilustración editorial del look ─────────────
export function OutfitCover({ items, backdrop, className, wide, label }: { items: Resolved[]; backdrop: number; className?: string; wide?: boolean; label?: string }) {
  const [bg, shape, floor] = BACKDROPS[backdrop % BACKDROPS.length];
  const W = wide ? 640 : 300, Hh = 400;
  const cx = wide ? 455 : 150;
  const dims = EDITORIAL_BODY;
  const [, , , fh] = figureBox(dims);
  const scale = 372 / fh;
  const variant = backdrop % 4;
  const dark = luminance(bg) < 0.3;
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} className={className} role="img" aria-label={label ?? 'Ilustración conceptual del look'} preserveAspectRatio="xMidYMid slice">
      <rect width={W} height={Hh} fill={bg} />
      {variant === 0 && <path d={`M${cx - 92},${Hh - 46}V150a92,92 0 0 1 184,0V${Hh - 46}Z`} fill={shape} />}
      {variant === 1 && <circle cx={cx + 26} cy={150} r={118} fill={shape} />}
      {variant === 2 && <rect x={cx - 112} y={34} width={150} height={Hh - 80} fill={shape} />}
      {variant === 3 && <path d={`M${cx - 150},${Hh - 46}L${cx + 10},20H${cx + 150}L${cx - 10},${Hh - 46}Z`} fill={shape} />}
      <rect y={Hh - 46} width={W} height={46} fill={floor} />
      <ellipse cx={cx + 8} cy={Hh - 26} rx={66} ry={7} fill={dark ? 'rgb(0 0 0 / 0.28)' : 'rgb(20 24 43 / 0.16)'} />
      <g transform={`translate(${cx} ${Hh - 27 - dims.height * scale}) scale(${scale})`}>
        <FigureLayers dims={dims} items={toWorn(items)} tuck={shouldTuck(items)} skin={dark ? '#E0D3C8' : '#D4C5B8'} />
      </g>
    </svg>
  );
}

// ───────────── Imagen del look: mosaico de fotos reales o, si no se pueden cargar, ilustración ─────────────
const ORDER = ['layer', 'top', 'bottom', 'shoes', 'accessory'];

export function useLookHasPhotos(items: Resolved[]): boolean {
  const st = usePhotoStatus();
  const withPhoto = items.filter((i) => i.product.photo || photoOk(i.product.imageUrl, st)).length;
  return items.length > 0 && withPhoto >= Math.max(2, Math.ceil(items.length * 0.6));
}

export function LookImage({ items, backdrop, className, wide, label }: { items: Resolved[]; backdrop: number; className?: string; wide?: boolean; label?: string }) {
  const photos = useLookHasPhotos(items);
  if (!photos) return <OutfitCover items={items} backdrop={backdrop} className={className} wide={wide} label={label} />;
  const sorted = [...items].sort((a, b) => ORDER.indexOf(a.product.category) - ORDER.indexOf(b.product.category));
  // Como mucho 5 fotos: la prenda principal en grande a la izquierda y el resto en orden de arriba abajo, cada una con su nombre.
  const shown = sorted.slice(0, 5);
  const extra = sorted.length - shown.length;
  const n = shown.length;
  const style = wide
    ? { gridTemplateColumns: `1.35fr repeat(${n - 1}, minmax(0, 1fr))`, gridTemplateRows: 'minmax(0, 1fr)' }
    : { gridTemplateColumns: n > 2 ? '1.25fr 1fr' : 'repeat(2, minmax(0, 1fr))', gridTemplateRows: `repeat(${Math.max(1, n - 1)}, minmax(0, 1fr))` };
  return (
    <div role="img" aria-label={label ?? 'Fotos reales de las prendas del look'} className={className}>
     <div className="grid h-full w-full gap-[3px] bg-surface" style={style}>
      {shown.map((it, i) => (
        <div key={it.piece.ref} className="relative min-h-0 min-w-0 overflow-hidden bg-tile" style={!wide && i === 0 && n > 2 ? { gridRow: `span ${n - 1}` } : undefined}>
          <ProductThumb product={it.product} color={it.piece.color} className="absolute inset-0 h-full w-full object-top" />
          <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium leading-tight text-ink">{typeLabel(it.product.type)}{extra > 0 && i === n - 1 ? ` y ${extra} más` : ''}</span>
        </div>
      ))}
     </div>
    </div>
  );
}

export function outfitResolvedLabel(outfit: Outfit) { return `Ilustración conceptual de ${outfit.name}`; }

// ───────────── Guía de medidas ─────────────
export type MeasureKey = keyof Measurements;

export const MEASURE_FIELDS: { key: MeasureKey; n: number; label: string; help: string; optional?: boolean; min: number; max: number }[] = [
  { key: 'height', n: 1, label: 'Altura', help: 'De pie, sin zapatos, de la coronilla al suelo.', min: 120, max: 230 },
  { key: 'shoulders', n: 2, label: 'Ancho de hombros', help: 'Por la espalda, de un extremo del hombro al otro.', min: 30, max: 65 },
  { key: 'chest', n: 3, label: 'Contorno de pecho', help: 'Alrededor de la parte más ancha del pecho, con la cinta horizontal.', min: 60, max: 160 },
  { key: 'waist', n: 4, label: 'Contorno de cintura', help: 'Alrededor de la parte más estrecha del torso, sin apretar.', min: 50, max: 160 },
  { key: 'hip', n: 5, label: 'Contorno de cadera', help: 'Alrededor de la parte más ancha de la cadera y los glúteos.', min: 60, max: 170 },
  { key: 'arm', n: 6, label: 'Longitud de brazo', help: 'Del extremo del hombro a la muñeca, con el brazo relajado.', min: 40, max: 90 },
  { key: 'leg', n: 7, label: 'Longitud de pierna', help: 'Por el lateral, de la cintura al suelo.', min: 70, max: 140 },
  { key: 'inseam', n: 8, label: 'Entrepierna', help: 'Por el interior de la pierna, de la ingle al suelo.', min: 55, max: 110 },
  { key: 'neck', n: 9, label: 'Contorno de cuello', help: 'Alrededor de la base del cuello.', optional: true, min: 28, max: 55 },
];

export function MeasureGuide({ active, onPick, className }: { active: MeasureKey | null; onPick?: (k: MeasureKey) => void; className?: string }) {
  const d = DEFAULT_BODY;
  const L = landmarks(d);
  const wristOut = along(L, L.arm, L.wrist + 3.5), shoulderOut = along(L, 0, L.ua + 3.5);
  const lines: Partial<Record<MeasureKey, { d: string; badge: [number, number]; dashed?: boolean }>> = {
    height: { d: `M${-L.sh - 16},0V${L.H}M${-L.sh - 19},0h6M${-L.sh - 19},${L.H}h6`, badge: [-L.sh - 16, L.H * 0.5] },
    shoulders: { d: `M${-L.sh},${L.ySh - 6}H${L.sh}M${-L.sh},${L.ySh - 8.5}v5M${L.sh},${L.ySh - 8.5}v5`, badge: [-L.sh + 3, L.ySh - 6] },
    chest: { d: `M${-L.ch},${L.yCh}Q0,${L.yCh + 5} ${L.ch},${L.yCh}`, badge: [0, L.yCh + 2.4], dashed: true },
    waist: { d: `M${-L.wa},${L.yWa}Q0,${L.yWa + 4.5} ${L.wa},${L.yWa}`, badge: [0, L.yWa + 2.2], dashed: true },
    hip: { d: `M${-L.hi},${L.yHi}Q0,${L.yHi + 5} ${L.hi},${L.yHi}`, badge: [0, L.yHi + 2.4], dashed: true },
    arm: { d: `M${shoulderOut[0]},${shoulderOut[1]}L${wristOut[0]},${wristOut[1]}`, badge: [(shoulderOut[0] + wristOut[0]) / 2, (shoulderOut[1] + wristOut[1]) / 2] },
    leg: { d: `M${-L.hi - 7},${L.yWa}V${L.H}M${-L.hi - 9.5},${L.yWa}h5M${-L.hi - 9.5},${L.H}h5`, badge: [-L.hi - 7, (L.yWa + L.H) / 2 + 10] },
    inseam: { d: `M0,${L.yCr + 2}V${L.H}M-2.5,${L.H}h5`, badge: [0, (L.yCr + L.H) / 2] },
    neck: { d: `M${-L.nk - 0.5},${L.head * 0.98}Q0,${L.head * 0.98 + 3} ${L.nk + 0.5},${L.head * 0.98}`, badge: [L.nk + 6, L.head * 0.98] , dashed: true },
  };
  const [x, y, w, h] = figureBox(d);
  return (
    <svg viewBox={`${x - 6} ${y} ${w + 12} ${h}`} className={className} role="img" aria-label="Dónde tomar cada medida">
      <FigureLayers dims={d} items={[]} skin="#CDD1DE" />
      {MEASURE_FIELDS.map((fld) => {
        const ln = lines[fld.key];
        if (!ln) return null;
        const on = active === fld.key;
        return (
          <g key={fld.key} onClick={() => onPick?.(fld.key)} style={{ cursor: onPick ? 'pointer' : undefined }} opacity={active && !on ? 0.45 : 1}>
            <path d={ln.d} fill="none" stroke={on ? 'var(--accent)' : 'var(--ink)'} strokeWidth={on ? 1.3 : 0.7} strokeDasharray={ln.dashed ? '2 1.6' : undefined} strokeLinecap="round" />
            <circle cx={ln.badge[0]} cy={ln.badge[1]} r={on ? 5.2 : 4.4} fill={on ? 'var(--accent)' : 'var(--surface)'} stroke={on ? 'var(--accent)' : 'var(--ink)'} strokeWidth={0.6} />
            <text x={ln.badge[0]} y={ln.badge[1] + 1.9} textAnchor="middle" fontSize={5.4} fontWeight={600} fill={on ? 'var(--accent-ink)' : 'var(--ink)'} style={{ fontFamily: 'var(--font-sans)' }}>{fld.n}</text>
          </g>
        );
      })}
    </svg>
  );
}

export { DEFAULT_BODY, EDITORIAL_BODY };
