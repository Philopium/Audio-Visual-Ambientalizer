/**
 * Fractal noise displacement for ImageData.
 * 
 * @param ctx      canvas context usato per creare l'ImageData di output
 * @param src      sorgente (NON mutata)
 * @param scalePx  grandezza cella rumore in pixel (maggiore = pattern largo)
 * @param depth    0..1 intensità (ampiezza spostamento max = scalePx * depth)
 * @param time     secondi per animazione (opzionale)
 * @returns        nuovo ImageData con distorsione
 */
export function fractalWarpImage(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  scalePx: number,
  depth: number,
  time = 0
): ImageData {
  const w = src.width;
  const h = src.height;
  const out = ctx.createImageData(w, h);

  if (depth <= 0 || scalePx <= 0) {
    out.data.set(src.data);
    return out;
  }

  const maxShift = scalePx * depth;
  const s = src.data;
  const d = out.data;

  // Per animazione leggera, offsettiamo le coordinate col tempo
  const t = time * 20; // fattore arbitrario

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // due campioni FBM disaccoppiati per X e Y
      const nx = fbm2d((x + t) / scalePx, (y + 17) / scalePx);
      const ny = fbm2d((x + 333) / scalePx, (y + t) / scalePx);

      const sx = clampInt(Math.round(x + nx * maxShift), 0, w - 1);
      const sy = clampInt(Math.round(y + ny * maxShift), 0, h - 1);

      const si = (sy * w + sx) << 2;
      const di = (y * w + x) << 2;

      d[di    ] = s[si    ];
      d[di + 1] = s[si + 1];
      d[di + 2] = s[si + 2];
      d[di + 3] = s[si + 3];
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* FBM (fractal Brownian motion) usando value noise 2D                */
/* ------------------------------------------------------------------ */

/**
 * Restituisce valore pseudo‑casuale continuo ~0..1, poi ricentrato a -1..1 dal chiamante.
 */
function fbm2d(x: number, y: number, octaves = 4): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * value2d(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  const v = sum / norm;   // 0..1
  return v * 2 - 1;       // -1..1
}

/**
 * Value noise 2D interpolato.
 */
function value2d(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const v00 = rnd2(xi, yi);
  const v10 = rnd2(xi + 1, yi);
  const v01 = rnd2(xi, yi + 1);
  const v11 = rnd2(xi + 1, yi + 1);

  const sx = smooth(xf);
  const sy = smooth(yf);

  const i1 = lerp(v00, v10, sx);
  const i2 = lerp(v01, v11, sx);
  return lerp(i1, i2, sy); // 0..1
}

/**
 * Hash deterministico → 0..1
 */
function rnd2(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h << 13)) >>> 0;
  h = (h ^ (h >> 17)) >>> 0;
  h = (h ^ (h << 5)) >>> 0;
  return (h & 0xffffffff) / 0xffffffff;
}

function smooth(t: number): number {
  // smootherstep-ish
  return t * t * (3 - 2 * t);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function clampInt(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}
