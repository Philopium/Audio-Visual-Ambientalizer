// src/lib/paramBus.ts
export type ParamId =
  | 'ringFreq'
  | 'pixelate'
  | 'delay'
  | 'feedback'
  | 'masterVol'
  | 'edgeAmt'
  | 'posterLevels'
  | 'warpScale'
  | 'warpDepth';

export interface ParamHandle {
  min: number;
  max: number;
  /** valore base attuale (controllato dall'utente) */
  getBase(): number;
  setBase(v: number): void;
  /**
   * opzionale: restituisce valore effettivo (base + modulazioni)
   * Se non fornito, App calcola e non usa questo.
   */
  getEffective?: () => number;
}

const registry = new Map<ParamId, ParamHandle>();

export function registerParam(id: ParamId, handle: ParamHandle) {
  registry.set(id, handle);
}

export function unregisterParam(id: ParamId) {
  registry.delete(id);
}

export function getParam(id: ParamId) {
  return registry.get(id);
}

/** utility clamp */
export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
