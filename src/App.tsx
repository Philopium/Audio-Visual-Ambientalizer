import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

/* ---------------------------------------------------------------
 * Imports – UI Modules
 * --------------------------------------------------------------- */
import { LfoModule, LfoTarget } from './components/LfoModule';
import { MicroLoopModule } from './components/MicroLoopModule';
import { UnlockOverlay } from './components/UnlockOverlay';
import { OfflineRenderControls } from './components/OfflineRenderControls';
import { RingModModule, RingWave } from './components/RingModModule';
import { PixelateModule } from './components/PixelateModule';
import { DelayModule } from './components/DelayModule';
import { FeedbackModule } from './components/FeedbackModule';
import { EdgeBoostModule } from './components/EdgeBoostModule';
import { PosterizeModule } from './components/PosterizeModule';
import { FractalWarpModule } from './components/FractalWarpModule';
import { GlobalImageModule } from './components/GlobalImageModule';
import { MasterEQ } from './components/MasterEQ';
import { HarmonizerModule, HarmoMode, VoiceConfig } from './components/HarmonizerModule';
import { RecordControls } from './components/RecordControls';

/* ---------------------------------------------------------------
 * Imports – Audio + Lib FX
 * --------------------------------------------------------------- */
import { AudioGraph, ChainId } from './audio/AudioGraph';
import { clamp } from './lib/math';
import { cloneImageData } from './lib/imageUtils';
import { generateModernSquares } from './lib/modernSquares';
import { pixelateImage } from './lib/pixelate';
import { shiftImage } from './lib/shift';
import { blendImages } from './lib/blend';
import { edgeDetect } from './lib/edge';
import { globalAdjust } from './lib/globalAdjust';
import { ringVisual, RingWave as RingWaveType } from './lib/ringVisual';
import { posterizeImage } from './lib/posterize';
import { fractalWarpImage } from './lib/fractalWarp';

/* --------------------------------------------------------------- */
const PREVIEW_W = 512;
const PREVIEW_H = 512;
const RENDER_W = 1024;
const RENDER_H = 1024;

/* effect order state */
type FxState = { id: ChainId; order: number; enabled: boolean };

/* ---------------------------------------------------------------
 * Component
 * --------------------------------------------------------------- */
export default function App() {
  /* ----- refs ----- */
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioGraph>();

  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const baseImageRef = useRef<ImageData | null>(null);
  const prevProcessedRef = useRef<ImageData | null>(null);

  /* ----- FX chain order ----- */
  const [fxOrder, setFxOrder] = useState<FxState[]>([
    { id: 'ringmod', order: 1, enabled: true },
    { id: 'pixelate', order: 2, enabled: true },
    { id: 'delay', order: 3, enabled: true },
    { id: 'feedback', order: 4, enabled: true },
  ]);
  const maxOrder = fxOrder.length;
  const fxMap: Record<ChainId, number> = useMemo(() => {
    const m: Record<ChainId, number> = { ringmod: 1, pixelate: 2, delay: 3, feedback: 4 };
    fxOrder.forEach((f) => { m[f.id] = f.order; });
    return m;
  }, [fxOrder]);
  const orderedIds = useMemo(() => [...fxOrder].sort((a,b)=>a.order-b.order).map(f=>f.id), [fxOrder]);

  /* ----- Params: RingMod ----- */
  const [ringFreq, setRingFreq] = useState(440);
  const [ringMix, setRingMix] = useState(0);
  const [ringWave, setRingWave] = useState<RingWave>('sine');

  /* ----- Params: Pixelate ----- */
  const [pixScale, setPixScale] = useState(4);
  const [pixMix, setPixMix] = useState(0);

  /* ----- Params: Delay ----- */
  const [delayTime, setDelayTime] = useState(0.2);
  const [delayMix, setDelayMix] = useState(0);

  /* ----- Params: Feedback ----- */
  const [feedbackAmt, setFeedbackAmt] = useState(0);

  /* ----- Post FX (edge, posterize, warp) ----- */
  const [edgeAmt, setEdgeAmt] = useState(0);
  const [posterLevels, setPosterLevels] = useState(0);
  const [posterDither, setPosterDither] = useState(false);
  const [warpScale, setWarpScale] = useState(0.3);
  const [warpDepth, setWarpDepth] = useState(0);

  /* ----- Global image controls ----- */
  const [globalContrast, setGlobalContrast] = useState(1);
  const [globalThreshold, setGlobalThreshold] = useState(0);
  const [globalGamma, setGlobalGamma] = useState(1);
  const [preserveBright, setPreserveBright] = useState(true);
  const [baseLocked, setBaseLocked] = useState(true);

  /* ----- Harmonizer ----- */
  const [harmoEnabled, setHarmoEnabled] = useState(false);
  const [harmoMode, setHarmoMode] = useState<HarmoMode>('intervals');
  const [harmoVoiceCount, setHarmoVoiceCount] = useState(1);
  const [harmoVoices, setHarmoVoices] = useState<VoiceConfig[]>([
    { enabled: false, semitones: 7,  mix: 0.2 },
    { enabled: false, semitones: 12, mix: 0.2 },
    { enabled: false, semitones: -12,mix: 0.2 },
  ]);
  const [harmoAlign, setHarmoAlign] = useState(true);
  const handleVoiceChange = (i:number, v:Partial<VoiceConfig>) => {
    setHarmoVoices(prev => { const arr=[...prev]; arr[i]={...arr[i],...v}; return arr; });
  };

  /* ----- LFO ----- */
  const [lfoRate, setLfoRate] = useState(0.2);
  const [lfoDepth, setLfoDepth] = useState(0);
  const [lfoTarget, setLfoTarget] = useState<LfoTarget>('none');

  /* ----- Master / Gate ----- */
  const [microIntensity, setMicroIntensity] = useState(0);
  const [microStepMs, setMicroStepMs] = useState(250);
  const [low, setLow] = useState(0);
  const [mid, setMid] = useState(0);
  const [high, setHigh] = useState(0);
  const [volume, setVolume] = useState(-20);
  const [gateThresh, setGateThresh] = useState(-60);
  const [gateRelease, setGateRelease] = useState(0.1);
  const [fadeDur, setFadeDur] = useState(1);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateLevel, setGateLevel] = useState(-Infinity);
  const [unlocked, setUnlocked] = useState(false);

  /* ------------------------------------------------------------- */
  /* Offscreen canvas + initial texture                            */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = PREVIEW_W; c.height = PREVIEW_H;
    offscreenRef.current = c;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;

    // Load default image (if exists) else fallback squares
    const img = new Image();
    img.src = '/images/digital_source.png';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, PREVIEW_W, PREVIEW_H);
      baseImageRef.current = ctx.getImageData(0, 0, PREVIEW_W, PREVIEW_H);
      prevProcessedRef.current = null;
    };
    img.onerror = () => {
      const gen = generateModernSquares(ctx, PREVIEW_W, PREVIEW_H);
      ctx.putImageData(gen, 0, 0);
      baseImageRef.current = gen;
      prevProcessedRef.current = null;
    };
  }, []);

  /* ------------------------------------------------------------- */
  /* AudioGraph init                                                */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    audioRef.current = new AudioGraph('/audio/forest.wav');
  }, []);

  /* Unlock on first user gesture */
  const handleUnlock = useCallback(async () => {
    if (unlocked) return;
    await audioRef.current?.start();
    (window as any).__webAffAudio = audioRef.current;
    setUnlocked(true);
    console.log('Audio context + AudioGraph started');
  }, [unlocked]);
  useEffect(() => {
    // Fallback: pointerdown anywhere
    const fn = async () => { await handleUnlock(); };
    window.addEventListener('pointerdown', fn, { once: true });
    return () => window.removeEventListener('pointerdown', fn);
  }, [handleUnlock]);

  /* ------------------------------------------------------------- */
  /* MicroLoop jitter visual (and audio seeking handled elsewhere) */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    if (microIntensity <= 0) return;
    const ag = audioRef.current; if (!ag) return;
    const dur = ag.getDuration();
    let id:number|undefined; let last=performance.now();
    const step=()=>{
      const now=performance.now();
      if(now-last>=microStepMs){
        last=now;
        if(Math.random()<microIntensity){
          const pos=Math.random()*dur; ag.seek(pos);
          if(harmoAlign) for(let i=0;i<harmoVoiceCount;i++) ag.seekVoice(i,pos);
        }
      }
      id=window.requestAnimationFrame(step);
    };
    id=window.requestAnimationFrame(step);
    return()=>{ if(id)cancelAnimationFrame(id); };
  }, [microIntensity,microStepMs,harmoAlign,harmoVoiceCount]);

  /* Poll gate meter */
  useEffect(() => {
    const id = setInterval(() => {
      const ag = audioRef.current; if (!ag) return;
      setGateOpen(ag.getGateOpen());
      setGateLevel(ag.getGateLevel());
    }, 100);
    return () => clearInterval(id);
  }, []);

  /* ------------------------------------------------------------- */
  /* LFO targeting UI params                                        */
  /* ------------------------------------------------------------- */
  useEffect(() => {
    if (lfoTarget==='none' || lfoDepth===0) return;
    let raf:number;
    const loop=()=>{
      const t=performance.now()/1000;
      const osc=(Math.sin(t*Math.PI*2*lfoRate)*0.5+0.5)*lfoDepth;
      switch(lfoTarget){
        case 'ringFreq': setRingFreq(clamp(1+osc*2000,1,2000)); break;
        case 'pixelate': setPixScale(clamp(Math.round(1+osc*127),1,128)); break;
        case 'delay': setDelayTime(clamp(osc,0,1)); break;
        case 'feedback': setFeedbackAmt(clamp(osc,0,1)); break;
        case 'masterVol': setVolume(-40+osc*40); break;
      }
      raf=requestAnimationFrame(loop);
    };
    loop();
    return()=>cancelAnimationFrame(raf);
  }, [lfoRate,lfoDepth,lfoTarget]);

  /* ------------------------------------------------------------- */
  /* Helpers                                                        */
  /* ------------------------------------------------------------- */
  function updateFxOrder(id:ChainId,newOrder:number){
    setFxOrder(prev=>{
      const arr=[...prev];
      const idx=arr.findIndex(f=>f.id===id);
      if(idx<0) return prev;
      const [it]=arr.splice(idx,1);
      const insertIndex=Math.max(0,Math.min(arr.length,newOrder-1));
      arr.splice(insertIndex,0,it);
      return arr.map((f,i)=>({...f,order:i+1}));
    });
  }

  const handleFile=(file:File)=>{
    const img=new Image();
    img.onload=()=>{
      originalImageRef.current=img;
      const off=offscreenRef.current;if(!off)return;
      const ctx=off.getContext('2d',{willReadFrequently:true})!;
      ctx.drawImage(img,0,0,off.width,off.height);
      baseImageRef.current=ctx.getImageData(0,0,off.width,off.height);
      prevProcessedRef.current=null;
    };
    img.src=URL.createObjectURL(file);
  };

  const regenSquares=()=>{
    const off=offscreenRef.current;if(!off)return;
    const ctx=off.getContext('2d',{willReadFrequently:true})!;
    const img=generateModernSquares(ctx,off.width,off.height);
    ctx.putImageData(img,0,0);
    baseImageRef.current=img;
    prevProcessedRef.current=null;
  };

  /* ------------------------------------------------------------- */
  /* Preview render scheduling (4fps cap)                           */
  /* ------------------------------------------------------------- */
  const lastTime=useRef(0);
  function shouldRun(now:number){
    if(now-lastTime.current>250){ lastTime.current=now; return true; }
    return false;
  }
  useEffect(()=>{
    let raf:number; const loop=(now:number)=>{ if(shouldRun(now)) renderPreview(); raf=requestAnimationFrame(loop); };
    raf=requestAnimationFrame(loop); return()=>cancelAnimationFrame(raf);
  });

  /* ------------------------------------------------------------- */
  /* renderPreview(): low‑res realtime visual + audio param update  */
  /* ------------------------------------------------------------- */
  const renderPreview = useCallback(() => {
    const off=offscreenRef.current;if(!off)return;
    const ctx=off.getContext('2d',{willReadFrequently:true})!;
    const input=baseLocked
      ? (baseImageRef.current ?? ctx.getImageData(0,0,off.width,off.height))
      : (prevProcessedRef.current ?? ctx.getImageData(0,0,off.width,off.height));
    let work=cloneImageData(ctx,input);

    /* microloop jitter (visual only) */
    if(microIntensity>0){
      const seg=Math.max(1,Math.floor(microStepMs/1000*off.width*0.5));
      const rand=(Math.random()*2-1)*microIntensity;
      const sh=Math.floor(rand*seg);
      if(sh!==0){ work=shiftImage(ctx,work,sh); }
    }

    /* ring visual pre */
    if(ringMix>0){
      work = ringVisual(ctx, work, ringFreq, ringMix, ringWave as RingWaveType, performance.now()/1000);
    }

    /* harmonizer colour overlay */
    if(harmoEnabled){
      const time = performance.now()/1000;
      const colours = [ [255,0,0],[0,255,0],[0,0,255] ];
      const src = work;
      const overlay = ctx.createImageData(src.width,src.height);
      const od=overlay.data; const sd=src.data;
      const voices = harmoVoices.slice(0,harmoVoiceCount);
      for(let vi=0;vi<voices.length;vi++){
        const v=voices[vi]; if(!v.enabled||v.mix<=0) continue;
        const [cr,cg,cb]=colours[vi];
        const ratio=Math.pow(2,v.semitones/12);
        const phase=(time*ratio)%1;
        for(let i=0;i<sd.length;i+=4){
          const amp=(Math.sin((i/4)*0.0001*ratio + phase*Math.PI*2)*0.5+0.5)*v.mix;
          od[i  ] += cr*amp;
          od[i+1] += cg*amp;
          od[i+2] += cb*amp;
          od[i+3] = 255;
        }
      }
      for(let i=0;i<sd.length;i+=4){
        sd[i  ] = Math.min(255, sd[i  ] + od[i  ]);
        sd[i+1] = Math.min(255, sd[i+1] + od[i+1]);
        sd[i+2] = Math.min(255, sd[i+2] + od[i+2]);
      }
      work = src;
    }

    /* Reorderable FX chain (after ring) */
    orderedIds.forEach(id=>{
      if(id==='ringmod') return;
      switch(id){
        case 'pixelate':
          if(pixMix>0){
            const eff=pixelateImage(ctx,work,pixScale*(PREVIEW_W/RENDER_W));
            work=blendImages(ctx,work,eff,pixMix);
          }
          break;
        case 'delay':
          if(delayMix>0){
            const pxShift=Math.floor(delayTime*off.width*0.25);
            const eff=shiftImage(ctx,work,pxShift);
            work=blendImages(ctx,work,eff,delayMix);
          }
          break;
        case 'feedback':
          if(feedbackAmt>0 && prevProcessedRef.current){
            work=blendImages(ctx,work,prevProcessedRef.current,feedbackAmt);
          }
          break;
      }
    });

    /* Posterize */
    if(posterLevels>1){
      work = posterizeImage(ctx, work, { levels: posterLevels, dither: posterDither, ditherAmt: 0.35 });
    }

    /* Fractal Warp */
    if(warpDepth>0){
      const time = performance.now()/1000;
      work = fractalWarpImage(ctx, work, PREVIEW_W * warpScale, warpDepth, time);
    }

    /* Edge + Global */
    if(edgeAmt>0){
      const edges=edgeDetect(ctx,work,edgeAmt);
      work=blendImages(ctx,work,edges,Math.min(edgeAmt*0.5,1));
    }
    work=globalAdjust(ctx,work,globalContrast,globalThreshold,globalGamma,preserveBright);

    ctx.putImageData(work,0,0);
    prevProcessedRef.current=cloneImageData(ctx,work);

    /* draw display canvas */
    const disp=displayCanvasRef.current;
    if(disp){
      const dctx=disp.getContext('2d')!;
      dctx.imageSmoothingEnabled=false;
      dctx.clearRect(0,0,disp.width,disp.height);
      dctx.drawImage(off,0,0,disp.width,disp.height);
    }
    const toRingWave = (w: string): import('./audio/AudioGraph').RingWave => {
      switch (w) {
        case 'tri': return 'triangle';
        case 'saw': return 'saw';        // già valido
        case 'sq':  return 'square';     // se usi 'sq'
        default:    return (w as any);   // fallback
      }
    };
    /* Audio update */
    const ag=audioRef.current;
    if(ag){
      ag.rebuildChain(orderedIds);
      ag.setRingMod(ringFreq,ringMix);
      ag.setRingWave(toRingWave(ringWave));
      ag.setHarmoEnabled(harmoEnabled);
      ag.setHarmoVoices(ringFreq, harmoVoices.slice(0,harmoVoiceCount), harmoAlign);
      ag.setPixelateBits(Math.max(1,Math.round(pixScale/16))||1);
      ag.setDelay(delayTime);
      ag.setFeedback(feedbackAmt);
      ag.setEq(low,mid,high);
      ag.setVolume(volume);
      ag.setGateThresh(gateThresh);
      ag.setGateRelease(gateRelease);
      ag.setWarpLiquid(warpDepth, warpScale);
      ag.setDryGain(1); // legacy shim (no-op)
    }
  }, [
    orderedIds,
    ringFreq,ringMix,ringWave,
    harmoEnabled,harmoMode,harmoVoiceCount,harmoVoices,harmoAlign,
    microIntensity,microStepMs,
    pixScale,pixMix,
    delayTime,delayMix,
    feedbackAmt,
    edgeAmt,
    posterLevels,posterDither,
    warpScale,warpDepth,
    globalContrast,globalThreshold,globalGamma,preserveBright,
    baseLocked,
    low,mid,high,volume,gateThresh,gateRelease
  ]);

  /* ------------------------------------------------------------- */
  /* hiResRenderFrame – for offline export                          */
  /* ------------------------------------------------------------- */
  const hiResRenderFrame = useCallback((ctx:CanvasRenderingContext2D,w:number,h:number,time:number)=>{
    // base image (user import else squares)
    if(originalImageRef.current){
      ctx.drawImage(originalImageRef.current,0,0,w,h);
    }else{
      const img=generateModernSquares(ctx,w,h);
      ctx.putImageData(img,0,0);
    }
    let work=ctx.getImageData(0,0,w,h);

    if(ringMix>0){
      work=ringVisual(ctx,work,ringFreq,ringMix,ringWave as any,time);
    }

    if(harmoEnabled){
      const colours=[[255,0,0],[0,255,0],[0,0,255]];
      const sd=work.data; const voices=harmoVoices.slice(0,harmoVoiceCount);
      for(let vi=0;vi<voices.length;vi++){
        const v=voices[vi]; if(!v.enabled||v.mix<=0) continue;
        const [cr,cg,cb]=colours[vi];
        const ratio=Math.pow(2,v.semitones/12);
        const phase=(time*ratio)%1;
        for(let i=0;i<sd.length;i+=4){
          const amp=(Math.sin((i/4)*0.0001*ratio + phase*Math.PI*2)*0.5+0.5)*v.mix;
          sd[i]+=cr*amp; sd[i+1]+=cg*amp; sd[i+2]+=cb*amp;
        }
      }
    }

    const order=orderedIds;
    order.forEach(id=>{
      if(id==='ringmod') return;
      switch(id){
        case 'pixelate':
          if(pixMix>0){ const eff=pixelateImage(ctx,work,pixScale); work=blendImages(ctx,work,eff,pixMix); } break;
        case 'delay':
          if(delayMix>0){ const pxShift=Math.floor(delayTime*w*0.25); const eff=shiftImage(ctx,work,pxShift); work=blendImages(ctx,work,eff,delayMix); } break;
        case 'feedback':
          // offline ignore historic feedback frames
          break;
      }
    });

    if(posterLevels>1){
      work = posterizeImage(ctx, work, { levels: posterLevels, dither: posterDither, ditherAmt: 0.35 });
    }
    if(warpDepth>0){
      work = fractalWarpImage(ctx, work, w * warpScale, warpDepth, time);
    }

    if(edgeAmt>0){
      const edges=edgeDetect(ctx,work,edgeAmt);
      work=blendImages(ctx,work,edges,Math.min(edgeAmt*0.5,1));
    }
    work=globalAdjust(ctx,work,globalContrast,globalThreshold,globalGamma,preserveBright);
    ctx.putImageData(work,0,0);
  },[
    orderedIds,ringFreq,ringMix,ringWave,
    harmoEnabled,harmoVoiceCount,harmoVoices,
    pixScale,pixMix,delayTime,delayMix,
    posterLevels,posterDither,
    warpScale,warpDepth,
    edgeAmt,
    globalContrast,globalThreshold,globalGamma,preserveBright
  ]);

  /* ------------------------------------------------------------- */
  /* Fade helpers                                                    */
  /* ------------------------------------------------------------- */
  const fadeIn = () => audioRef.current?.fadeIn(fadeDur);
  const fadeOut = () => audioRef.current?.fadeOut(fadeDur);

  /* ------------------------------------------------------------- */
  /* Render                                                         */
  /* ------------------------------------------------------------- */
  return (
    <div style={{display:'flex',height:'100vh',background:'#000',color:'#fff',fontFamily:'sans-serif',position:'relative'}}>
      <UnlockOverlay visible={!unlocked} onClick={handleUnlock} />

      {/* Left panel: Modulations & inputs */}
      <div style={{width:'25%',padding:'1rem',overflowY:'auto',borderRight:'1px solid #333'}}>
        <h2>Modulations</h2>
        <LfoModule
          rate={lfoRate} depth={lfoDepth} target={lfoTarget}
          onChange={p=>{if(p.rate!==undefined)setLfoRate(p.rate);if(p.depth!==undefined)setLfoDepth(p.depth);if(p.target!==undefined)setLfoTarget(p.target);}}
        />
        <MicroLoopModule
          intensity={microIntensity} stepMs={microStepMs}
          onIntensity={setMicroIntensity} onStepMs={setMicroStepMs}
        />
        <div style={{marginTop:'1rem'}}>
          <label>
            <input type="checkbox" checked={baseLocked} onChange={e=>setBaseLocked(e.target.checked)}/> Base-Locked
          </label>
        </div>
        <div style={{marginTop:'1rem'}}>
          <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
        </div>
        <button style={{marginTop:'1rem',padding:'0.5rem 1rem',background:'#444'}} onClick={regenSquares}>New Squares</button>
        <RecordControls canvasRef={displayCanvasRef} getAudioStream={()=>audioRef.current?.getStream()} />
        <OfflineRenderControls renderFrame={(ctx,w,h,time)=>hiResRenderFrame(ctx,w,h,time)} getAudioStream={()=>audioRef.current?.getStream()} />
      </div>

      {/* Center canvas */}
      <div style={{width:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <canvas
          ref={displayCanvasRef}
          width={RENDER_W}
          height={RENDER_H}
          style={{border:'1px solid #555',background:'#111',imageRendering:'pixelated',width:RENDER_W,height:RENDER_H}}
        />
      </div>

      {/* Right panel: FX chain */}
      <div style={{width:'25%',padding:'1rem',overflowY:'auto',borderLeft:'1px solid #333'}}>
        <HarmonizerModule enabled={harmoEnabled} setEnabled={setHarmoEnabled} mode={harmoMode} setMode={setHarmoMode} voiceCount={harmoVoiceCount} setVoiceCount={setHarmoVoiceCount} voices={harmoVoices} onVoiceChange={handleVoiceChange} align={harmoAlign} setAlign={setHarmoAlign} />
        <h2>Effects Chain</h2>
        <RingModModule
          freq={ringFreq} mix={ringMix} wave={ringWave} order={fxMap.ringmod} maxOrder={maxOrder}
          onFreqChange={setRingFreq} onMixChange={setRingMix} onWaveChange={setRingWave}
          onOrderChange={n=>updateFxOrder('ringmod',n)}
        />
        <PixelateModule
          value={pixScale} mix={pixMix} order={fxMap.pixelate} maxOrder={maxOrder}
          onChange={setPixScale} onMixChange={setPixMix}
          onOrderChange={n=>updateFxOrder('pixelate',n)}
        />
        <DelayModule
          time={delayTime} mix={delayMix} order={fxMap.delay} maxOrder={maxOrder}
          onChange={setDelayTime} onMixChange={setDelayMix}
          onOrderChange={n=>updateFxOrder('delay',n)}
        />
        <FeedbackModule
          value={feedbackAmt} order={fxMap.feedback} maxOrder={maxOrder}
          onChange={setFeedbackAmt} onOrderChange={n=>updateFxOrder('feedback',n)}
        />
        <EdgeBoostModule amount={edgeAmt} onAmountChange={setEdgeAmt}/>
        <PosterizeModule levels={posterLevels} dither={posterDither} onLevelsChange={setPosterLevels} onDitherChange={setPosterDither}/>
        <FractalWarpModule scale={warpScale} depth={warpDepth} onScaleChange={setWarpScale} onDepthChange={setWarpDepth}/>
        <GlobalImageModule
          contrast={globalContrast} threshold={globalThreshold} gamma={globalGamma} preserve={preserveBright}
          onContrastChange={setGlobalContrast} onThresholdChange={setGlobalThreshold} onGammaChange={setGlobalGamma} onPreserveChange={setPreserveBright}
          onNewSquares={regenSquares}
        />
        <MasterEQ
          low={low} mid={mid} high={high} volume={volume}
          gateThresh={gateThresh} gateRelease={gateRelease}
          gateOpen={gateOpen} gateLevel={gateLevel}
          fadeDur={fadeDur}
          onLowChange={setLow} onMidChange={setMid} onHighChange={setHigh}
          onVolumeChange={setVolume}
          onGateThreshChange={setGateThresh} onGateReleaseChange={setGateRelease}
          onFadeDurChange={setFadeDur} onFadeIn={fadeIn} onFadeOut={fadeOut}
        />
      </div>
    </div>
  );
}
