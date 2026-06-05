/**
 * Converts HSL tokens from global.css to Figma Design Tokens JSON format.
 * Outputs one file per mode — the format Figma exports/imports.
 */

import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../figma-tokens");

// ── Token definitions (HSL) ───────────────────────────────────────

const tokens = {
  // --- Core surface/background ---
  background: { light: [47.9999, 33.4124, 97.0613], dark: [60, 2, 4] },
  foreground: {
    light: [48.0004, 19.5733, 20.0067],
    dark: [46.154, 9.7646, 73.9254],
  },
  card: { light: [48, 35, 99], dark: [48, 4, 18] },
  "card-foreground": {
    light: [59.9977, 2.5881, 7.6423],
    dark: [47.9999, 33.4124, 97.0613],
  },
  popover: { light: [300, 50, 100], dark: [60.0012, 2.1175, 18.4372] },
  "popover-foreground": {
    light: [50.7697, 19.3858, 13.1359],
    dark: [60.0003, 5.4307, 89.2231],
  },

  // --- Brand / interactive ---
  primary: {
    light: [22.2046, 56.4292, 55.877],
    dark: [14.7691, 63.0842, 59.6063],
  },
  "primary-foreground": { light: [300, 50, 100], dark: [300, 50, 100] },
  secondary: {
    light: [46.1535, 22.8633, 88.8169],
    dark: [47.9999, 33.4124, 97.0613],
  },
  "secondary-foreground": {
    light: [50.7703, 8.4755, 30.0071],
    dark: [60.0012, 2.1175, 18.4372],
  },
  muted: {
    light: [43.9999, 29.4191, 89.9959],
    dark: [60.0011, 3.8343, 10.1932],
  },
  "muted-foreground": { light: [50.0005, 2.3533, 50.1937], dark: [48, 6, 78] },
  accent: {
    light: [46.1535, 22.8633, 88.8169],
    dark: [47.9998, 10.648, 9.2123],
  },
  "accent-foreground": {
    light: [50.7697, 19.3858, 13.1359],
    dark: [51.4288, 25.9022, 94.7126],
  },
  destructive: {
    light: [59.9977, 2.5881, 7.6423],
    dark: [0.0029, 84.2066, 60.192],
  },
  "destructive-foreground": { light: [300, 50, 100], dark: [300, 50, 100] },

  // --- Borders & inputs ---
  border: {
    light: [49.9994, 7.5433, 84.3127],
    dark: [59.9985, 5.0978, 23.1333],
  },
  input: {
    light: [50.7685, 8.0001, 68.0389],
    dark: [52.5006, 5.1189, 30.5892],
  },
  ring: {
    light: [15.1107, 55.5301, 52.3487],
    dark: [14.7691, 63.0842, 59.6063],
  },

  // --- Charts ---
  "chart-1": {
    light: [18.2817, 57.1503, 43.9157],
    dark: [18.2817, 57.1503, 43.9157],
  },
  "chart-2": {
    light: [251.4525, 84.5858, 74.5083],
    dark: [251.4525, 84.5858, 74.5083],
  },
  "chart-3": {
    light: [46.1541, 28.2179, 81.9634],
    dark: [47.9998, 10.648, 9.2123],
  },
  "chart-4": {
    light: [256.5505, 49.1031, 88.4329],
    dark: [248.2794, 25.2338, 22.5483],
  },
  "chart-5": {
    light: [17.7782, 60.0063, 44.1217],
    dark: [17.7782, 60.0063, 44.1217],
  },

  // --- Sidebar ---
  "sidebar-background": {
    light: [51.4288, 25.9022, 94.7126],
    dark: [240, 5.9, 10],
  },
  "sidebar-foreground": {
    light: [59.9983, 2.5347, 23.3334],
    dark: [240, 4.8, 95.9],
  },
  "sidebar-primary": {
    light: [15.1107, 55.5301, 52.3487],
    dark: [224.3, 76.3, 48],
  },
  "sidebar-primary-foreground": { light: [300, 0, 98.433], dark: [0, 0, 100] },
  "sidebar-accent": {
    light: [46.1535, 22.8633, 88.8169],
    dark: [240, 3.7, 15.9],
  },
  "sidebar-accent-foreground": {
    light: [330, 0, 20.3885],
    dark: [240, 4.8, 95.9],
  },
  "sidebar-border": { light: [300, 0, 92.1607], dark: [240, 3.7, 15.9] },
  "sidebar-ring": { light: [330, 0, 70.9799], dark: [217.2, 91.2, 59.8] },

  // --- Study level (SL) semantic colors ---
  "sl-relearn": { light: [0, 72, 51], dark: [0, 72, 51] },
  "sl-hard": { light: [25, 95, 45], dark: [25, 95, 53] },
  "sl-medium": { light: [48, 96, 40], dark: [48, 96, 53] },
  "sl-easy": { light: [142, 71, 35], dark: [142, 71, 45] },
  "sl-new": { light: [220, 10, 50], dark: [220, 10, 50] },
  "sl-surface-hover": { light: [220, 14, 94], dark: [228, 14, 14] },
  "sl-surface-active": { light: [220, 14, 91], dark: [228, 14, 16] },

  // --- Numeric / dimension ---
  radius: { light: 0.75, dark: 0.75 },
  "sl-sidebar-width": { light: 220, dark: 220 },
  "sl-sidebar-collapsed": { light: 48, dark: 48 },
  spacing: { light: 0.25, dark: 0.25 },
};

// ── HSL → RGB ─────────────────────────────────────────────────────

function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hue2rgb(p, q, h + 1 / 3),
    g: hue2rgb(p, q, h),
    b: hue2rgb(p, q, h - 1 / 3),
  };
}

// ── Token groups ──────────────────────────────────────────────────

const groups = {
  color: Object.keys(tokens).filter(
    (k) =>
      ![
        "radius",
        "sl-sidebar-width",
        "sl-sidebar-collapsed",
        "spacing",
      ].includes(k),
  ),
  dimension: ["radius", "spacing", "sl-sidebar-width", "sl-sidebar-collapsed"],
};

// ── Build per-mode files ─────────────────────────────────────────

function buildModeFile(modeName) {
  const file = {};

  for (const [name, val] of Object.entries(tokens)) {
    const isColor = ![
      "radius",
      "sl-sidebar-width",
      "sl-sidebar-collapsed",
      "spacing",
    ].includes(name);

    if (isColor) {
      const { r, g, b } = hslToRgb(...val[modeName.toLowerCase()]);
      file[`color/${name}`] = {
        $type: "color",
        $value: {
          colorSpace: "srgb",
          components: [
            Number(r.toFixed(6)),
            Number(g.toFixed(6)),
            Number(b.toFixed(6)),
          ],
          alpha: 1,
        },
        $extensions: {
          "com.figma.scopes": ["ALL_SCOPES"],
        },
      };
    } else {
      file[`dimension/${name}`] = {
        $type: "number",
        $value: val[modeName.toLowerCase()],
        $extensions: {
          "com.figma.scopes": ["ALL_SCOPES"],
        },
      };
    }
  }

  file["$extensions"] = {
    "com.figma.modeName": modeName,
  };

  return file;
}

// ── Write output ──────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

for (const mode of ["Light", "Dark"]) {
  const data = buildModeFile(mode);
  const filePath = resolve(OUT_DIR, `${mode}.tokens.json`);
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ Written: ${filePath}`);
}

console.log("\n📁 Import these files into Figma via Variables → Import.");
