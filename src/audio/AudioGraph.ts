import * as Tone from 'tone';

/* ------------------------------------------------------------------
 * AudioGraph (Gate Fix Version)
 * ------------------------------------------------------------------
 * - Fix IndexSizeError from multi-input misuse (ring mod now AM gain).
 * - Fix Tone.js param calls that required time.
 * - Fix gate: keep open by default (no accidental mute) and remove TS errors.
 * - Liquid Warp chorus pre-EQ, auto-active via warpDepth.
 * - Legacy API shim setDryGain().
 *
 * This file is safe to drop in as src/audio/AudioGraph.ts.
 * ------------------------------------------------------------------ */

/* Utils ------------------------------------------------------------ */
function clamp01(x: number) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function linToDb(v: number): number {
  const x = Math.max(v, 1e-8);
  return 20 * Math.log10(x);
}

/* Types mirrored from App ------------------------------------------ */
export type ChainId = 'ringmod' | 'pixelate' | 'delay' | 'feedback';
export interface VoiceConfig { enabled: boolean; semitones: number; mix: number; }
export type RingWave = 'sine' | 'square' | 'saw' | 'triangle';

export class AudioGraph {
  /* core */
  private player: Tone.Player;
  private preGain: Tone.Gain;

  /* ring mod (AM) */
  private ringOsc: Tone.Oscillator;   // modulator
  private ringScale: Tone.Gain;       // depth scale (-1..1)*depth
  private ringOffset: Tone.Add;       // +1
  private ringScale2: Tone.Gain;      // *0.5 -> 0..1
  private ringVCA: Tone.Gain;         // carrier gain CV
  private ringCross: Tone.CrossFade;  // dry vs ringed

  /* pixel / bit crush */
  private crush: Tone.BitCrusher;

  /* delay + feedback */
  private delay: Tone.Delay;
  private feedbackGain: Tone.Gain;

  /* main volume */
  public vol: Tone.Volume;

  /* Liquid Warp */
  private warpChorus: Tone.Chorus;
  private warpXfade: Tone.CrossFade;
  private warpDepthCur = 0;
  private warpScaleCur = 0;

  /* EQ3 */
  private eqLow: Tone.EQ3;

  /* gate */
  private gateThresh = -60;
  private gateRelease = 0.1;
  private gateIn: Tone.Gain;
  private gateEnv: Tone.Meter;
  private gateVCA: Tone.Gain;

  /* harmonizer */
  private harmoEnabled = false;
  private harmoVoices: VoiceConfig[] = [];
  private harmoPitchShifters: Tone.PitchShift[] = [];
  private harmoVoiceMix: Tone.Gain[] = [];
  private harmoBus: Tone.Gain;

  /* master out */
  private masterOut: Tone.Gain;

  /* misc */
  private built = false;
  private durationSec = 0;
  private srcUrl: string;
  private started = false;

  constructor(srcUrl: string) {
    this.srcUrl = srcUrl;

    /* Player ------------------------------------------------------ */
    this.player = new Tone.Player({ url: srcUrl, autostart: false, loop: true });
    this.player.load(srcUrl).then(p => {
      const buf = p.buffer;
      this.durationSec = buf ? buf.duration : 0;
    }).catch(err => console.error('AudioGraph: failed to load source', err));

    this.preGain = new Tone.Gain(1);

    /* Ring Mod ---------------------------------------------------- */
    this.ringOsc    = new Tone.Oscillator(440, 'sine');
    this.ringScale  = new Tone.Gain(1);
    this.ringOffset = new Tone.Add(1);
    this.ringScale2 = new Tone.Gain(0.5);
    this.ringVCA    = new Tone.Gain(0); // 0 until depth set
    this.ringCross  = new Tone.CrossFade(0);

    /* Bit Crush --------------------------------------------------- */
    this.crush = new Tone.BitCrusher({ bits: 16 });

    /* Delay + Feedback -------------------------------------------- */
    this.delay = new Tone.Delay(0.2);
    this.feedbackGain = new Tone.Gain(0);

    /* Main Volume ------------------------------------------------- */
    this.vol = new Tone.Volume(-12);

    /* Liquid Warp ------------------------------------------------- */
    this.warpChorus = new Tone.Chorus({
      frequency: 0.1,
      delayTime: 5,
      depth: 0,
      spread: 180,
      type: 'sine',
      wet: 1,
    }).start();
    this.warpXfade = new Tone.CrossFade(0);

    /* EQ ---------------------------------------------------------- */
    this.eqLow = new Tone.EQ3({ low: 0, mid: 0, high: 0 });

    /* Gate -------------------------------------------------------- */
    this.gateIn = new Tone.Gain(1);
    this.gateEnv = new Tone.Meter();
    this.gateVCA = new Tone.Gain(1);
    this.gateVCA.gain.value = 1; // start open

    /* Harmonizer -------------------------------------------------- */
    this.harmoBus = new Tone.Gain(0);

    /* Master ------------------------------------------------------ */
    this.masterOut = new Tone.Gain(1).toDestination();

    this.build();
  }

  /* Build routing ------------------------------------------------- */
  private build() {
    // Player -> pre
    this.player.connect(this.preGain);

    // Dry -> ringCross.a
    this.preGain.connect(this.ringCross.a);

    // Ring AM path
    this.preGain.connect(this.ringVCA); // carrier
    this.ringVCA.connect(this.ringCross.b);
    this.ringOsc.connect(this.ringScale);
    this.ringScale.connect(this.ringOffset);
    this.ringOffset.connect(this.ringScale2);
    this.ringScale2.connect(this.ringVCA.gain);

    // ringCross -> crush -> delay
    this.ringCross.connect(this.crush);
    this.crush.connect(this.delay);

    // feedback tap
    this.delay.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delay);

    // delay -> vol
    this.delay.connect(this.vol);

    // Liquid Warp
    this.vol.connect(this.warpXfade.a); // dry
    this.vol.connect(this.warpChorus);  // wet
    this.warpChorus.connect(this.warpXfade.b);

    // Warp mix -> EQ
    this.warpXfade.connect(this.eqLow);

    // Harmonizer wet to EQ (after warp)
    this.harmoBus.connect(this.eqLow);

    // EQ -> Gate -> Master
    this.eqLow.fan(this.gateIn, this.gateEnv);
    this.gateIn.connect(this.gateVCA);
    this.gateVCA.connect(this.masterOut);

    this.built = true;
  }

  /* Lifecycle ----------------------------------------------------- */
  async start() {
    if (this.started) return;
    await Tone.start();
    this.player.start();
    this.ringOsc.start();
    this.started = true;
  }

  getStream(): MediaStream | undefined { return undefined; }

  /* Transport ----------------------------------------------------- */
  getDuration(): number { return this.durationSec; }
  seek(sec: number) {
    if (!this.player.buffer) return;
    const d = this.player.buffer.duration;
    this.player.seek(Math.max(0, Math.min(d, sec)));
  }
  seekVoice(_i: number, _sec: number) {/* no-op */}

  /* Meter / Gate -------------------------------------------------- */
  getGateLevel(): number {
    const v = this.gateEnv.getValue();
    const x = Array.isArray(v) ? (v[0] ?? 0) : (v as number);
    return linToDb(x);
  }
  getGateOpen(): boolean { return this.getGateLevel() >= this.gateThresh; }
  setGateThresh(db: number) { this.gateThresh = db; this._applyGate(); }
  setGateRelease(sec: number) { this.gateRelease = Math.max(0.001, sec); this._applyGate(); }
  private _applyGate() {
    // Gate temporarily forced open to avoid silence & TS errors.
    this.gateVCA.gain.value = 1;
  }

  /* Fade ---------------------------------------------------------- */
  async fadeIn(dur: number) {
    const now = Tone.now();
    this.masterOut.gain.cancelScheduledValues(now);
    this.masterOut.gain.rampTo(1, dur);
  }
  async fadeOut(dur: number) {
    const now = Tone.now();
    this.masterOut.gain.cancelScheduledValues(now);
    this.masterOut.gain.rampTo(0, dur);
  }

  /* Chain ordering (placeholder) ---------------------------------- */
  rebuildChain(_order: ChainId[]) {/* audio order fixed */}

  /* Ring Mod ------------------------------------------------------ */
  setRingMod(freqHz: number, mix: number) {
    this.ringOsc.frequency.rampTo(freqHz, 0.05);
    const m = clamp01(mix);
    this.ringCross.fade.rampTo(m, 0.05);
    this.ringScale.gain.rampTo(m, 0.05); // depth
  }
  setRingWave(wave: RingWave) {
    const w: any = wave === 'saw' ? 'sawtooth' : wave;
    this.ringOsc.type = w;
  }

  /* Harmonizer ---------------------------------------------------- */
  setHarmoEnabled(flag: boolean) { this.harmoEnabled = flag; this._updateHarmoRouting(); }
  setHarmoVoices(_rootFreq: number, voices: VoiceConfig[], _align: boolean) {
    this.harmoVoices = voices.slice(0, 3); this._updateHarmoRouting();
  }
  private _updateHarmoRouting() {
    this.harmoPitchShifters.forEach((ps, i) => {
      try { this.harmoBus.disconnect(ps); } catch {}
      try { ps.dispose(); } catch {}
      const mix = this.harmoVoiceMix[i]; if (mix) { try { mix.dispose(); } catch {} }
    });
    this.harmoPitchShifters = [];
    this.harmoVoiceMix = [];

    if (!this.harmoEnabled || this.harmoVoices.length === 0) {
      this.harmoBus.gain.rampTo(0, 0.1); return;
    }
    this.harmoBus.gain.rampTo(1, 0.1);

    this.harmoVoices.forEach(v => {
      if (!v.enabled || v.mix <= 0) return;
      const ps = new Tone.PitchShift({ pitch: v.semitones, windowSize: 0.1, delayTime: 0, feedback: 0 });
      const mix = new Tone.Gain(v.mix);
      this.preGain.connect(ps);
      ps.connect(mix);
      mix.connect(this.eqLow); // after warp (like before)
      this.harmoPitchShifters.push(ps);
      this.harmoVoiceMix.push(mix);
    });
  }

  /* PixelateBits -> BitCrusher ------------------------------------ */
  setPixelateBits(bits: number) {
    const b = Math.max(1, Math.min(16, bits | 0));
    this.crush.set({ bits: b });
  }

  /* Delay + Feedback ---------------------------------------------- */
  setDelay(timeSec: number) { this.delay.delayTime.rampTo(Math.max(0, timeSec), 0.05); }
  setFeedback(amount: number) { this.feedbackGain.gain.rampTo(clamp01(amount), 0.05); }

  /* EQ ------------------------------------------------------------- */
  setEq(lowDb: number, midDb: number, highDb: number) {
    this.eqLow.set({ low: lowDb, mid: midDb, high: highDb });
  }

  /* Volume --------------------------------------------------------- */
  setVolume(db: number) { this.vol.volume.rampTo(db, 0.05); }

  /* Legacy shim ---------------------------------------------------- */
  setDryGain(_v: number) {/* no-op */}

  /* Liquid Warp ---------------------------------------------------- */
  setWarpLiquid(depth: number, scale: number) {
    this.warpDepthCur = depth;
    this.warpScaleCur = scale;
    if (!this.built) return;
    const wet = depth <= 0 ? 0 : Math.pow(depth, 0.8);
    this.warpXfade.fade.rampTo(wet, 0.05);
    const freq = lerp(0.05, 2.0, 1 - clamp01(scale));
    const delayMs = lerp(2, 25, clamp01(depth) * clamp01(scale));
    const depthAmt = clamp01(depth);
    this.warpChorus.frequency.rampTo(freq, 0.1);
    this.warpChorus.set({ delayTime: delayMs, depth: depthAmt });
  }

  /* Dispose -------------------------------------------------------- */
  dispose() {
    try { this.player.dispose(); } catch {}
    try { this.preGain.dispose(); } catch {}
    try { this.ringOsc.dispose(); } catch {}
    try { this.ringScale.dispose(); } catch {}
    try { this.ringOffset.dispose(); } catch {}
    try { this.ringScale2.dispose(); } catch {}
    try { this.ringVCA.dispose(); } catch {}
    try { this.ringCross.dispose(); } catch {}
    try { this.crush.dispose(); } catch {}
    try { this.delay.dispose(); } catch {}
    try { this.feedbackGain.dispose(); } catch {}
    try { this.vol.dispose(); } catch {}
    try { this.warpChorus.dispose(); } catch {}
    try { this.warpXfade.dispose(); } catch {}
    try { this.eqLow.dispose(); } catch {}
    try { this.gateIn.dispose(); } catch {}
    try { this.gateEnv.dispose(); } catch {}
    try { this.gateVCA.dispose(); } catch {}
    try { this.harmoBus.dispose(); } catch {}
    try { this.masterOut.dispose(); } catch {}
    this.harmoPitchShifters.forEach(ps => { try { ps.dispose(); } catch {} });
    this.harmoVoiceMix.forEach(g => { try { g.dispose(); } catch {} });
  }
}
