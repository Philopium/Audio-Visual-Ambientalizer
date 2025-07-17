export function cloneImageData(ctx:CanvasRenderingContext2D,img:ImageData){
  const copy = ctx.createImageData(img.width,img.height);
  copy.data.set(img.data);
  return copy;
}
