import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { RichSlider } from '../ui/RichControls';
import { Hourglass } from 'lucide-react';

interface Props {
  time: number;            // 0..1 (seconds or normalized shift)
  mix: number;             // 0..1
  order: number;
  maxOrder: number;
  onChange: (n: number) => void;
  onMixChange: (n: number) => void;
  onOrderChange: (n: number) => void;
}

export function DelayModule({
  time,
  mix,
  order,
  maxOrder,
  onChange,
  onMixChange,
  onOrderChange,
}: Props) {
  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Hourglass className="w-3.5 h-3.5 text-emerald-400" />
          Delay
        </span>
      }
      accent="fx"
    >
      {/* Time */}
      <div className="mb-3 flex justify-center">
        <ValueKnob
          label="Time"
          value={time}
          min={0}
          max={1}
          step={0.001}
          defaultValue={0.2}
          onChange={onChange}
          sizePx={96}
          ticks={12}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v) => `${(v * 1000).toFixed(0)}ms`}
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
          color="emerald"
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
