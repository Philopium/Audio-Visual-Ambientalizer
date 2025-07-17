import React, {
  useRef,
  useCallback,
  useEffect,
  ReactNode,
  CSSProperties,
} from 'react';

type KnobSize = 72 | 96 | 120;

export interface ValueKnobProps {
  value: number;                // base
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (v:number)=>void;
  label?: ReactNode;
  sizePx?: KnobSize;
  format?:(v:number)=>string;
  ticks?: number;
  preventContextMenu?: boolean;
  sensitivity?: number;
  sweepStartDeg?: number; // display deg (0=top)
  sweepEndDeg?: number;   // display deg

  /** valore modulato (effettivo). Se definito, mostrato con arco blu. */
  modValue?: number;
  showModArc?: boolean;
}

const clamp=(v:number,a:number,b:number)=>(v<a?a:v>b?b:v);
const v2n=(v:number,min:number,max:number)=>(v-min)/(max-min);
const hueForNorm=(n:number)=>120-120*clamp(n,0,1); // green->red

/* convert display angle (0=top) -> svg/trig (0=right) */
const dispToSvgDeg=(d:number)=>d-90;

export const ValueKnob:React.FC<ValueKnobProps>=({
  value,
  min=0,
  max=100,
  step=1,
  defaultValue,
  onChange,
  label,
  sizePx=96,
  format,
  ticks=12,
  preventContextMenu=true,
  sensitivity=150,
  sweepStartDeg=-120,
  sweepEndDeg=120,
  modValue,
  showModArc=true,
})=>{
  const ref=useRef<HTMLDivElement>(null);
  const dragRef=useRef<{startY:number;startX:number;startVal:number}|null>(null);

  const norm=clamp(v2n(value,min,max),0,1);
  const hue=hueForNorm(norm);
  const arcColor=`hsl(${hue} 100% 50%)`;

  const hasMod = modValue!==undefined;
  const modNorm = hasMod ? clamp(v2n(modValue!,min,max),0,1) : 0;

  const quantize=useCallback((v:number)=>{
    const c=clamp(v,min,max);
    const snapped=Math.round((c-min)/step)*step+min;
    return clamp(snapped,min,max);
  },[min,max,step]);

  /* drag */
  const handlePointerDown=(e:React.MouseEvent)=>{
    e.preventDefault();
    dragRef.current={startY:e.clientY,startX:e.clientX,startVal:value};
    window.addEventListener('mousemove',handleDragMove);
    window.addEventListener('mouseup',handleDragEnd,{once:true});
  };
  const handleDragMove=(e:MouseEvent)=>{
    const d=dragRef.current; if(!d) return;
    const dy=d.startY - e.clientY;
    const dx=e.clientX - d.startX;
    const dist = dy + dx*0.25;
    const range=max-min;
    const newVal = d.startVal + (dist/sensitivity)*range;
    onChange(quantize(newVal));
  };
  const handleDragEnd=(_e:MouseEvent)=>{
    dragRef.current=null;
    window.removeEventListener('mousemove',handleDragMove);
  };
  useEffect(()=>{
    return()=>window.removeEventListener('mousemove',handleDragMove);
  },[]);

  /* wheel */
  const handleWheel=(e:React.WheelEvent)=>{
    e.preventDefault();
    let inc = e.deltaY>0?-step:step;
    if(e.shiftKey) inc/=10;
    if(e.altKey)   inc*=10;
    onChange(quantize(value+inc));
  };

  /* double-click reset */
  const handleDoubleClick=()=>{
    const dv=defaultValue!==undefined?defaultValue:min;
    onChange(quantize(dv));
  };

  /* right click numeric */
  const handleContext=(e:React.MouseEvent)=>{
    if(!preventContextMenu) return;
    e.preventDefault();
    const input=window.prompt('Immetti valore:',String(value));
    if(input===null) return;
    const parsed=parseFloat(input);
    if(!Number.isNaN(parsed)) onChange(quantize(parsed));
  };

  const valLabel=format?format(value):String(value);

  /* display geometry */
  const outerStyle:CSSProperties={
    width:sizePx,
    height:sizePx,
    position:'relative',
    cursor:'ns-resize',
  };
  const bodyStyle:CSSProperties={
    position:'absolute',
    inset:0,
    borderRadius:'50%',
    background:'#1a1a1a',
    boxShadow:'0 0 6px rgba(0,0,0,.8) inset,0 0 4px rgba(0,0,0,.9)',
    border:'2px solid #666',
  };
  const discInset=Math.round(sizePx*0.1);
  const discStyle:CSSProperties={
    position:'absolute',
    inset:discInset,
    borderRadius:'50%',
    background:'radial-gradient(circle at 30% 30%, #2b2b2b 0%, #1a1a1a 60%, #000 100%)',
  };

  // pointer angle (display coords)
  const angleDisp = sweepStartDeg + (sweepEndDeg - sweepStartDeg)*norm;
  const pointerLen=sizePx/2 - discInset - 6;
  const pointerStyle:CSSProperties={
    position:'absolute',
    top:'50%',
    left:'50%',
    width:2,
    height:pointerLen,
    background:'#fff',
    borderRadius:2,
    transform:`translate(-50%,-100%) rotate(${angleDisp}deg)`,
    transformOrigin:'50% 100%',
  };

  const glossStyle:CSSProperties={
    position:'absolute',
    inset:0,
    borderRadius:'50%',
    background:'linear-gradient(135deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 60%)',
    pointerEvents:'none',
  };

  /* ==== SVG ARC ==== */
  const svgSize=sizePx;
  const arcStrokeW=4;
  const rOuter=svgSize/2;
  const rArc=rOuter-arcStrokeW/2;
  const sweepDisp = sweepEndDeg - sweepStartDeg;
  const startSvg = dispToSvgDeg(sweepStartDeg);
  const sweepNowDisp = sweepDisp * norm;
  const endSvg   = startSvg + sweepNowDisp;
  const largeArc = sweepNowDisp > 180 ? 1 : 0;
  const start = polar(rOuter,rOuter,rArc,startSvg);
  const end   = polar(rOuter,rOuter,rArc,endSvg);
  const arcPath=`M ${start.x} ${start.y} A ${rArc} ${rArc} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  /* mod overlay arc (thin cyan) */
  let modPath:string|undefined;
  let modLargeArc=0;
  if(hasMod && showModArc){
    const modSweepDisp = sweepDisp * modNorm;
    const modEndSvg = startSvg + modSweepDisp;
    modLargeArc = modSweepDisp > 180 ? 1 : 0;
    const ms = polar(rOuter,rOuter,rArc,startSvg);
    const me = polar(rOuter,rOuter,rArc,modEndSvg);
    modPath = `M ${ms.x} ${ms.y} A ${rArc} ${rArc} 0 ${modLargeArc} 1 ${me.x} ${me.y}`;
  }

  const tickEls:React.ReactNode[]=[];
  if(ticks>0){
    for(let i=0;i<=ticks;i++){
      const tn=i/ticks;
      const tdSvg  = dispToSvgDeg(sweepStartDeg + sweepDisp*tn);
      const x1=rOuter+Math.cos(tdSvg*Math.PI/180)*rArc;
      const y1=rOuter+Math.sin(tdSvg*Math.PI/180)*rArc;
      const x2=rOuter+Math.cos(tdSvg*Math.PI/180)*(rArc-4);
      const y2=rOuter+Math.sin(tdSvg*Math.PI/180)*(rArc-4);
      tickEls.push(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#555" strokeWidth={1} strokeLinecap="round" />
      );
    }
  }

  return (
    <div
      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,userSelect:'none'}}
      onContextMenu={handleContext}
    >
      <div
        ref={ref}
        style={outerStyle}
        onMouseDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        <div style={bodyStyle}/>
        <div style={discStyle}/>
        <svg width={svgSize} height={svgSize} style={{position:'absolute',inset:0,pointerEvents:'none'}}>
          {tickEls}
          {/* mod arc first (behind) */}
          {hasMod && showModArc && (
            <path
              d={modPath}
              stroke="hsl(190 100% 60% / .6)"
              strokeWidth={arcStrokeW}
              fill="none"
              strokeLinecap="round"
            />
          )}
          {/* base arc on top */}
          {norm>0 && (
            <path
              d={arcPath}
              stroke={arcColor}
              strokeWidth={arcStrokeW}
              fill="none"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div style={pointerStyle}/>
        <div style={glossStyle}/>
      </div>
      {label!==undefined && (
        <div style={{textAlign:'center',lineHeight:1.15}}>
          <div style={{fontSize:12,color:'#ccc'}}>{label}</div>
          <div style={{fontSize:12,color:'#fff'}}>{valLabel}</div>
        </div>
      )}
    </div>
  );
};

/* polar helper (svg/trig deg: 0=right) */
function polar(cx:number,cy:number,r:number,deg:number){
  const rad=deg*Math.PI/180;
  return {x:cx+Math.cos(rad)*r,y:cy+Math.sin(rad)*r};
}
