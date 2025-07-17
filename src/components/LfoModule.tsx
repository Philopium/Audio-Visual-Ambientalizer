import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { Waves } from 'lucide-react';

/* Gli stessi target usati in App.tsx */
export type LfoTarget =
  | 'none'
  | 'ringFreq'
  | 'pixelate'
  | 'delay'
  | 'feedback'
  | 'masterVol';

export interface LfoParams {
  rate: number;  // Hz
  depth: number; // 0..1
  target: LfoTarget;
}

/* props di controllo */
interface Props extends LfoParams {
  onChange: (p: Partial<LfoParams>) => void;
  /** opzionale: className extra */
  className?: string;
}

export function LfoModule({
  rate,
  depth,
  target,
  onChange,
  className,
}: Props) {

  const handleRate = (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ rate: Number(e.target.value) });

  const handleDepth = (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ depth: Number(e.target.value) });

  const handleTarget = (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ target: e.target.value as LfoTarget });

  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Waves className="w-3.5 h-3.5 text-lime-400" />
          LFO
        </span>
      }
      accent="mod"
      className={className}
      titleSize="lg"
    >
      {/* Rate */}
      <div className="mb-3">
        <label className="text-xs opacity-80 block mb-1">
          Rate: <span className="opacity-100 font-mono">{rate.toFixed(2)} Hz</span>
        </label>
        <input
          type="range"
          min={0.01}
          max={20}
          step={0.01}
          value={rate}
          onChange={handleRate}
          className="w-full accent-lime-400"
        />
      </div>

      {/* Depth */}
      <div className="mb-3">
        <label className="text-xs opacity-80 block mb-1">
          Depth: <span className="opacity-100 font-mono">{depth.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={depth}
          onChange={handleDepth}
          className="w-full accent-lime-400"
        />
      </div>

      {/* Target */}
      <div className="mb-1">
        <label className="text-xs opacity-80 block mb-1">Target</label>
        <select
          value={target}
          onChange={handleTarget}
          className="bg-gray-700 text-xs p-1 rounded w-full"
        >
          <option value="none">(None)</option>
          <option value="ringFreq">Ring Freq</option>
          <option value="pixelate">Pixelate Size</option>
          <option value="delay">Delay Time</option>
          <option value="feedback">Feedback Amt</option>
          <option value="masterVol">Master Volume</option>
        </select>
      </div>
    </ModuleCard>
  );
}
