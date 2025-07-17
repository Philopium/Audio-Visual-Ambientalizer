import React, { useState } from 'react';
import JSZip from 'jszip';

/**
 * Offline hi-res render:
 *  - Renders current generative state frame-by-frame at 1024x1024 (no blur).
 *  - Captures N seconds at fixed FPS (default 10 to keep size down).
 *  - Audio bounce: we currently grab *live* audio from the engine for the duration;
 *    true Tone.Offline is possible but heavier; can add later.
 *  - Produces zip: PNG frames + live-captured .webm audio track extracted from a MediaRecorder (audio-only).
 * NOTE: Because browsers restrict synchronous offline audio mixing + deterministic visual,
 *       this is a "quasi-offline" capture that runs in real-time but writes lossless PNG frames
 *       (unlike the normal WebM capture which may blur).
 */
interface Props{
  renderFrame:(ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>void;
  getAudioStream:()=>MediaStream|undefined;
}
export function OfflineRenderControls({renderFrame,getAudioStream}:Props){
  const [dur,setDur]=useState(10);
  const [fps,setFps]=useState(10);
  const [busy,setBusy]=useState(false);

  const run = async()=>{
    if(busy) return;
    setBusy(true);
    try{
      const W=1024,H=1024;
      const can=document.createElement('canvas');
      can.width=W; can.height=H;
      const ctx=can.getContext('2d',{willReadFrequently:true})!;
      const frames:number=Math.max(1,Math.floor(dur*fps));
      const zip=new JSZip();

      // capture audio (live) in parallel
      const astream=getAudioStream();
      let audioChunks:Blob[]=[];
      let mr:MediaRecorder|null=null;
      if(astream){
        mr=new MediaRecorder(astream,{mimeType:'audio/webm'});
        mr.ondataavailable=(e)=>{if(e.data.size>0)audioChunks.push(e.data);};
        mr.start();
      }

      for(let i=0;i<frames;i++){
        const t=i/fps;
        renderFrame(ctx,W,H,performance.now()/1000 + t);
        const blob=await new Promise<Blob>(res=>can.toBlob(b=>res(b!),'image/png'));
        zip.file(`frame_${String(i).padStart(5,'0')}.png`,blob);
        await new Promise(r=>setTimeout(r,0)); // yield
      }

      if(mr){
        await new Promise<void>(res=>{
          mr!.onstop=()=>res();
          mr!.stop();
        });
        const audioBlob=new Blob(audioChunks,{type:'audio/webm'});
        zip.file('audio.webm',audioBlob);
      }

      const zipBlob=await zip.generateAsync({type:'blob'});
      const url=URL.createObjectURL(zipBlob);
      const a=document.createElement('a');
      a.href=url;
      a.download='WebAff_Offline.zip';
      a.click();
    }finally{
      setBusy(false);
    }
  };

  return (
    <div style={{marginTop:'1rem',padding:'0.5rem',border:'1px solid #444'}}>
      <h3>Offline Render (PNG+Audio)</h3>
      <label>Durata (s): {dur}</label>
      <input type="range" min={1} max={600} step={1} value={dur}
        onChange={e=>setDur(parseInt(e.target.value,10))}/>
      <label>FPS: {fps}</label>
      <input type="range" min={1} max={60} step={1} value={fps}
        onChange={e=>setFps(parseInt(e.target.value,10))}/>
      <div style={{marginTop:'0.5rem'}}>
        <button disabled={busy} onClick={run}>{busy?'Rendering...':'Render Offline'}</button>
      </div>
    </div>
  );
}
