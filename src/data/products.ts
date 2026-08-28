/* ---------------------------------------------------------------------------
   VLT/STRT — catalog data, store constants and shared types
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
  sizes?: string[];     // clothing only (S–XL)
  closures?: string[];  // caps only (Snapback / Strapback)
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

/* ------------------------------ store config ---------------------------- */

export const STORE = {
  whatsapp: "6281234567890",
  freeShipThreshold: 120,
  flatShip: 8,
  bank: { name: "VOLT BANK", account: "8830 1122 9917", holder: "VLT STRT OFFICIAL" },
  dropName: "DROP 004 — CONCRETE SEASON",
};

export const TICKER_ITEMS = [
  "FREE SHIPPING OVER $120",
  "DROP 004 — LIVE NOW",
  "MANUAL PAY: COD / TRANSFER",
  "48H DISPATCH, WORLDWIDE",
  "CODE STREET10 = 10% OFF",
  "NEW: VOLT CLASSIC SNAPBACK",
];

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All gear" },
  { id: "caps", label: "Caps" },
  { id: "tees", label: "Tees" },
  { id: "hoodies", label: "Hoodies" },
];

/* -------------------------------- catalog ------------------------------- */

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    sku: "CAP-001",
    name: "Volt Classic Snapback",
    category: "caps",
    price: 42,
    tag: "NEW",
    image:
      "https://image.qwenlm.ai/generated-images/6a52504a-2451-4e90-8ea3-59f11fca31d0/_result.png",
    description:
      "The flagship. Structured six-panel crown, flat brim, and 3D volt embroidery that reads from across the street.",
    details: ["Structured 6-panel crown", "3D chain-stitch embroidery", "Moisture-wicking sweatband", "One size — adjustable"],
    colors: [
      { name: "Jet Black", hex: "#1a1a1a" },
      { name: "Volt", hex: "#c8f542" },
    ],
    closures: ["Snapback", "Strapback"],
  },
  {
    id: "p2",
    sku: "CAP-002",
    name: "Purple Haze Snapback",
    category: "caps",
    price: 44,
    tag: "HOT",
    image:
      "https://image.qwenlm.ai/generated-images/79fa786d-0fc5-447d-a257-020edc6cdc47/_result.png",
    description:
      "Blackout shell with electric-purple stitchwork. Limited run of 200 — when it's gone, it's gone.",
    details: ["Limited run — 200 units", "Tonal purple embroidery", "Flat brim with sticker", "One size — adjustable"],
    colors: [
      { name: "Jet Black", hex: "#1a1a1a" },
      { name: "Grape", hex: "#a06bff" },
    ],
    closures: ["Snapback", "Strapback"],
  },
  {
    id: "p3",
    sku: "CAP-003",
    name: "Blackout Dad Hat",
    category: "caps",
    price: 38,
    image:
      "https://image.qwenlm.ai/generated-images/dc65a4b9-c8e4-49a3-8e99-18e96a64980d/_result.png",
    description:
      "Garment-washed, unstructured, broken-in from day one. The low-key one for off-days.",
    details: ["Garment-washed cotton twill", "Unstructured low crown", "Pre-curved brim", "Metal clasp closure"],
    colors: [
      { name: "Washed Black", hex: "#262626" },
      { name: "Olive", hex: "#5a5f45" },
    ],
    closures: ["Strapback", "Snapback"],
  },
  {
    id: "p4",
    sku: "TEE-001",
    name: "Static Logo Tee",
    category: "tees",
    price: 36,
    image:
      "https://image.qwenlm.ai/generated-images/3b376424-2593-4c2c-b6ec-d158ab630df6/_result.png",
    description:
      "240gsm heavyweight jersey with a glitch-static chest hit. Boxy cut, dropped shoulders, zero shrink.",
    details: ["240gsm combed cotton", "Boxy oversized fit", "Water-based ink print", "Pre-shrunk, ribbed collar"],
    colors: [
      { name: "Jet Black", hex: "#1a1a1a" },
      { name: "Bone", hex: "#e8e6da" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p5",
    sku: "TEE-002",
    name: "Graffiti Oversize Tee",
    category: "tees",
    price: 40,
    compareAt: 52,
    tag: "LAST CALL",
    image:
      "https://image.qwenlm.ai/generated-images/fab9ebb1-0e94-444d-92fb-d38bf97cac43/_result.png",
    description:
      "Acid-washed grey with hand-sprayed script across the chest. Every wash cycle is one of a kind.",
    details: ["Acid-washed, unique fades", "Hand-sprayed chest print", "Oversized drop-shoulder", "Final drop — no restock"],
    colors: [
      { name: "Acid Grey", hex: "#8d8d88" },
      { name: "Jet Black", hex: "#1a1a1a" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p6",
    sku: "TEE-003",
    name: "Box Logo Tee",
    category: "tees",
    price: 34,
    image:
      "https://image.qwenlm.ai/generated-images/4b5f871a-a6df-47a3-a4a9-a7f4654ecdfe/_result.png",
    description:
      "The everyday uniform. Bone-white heavyweight cotton with the volt box hit on the left chest.",
    details: ["220gsm ring-spun cotton", "Regular boxy fit", "Volt box chest hit", "Double-needle hems"],
    colors: [
      { name: "Bone", hex: "#e8e6da" },
      { name: "Jet Black", hex: "#1a1a1a" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p7",
    sku: "HDY-001",
    name: "Midnight Heavy Hoodie",
    category: "hoodies",
    price: 78,
    tag: "NEW",
    image:
      "https://image.qwenlm.ai/generated-images/5adaa840-2362-4e78-b895-b34e2d23fd7d/_result.png",
    description:
      "480gsm brushed-back fleece that weighs like armor. Chunky drawcords, hidden phone pocket, volt chest hit.",
    details: ["480gsm brushed-back fleece", "Relaxed, cropped slightly", "Hidden zip pocket", "Tonally dyed drawcords"],
    colors: [
      { name: "Jet Black", hex: "#1a1a1a" },
      { name: "Volt", hex: "#c8f542" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "p8",
    sku: "HDY-002",
    name: "Signal Hoodie",
    category: "hoodies",
    price: 82,
    tag: "HOT",
    image:
      "https://image.qwenlm.ai/generated-images/cb469f43-0a69-46f5-8b54-3700a0abe500/_result.png",
    description:
      "Full electric-grape dye, 480gsm fleece, blackout hardware. Loud on purpose.",
    details: ["480gsm heavyweight fleece", "Reactive-dyed electric grape", "Blackout hardware", "Ribbed side gussets"],
    colors: [
      { name: "Grape", hex: "#a06bff" },
      { name: "Jet Black", hex: "#1a1a1a" },
    ],
    sizes: ["S", "M", "L", "XL"],
  },
];

/* -------------------------------- helpers ------------------------------- */

export const fmt = (n: number) => `$${n.toFixed(n % 1 === 0 ? 0 : 2)}`;

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
