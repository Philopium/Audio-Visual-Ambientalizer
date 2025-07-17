import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { Image as ImageIcon, RefreshCw } from 'lucide-react';

interface Props {
  contrast: number;          // 0.0 .. 3.0 (tipico 1.0)
  threshold: number;         // 0 .. 255 (o normalizzato? in App usi 0..?)
  gamma: number;             // 0.1 .. 4.0 (tipico 1.0)
  preserve: boolean;         // preserve bright
  onContrastChange: (n: number) => void;
  onThresholdChange: (n: number) => void;
  onGammaChange: (n: number) => void;
  onPreserveChange: (b: boolean) => void;
  onNewSquares: () => void;
  className?: string;
}

/**
 * Controlli globali immagine: contrast, threshold, gamma, preserveBright + regen.
 * NOTE: i range usati qui sono coerenti con App.tsx:
 *   - contrast default 1, slider 0..3
 *   - threshold default 0, slider 0..1 (App usa 0..1 normalizzato, NON 0..255)
 *   - gamma default 1, slider 0.1..4
 * Se il tuo codice App cambia scala, aggiorna i min/max qui.
 */
export function GlobalImageModule({
  contrast,
  threshold,
  gamma,
  preserve,
  onContrastChange,
  onThresholdChange,
  onGammaChange,
  onPreserveChange,
  onNewSquares,
  className,
}: Props) {

  const handleContrast = (e: React.ChangeEvent<HTMLInputElement>) =>
    onContrastChange(Number(e.target.value));

  const handleThreshold = (e: React.ChangeEvent<HTMLInputElement>) =>
    onThresholdChange(Number(e.target.value));

  const handleGamma = (e: React.ChangeEvent<HTMLInputElement>) =>
    onGammaChange(Number(e.target.value));

  const handlePreserve = (e: React.ChangeEvent<HTMLInputElement>) =>
    onPreserveChange(e.target.checked);

  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          Global Image
        </span>
      }
      accent="img"
      className={className}
      titleSize="lg"
    >
      {/* Contrast */}
      <div className="mb-3">
        <label className="text-xs opacity-80 block mb-1">
          Contrast: <span className="font-mono opacity-100">{contrast.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={3}
          step={0.01}
          value={contrast}
          onChange={handleContrast}
          className="w-full accent-cyan-400"
        />
      </div>

      {/* Threshold (0..1 normalizzato come in App) */}
      <div className="mb-3">
        <label className="text-xs opacity-80 block mb-1">
          Threshold: <span className="font-mono opacity-100">{threshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={handleThreshold}
          className="w-full accent-cyan-400"
        />
      </div>

      {/* Gamma */}
      <div className="mb-3">
        <label className="text-xs opacity-80 block mb-1">
          Gamma: <span className="font-mono opacity-100">{gamma.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.1}
          max={4}
          step={0.01}
          value={gamma}
          onChange={handleGamma}
          className="w-full accent-cyan-400"
        />
      </div>

      {/* Preserve Bright */}
      <label className="text-xs opacity-80 flex items-center gap-2 mb-3 select-none">
        <input
          type="checkbox"
          checked={preserve}
          onChange={handlePreserve}
        />
        Preserve Bright
      </label>

      {/* Regenerate Squares */}
      <button
        type="button"
        onClick={onNewSquares}
        className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 text-xs"
      >
        <RefreshCw className="w-3 h-3" />
        New Squares
      </button>
    </ModuleCard>
  );
}
