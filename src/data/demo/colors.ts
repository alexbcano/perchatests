import type { ColorKey } from '@/domain/types';

export interface ColorInfo { key: ColorKey; name: string; hex: string; family: 'neutro' | 'tierra' | 'frio' | 'calido' | 'acento' }

export const COLORS: Record<ColorKey, ColorInfo> = {
  negro: { key: 'negro', name: 'Negro', hex: '#222226', family: 'neutro' },
  carbon: { key: 'carbon', name: 'Carbón', hex: '#43454C', family: 'neutro' },
  gris: { key: 'gris', name: 'Gris', hex: '#8E9199', family: 'neutro' },
  grisclaro: { key: 'grisclaro', name: 'Gris claro', hex: '#C9CCD2', family: 'neutro' },
  blanco: { key: 'blanco', name: 'Blanco', hex: '#F6F5F1', family: 'neutro' },
  crudo: { key: 'crudo', name: 'Crudo', hex: '#E8E1CF', family: 'neutro' },
  beige: { key: 'beige', name: 'Beige', hex: '#D3C1A0', family: 'tierra' },
  camel: { key: 'camel', name: 'Camel', hex: '#B98B57', family: 'tierra' },
  marron: { key: 'marron', name: 'Marrón', hex: '#74503A', family: 'tierra' },
  chocolate: { key: 'chocolate', name: 'Chocolate', hex: '#4B342A', family: 'tierra' },
  marino: { key: 'marino', name: 'Azul marino', hex: '#222D4A', family: 'neutro' },
  azul: { key: 'azul', name: 'Azul', hex: '#3F5FA3', family: 'frio' },
  azulclaro: { key: 'azulclaro', name: 'Azul claro', hex: '#A9C2E0', family: 'frio' },
  denim: { key: 'denim', name: 'Vaquero medio', hex: '#5E7A9E', family: 'neutro' },
  denimoscuro: { key: 'denimoscuro', name: 'Vaquero oscuro', hex: '#2F415F', family: 'neutro' },
  oliva: { key: 'oliva', name: 'Verde oliva', hex: '#6C7048', family: 'tierra' },
  bosque: { key: 'bosque', name: 'Verde bosque', hex: '#2F4C3C', family: 'frio' },
  salvia: { key: 'salvia', name: 'Salvia', hex: '#A8B79B', family: 'frio' },
  burdeos: { key: 'burdeos', name: 'Burdeos', hex: '#702637', family: 'calido' },
  rojo: { key: 'rojo', name: 'Rojo', hex: '#C13C34', family: 'calido' },
  naranja: { key: 'naranja', name: 'Naranja', hex: '#DC7B34', family: 'calido' },
  mostaza: { key: 'mostaza', name: 'Mostaza', hex: '#C9A13A', family: 'tierra' },
  rosa: { key: 'rosa', name: 'Rosa', hex: '#E4B5BE', family: 'calido' },
  lila: { key: 'lila', name: 'Lila', hex: '#B6A6D6', family: 'frio' },
  plata: { key: 'plata', name: 'Plata', hex: '#BFC4CA', family: 'acento' },
  lima: { key: 'lima', name: 'Lima', hex: '#C6DF45', family: 'acento' },
};

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[];
export const hex = (c: ColorKey) => COLORS[c]?.hex ?? '#999';
export const colorName = (c: ColorKey) => COLORS[c]?.name ?? c;

/** Fondos de las ilustraciones editoriales: [fondo, forma, suelo]. */
export const BACKDROPS: [string, string, string][] = [
  ['#D9DCE9', '#C5CAE0', '#B9BED6'], // lavanda fría
  ['#DCE3D5', '#C9D4BE', '#B8C4AC'], // salvia
  ['#E7DACB', '#D9C8B3', '#C9B69E'], // arena
  ['#CFDDE6', '#B9CEDB', '#A7BFCE'], // cielo
  ['#E6D3D6', '#D9BFC4', '#C9ACB2'], // rosa empolvado
  ['#D6D6D2', '#C4C4BF', '#B2B2AC'], // humo
  ['#2A3FE5', '#3D51EE', '#2233C4'], // cobalto
  ['#E3DCA9', '#D6CD8E', '#C6BC78'], // paja
];

export function shade(hexColor: string, amount: number): string {
  const n = parseInt(hexColor.slice(1), 16);
  const ch = (v: number) => {
    const t = amount < 0 ? 0 : 255;
    const p = Math.abs(amount);
    return Math.round((t - v) * p + v);
  };
  const r = ch(n >> 16), g = ch((n >> 8) & 255), b = ch(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function luminance(hexColor: string): number {
  const n = parseInt(hexColor.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
