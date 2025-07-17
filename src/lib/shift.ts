export function shiftImage(
  ctx:CanvasRenderingContext2D,
  img:ImageData,
  px:number
):ImageData{
  const {width:w,height:h} = img;
  const tmp = ctx.createImageData(w,h);
  const src = img.data;
  const dst = tmp.data;
  const shift = ((px % w) + w) % w;
  const rowBytes = w*4;
  for (let y=0;y<h;y++){
    const rowStart = y*w*4;
    const split = shift*4;
    dst.set(src.subarray(rowStart+rowBytes-split,rowStart+rowBytes),rowStart);
    dst.set(src.subarray(rowStart,rowStart+rowBytes-split),rowStart+split);
  }
  return tmp;
}
