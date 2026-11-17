// Recomendador de tallas.
// No existe conversión universal: cada recomendación sale de la tabla de la marca (y grupo de prenda)
// comparada con las medidas del usuario. Si faltan medidas clave, se dice y no se recomienda.
import type { Confidence, Fit, Measurements, Product, Profile, SizeRec } from '@/domain/types';
import { brandById, chartFor, type Range, type SizeChart, type SizeRow } from '@/data/demo/brands';
import { chartGroupFor } from '@/data/demo/catalog';

export const EASE_CM: Record<Fit, number> = { slim: 4, regular: 8, relaxed: 14, oversized: 22 };
const FIT_TEXT: Record<Fit, string> = { slim: 'slim (entallado)', regular: 'regular', relaxed: 'relaxed (holgado)', oversized: 'oversized (muy amplio)' };

const out = (v: number, [lo, hi]: Range) => (v < lo ? lo - v : v > hi ? v - hi : 0);
const pos = (v: number, [lo, hi]: Range) => (hi === lo ? 0.5 : (v - lo) / (hi - lo));
const fmtRange = (r?: Range) => (r ? `${fmt(r[0])}–${fmt(r[1])}` : '—');
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
const down = (c: Confidence): Confidence => (c === 'alta' ? 'media' : 'baja');

function bestRow(rows: SizeRow[], checks: { v: number; key: 'chest' | 'shoulders' | 'waist' | 'hip' | 'foot'; w: number }[]): number {
  let best = 0, bestScore = Infinity;
  rows.forEach((row, i) => {
    let score = 0;
    for (const c of checks) {
      const r = row[c.key];
      if (!r) continue;
      score += out(c.v, r) * c.w + Math.abs(pos(c.v, r) - 0.5) * 0.01;
    }
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
}

function chartTable(chart: SizeChart, product: Product, recommended?: string): SizeRec['chart'] {
  const cols: { key: 'chest' | 'shoulders' | 'waist' | 'hip' | 'foot'; label: string }[] = [];
  const has = (k: keyof SizeRow) => chart.rows.some((r) => r[k] !== undefined);
  if (has('chest')) cols.push({ key: 'chest', label: 'Pecho' });
  if (has('shoulders')) cols.push({ key: 'shoulders', label: 'Hombros' });
  if (has('waist')) cols.push({ key: 'waist', label: 'Cintura' });
  if (has('hip')) cols.push({ key: 'hip', label: 'Cadera' });
  if (has('foot')) cols.push({ key: 'foot', label: 'Pie' });
  return {
    title: chart.title,
    note: chart.note, demo: chart.brandId !== 'cos' && !chart.sourceUrl, sourceUrl: chart.sourceUrl,
    columns: cols.map((c) => c.label + ' (cm)'),
    rows: chart.rows.map((r) => ({
      size: r.size,
      cells: cols.map((c) => fmtRange(r[c.key])),
      inStock: product.sizes.length === 0 ? true : product.sizes.find((s) => s.label === r.size)?.inStock ?? false,
      recommended: r.size === recommended,
    })),
  };
}

export function recommendSize(product: Product, m: Measurements, fitPref: Profile['fitPreference']): SizeRec {
  const brand = brandById(product.brandId);
  const brandNote = brand?.sizingNote ?? '';
  const base: SizeRec = { status: 'ok', confidence: 'alta', headline: '', detail: '', margins: [], measures: [], chart: null, fit: product.fit, missing: [], brandNote };

  const group = chartGroupFor(product);
  const found = group ? chartFor(product.brandId, group, product.type) : undefined;
  const known = product.sizes.map((s) => s.label);
  const applies = !!found && !product.noChart && (known.length === 0 || found.rows.some((r) => known.includes(r.size)));
  if (!group || (!found && product.demo)) {
    return { ...base, status: 'onesize', headline: 'Talla única', detail: 'Este accesorio no tiene tallas.' };
  }
  if ((!found || !applies) && product.garment) return byGarment(product, m, base, brand?.name ?? 'La marca');
  if (!found || !applies) {
    // Marca real sin tabla leída: no se inventa una equivalencia.
    const usual = group === 'shoes' && m.shoeEU ? ` Tu talla habitual de calzado es la ${Math.round(m.shoeEU)}: úsala como punto de partida y confírmala en la guía de la marca.` : '';
    return {
      ...base, status: 'nochart', confidence: 'baja',
      headline: `Sin tabla de tallas de ${brand?.name ?? 'esta marca'}`,
      detail: `No tenemos una tabla oficial de medidas del cuerpo de ${brand?.name ?? 'esta marca'} para esta prenda, así que no recomendamos talla: sería adivinar. Abre la ficha y consulta su guía de tallas.${usual}`,
    };
  }
  const chart = found;
  const vintage = product.brandId === 'lunes';
  const finish = (rec: SizeRec): SizeRec => {
    if (rec.status === 'ok' && rec.size) {
      const label = rec.size.split(' ')[0];
      const stock = product.sizes.find((s) => s.label === label);
      if (stock && !stock.inStock) rec.stockWarning = product.demo ? `La talla ${label} figura sin existencias en los datos de demostración.` : `La talla ${label} no se podía comprar cuando consultamos la ficha.`;
      if (chart.derived && rec.confidence === 'alta') rec.confidence = 'media';
      if (vintage) { rec.confidence = down(rec.confidence); }
      rec.chart = chartTable(chart, product, label);
    } else {
      rec.chart = chartTable(chart, product);
    }
    return rec;
  };

  // ── Calzado ────────────────────────────────────────────────────
  if (group === 'shoes') {
    if (m.footLength) {
      const i = bestRow(chart.rows, [{ v: m.footLength, key: 'foot', w: 1 }]);
      const row = chart.rows[i];
      const off = out(m.footLength, row.foot!);
      return finish({
        ...base, size: row.size, confidence: off > 0.4 ? 'media' : 'alta',
        headline: `Te recomendamos un ${row.size}`,
        detail: `Tu pie mide ${fmt(m.footLength)} cm y la talla ${row.size} de ${brand?.name} cubre ${fmtRange(row.foot)} cm. ${brandNote}`,
        measures: [{ label: 'Largo de pie', user: m.footLength, range: fmtRange(row.foot), inRange: off === 0 }],
        alt: chart.rows[i + 1] ? { size: chart.rows[i + 1].size, why: 'Si lo llevas con calcetín grueso o prefieres más holgura en la puntera.' } : undefined,
      });
    }
    if (m.shoeEU) {
      const small = product.brandId === 'zancada';
      // Si la marca no tiene esa talla exacta (medios números), se toma la más cercana por arriba.
      const exact = String(Math.round(m.shoeEU));
      const near = chart.rows.find((r) => r.size === exact)
        ?? [...chart.rows].sort((x, y) => Math.abs(parseFloat(x.size) - m.shoeEU!) - Math.abs(parseFloat(y.size) - m.shoeEU!) || parseFloat(y.size) - parseFloat(x.size))[0];
      const size = near?.size ?? exact;
      const next = String(Math.round(m.shoeEU) + 1);
      return finish({
        ...base, size, confidence: 'media',
        headline: `Te recomendamos un ${size}`,
        detail: `Nos basamos en tu talla habitual (${exact} EU), no en la medida de tu pie.${size !== exact ? ` ${brand?.name} no tiene ${exact} justo: el más cercano es el ${size}.` : ''} ${brandNote} Añade el largo de pie en tu perfil para afinar.`,
        measures: [{ label: 'Largo de pie', user: null, range: fmtRange(chart.rows.find((r) => r.size === size)?.foot), inRange: null }],
        alt: small ? { size: next, why: 'Esta marca tiene horma pequeña: si sueles ir justo, sube una talla.' } : undefined,
        missing: ['Largo de pie'],
      });
    }
    return finish({
      ...base, status: 'insufficient', confidence: 'baja',
      headline: 'No hay datos suficientes para recomendar talla',
      detail: 'Para el calzado necesitamos el largo de tu pie o, al menos, tu talla habitual. Añádelo en Mi perfil.',
      missing: ['Largo de pie', 'Talla de calzado habitual'],
    });
  }

  // ── Cinturones ─────────────────────────────────────────────────
  if (group === 'belts') {
    if (!m.waist) {
      return finish({ ...base, status: 'insufficient', confidence: 'baja', headline: 'No hay datos suficientes para recomendar talla', detail: 'Falta tu contorno de cintura.', missing: ['Contorno de cintura'] });
    }
    const i = bestRow(chart.rows, [{ v: m.waist, key: 'waist', w: 1 }]);
    const row = chart.rows[i];
    return finish({
      ...base, size: row.size, confidence: out(m.waist, row.waist!) === 0 ? 'alta' : 'media',
      headline: `Te recomendamos la talla ${row.size}`,
      detail: `Tu cintura (${fmt(m.waist)} cm) entra en el rango ${fmtRange(row.waist)} de ${brand?.name}.`,
      measures: [{ label: 'Cintura', user: m.waist, range: fmtRange(row.waist), inRange: out(m.waist, row.waist!) === 0 }],
    });
  }

  // ── Partes de arriba y capas ───────────────────────────────────
  if (group === 'tops' || group === 'tailoring') {
    if (!m.chest) {
      return finish({
        ...base, status: 'insufficient', confidence: 'baja',
        headline: 'No hay datos suficientes para recomendar talla',
        detail: 'Para esta prenda necesitamos tu contorno de pecho. Añádelo en Mi perfil.',
        missing: ['Contorno de pecho'],
      });
    }
    const hasShoulders = chart.rows.some((r) => r.shoulders);
    const checks: Parameters<typeof bestRow>[1] = [{ v: m.chest, key: 'chest', w: 1 }];
    if (hasShoulders && m.shoulders) checks.push({ v: m.shoulders, key: 'shoulders', w: group === 'tailoring' ? 2.2 : 1.2 });
    let i = bestRow(chart.rows, checks);
    const byChest = bestRow(chart.rows, [{ v: m.chest, key: 'chest', w: 1 }]);
    const notes: string[] = [];
    const p = pos(m.chest, chart.rows[i].chest!);
    if (fitPref === 'holgado' && p > 0.6 && chart.rows[i + 1] && product.fit !== 'oversized') { i += 1; notes.push('Has indicado que prefieres la ropa holgada y estás en la parte alta del rango, así que subimos una talla.'); }
    if (fitPref === 'ajustado' && p < 0.35 && chart.rows[i - 1] && (product.fit === 'relaxed' || product.fit === 'oversized')) { i -= 1; notes.push('Prefieres la ropa ajustada y este corte ya es amplio, así que bajamos una talla.'); }
    const row = chart.rows[i];
    const offChest = out(m.chest, row.chest!);
    const offSh = row.shoulders && m.shoulders ? out(m.shoulders, row.shoulders) : 0;
    let confidence: Confidence = 'alta';
    if (offChest > 0 || offSh > 0 || (hasShoulders && !m.shoulders) || notes.length) confidence = 'media';
    if (offChest > 4 || offSh > 2.5) confidence = 'baja';
    if (i !== byChest && !notes.length) notes.push(`Por pecho serías una ${chart.rows[byChest].size}, pero tus hombros piden una ${row.size}: en esta prenda manda el hombro.`);
    const garment = row.chest![1] + EASE_CM[product.fit];
    const margin = Math.round(garment - m.chest);
    const measures: SizeRec['measures'] = [{ label: 'Pecho', user: m.chest, range: fmtRange(row.chest), inRange: offChest === 0 }];
    if (hasShoulders) measures.push({ label: 'Hombros', user: m.shoulders, range: fmtRange(row.shoulders), inRange: m.shoulders ? offSh === 0 : null });
    const amplio = product.fit === 'relaxed' || product.fit === 'oversized';
    const alt = amplio
      ? (chart.rows[i - 1] ? { size: chart.rows[i - 1].size, why: 'Si lo prefieres menos amplio, la talla inferior reduce el volumen sin quedar ceñida.' } : undefined)
      : (chart.rows[i + 1] ? { size: chart.rows[i + 1].size, why: 'Si buscas un efecto más oversized, la talla superior añade unos ' + Math.round((chart.rows[i + 1].chest![1] - row.chest![1])) + ' cm de contorno.' } : undefined);
    const offChart = offChest > 4;
    return finish({
      ...base, size: row.size, confidence,
      headline: `Te recomendamos la talla ${row.size}`,
      detail: offChart
        ? `Tu pecho (${fmt(m.chest)} cm) queda fuera de la tabla de ${brand?.name}; la ${row.size} es la más cercana, pero puede no sentarte bien.`
        : `Tu pecho (${fmt(m.chest)} cm) ${offChest === 0 ? 'entra en' : 'queda cerca de'} el rango ${fmtRange(row.chest)} de la ${row.size} de ${brand?.name}. Corte ${FIT_TEXT[product.fit]}${product.demo ? `: unos ${margin} cm de holgura en el pecho` : ' según la marca; la holgura exacta depende de las medidas de la prenda, que están en la ficha'}. ${notes.join(' ')}`.trim(),
      margins: product.demo ? [{ label: 'Holgura en pecho', cm: margin }] : [],
      measures, alt,
      missing: hasShoulders && !m.shoulders ? ['Ancho de hombros'] : [],
    });
  }

  // ── Partes de abajo ────────────────────────────────────────────
  if (!m.waist) {
    return finish({
      ...base, status: 'insufficient', confidence: 'baja',
      headline: 'No hay datos suficientes para recomendar talla',
      detail: 'Para esta prenda necesitamos tu contorno de cintura (y mejor también cadera). Añádelos en Mi perfil.',
      missing: ['Contorno de cintura', 'Contorno de cadera'],
    });
  }
  const byWaist = bestRow(chart.rows, [{ v: m.waist, key: 'waist', w: 1 }]);
  let i = byWaist;
  const notes: string[] = [];
  const chartHasHip = chart.rows.some((r) => r.hip);
  if (m.hip && chartHasHip) {
    const byHip = bestRow(chart.rows, [{ v: m.hip, key: 'hip', w: 1 }]);
    if (byHip > byWaist && product.fit === 'slim') { i = byHip; notes.push(`Tu cadera pide una ${chart.rows[byHip].size}: en un corte entallado manda la cadera y la cintura se ajusta con cinturón o sastre.`); }
    else if (byHip > byWaist) notes.push('Tu cadera está en la talla siguiente, pero este corte tiene holgura suficiente para mantener la talla de cintura.');
  }
  const row = chart.rows[i];
  const offW = out(m.waist, row.waist!);
  const offH = m.hip && row.hip ? out(m.hip, row.hip) : 0;
  let confidence: Confidence = 'alta';
  if (offW > 0 || offH > 0 || (chartHasHip && !m.hip) || i !== byWaist) confidence = 'media';
  if (offW > 4 || offH > 6) confidence = 'baja';
  let size = row.size;
  const measures: SizeRec['measures'] = [
    { label: 'Cintura', user: m.waist, range: fmtRange(row.waist), inRange: offW === 0 },
  ];
  if (row.hip) measures.push({ label: 'Cadera', user: m.hip, range: fmtRange(row.hip), inRange: m.hip ? offH === 0 : null });
  if (chart.derived) notes.push(chart.brandId === 'cos' ? 'La marca agrupa las tallas de dos en dos; hemos elegido dentro de la pareja según en qué mitad del rango cae tu cintura.' : 'La marca da una sola medida por talla; el rango de cada talla lo hemos repartido nosotros, así que confírmalo en su guía.');
  const needsLength = !['shorts', 'skirt'].includes(product.type);
  if (needsLength) {
    if (chart.lengths) {
      if (m.inseam) {
        const len = chart.lengths.reduce((a, b) => (Math.abs(b.inseam - m.inseam!) < Math.abs(a.inseam - m.inseam!) ? b : a));
        size = `${row.size} ${len.label}`;
        notes.push(`Largo ${len.label} (${len.inseam} cm) para tu entrepierna de ${fmt(m.inseam)} cm.`);
        measures.push({ label: 'Entrepierna', user: m.inseam, range: `${len.inseam}`, inRange: Math.abs(len.inseam - m.inseam) <= 2.5 });
      } else { notes.push('Falta tu entrepierna para elegir el largo (L30, L32 o L34).'); confidence = down(confidence); }
    } else if (row.inseam) {
      if (m.inseam) {
        const diff = row.inseam - m.inseam;
        measures.push({ label: 'Entrepierna', user: m.inseam, range: `${row.inseam}`, inRange: Math.abs(diff) <= 2.5 });
        if (diff > 2.5) notes.push(`Largo único de ${row.inseam} cm: te sobran unos ${Math.round(diff)} cm, habrá que subir el bajo.`);
        else if (diff < -2.5) { notes.push(`Largo único de ${row.inseam} cm: te quedará unos ${Math.round(-diff)} cm corto.`); confidence = down(confidence); }
      } else notes.push('Añade tu entrepierna para comprobar el largo.');
    } else if (!product.demo) notes.push('El largo no figura en la tabla: mira la medida de pierna en la ficha.');
  }
  const margins = m.hip && row.hip && product.demo ? [{ label: 'Holgura en cadera', cm: Math.round(row.hip[1] + EASE_CM[product.fit] - m.hip) }] : [];
  const amplio = product.fit === 'relaxed' || product.fit === 'oversized';
  const alt = amplio
    ? (chart.rows[i - 1] ? { size: chart.rows[i - 1].size, why: 'Si quieres una pierna menos voluminosa. Comprueba que la cintura no apriete.' } : undefined)
    : (chart.rows[i + 1] ? { size: chart.rows[i + 1].size, why: 'Si lo quieres más holgado o de tiro caído; necesitarás cinturón.' } : undefined);
  const missing: string[] = [];
  if (!m.hip && chartHasHip) missing.push('Contorno de cadera');
  if (needsLength && !m.inseam) missing.push('Entrepierna');
  return finish({
    ...base, size, confidence,
    headline: `Te recomendamos la talla ${size}`,
    detail: offW > 4
      ? `Tu cintura (${fmt(m.waist)} cm) queda fuera de la tabla de ${brand?.name}; la ${row.size} es la más cercana, pero puede no sentarte bien.`
      : `Tu cintura (${fmt(m.waist)} cm) ${offW === 0 ? 'entra en' : 'queda cerca de'} el rango ${fmtRange(row.waist)} de la ${row.size} de ${brand?.name}. Corte ${FIT_TEXT[product.fit]}. ${notes.join(' ')}`.trim(),
    margins, measures, alt, missing,
  });
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = { alta: 'Confianza alta', media: 'Confianza media', baja: 'Confianza baja' };

/**
 * La tienda solo publica medidas de la prenda en plano. Sin una prenda tuya de referencia no hay forma honesta
 * de recomendar (habría que inventar cuánta holgura quieres). Con ella, se elige la talla cuyo ancho se parece más.
 */
function byGarment(product: Product, m: Measurements, base: SizeRec, brandName: string): SizeRec {
  const g = product.garment!;
  const sizes = Object.keys(g.chestFlat);
  const ref = m.refChestFlat ?? null;
  let pick: string | undefined;
  if (ref) pick = sizes.reduce((a, b) => (Math.abs(g.chestFlat[b] - ref) < Math.abs(g.chestFlat[a] - ref) ? b : a), sizes[0]);
  const chart: SizeRec['chart'] = {
    title: `Medidas de la prenda en plano (${brandName})`,
    note: 'Son medidas de la sudadera estirada sobre una mesa, no de tu cuerpo. El ancho va de axila a axila.',
    sourceUrl: g.sourceUrl,
    columns: g.length ? ['Ancho', 'Largo'] : ['Ancho'],
    rows: sizes.map((s) => ({
      size: s, recommended: s === pick,
      inStock: product.sizes.length === 0 ? true : product.sizes.find((x) => x.label === s)?.inStock ?? false,
      cells: [`${fmt(g.chestFlat[s])} cm`, ...(g.length ? [g.length[s] != null ? `${fmt(g.length[s])} cm` : '—'] : [])],
    })),
  };
  if (!ref || !pick) {
    return {
      ...base, status: 'nochart', confidence: 'baja', chart,
      headline: 'Compárala con una sudadera tuya',
      detail: `${brandName} solo publica las medidas de la prenda, no las del cuerpo. Coge una sudadera o camiseta que te quede como te gusta, extiéndela y mide de axila a axila. Con ese ancho elegimos la talla que más se parece.`,
    };
  }
  const diff = g.chestFlat[pick] - ref;
  const i = sizes.indexOf(pick);
  const other = diff < 0 ? sizes[i + 1] : sizes[i - 1];
  const otherDiff = other ? g.chestFlat[other] - ref : null;
  const close = Math.abs(diff) <= 1.5;
  const tie = otherDiff != null && Math.abs(otherDiff) === Math.abs(diff) && diff !== 0;
  const rec: SizeRec = {
    ...base, chart, size: pick, confidence: close ? 'media' : 'baja',
    headline: tie ? `Talla ${[pick, other].sort((a, b) => sizes.indexOf(a!) - sizes.indexOf(b!)).join(' o ')}` : `Talla ${pick}`,
    detail: `Tu prenda de referencia mide ${fmt(ref)} cm de ancho; la ${pick} de esta mide ${fmt(g.chestFlat[pick])} cm (${diff === 0 ? 'igual' : `${diff > 0 ? '+' : ''}${fmt(diff)} cm`}). ${tie ? ` La ${other} está igual de cerca (${otherDiff! > 0 ? '+' : ''}${fmt(otherDiff!)} cm): elige según si la quieres más justa o más holgada.` : ' Es la que más se parece a como te gusta que te quede.'}${close ? '' : ' Ninguna talla se parece mucho: mira también el largo en la tabla.'}`,
    measures: [{ label: 'Ancho de tu prenda', user: ref, range: `${fmt(g.chestFlat[pick])} en la ${pick}`, inRange: null }],
  };
  if (!tie && other && otherDiff != null && Math.abs(otherDiff) <= 2.5) rec.alt = { size: other, why: `Mide ${fmt(g.chestFlat[other])} cm (${otherDiff > 0 ? '+' : ''}${fmt(otherDiff)} cm): ${otherDiff > 0 ? 'si la quieres más holgada' : 'si la quieres algo más justa'}.` };
  const stock = product.sizes.find((s) => s.label === pick);
  if (stock && !stock.inStock) rec.stockWarning = `La talla ${pick} no se podía comprar cuando consultamos la ficha.`;
  return rec;
}
