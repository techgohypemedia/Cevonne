export type ArShade = {
  id: number;
  code: string | null;
  name: string;
  color: string;
  pantone?: string;
  category: string;
  finish: "Satin Crème Matte" | "Matte Finish" | "High-Shine Gloss" | "Natural Finish";
  effect?: string;
  productLine?: "Bullet" | "Liquid" | "Gloss" | "Natural";
};

export const AR_STATIC_SHADES: ArShade[] = [
  {
    id: 0,
    code: null,
    name: "Natural Finish",
    color: "transparent",
    category: "Bare Lips",
    finish: "Natural Finish",
    productLine: "Natural",
  },

  // Velvet Couture™ (Bullet) — Satin Crème Matte Finish
  {
    id: 1,
    code: "23",
    name: "Silk Élan",
    color: "#5F302C",
    pantone: "7595 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 2,
    code: "24",
    name: "Bare Grace",
    color: "#AC807F",
    pantone: "2440 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 3,
    code: "32",
    name: "Rose Veil",
    color: "#B34661",
    pantone: "2342 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 4,
    code: "37",
    name: "Velvet Mira",
    color: "#8F3651",
    pantone: "696 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 5,
    code: "41",
    name: "Rouge Mystral",
    color: "#991C42",
    pantone: "194 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 6,
    code: "42",
    name: "Spiced Ember",
    color: "#A24261",
    pantone: "2343 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 7,
    code: "45",
    name: "Cocoa Poise",
    color: "#732D2C",
    pantone: "7594 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },
  {
    id: 8,
    code: "46",
    name: "Velvet Rose",
    color: "#CF1435",
    pantone: "3517 C",
    category: "Velvet Couture™ (Bullet)",
    finish: "Satin Crème Matte",
    productLine: "Bullet",
  },

  // Air Couture™ (Liquid) — Matte Finish
  {
    id: 9,
    code: "102",
    name: "Desert Dream",
    color: "#B15A67",
    pantone: "2341 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },
  {
    id: 10,
    code: "111",
    name: "Marvellè Crush",
    color: "#A0316A",
    pantone: "2047 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },
  {
    id: 11,
    code: "123",
    name: "Ruby Banarasi",
    color: "#CF1435",
    pantone: "3517 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },
  {
    id: 12,
    code: "156",
    name: "Runway Rani",
    color: "#5E1F37",
    pantone: "7428 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },
  {
    id: 13,
    code: "213",
    name: "Toffee Veil",
    color: "#BD919F",
    pantone: "7633 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },
  {
    id: 14,
    code: "214",
    name: "Mulberry Luxe",
    color: "#A0174C",
    pantone: "2041 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },
  {
    id: 15,
    code: "312",
    name: "Power Play",
    color: "#A24261",
    pantone: "2343 C",
    category: "Air Couture™ (Liquid)",
    finish: "Matte Finish",
    productLine: "Liquid",
  },

  // Glass Veil™ (Gloss) — High-Shine Gloss with Plump Effect
  {
    id: 16,
    code: "105",
    name: "Crystal Kiss",
    color: "#E9ADA4",
    pantone: "7520 C",
    category: "Glass Veil™ (Gloss)",
    finish: "High-Shine Gloss",
    effect: "Shine & Plump Effect",
    productLine: "Gloss",
  },
  {
    id: 17,
    code: "114",
    name: "Rose Halo",
    color: "#E9A7D8",
    pantone: "217 C",
    category: "Glass Veil™ (Gloss)",
    finish: "High-Shine Gloss",
    effect: "Shine & Plump Effect",
    productLine: "Gloss",
  },
  {
    id: 18,
    code: "231",
    name: "Honey Veil",
    color: "#EFA69E",
    pantone: "488 C",
    category: "Glass Veil™ (Gloss)",
    finish: "High-Shine Gloss",
    effect: "Shine & Plump Effect",
    productLine: "Gloss",
  },
];

export const LIPSTICK_SHADES = AR_STATIC_SHADES;

export const AR_COLLECTIONS = [
  "All",
  "Velvet Couture™ (Bullet)",
  "Air Couture™ (Liquid)",
  "Glass Veil™ (Gloss)",
] as const;
