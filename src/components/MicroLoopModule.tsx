import React from 'react';

interface Props{
  intensity:number;     // 0..1 (probability / randomness)
  stepMs:number;        // 10..1000
  onIntensity:(n:number)=>void;
  onStepMs:(n:number)=>void;
}
export function MicroLoopModule({intensity,stepMs,onIntensity,onStepMs}:Props){
  return (
    <div style={{marginBottom:'1rem'}}>
      <h3>MicroLoop</h3>
      <label>Random: {intensity.toFixed(2)}</label>
      <input type="range" min={0} max={1} step={0.01} value={intensity}
        onChange={e=>onIntensity(parseFloat(e.target.value))}/>
      <label>Step: {stepMs} ms</label>
      <input type="range" min={10} max={1000} step={1} value={stepMs}
        onChange={e=>onStepMs(parseInt(e.target.value,10))}/>
    </div>
  );
}
