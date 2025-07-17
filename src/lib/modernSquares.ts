/**
 * Generate a modern-art blocky coloured base image.
 * Fills background black then draws random colour squares.
 */
export function generateModernSquares(
  ctx:CanvasRenderingContext2D,
  w:number,
  h:number,
  palette:string[]=[
    '#ff004c','#ffb300','#00c8ff','#1eff00','#ff6d00',
    '#d500f9','#00ffb3','#ffe600','#ff00c8','#006dff',
    '#ffffff','#000000'
  ],
  density:number=0.1
):ImageData{
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,w,h);
  const min = Math.max(8, Math.floor(Math.min(w,h)*0.02));
  const max = Math.max(min+1, Math.floor(Math.min(w,h)*0.15));
  const count = Math.floor((w*h) * density / (max*max));
  for (let i=0;i<count;i++){
    const size = Math.floor(min + Math.random()*(max-min));
    const x = Math.floor(Math.random()*(w-size));
    const y = Math.floor(Math.random()*(h-size));
    ctx.fillStyle = palette[Math.floor(Math.random()*palette.length)];
    ctx.fillRect(x,y,size,size);
  }
  return ctx.getImageData(0,0,w,h);
}
