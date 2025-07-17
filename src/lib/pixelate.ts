import { clamp } from './math';

export function pixelateImage(
  ctx:CanvasRenderingContext2D,
  img:ImageData,
  size:number
):ImageData{
  size = clamp(Math.floor(size),1,256);
  const {width:w,height:h} = img;
  const tmp = document.createElement('canvas');
  tmp.width = Math.max(1,Math.floor(w/size));
  tmp.height = Math.max(1,Math.floor(h/size));
  const tctx = tmp.getContext('2d')!;
  // put original
  const c2 = document.createElement('canvas');
  c2.width=w; c2.height=h;
  c2.getContext('2d')!.putImageData(img,0,0);
  tctx.imageSmoothingEnabled=false;
  tctx.drawImage(c2,0,0,tmp.width,tmp.height);
  const up = document.createElement('canvas');
  up.width=w; up.height=h;
  const uctx = up.getContext('2d')!;
  uctx.imageSmoothingEnabled=false;
  uctx.drawImage(tmp,0,0,w,h);
  return uctx.getImageData(0,0,w,h);
}
