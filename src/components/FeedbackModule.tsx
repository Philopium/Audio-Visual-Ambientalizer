import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { RefreshCw } from 'lucide-react';

interface Props {
  value: number;       // 0..1
  order: number;
  maxOrder: number;
  onChange: (n: number) => void;
  onOrderChange: (n: number) => void;
}

export function FeedbackModule({
  value,
  order,
  maxOrder,
  onChange,
  onOrderChange,
}: Props) {
  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
          Feedback
        </span>
      }
      accent="fx"
    >
      <div className="mb-3 flex justify-center">
        <ValueKnob
          label="Amt"
          value={value}
          min={0}
          max={1}
          step={0.001}
          defaultValue={0}
          onChange={onChange}
          sizePx={72}
          ticks={8}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v) => v.toFixed(2)}
        />
      </div>

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
