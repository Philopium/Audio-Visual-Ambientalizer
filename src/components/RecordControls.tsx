import React, { useState, useRef } from 'react';

const codecOptions = [
  {label:'Auto (vp9/opus)', value:'video/webm;codecs=vp9,opus'},
  {label:'vp8/vorbis', value:'video/webm;codecs=vp8,vorbis'},
  {label:'webm (browser default)', value:'video/webm'},
  {label:'raw default', value:''},
];

interface Props{
  canvasRef: React.RefObject<HTMLCanvasElement>;
  getAudioStream: ()=>MediaStream|undefined;
}

export function RecordControls({canvasRef,getAudioStream}:Props){
  const [dur,setDur] = useState(60); // seconds
  const [recording,setRecording] = useState(false);
  const [codec,setCodec] = useState(codecOptions[0].value);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<number|undefined>();

  const pickMime = ()=>{
    if(codec && MediaRecorder.isTypeSupported(codec)) return codec;
    // fallback chain
    for(const opt of codecOptions){
      if(opt.value && MediaRecorder.isTypeSupported(opt.value)) return opt.value;
    }
    return '';
  };

  const start = ()=>{
    if(recording) return;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const fps = 30;
    const vstream = canvas.captureStream(fps);

    const astream = getAudioStream();
    if(astream){
      const stream = new MediaStream();
      vstream.getVideoTracks().forEach(t=>stream.addTrack(t));
      astream.getAudioTracks().forEach(t=>stream.addTrack(t));
      begin(stream);
    }else{
      begin(vstream);
    }
  };

  const begin = (stream:MediaStream)=>{
    chunksRef.current=[];
    const mime = pickMime();
    const opts:MediaRecorderOptions = mime?{mimeType:mime}:{};
    const mr = new MediaRecorder(stream,opts);
    mediaRecorderRef.current=mr;
    mr.ondataavailable = (e)=>{ if(e.data.size>0) chunksRef.current.push(e.data); };
    mr.onstop = save;
    mr.start();
    setRecording(true);
    timeoutRef.current = window.setTimeout(stop, dur*1000);
  };

  const stop = ()=>{
    if(!recording) return;
    const mr=mediaRecorderRef.current;
    if(!mr) return;
    mr.stop();
    setRecording(false);
    if(timeoutRef.current!==undefined){
      clearTimeout(timeoutRef.current);
      timeoutRef.current=undefined;
    }
  };

  const save = ()=>{
    const blob = new Blob(chunksRef.current,{type:'video/webm'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url;
    a.download='WebAff_Capture.webm';
    a.click();
  };

  return (
    <div style={{marginTop:'1rem',padding:'0.5rem',border:'1px solid #444'}}>
      <h3>Record (A/V)</h3>
      <label>Durata (s): {dur}</label>
      <input type="range" min={1} max={600} step={1} value={dur}
        onChange={e=>setDur(parseInt(e.target.value,10))}/>
      <div style={{marginTop:'0.25rem'}}>
        <label>Codec: </label>
        <select value={codec} onChange={e=>setCodec(e.target.value)}>
          {codecOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div style={{marginTop:'0.5rem'}}>
        {!recording ? (
          <button onClick={start}>Rec</button>
        ) : (
          <button onClick={stop}>Stop</button>
        )}
      </div>
    </div>
  );
}
