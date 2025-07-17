import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

/* Color tokens -> tailwind fallback */
const COLOR_CLASSES: Record<string,string> = {
  blue:    'from-blue-500 to-blue-600',
  purple:  'from-purple-500 to-purple-600',
  emerald: 'from-emerald-500 to-emerald-600',
  orange:  'from-orange-500 to-orange-600',
  pink:    'from-pink-500 to-pink-600',
};

type SizeOpt = 'sm'|'md'|'lg';
const SIZE_CLASSES: Record<SizeOpt,string> = {
  sm:'w-12 h-12',
  md:'w-16 h-16',
  lg:'w-20 h-20',
};

export interface RichKnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v:number)=>void;
  label?: ReactNode;
  size?: SizeOpt;
  color?: keyof typeof COLOR_CLASSES;
  format?: (v:number)=>string;
}

export function RichKnob({
  value,
  min=0,
  max=100,
  step=1,
  onChange,
  label,
  size='md',
  color='blue',
  format,
}:RichKnobProps){
  const [dragging,setDragging]=useState(false);
  const ref=useRef<HTMLDivElement>(null);

  const angle = ((value-min)/(max-min))*270 - 135; // -135..+135deg

  const handleMouseDown=(e:React.MouseEvent)=>{
    e.preventDefault();
    setDragging(true);
  };

  const endDrag=useCallback(()=>setDragging(false),[]);

  const handleMouseMove=useCallback((e:MouseEvent)=>{
    if(!dragging||!ref.current) return;
    const r=ref.current.getBoundingClientRect();
    const cx=r.left+r.width/2;
    const cy=r.top+r.height/2;
    const ang=Math.atan2(e.clientY-cy,e.clientX-cx)*(180/Math.PI)+90;
    const norm=((ang+135)%360)-135;
    const clamped=Math.max(-135,Math.min(135,norm));
    const newVal=min+((clamped+135)/270)*(max-min);
    const quant=Math.round(newVal/step)*step;
    onChange(quant);
  },[dragging,min,max,step,onChange]);

  useEffect(()=>{
    if(!dragging) return;
    window.addEventListener('mousemove',handleMouseMove);
    window.addEventListener('mouseup',endDrag,{once:true});
    return()=>{
      window.removeEventListener('mousemove',handleMouseMove);
      window.removeEventListener('mouseup',endDrag);
    };
  },[dragging,handleMouseMove,endDrag]);

  const valLabel = format ? format(value) : value;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        ref={ref}
        className={`${SIZE_CLASSES[size]} relative cursor-pointer`}
        onMouseDown={handleMouseDown}
      >
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${COLOR_CLASSES[color]} shadow-lg border-2 border-gray-600 hover:border-gray-500 transition-all duration-200`}>
          <div className="absolute inset-2 rounded-full bg-gray-900 shadow-inner">
            <div
              className="absolute top-1 left-1/2 w-0.5 h-3 bg-white rounded-full origin-bottom"
              style={{transform:`translate(-50%,0) rotate(${angle}deg)`}}
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      </div>
      {label!==undefined && (
        <div className="text-center leading-tight">
          <div className="text-xs text-gray-400 font-medium">{label}</div>
          <div className="text-xs text-gray-300">{valLabel}</div>
        </div>
      )}
    </div>
  );
}

export interface RichSliderProps {
  value:number;
  min?:number;
  max?:number;
  step?:number;
  onChange:(v:number)=>void;
  label?:ReactNode;
  vertical?:boolean;
  color?:keyof typeof COLOR_CLASSES;
  format?:(v:number)=>string;
}
export function RichSlider({
  value,
  min=0,
  max=100,
  step=1,
  onChange,
  label,
  vertical=false,
  color='blue',
  format,
}:RichSliderProps){
  const pct=((value-min)/(max-min))*100;
  const valLabel = format?format(value):value;

  return (
    <div className={`flex ${vertical?'flex-col h-32':'flex-row'} items-center gap-3 w-full`}>
      {!vertical && label && (
        <div className="text-xs text-gray-400 font-medium min-w-fit">{label}</div>
      )}
      <div className={`relative ${vertical?'w-2 flex-1':'flex-1 h-2'} bg-gray-700 rounded-full`}>
        <div
          className={`absolute ${COLOR_CLASSES[color]} rounded-full transition-all duration-150 ${vertical?'bottom-0 left-0 right-0':'top-0 left-0 bottom-0'}`}
          style={vertical?{height:`${pct}%`}:{width:`${pct}%`}}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e)=>onChange(parseFloat(e.target.value))}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={typeof label==='string'?label:undefined}
        />
        <div
          className={`absolute w-4 h-4 ${COLOR_CLASSES[color]} rounded-full border-2 border-white shadow-lg transition-all duration-150 pointer-events-none`}
          style={vertical
            ?{left:'50%',bottom:`${pct}%`,transform:'translate(-50%,50%)'}
            :{top:'50%',left:`${pct}%`,transform:'translate(-50%,-50%)'}
          }
        />
      </div>
      {vertical && label && (
        <div className="text-xs text-gray-400 font-medium text-center">{label}</div>
      )}
      {!vertical && (
        <div className="text-xs text-gray-300 min-w-fit">{valLabel}</div>
      )}
    </div>
  );
}

/* Fancy Card wrappers (optional; you can still use ModuleCard) */
export function RichCard({
  title,
  icon:Icon,
  children,
  className=''
}:{title:ReactNode;icon:React.ComponentType<{className?:string}>;children?:ReactNode;className?:string;}){
  return(
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-lg backdrop-blur-sm p-4 mb-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        {Icon && <Icon className="w-4 h-4 text-blue-400"/>}
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
