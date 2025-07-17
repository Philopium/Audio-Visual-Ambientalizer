export const clamp = (v:number,min:number,max:number)=>Math.min(Math.max(v,min),max);
export const lerp = (a:number,b:number,t:number)=>a+(b-a)*t;
