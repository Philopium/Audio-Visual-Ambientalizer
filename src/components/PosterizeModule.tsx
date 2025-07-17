import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { Palette } from 'lucide-react';

interface Props {
  levels: number;               // 0? actually we want >=2; mapping sotto
  dither: boolean;
  onLevelsChange: (n: number) => void;
  onDitherChange: (b: boolean) => void;
}

export function PosterizeModule({
  levels,
  dither,
  onLevelsChange,
  onDitherChange,
}: Props) {
  // UI range: 2..32. We’ll clamp in knob.
  const safeLevels = Math.max(2, Math.min(32, Math.round(levels || 0)));

  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Palette className="w-3.5 h-3.5 text-fuchsia-300" />
          Posterize
        </span>
      }
      accent="img"
    >
      <div className="mb-3 flex justify-center">
        <ValueKnob
          label="Levels"
          value={safeLevels}
          min={2}
          max={32}
          step={1}
          defaultValue={8}
          onChange={(n)=>onLevelsChange(Math.round(n))}
          sizePx={72}
          ticks={6}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v)=>`${Math.round(v)}`}
        />
      </div>

      <label className="text-xs flex items-center gap-2">
        <input
          type="checkbox"
          checked={dither}
          onChange={(e)=>onDitherChange(e.target.checked)}
        />
        Dither
      </label>
    </ModuleCard>
  );
}
