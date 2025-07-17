import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { Shuffle } from 'lucide-react';

interface Props {
  scale: number;    // 0..1
  depth: number;    // 0..1
  onScaleChange: (n: number) => void;
  onDepthChange: (n: number) => void;
}

export function FractalWarpModule({
  scale,
  depth,
  onScaleChange,
  onDepthChange,
}: Props) {
  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Shuffle className="w-3.5 h-3.5 text-indigo-300" />
          Fractal Warp
        </span>
      }
      accent="fx"
    >
      <div className="mb-3 flex justify-center gap-4">
        <ValueKnob
          label="Scale"
          value={scale}
          min={0}
          max={1}
          step={0.001}
          defaultValue={0.3}
          onChange={onScaleChange}
          sizePx={72}
          ticks={8}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v)=>v.toFixed(2)}
        />
        <ValueKnob
          label="Depth"
          value={depth}
          min={0}
          max={1}
          step={0.001}
          defaultValue={0}
          onChange={onDepthChange}
          sizePx={72}
          ticks={8}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v)=>v.toFixed(2)}
        />
      </div>
    </ModuleCard>
  );
}
