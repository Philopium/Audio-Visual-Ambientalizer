import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { RichSlider } from '../ui/RichControls';
import { Zap } from 'lucide-react';

export type RingWave = 'sine' | 'square' | 'saw' | 'tri';

interface Props {
  freq: number;
  mix: number;
  wave: RingWave;
  order: number;
  maxOrder: number;
  onFreqChange: (n: number) => void;
  onMixChange: (n: number) => void;
  onWaveChange: (w: RingWave) => void;
  onOrderChange: (n: number) => void;
  /** overlay modulato opzionale */
  modFreq?: number;
}

export function RingModModule({
  freq,
  mix,
  wave,
  order,
  maxOrder,
  onFreqChange,
  onMixChange,
  onWaveChange,
  onOrderChange,
  modFreq,
}: Props) {
  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-orange-400" />
          Ring Mod
        </span>
      }
      accent="fx"
    >
      {/* Freq */}
      <div className="mb-3 flex justify-center">
        <ValueKnob
          label="Freq"
          value={freq}
          min={1}
          max={2000}
          step={1}
          defaultValue={440}
          onChange={onFreqChange}
          sizePx={96}
          ticks={12}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v)=>`${Math.round(v)}Hz`}
          modValue={modFreq}
        />
      </div>

      {/* Mix Slider */}
      <div className="mb-3">
        <RichSlider
          label="Mix"
          value={mix}
          min={0}
          max={1}
          step={0.01}
          onChange={onMixChange}
          color="purple"
          format={(v) => v.toFixed(2)}
        />
      </div>

      {/* Wave Select */}
      <div className="mt-2 mb-3">
        <label className="text-xs opacity-80 block mb-1">Wave</label>
        <select
          className="bg-gray-700 text-xs p-1 rounded w-full"
          value={wave}
          onChange={(e) => onWaveChange(e.target.value as RingWave)}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="saw">Saw</option>
          <option value="tri">Tri</option>
        </select>
      </div>

      {/* Chain Pos */}
      <div className="text-xs opacity-70 flex items-center gap-2">
        <span>Chain Pos</span>
        <input
          type="number"
          min={1}
          max={maxOrder}
          value={order}
          onChange={(e) => onOrderChange(Number(e.target.value))}
          className="w-16 bg-gray-700 text-xs p-1 rounded"
        />
        <span>/ {maxOrder}</span>
      </div>
    </ModuleCard>
  );
}
