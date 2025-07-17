import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { RichSlider } from '../ui/RichControls';
import { Grid3X3 as PixelIcon } from 'lucide-react';

interface Props {
  value: number;             // pixel scale
  mix: number;               // blend %
  order: number;
  maxOrder: number;
  onChange: (n: number) => void;
  onMixChange: (n: number) => void;
  onOrderChange: (n: number) => void;
  /** opzionale overlay modulato (se/quando aggiungeremo LFO) */
  modScale?: number;
}

export function PixelateModule({
  value,
  mix,
  order,
  maxOrder,
  onChange,
  onMixChange,
  onOrderChange,
  modScale,
}: Props) {
  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <PixelIcon className="w-3.5 h-3.5 text-cyan-400" />
          Pixelate
        </span>
      }
      accent="img"
    >
      {/* Pixel size */}
      <div className="mb-3 flex justify-center">
        <ValueKnob
          label="Size"
          value={value}
          min={1}
          max={256}
          step={1}
          defaultValue={4}
          onChange={onChange}
          sizePx={96}
          ticks={8}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v) => `${Math.round(v)}`}
          modValue={modScale}  // overlay (ok se undefined)
        />
      </div>

      {/* Mix */}
      <div className="mb-3">
        <RichSlider
          label="Mix"
          value={mix}
          min={0}
          max={1}
          step={0.01}
          onChange={onMixChange}
          color="cyan"
          format={(v) => v.toFixed(2)}
        />
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
