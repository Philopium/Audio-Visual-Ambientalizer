import { clamp } from './math';
export type RingWave = 'sine'|'square'|'saw'|'triangle'|'noise';
export function ringVisual(
  ctx:CanvasRenderingContext2D,
  img:ImageData,
  freq:number,
  mix:number,
  wave:RingWave,
  t:number
):ImageData{
  const {width:w,height:h}=img;
  const out = ctx.createImageData(w,h);
  const src=img.data,dst=out.data;
  const phase = t*freq*0.001;
  for (let y=0;y<h;y++){
    const v = (y/h);
    let osc:number;
    switch(wave){
      case 'square': osc = ((v*freq+phase)%1)<0.5?1:-1; break;
      case 'saw': osc = ((v*freq+phase)%1)*2-1; break;
      case 'triangle': {
        const p = (v*freq+phase)%1;
        osc = p<0.5?(p*4-1):(3-4*p);
        break;
      }
      case 'noise': osc = Math.random()*2-1; break;
      default: osc = Math.sin((v*freq+phase)*Math.PI*2);
    }
    const scale = (osc*0.5+0.5)*mix;
    for (let x=0;x<w;x++){
      const i=(y*w+x)*4;
      dst[i+0]=clamp(src[i+0]*scale,0,255);
      dst[i+1]=clamp(src[i+1]*scale,0,255);
      dst[i+2]=clamp(src[i+2]*scale,0,255);
      dst[i+3]=255;
    }
  }
  return out;
}
