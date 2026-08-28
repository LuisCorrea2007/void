/* ---------------------------------------------------------------------------
   VLT/STRT — datos semilla del catálogo, constantes de tienda y tipos.
   Este archivo alimenta la tabla `products` de la base de datos en el primer
   arranque; después de eso, todo se gestiona desde el Panel de Staff.
--------------------------------------------------------------------------- */

export type Category = "caps" | "tees" | "hoodies";

export type ColorOpt = { name: string; hex: string };

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: Category;
  price: number;
  compareAt?: number;
  tag?: "NEW" | "HOT" | "LAST CALL";
  image: string;
  description: string;
  details: string[];
  colors: ColorOpt[];
  sizes?: string[];     // solo ropa (S–XL)
  closures?: string[];  // solo gorras (Snapback / Strapback)
  active?: number;      // visibilidad en tienda (gestiona el Panel de Staff)
};

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  color: ColorOpt;
  size?: string;
  closure?: string;
  qty: number;
};

/* --------------------------- configuración tienda ------------------------ */

export const STORE = {
  whatsapp: "593994327349",          // formato internacional (wa.me)
  whatsappDisplay: "0994 327 349",   // formato local para mostrar
  email: "luiscorreduardo@gmail.com",
  freeShipThreshold: 120,
  flatShip: 8,
  bank: { name: "VOLT BANK", account: "8830 1122 9917", holder: "L. Eduardo" },
  dropName: "DROP 004 — TEMPORADA CONCRETO",
  mascot:
    "https://image.qwenlm.ai/generated-images/54d15f3c-fa4d-4f61-8dc7-74ff5be3ccb7/_result.png",
};

export const TICKER_ITEMS = [
  "ENVÍO GRATIS DESDE $120",
  "DROP 004 — YA DISPONIBLE",
  "LAB 3D DE GORRAS — GIRA LA TUYA",
  "CÓDIGO CALLE10 = 10% OFF",
  "PAGO CONTRA ENTREGA O TRANSFERENCIA",
  "DESPACHO EN 48H, A TODO EL PAÍS",
  "STOCK EN VIVO — CUANDO VUELA, VUELA",
];

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "caps", label: "Gorras" },
  { id: "tees", label: "Camisetas" },
  { id: "hoodies", label: "Hoodies" },
];

/* -------------------------------- catálogo ------------------------------- */

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    sku: "CAP-001",
    name: "Gorra Snapback Clásica",
    category: "caps",
    price: 42,
    tag: "NEW",
    image:
      "https://image.qwenlm.ai/generated-images/6a52504a-2451-4e90-8ea3-59f11fca31d0/_result.png",
    description:
      "La insignia. Corona estructurada de seis paneles, visera plana y bordado volt que se lee desde la otra acera.",
    details: ["Corona estructurada de 6 paneles", "Bordado 3D de alta densidad", "Banda interior absorbente", "Talla única — ajustable"],
    colors: [
      { name: "Negro Jet", hex: "#1a1a1a" },
      { name: "Volt", hex: "#a785bc" },
    ],
    closures: ["Snapback", "Strapback"],
  },
  {
    id: "p2",
    sku: "CAP-002",
    name: "Snapback Bruma Púrpura",
    category: "caps",
    price: 44,
    tag: "HOT",
    image:
      "https://image.qwenlm.ai/generated-images/79fa786d-0fc5-447d-a257-020edc6cdc47/_result.png",
    description:
      "Cuerpo negro con costuras púrpura eléctrico. Tirada limitada de 200 unidades — cuando vuela, vuela.",
    details: ["Tirada limitada — 200 unidades", "Bordado púrpura tono sobre tono", "Visera plana con sticker", "Talla única — ajustable"],
    colors: [
      { name: "Negro Jet", hex: "#1a1a1a" },
      { name: "Uva", hex: "#733ca9" },
    ],
    closures: ["Snapback", "Strapback"],
  },
  {
    id: "p3",
    sku: "CAP-003",
    name: "Dad Hat Blackout",
    category: "caps",
    price: 38,
    image:
      "https://image.qwenlm.ai/generated-images/dc65a4b9-c8e4-49a3-8e99-18e96a64980d/_result.png",
    description:
      "Lavada a la piedra, desestructurada, con pinta de vieja desde el día uno. La discreta para los días off.",
    details: ["Sarga de algodón lavado", "Corona baja desestructurada", "Visera pre-curvada", "Cierre de hebilla metálica"],
    colors: [
      { name: "Negro Lavado", hex: "#262626" },
      { name: "Oliva", hex: "#5a5f45" },
    ],
    closures: ["Strapback", "Snapback"],
  },
  {
    id: "p4",
    sku: "TEE-001",
    name: "Camiseta Logo Estático",
    category: "tees",
    price: 36,
    image:
      "https://image.qwenlm.ai/generated-images/3b376424-2593-4c2c-b6ec-d158ab630df6/_result.png",
    description:
      "Jersey pesado de 240gsm con golpe de estática glitch en el pecho. Corte boxy, hombros caídos, cero encogimiento.",
    details: ["Algodón peinado 240gsm", "Corte boxy oversized", "Impresión al agua", "Pre-encogida, cuello ribeteado"],
    colors: [
      { name: "Negro Jet", hex: "#1a1a1a" },
      { name: "Hueso", hex: "#e8e6da" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p5",
    sku: "TEE-002",
    name: "Camiseta Oversize Grafiti",
    category: "tees",
    price: 40,
    compareAt: 52,
    tag: "LAST CALL",
    image:
      "https://image.qwenlm.ai/generated-images/fab9ebb1-0e94-444d-92fb-d38bf97cac43/_result.png",
    description:
      "Gris lavado al ácido con script pintado a spray en el pecho. Cada lavado es una pieza única.",
    details: ["Lavado al ácido, desteñido único", "Estampado a spray en el pecho", "Oversize con hombro caído", "Última tirada — sin reposición"],
    colors: [
      { name: "Gris Ácido", hex: "#8d8d88" },
      { name: "Negro Jet", hex: "#1a1a1a" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p6",
    sku: "TEE-003",
    name: "Camiseta Box Logo",
    category: "tees",
    price: 34,
    image:
      "https://image.qwenlm.ai/generated-images/4b5f871a-a6df-47a3-a4a9-a7f4654ecdfe/_result.png",
    description:
      "El uniforme de diario. Algodón pesado color hueso con el golpe volt en el pecho izquierdo.",
    details: ["Algodón peinado 220gsm", "Corte regular boxy", "Box logo volt en el pecho", "Costuras de doble aguja"],
    colors: [
      { name: "Hueso", hex: "#e8e6da" },
      { name: "Negro Jet", hex: "#1a1a1a" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p7",
    sku: "HDY-001",
    name: "Hoodie Pesado Medianoche",
    category: "hoodies",
    price: 78,
    tag: "NEW",
    image:
      "https://image.qwenlm.ai/generated-images/5adaa840-2362-4e78-b895-b34e2d23fd7d/_result.png",
    description:
      "Felpa perchada de 480gsm que pesa como armadura. Cordones gruesos, bolsillo oculto y golpe volt en el pecho.",
    details: ["Felpa perchada 480gsm", "Relajado, ligeramente corto", "Bolsillo oculto con cierre", "Cordones teñidos al tono"],
    colors: [
      { name: "Negro Jet", hex: "#1a1a1a" },
      { name: "Volt", hex: "#a785bc" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p8",
    sku: "HDY-002",
    name: "Hoodie Señal",
    category: "hoodies",
    price: 82,
    tag: "HOT",
    image:
      "https://image.qwenlm.ai/generated-images/cb469f43-0a69-46f5-8b54-3700a0abe500/_result.png",
    description:
      "Teñido uva eléctrico completo, felpa de 480gsm y herrajes en negro. Fuerte a propósito.",
    details: ["Felpa pesada 480gsm", "Teñido reactivo uva eléctrico", "Herrajes blackout", "Refuerzos laterales ribeteados"],
    colors: [
      { name: "Uva", hex: "#733ca9" },
      { name: "Negro Jet", hex: "#1a1a1a" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
];

/* -------------------------------- helpers -------------------------------- */

export const fmt = (n: number) => `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
