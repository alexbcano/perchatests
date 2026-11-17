// Tipos de dominio. No dependen de React ni de ningún proveedor externo.

export type StyleKey =
  | 'street' | 'oldmoney' | 'casual' | 'smart' | 'minimal' | 'tech' | 'y2k'
  | 'vintage' | 'skater' | 'formal' | 'sporty' | 'quiet' | 'gorp' | 'business';

export type Season = 'primavera' | 'verano' | 'otono' | 'invierno';
export type Occasion = 'diario' | 'trabajo' | 'cita' | 'fiesta' | 'evento' | 'viaje' | 'deporte';
export type Market = 'ES' | 'UE' | 'INT';
export type Fit = 'slim' | 'regular' | 'relaxed' | 'oversized';
export type Category = 'top' | 'layer' | 'bottom' | 'shoes' | 'accessory';

export type GarmentType =
  // partes de arriba
  | 'tee' | 'longsleeve' | 'shirt' | 'polo' | 'knit' | 'turtleneck' | 'hoodie' | 'sweatshirt'
  // capas
  | 'blazer' | 'coat' | 'trench' | 'bomber' | 'puffer' | 'shell' | 'overshirt' | 'denimjacket' | 'gilet' | 'cardigan'
  // partes de abajo
  | 'wide' | 'straight' | 'slimpant' | 'chino' | 'jeans' | 'cargo' | 'jogger' | 'shorts' | 'skirt' | 'tailored'
  // calzado
  | 'sneaker' | 'chunky' | 'skate' | 'runner' | 'trail' | 'boot' | 'loafer' | 'derby'
  // accesorios
  | 'cap' | 'beanie' | 'tote' | 'crossbody' | 'backpack' | 'belt' | 'scarf' | 'sunglasses' | 'watch';

export type ColorKey =
  | 'negro' | 'carbon' | 'gris' | 'grisclaro' | 'blanco' | 'crudo' | 'beige' | 'camel' | 'marron' | 'chocolate'
  | 'marino' | 'azul' | 'azulclaro' | 'denim' | 'denimoscuro' | 'oliva' | 'bosque' | 'salvia'
  | 'burdeos' | 'rojo' | 'naranja' | 'mostaza' | 'rosa' | 'lila' | 'plata' | 'lima';

export type Availability = 'disponible' | 'pocas' | 'agotado' | 'consultar';

export interface Brand {
  id: string;
  name: string;
  demo: boolean; // true = marca ficticia de demostración
  url?: string;
  blurb: string;
  sizingNote: string;
  store: string;
  markets: Market[];
}

export interface Product {
  id: string;
  demo: boolean;
  name: string;
  brandId: string;
  category: Category;
  type: GarmentType;
  color: ColorKey;
  colors: ColorKey[];
  price: number; // EUR
  fit: Fit;
  styles: StyleKey[];
  seasons: Season[];
  formality: number; // 1–5
  boldness: number; // 1–5
  warmth: number; // 1–5
  sizes: { label: string; inStock: boolean }[];
  availability: Availability;
  markets: Market[];
  /** rasgos de dibujo opcionales */
  traits?: { cropped?: boolean; shortSleeve?: boolean; pattern?: 'stripes' | 'check' | 'graphic'; mini?: boolean; high?: boolean; second?: ColorKey };
  /** URL real del producto. null mientras no haya catálogo conectado. */
  url: string | null;
  /** true cuando la prenda viene del armario del usuario */
  own?: boolean;
  photo?: string;
  /** Catálogo real: foto de la ficha (se carga desde la tienda; si no se puede, se usa el dibujo) */
  imageUrl?: string;
  /** Catálogo real: fecha en la que se leyó el precio en la tienda (AAAA-MM-DD) */
  seenAt?: string;
  /** Catálogo real: nombres de color tal como los da la tienda */
  colorNames?: string[];
  /** Catálogo real: la tabla de tallas de la marca no aplica a este producto */
  noChart?: boolean;
  /** Medidas de la prenda en plano publicadas por la tienda (no del cuerpo). */
  garment?: { chestFlat: Record<string, number>; length?: Record<string, number>; sourceUrl: string };
}

export interface Measurements {
  height: number | null;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  shoulders: number | null;
  leg: number | null;
  inseam: number | null;
  arm: number | null;
  neck: number | null;
  footLength: number | null;
  shoeEU: number | null;
  /** Ancho en plano (axila a axila) de una sudadera o camiseta tuya que te queda como te gusta. */
  refChestFlat?: number | null;
}

export interface Profile {
  isExample: boolean;
  name: string;
  age: number | null;
  pattern: 'masculino' | 'femenino' | 'neutro' | null;
  country: string;
  units: 'metric' | 'imperial';
  fitPreference: 'ajustado' | 'normal' | 'holgado';
  measures: Measurements;
  photos: { id: string; dataUrl: string; addedAt: number }[];
  consentTraining: boolean;
}

export interface Prefs {
  styles: StyleKey[];
  season: Season;
  occasion: Occasion;
  budget: number;
  favColors: ColorKey[];
  avoidColors: ColorKey[];
  likeTypes: GarmentType[];
  avoidTypes: GarmentType[];
  boldness: number; // 1–5
  brands: string[];
  market: Market;
}

export type SourceMode = 'catalog' | 'mix' | 'wardrobe';

export interface GenRequest extends Prefs {
  text: string;
  source: SourceMode;
  referentIds: string[];
  count: number;
  seed: number;
  lockRefs?: string[];
  tweak?: 'formal' | 'informal' | 'cheaper' | 'bolder' | 'color' | null;
}

export interface Piece {
  ref: string; // id de producto o de prenda del armario
  own: boolean;
  color: ColorKey;
  sizeShift?: number; // −1, 0, +1 respecto a la talla recomendada (probador)
}

export interface CompatPart { key: string; label: string; score: number; weight: number }

export interface Outfit {
  id: string;
  name: string;
  style: StyleKey;
  pieces: Piece[];
  description: string;
  occasion: Occasion;
  season: Season;
  total: number;
  compat: number;
  compatParts: CompatPart[];
  reasons: string[];
  backdrop: number;
  createdAt: number;
  budget: number;
  fromWardrobe: number; // nº de prendas propias
  /** preferencias con las que se evaluó, para poder recalcular al cambiar una prenda */
  basis: { styles: StyleKey[]; favColors: ColorKey[]; boldness: number; formalityShift: number };
}

export interface WardrobeItem {
  id: string;
  example?: boolean;
  name: string;
  type: GarmentType;
  brand: string;
  color: ColorKey;
  seasons: Season[];
  photo?: string;
  /** Enlace a la ficha de la tienda donde se compró. */
  url?: string;
  /** Dirección de una foto en la web de la tienda (no se descarga). */
  imageUrl?: string;
  /** Si el enlace coincide con una prenda del catálogo. */
  catalogId?: string;
  addedAt: number;
}

export interface Collection { id: string; name: string; outfitIds: string[]; productIds: string[]; createdAt: number }

export interface SearchRecord { id: string; at: number; request: GenRequest; resultCount: number; summary: string }

export interface Referent {
  id: string;
  demo: boolean;
  custom?: boolean;
  name: string;
  handle: string;
  country: string;
  language: 'es' | 'en';
  content: 'Vídeo corto' | 'Vídeo largo' | 'Fotografía' | 'Blog';
  styles: StyleKey[];
  bio: string;
  signature: string[];
  palette: ColorKey[];
  sourceUrl?: string;
}

export interface StyleInfo {
  key: StyleKey;
  name: string;
  line: string;
  about: string;
  keyPieces: string[];
  palette: ColorKey[];
  related: StyleKey[];
  formality: number;
  trend: string;
}

export type Confidence = 'alta' | 'media' | 'baja';

export interface SizeRec {
  status: 'ok' | 'insufficient' | 'onesize' | 'nochart';
  size?: string;
  confidence: Confidence;
  headline: string;
  detail: string;
  alt?: { size: string; why: string };
  margins: { label: string; cm: number }[];
  measures: { label: string; user: number | null; range: string; inRange: boolean | null }[];
  chart: { title: string; note?: string; demo?: boolean; sourceUrl?: string; columns: string[]; rows: { size: string; cells: string[]; inStock: boolean; recommended: boolean }[] } | null;
  fit: Fit;
  missing: string[];
  stockWarning?: string;
  brandNote: string;
}
