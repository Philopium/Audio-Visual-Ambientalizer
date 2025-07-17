export function blendImages(
  ctx:CanvasRenderingContext2D,
  a:ImageData,
  b:ImageData,
  mix:number
):ImageData{
  const out = ctx.createImageData(a.width,a.height);
  const ad=a.data, bd=b.data, od=out.data;
  const len = ad.length;
  for (let i=0;i<len;i+=4){
    od[i+0] = ad[i+0] + (bd[i+0]-ad[i+0])*mix;
    od[i+1] = ad[i+1] + (bd[i+1]-ad[i+1])*mix;
    od[i+2] = ad[i+2] + (bd[i+2]-ad[i+2])*mix;
    od[i+3] = 255;
  }
  return out;
}
