import React, { useState, useEffect, useRef } from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { Play, Pause } from 'lucide-react';

export type HarmoSeqDivision = '1/4'|'1/8'|'1/16'|'1/32';

interface StepCell {
  enabled: boolean;
  semitones: number; // -24..+24
}

interface Props {
  /** numero voci attive nel tuo Harmonizer (<=3) */
  voiceCount: number;
  /** callback: pattern changed -> notifica App */
  onPatternChange?: (patterns: StepCell[][]) => void;
  /** callback runtime: step advanced -> semitoni per voce -> App mod */
  onStep?: (steps: StepCell[]) => void;
}

const SEMI_MIN=-24;
const SEMI_MAX=24;
const DEFAULT_LEN=16;

export function HarmoSeqModule({
  voiceCount,
  onPatternChange,
  onStep,
}: Props){
  const [bpm,setBpm]=useState(120);
  const [div,setDiv]=useState<HarmoSeqDivision>('1/8');
  const [len,setLen]=useState(DEFAULT_LEN);
  const [playing,setPlaying]=useState(false);
  const [step,setStep]=useState(0);

  // pattern [voice][step]
  const [patterns,setPatterns]=useState<StepCell[][]>(()=>(
    Array.from({length:3},()=>(
      Array.from({length:DEFAULT_LEN},()=>({enabled:false,semitones:0}))
    ))
  ));

  // update parent pattern
  useEffect(()=>{ onPatternChange?.(patterns); },[patterns]);

  // clock
  const timerRef=useRef<number|null>(null);
  useEffect(()=>{
    if(!playing){
      if(timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const msPerBeat=60000/bpm;
    const divMult = divisionMult(div); // es. 0.5 beat for 1/8
    const stepMs = msPerBeat*divMult;
    timerRef.current=window.setInterval(()=>{
      setStep(prev=>{
        const nxt=(prev+1)%len;
        // fire step callback
        const cur = patterns.map(v=>v[nxt]);
        onStep?.(cur.slice(0,voiceCount));
        return nxt;
      });
    },stepMs);
    return()=>{if(timerRef.current)clearInterval(timerRef.current);};
  },[playing,bpm,div,len,voiceCount,patterns,onStep]);

  // cell edit
  const toggleCell=(vi:number,si:number)=>{
    setPatterns(p=>{
      const np=p.map((row)=>row.slice());
      np[vi][si]={...np[vi][si],enabled:!np[vi][si].enabled};
      return np;
    });
  };
  const editCell=(vi:number,si:number)=>{
    const cur=patterns[vi][si];
    const input=window.prompt('Semitoni (-24..+24):',String(cur.semitones));
    if(input===null) return;
    let n=parseInt(input,10);
    if(Number.isNaN(n)) return;
    if(n<SEMI_MIN)n=SEMI_MIN; if(n>SEMI_MAX)n=SEMI_MAX;
    setPatterns(p=>{
      const np=p.map((row)=>row.slice());
      np[vi][si]={...np[vi][si],enabled:true,semitones:n};
      return np;
    });
  };

  const playToggle=()=>setPlaying(p=>!p);

  return (
    <ModuleCard
      title="Harmo Seq"
      accent="mod"
    >
      {/* transport */}
      <div className="flex items-center gap-2 mb-2">
        <button
          className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
          onClick={playToggle}
        >
          {playing ? <Pause className="w-3 h-3 inline"/> : <Play className="w-3 h-3 inline"/>}
          <span className="ml-1">{playing?'Stop':'Play'}</span>
        </button>
        <label className="text-xs flex items-center gap-1">
          BPM
          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={e=>setBpm(Number(e.target.value))}
            className="w-16 bg-gray-700 text-xs p-1 rounded"
          />
        </label>
        <label className="text-xs flex items-center gap-1">
          Div
          <select
            value={div}
            onChange={e=>setDiv(e.target.value as HarmoSeqDivision)}
            className="bg-gray-700 text-xs p-1 rounded"
          >
            <option value="1/4">1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
            <option value="1/32">1/32</option>
          </select>
        </label>
        <label className="text-xs flex items-center gap-1">
          Steps
          <input
            type="number"
            min={1}
            max={64}
            value={len}
            onChange={e=>{
              const n=Number(e.target.value);
              setLen(n);
              setPatterns(p=>p.map(row=>resizeRow(row,n)));
            }}
            className="w-16 bg-gray-700 text-xs p-1 rounded"
          />
        </label>
      </div>

      {/* grid */}
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <tbody>
            {patterns.slice(0,voiceCount).map((row,vi)=>(
              <tr key={vi}>
                {row.map((cell,si)=>{
                  const active = playing && si===step;
                  const enabled = cell.enabled;
                  const semi = cell.semitones;
                  const bg = enabled
                    ? semitoneColor(semi)
                    : 'rgba(255,255,255,0.05)';
                  const outline = active ? '2px solid #fff' : '1px solid #333';
                  return (
                    <td
                      key={si}
                      style={{
                        width:22,
                        height:22,
                        background:bg,
                        border:outline,
                        cursor:'pointer',
                        textAlign:'center',
                        lineHeight:'22px',
                        userSelect:'none',
                      }}
                      title={`V${vi+1} S${si} ${enabled?semi: 'off'}`}
                      onClick={()=>toggleCell(vi,si)}
                      onDoubleClick={()=>editCell(vi,si)}
                    >
                      {enabled?semi:'.'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleCard>
  );
}

/* helpers */
function resizeRow(row:StepCell[],len:number):StepCell[]{
  if(row.length===len) return row;
  const base={enabled:false,semitones:0};
  if(row.length<len){
    return [...row,...Array.from({length:len-row.length},()=>({...base}))];
  }else{
    return row.slice(0,len);
  }
}
function divisionMult(div:HarmoSeqDivision){
  switch(div){
    case '1/4': return 1;
    case '1/8': return 0.5;
    case '1/16': return 0.25;
    case '1/32': return 0.125;
  }
}
function semitoneColor(semi:number){
  // map -24..+24 to blue->red
  const n=(semi+24)/48; // 0..1
  const hue=clamp(240 - 240*n,0,240); // blu->rosso
  return `hsl(${hue} 80% 50% / .8)`;
}
const clamp=(v:number,a:number,b:number)=>(v<a?a:v>b?b:v);
