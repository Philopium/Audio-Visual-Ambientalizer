export function edgeDetect(
  ctx:CanvasRenderingContext2D,
  img:ImageData,
  amount:number
):ImageData{
  const {width:w,height:h} = img;
  const src = img.data;
  const out = ctx.createImageData(w,h);
  const dst = out.data;
  function idx(x:number,y:number){return (y*w+x)*4;}
  for (let y=1;y<h-1;y++){
    for (let x=1;x<w-1;x++){
      const i = idx(x,y);
      const gx =
        src[idx(x+1,y-1)] - src[idx(x-1,y-1)] +
        2*(src[idx(x+1,y)] - src[idx(x-1,y)]) +
        src[idx(x+1,y+1)] - src[idx(x-1,y+1)];
      const gy =
        src[idx(x-1,y+1)] - src[idx(x-1,y-1)] +
        2*(src[idx(x,y+1)] - src[idx(x,y-1)]) +
        src[idx(x+1,y+1)] - src[idx(x+1,y-1)];
      let mag = Math.sqrt(gx*gx+gy*gy)*amount*0.25;
      mag = Math.max(0,Math.min(255,mag));
      dst[i]=dst[i+1]=dst[i+2]=mag;
      dst[i+3]=255;
    }
  }
  return out;
}
