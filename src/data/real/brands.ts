// CATÁLOGO REAL — marcas y tablas de tallas oficiales.
// Solo se incluye una tabla cuando se ha leído en la web de la propia marca. Si no, no hay tabla
// y el recomendador lo dice en lugar de inventar una equivalencia.
import type { Brand } from '@/domain/types';
import { registerBrands, type SizeChart } from '@/data/demo/brands';

export const REAL_SEEN_AT = '2026-11-16';

export const REAL_BRANDS: Brand[] = [
  { id: 'cos', name: 'COS', demo: false, blurb: 'Minimalismo y sastrería relajada.', sizingNote: 'COS publica rangos de cuerpo por talla; muchos cortes son relaxed, así que mira también las medidas de la ficha.', store: 'cos.com', url: 'https://www.cos.com/es-es/men/view-all', markets: ['ES', 'UE'] },
  { id: 'uniqlo', name: 'UNIQLO', demo: false, blurb: 'Básicos funcionales a buen precio.', sizingNote: 'Tabla oficial para pantalones y vaqueros. Para las partes de arriba UNIQLO solo da medidas de cada prenda en su ficha.', store: 'uniqlo.com', url: 'https://www.uniqlo.com/es/es/men', markets: ['ES', 'UE'] },
  { id: 'camper', name: 'Camper', demo: false, blurb: 'Calzado mallorquín.', sizingNote: 'Guía oficial de Camper por largo de pie.', store: 'camper.com', url: 'https://www.camper.com/es_ES/hombre/zapatos', markets: ['ES', 'UE'] },
  { id: 'newbalance', name: 'New Balance', demo: false, blurb: 'Zapatillas.', sizingNote: 'Tallas EU con medios números: no hay 41 ni 46 justos.', store: 'newbalance.es', url: 'https://www.newbalance.es/es/574/', markets: ['ES', 'UE'] },
  { id: 'levis', name: "Levi's", demo: false, blurb: 'Vaqueros.', sizingNote: 'Cintura en pulgadas; el largo (30/32/34) lo eliges aparte.', store: 'levi.com', markets: ['ES', 'UE'] },
  { id: 'carhartt', name: 'Carhartt WIP', demo: false, blurb: 'Ropa de trabajo llevada a la calle.', sizingNote: 'Tallaje fiel según la marca: tu cintura en pulgadas. El largo se elige aparte.', store: 'carhartt-wip.com', markets: ['ES', 'UE'] },
  { id: 'milfshakes', name: 'Milfshakes', demo: false, blurb: 'Streetwear español de sudaderas y camisetas gráficas.', sizingNote: 'Solo publica medidas de la prenda en plano en cada ficha, no del cuerpo: míralas en la tienda.', store: 'milfshakes.es', url: 'https://milfshakes.es', markets: ['ES', 'UE'] },
  { id: 'scuffers', name: 'Scuffers', demo: false, blurb: 'Sudaderas boxy de algodón grueso, de Madrid.', sizingNote: 'Solo publica medidas de la prenda en plano: compárala con una sudadera tuya.', store: 'scuffers.com', url: 'https://scuffers.com', markets: ['ES', 'UE'] },
  { id: 'uo', name: 'Urban Outfitters', demo: false, blurb: 'Streetwear y marcas propias (BDG, iets frans…).', sizingNote: 'Guía general de la tienda; en sus marcas baggy la prenda ya viene holgada.', store: 'urbanoutfitters.com', url: 'https://www.urbanoutfitters.com/es-es/mens-clothing', markets: ['ES', 'UE'] },
  { id: 'dutti', name: 'Massimo Dutti', demo: false, blurb: 'Sastrería y clásicos.', sizingNote: 'No hemos podido leer su guía de tallas: consúltala en la ficha del producto.', store: 'massimodutti.com', markets: ['ES', 'UE'] },
];

const COS_GUIDE = 'https://ae.cos.com/en/fragments/pdp/size-guide/size-guide-men';

export const REAL_CHARTS: SizeChart[] = [
  {
    brandId: 'cos', group: 'tops', title: 'COS · hombre · partes de arriba, chaquetas y abrigos', sourceUrl: COS_GUIDE,
    rows: [
      { size: 'XS', chest: [78, 86] }, { size: 'S', chest: [86, 94] }, { size: 'M', chest: [94, 102] }, { size: 'L', chest: [102, 110] },
      { size: 'XL', chest: [110, 118] }, { size: 'XXL', chest: [118, 126] }, { size: '3XL', chest: [126, 134] },
    ],
    note: 'Guía oficial de COS para hombre: contorno de pecho del cuerpo, en cm.',
  },
  {
    brandId: 'cos', group: 'bottoms', title: 'COS · hombre · pantalones (tallas EU)', sourceUrl: COS_GUIDE, derived: true,
    rows: [
      { size: '40', waist: [66, 70] }, { size: '42', waist: [70, 74] }, { size: '44', waist: [74, 78] }, { size: '46', waist: [78, 82] },
      { size: '48', waist: [82, 86] }, { size: '50', waist: [86, 90] }, { size: '52', waist: [90, 94.25] }, { size: '54', waist: [94.25, 98.5] },
      { size: '56', waist: [98.5, 103] }, { size: '58', waist: [103, 107.5] },
    ],
    note: 'COS publica la cintura por pareja de tallas (EU 44–46: 74–82 cm; 48–50: 82–90 cm…). Aquí cada pareja se reparte a partes iguales, por eso la confianza nunca es alta.',
  },
  {
    brandId: 'cos', group: 'belts', title: 'COS · hombre · cinturones', sourceUrl: COS_GUIDE,
    rows: [{ size: 'XS', waist: [66, 74] }, { size: 'S', waist: [74, 82] }, { size: 'M', waist: [82, 90] }, { size: 'L', waist: [90, 98.5] }, { size: 'XL', waist: [98.5, 107.5] }],
    note: 'Guía oficial de COS para hombre: contorno de cintura, en cm.',
  },
];

const UO_GUIDE = 'https://www.urbanoutfitters.com/help/size-charts';
const LEVIS_GUIDE = 'https://www.levi.com/ES/es_ES/info/sizechart';
const NB_GUIDE = 'https://www.newbalance.es/en/size-guide.html';

REAL_CHARTS.push(
  {
    brandId: 'uo', group: 'tops', title: 'Urban Outfitters · hombre · partes de arriba', sourceUrl: UO_GUIDE,
    rows: [
      { size: 'XS', chest: [86, 91], waist: [70, 75] }, { size: 'S', chest: [91, 97], waist: [75, 80] }, { size: 'M', chest: [97, 102], waist: [80, 85] },
      { size: 'L', chest: [102, 109], waist: [85, 93] }, { size: 'XL', chest: [109, 117], waist: [93, 100] }, { size: 'XXL', chest: [117, 125], waist: [100, 108] },
    ],
    note: 'Guía general de Urban Outfitters para hombre (medidas del cuerpo, en cm). Vale para sus marcas propias; cada prenda puede tallar distinto.',
  },
  {
    brandId: 'uo', group: 'bottoms', title: 'Urban Outfitters · hombre · pantalones (tallas XS–XXL)', sourceUrl: UO_GUIDE,
    rows: [
      { size: 'XS', waist: [68.5, 73.5], hip: [84, 89] }, { size: 'S', waist: [73.5, 78.5], hip: [89, 94] }, { size: 'M', waist: [78.5, 85], hip: [94, 100.5] },
      { size: 'L', waist: [85, 92.5], hip: [100.5, 108] }, { size: 'XL', waist: [92.5, 100.5], hip: [108, 115.5] }, { size: 'XXL', waist: [100.5, 108], hip: [115.5, 123] },
    ],
    note: 'Guía general de Urban Outfitters para hombre (medidas del cuerpo, en cm). Solo para pantalones con talla de letra; los vaqueros van por cintura en pulgadas y su guía no trae esa tabla.',
  },
  {
    brandId: 'levis', group: 'bottoms', title: "Levi's · hombre · vaqueros (cintura en pulgadas)", sourceUrl: LEVIS_GUIDE, derived: true,
    rows: [{ size: '28', waist: [69.8, 72.4] }, { size: '29', waist: [72.4, 75.0] }, { size: '30', waist: [75.0, 77.5] }, { size: '31', waist: [77.5, 80.0] }, { size: '32', waist: [80.0, 82.5] }, { size: '33', waist: [82.5, 85.1] }, { size: '34', waist: [85.1, 87.7] }, { size: '35', waist: [87.7, 90.2] }, { size: '36', waist: [90.2, 94.0] }, { size: '38', waist: [94.0, 99.0] }, { size: '40', waist: [99.0, 104.1] }],
    note: "Levi's publica una cintura por talla (30: 76,2 cm; 32: 81,3 cm…). Aquí cada talla cubre hasta la mitad del salto con la siguiente, por eso la confianza nunca es alta.",
  },
  {
    brandId: 'levis', group: 'tops', title: "Levi's · hombre · partes de arriba", sourceUrl: LEVIS_GUIDE,
    rows: [
      { size: 'XS', chest: [81.3, 86.4], waist: [66, 71.1] }, { size: 'S', chest: [88.9, 94], waist: [73.7, 78.7] }, { size: 'M', chest: [96.5, 101.6], waist: [81.3, 86.4] },
      { size: 'L', chest: [104.1, 109.2], waist: [88.9, 94] }, { size: 'XL', chest: [111.8, 116.8], waist: [96.5, 101.6] }, { size: 'XXL', chest: [119.4, 124.5], waist: [104.1, 109.2] },
    ],
    note: "Guía oficial de Levi's para hombre: medidas del cuerpo, en cm.",
  },
  {
    brandId: 'newbalance', group: 'shoes', title: 'New Balance · hombre/unisex · calzado (EU)', sourceUrl: NB_GUIDE, derived: true,
    rows: [{ size: '38', foot: [23.0, 23.5] }, { size: '38.5', foot: [23.5, 24] }, { size: '39.5', foot: [24.0, 24.5] }, { size: '40', foot: [24.5, 25] }, { size: '40.5', foot: [25.0, 25.5] }, { size: '41.5', foot: [25.5, 26] }, { size: '42', foot: [26.0, 26.5] }, { size: '42.5', foot: [26.5, 27] }, { size: '43', foot: [27.0, 27.5] }, { size: '44', foot: [27.5, 28] }, { size: '44.5', foot: [28.0, 28.5] }, { size: '45', foot: [28.5, 29] }, { size: '45.5', foot: [29.0, 29.5] }, { size: '46.5', foot: [29.5, 30] }, { size: '47', foot: [30.0, 30.5] }, { size: '47.5', foot: [30.5, 31] }],
    note: 'New Balance publica un largo de pie por talla (EU 42: 26,5 cm; EU 43: 27,5 cm…). Aquí cada talla cubre el medio centímetro anterior. Ojo: no tiene 41 ni 46 justos, salta a 41,5 y 46,5.',
  },
);

const CAMPER_GUIDE = 'https://www.camper.com/en_US/men/shoes/motel/camper-motel-36732-002';
const UQ_BOTTOMS = 'https://www.uniqlo.com/ca/en/size/404999.html';
const UQ_TAG = 'https://faq-us.uniqlo.com/articles/en_US/FAQ/How-can-I-figure-out-my-size/?l=en_US&fs=RelatedArticle';
const CARHARTT_DK = 'https://us.carhartt-wip.com/en-us/products/double-knee-pant-black-rinsed-1313';

REAL_CHARTS.push(
  {
    brandId: 'camper', group: 'shoes', title: 'Camper · hombre · calzado (EU)', sourceUrl: CAMPER_GUIDE,
    rows: [{ size: '39', foot: [24.4, 25.0] }, { size: '40', foot: [25.1, 25.7] }, { size: '41', foot: [25.8, 26.3] }, { size: '42', foot: [26.4, 27.0] }, { size: '43', foot: [27.1, 27.7] }, { size: '44', foot: [27.8, 28.3] }, { size: '45', foot: [28.4, 29.0] }, { size: '46', foot: [29.1, 29.7] }, { size: '47', foot: [29.8, 30.3] }],
    note: 'Guía oficial de Camper: largo del pie en cm para cada talla europea. Mide del talón a la punta del dedo más largo.',
  },
  {
    brandId: 'uniqlo', group: 'bottoms', title: 'UNIQLO · hombre · pantalones con talla de letra (cintura del cuerpo)', sourceUrl: UQ_BOTTOMS,
    rows: [
      { size: 'S', waist: [68, 76] }, { size: 'M', waist: [76, 84] }, { size: 'L', waist: [84, 92] },
      { size: 'XL', waist: [92, 100] }, { size: 'XXL', waist: [100, 108] }, { size: '3XL', waist: [108, 116] },
    ],
    note: 'Medidas del cuerpo que publica UNIQLO para sus pantalones de hombre de S a 3XL. La XS no aparece en su tabla.',
  },
  {
    brandId: 'uniqlo', group: 'bottoms', forTypes: ['jeans'], title: 'UNIQLO · hombre · vaqueros (cintura en pulgadas)', sourceUrl: UQ_TAG, derived: true,
    rows: [{ size: '28', waist: [69.8, 72.4] }, { size: '29', waist: [72.4, 75.0] }, { size: '30', waist: [75.0, 77.5] }, { size: '31', waist: [77.5, 80.0] }, { size: '32', waist: [80.0, 82.5] }, { size: '33', waist: [82.5, 85.1] }, { size: '34', waist: [85.1, 87.7] }, { size: '35', waist: [87.7, 90.2] }, { size: '36', waist: [90.2, 94.0] }, { size: '38', waist: [94.0, 99.0] }, { size: '40', waist: [99.0, 104.1] }],
    note: 'UNIQLO indica que la talla de la etiqueta es la medida del cuerpo: un 32 es una cintura de 32 pulgadas (81,3 cm). El rango de cada talla lo repartimos nosotros hasta la mitad del salto con la siguiente.',
  },
  {
    brandId: 'carhartt', group: 'bottoms', title: 'Carhartt WIP · Double Knee Pant (cintura en pulgadas)', sourceUrl: CARHARTT_DK, derived: true,
    rows: [{ size: '26', waist: [64.7, 67.3] }, { size: '27', waist: [67.3, 69.8] }, { size: '28', waist: [69.8, 72.4] }, { size: '29', waist: [72.4, 75.0] }, { size: '30', waist: [75.0, 77.5] }, { size: '31', waist: [77.5, 80.0] }, { size: '32', waist: [80.0, 82.5] }, { size: '33', waist: [82.5, 85.1] }, { size: '34', waist: [85.1, 88.9] }, { size: '36', waist: [88.9, 94.0] }, { size: '38', waist: [94.0, 99.0] }, { size: '40', waist: [99.0, 104.1] }],
    note: 'Carhartt dice que este pantalón tiene tallaje fiel: la talla es tu cintura en pulgadas (32 = 81,3 cm). El rango de cada talla lo repartimos nosotros. El largo (30, 32 o 34) se elige aparte.',
  },
);

registerBrands(REAL_BRANDS, REAL_CHARTS);
