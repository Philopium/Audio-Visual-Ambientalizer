// src/lib/posterize.ts
export interface PosterizeOpts {
  levels: number;        // >=2 attiva
  dither?: boolean;
  ditherAmt?: number;    // 0..1 scala relativa
}

/**
 * Riduce il numero di livelli per canale RGB.
 * Non modifica 'src'; ritorna nuovo ImageData.
 */
export function posterizeImage(
  ctx: CanvasRenderingContext2D,
  src: ImageData,
  { levels, dither = false, ditherAmt = 0.25 }: PosterizeOpts
): ImageData {
  const w = src.width;
  const h = src.height;
  const out = ctx.createImageData(w, h);

  if (levels < 2) {
    out.data.set(src.data);
    return out;
  }

  const s = src.data;
  const d = out.data;
  const step = 255 / (levels - 1);
  const inv = 1 / step;

  for (let i = 0; i < s.length; i += 4) {
    let r = s[i];
    let g = s[i + 1];
    let b = s[i + 2];
    const a = s[i + 3];

    if (dither) {
      const n = (hashNoise(i) - 0.5) * 2 * ditherAmt * step; // ±
      r = clamp8(r + n);
      g = clamp8(g + n);
      b = clamp8(b + n);
    }

    d[i] = quant(r, step, inv);
    d[i + 1] = quant(g, step, inv);
    d[i + 2] = quant(b, step, inv);
    d[i + 3] = a;
  }
  return out;
}

function quant(v: number, step: number, inv: number) {
  return clamp8(Math.round(v * inv) * step);
}
function clamp8(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}
function hashNoise(i: number) {
  let x = (i ^ 0x9e3779b1) >>> 0;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  return (x & 0xffff) / 0xffff; // 0..1
}
