import { clamp } from './math';

export function globalAdjust(
  ctx:CanvasRenderingContext2D,
  img:ImageData,
  contrast:number=1,
  threshold:number=0,
  gamma:number=1,
  preserveBright:boolean=true
):ImageData{
  const out = ctx.createImageData(img.width,img.height);
  const src = img.data, dst=out.data;
  for (let i=0;i<src.length;i+=4){
    let r=src[i],g=src[i+1],b=src[i+2];
    // contrast (simple)
    r = clamp(((r-128)*contrast)+128,0,255);
    g = clamp(((g-128)*contrast)+128,0,255);
    b = clamp(((b-128)*contrast)+128,0,255);
    // gamma
    if (gamma!==1){
      const inv=1/gamma;
      r = 255*Math.pow(r/255,inv);
      g = 255*Math.pow(g/255,inv);
      b = 255*Math.pow(b/255,inv);
    }
    // threshold
    if (threshold>0){
      const l=(r+g+b)/3;
      if (l<threshold*255){
        r=g=b=preserveBright?0:l;
      }
    }
    dst[i]=r;dst[i+1]=g;dst[i+2]=b;dst[i+3]=255;
  }
  return out;
}
