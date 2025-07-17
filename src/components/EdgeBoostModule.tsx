import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { ValueKnob } from '../ui/ValueKnob';
import { Crop } from 'lucide-react';

interface Props {
  amount: number;              // 0..1
  onAmountChange: (n: number) => void;
}

export function EdgeBoostModule({
  amount,
  onAmountChange,
}: Props) {
  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Crop className="w-3.5 h-3.5 text-yellow-300" />
          Edge Boost
        </span>
      }
      accent="img"
    >
      <div className="flex justify-center">
        <ValueKnob
          label="Amt"
          value={amount}
          min={0}
          max={1}
          step={0.001}
          defaultValue={0}
          onChange={onAmountChange}
          sizePx={72}
          ticks={8}
          sweepStartDeg={-120}
          sweepEndDeg={120}
          format={(v) => v.toFixed(2)}
        />
      </div>
    </ModuleCard>
  );
}
