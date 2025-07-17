import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import { Music2 } from 'lucide-react';

export type HarmoMode = 'intervals' | 'chord'; // espandi se usi altri
export interface VoiceConfig {
  enabled: boolean;
  semitones: number; // offset
  mix: number;       // 0..1
}

interface Props {
  enabled: boolean;
  setEnabled: (b: boolean) => void;

  mode: HarmoMode;
  setMode: (m: HarmoMode) => void;

  voiceCount: number;
  setVoiceCount: (n: number) => void;

  voices: VoiceConfig[];
  onVoiceChange: (index: number, v: Partial<VoiceConfig>) => void;

  align: boolean;
  setAlign: (b: boolean) => void;

  className?: string;
}

export function HarmonizerModule({
  enabled,
  setEnabled,
  mode,
  setMode,
  voiceCount,
  setVoiceCount,
  voices,
  onVoiceChange,
  align,
  setAlign,
  className,
}: Props) {

  // aggiornatori per voce
  const setVoiceEnabled = (i: number, b: boolean) =>
    onVoiceChange(i, { enabled: b });
  const setVoiceSemitones = (i: number, n: number) =>
    onVoiceChange(i, { semitones: n });
  const setVoiceMix = (i: number, n: number) =>
    onVoiceChange(i, { mix: n });

  // render voci attive (limit a voiceCount)
  const rows = [];
  for (let i = 0; i < voiceCount; i++) {
    const v = voices[i] ?? { enabled: false, semitones: 0, mix: 0.5 };
    rows.push(
      <VoiceRow
        key={i}
        index={i}
        cfg={v}
        onEnabled={(b) => setVoiceEnabled(i, b)}
        onSemitones={(n) => setVoiceSemitones(i, n)}
        onMix={(n) => setVoiceMix(i, n)}
      />
    );
  }

  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <Music2 className="w-3.5 h-3.5 text-lime-400" />
          Harmonizer
        </span>
      }
      accent="mod"
      className={className}
      titleSize="lg"
    >
      {/* Enable */}
      <label className="text-xs opacity-80 flex items-center gap-2 mb-3 select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Enabled
      </label>

      {/* Mode + Voice count */}
      <div className="flex gap-2 mb-3 text-xs">
        <div className="flex-1">
          <label className="opacity-80 block mb-1">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as HarmoMode)}
            className="bg-gray-700 text-xs p-1 rounded w-full"
          >
            <option value="intervals">Intervals</option>
            <option value="chord">Chord</option>
          </select>
        </div>
        <div className="w-20">
          <label className="opacity-80 block mb-1">Voices</label>
          <input
            type="number"
            min={1}
            max={3}
            value={voiceCount}
            onChange={(e) => setVoiceCount(Number(e.target.value))}
            className="bg-gray-700 text-xs p-1 rounded w-full text-center"
          />
        </div>
      </div>

      {/* Align */}
      <label className="text-xs opacity-80 flex items-center gap-2 mb-4 select-none">
        <input
          type="checkbox"
          checked={align}
          onChange={(e) => setAlign(e.target.checked)}
        />
        Align Playback Position
      </label>

      {/* Voice rows */}
      <div className="space-y-3">
        {rows}
      </div>
    </ModuleCard>
  );
}

/* ------------------------------------------------------------------ */
/* Voice row subcomponent                                             */
/* ------------------------------------------------------------------ */
interface VoiceRowProps {
  index: number;
  cfg: VoiceConfig;
  onEnabled: (b: boolean) => void;
  onSemitones: (n: number) => void;
  onMix: (n: number) => void;
}

function VoiceRow({
  index,
  cfg,
  onEnabled,
  onSemitones,
  onMix,
}: VoiceRowProps) {

  const { enabled, semitones, mix } = cfg;

  const handleSemiRange = (e: React.ChangeEvent<HTMLInputElement>) =>
    onSemitones(Number(e.target.value));
  const handleSemiNum = (e: React.ChangeEvent<HTMLInputElement>) =>
    onSemitones(Number(e.target.value));
  const handleMix = (e: React.ChangeEvent<HTMLInputElement>) =>
    onMix(Number(e.target.value));

  return (
    <div className="p-2 rounded bg-black/40 border border-lime-500/20">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs opacity-80 flex items-center gap-2 select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabled(e.target.checked)}
          />
          V{index + 1}
        </label>
      </div>

      {/* Semitones */}
      <div className="mb-2">
        <label className="text-[11px] opacity-80 block mb-1">
          Semitones: <span className="font-mono opacity-100">{semitones}</span>
        </label>
        <input
          type="range"
          min={-24}
          max={24}
          step={1}
          value={semitones}
          onChange={handleSemiRange}
          className="w-full accent-lime-400"
        />
        <input
          type="number"
          min={-24}
          max={24}
          step={1}
          value={semitones}
          onChange={handleSemiNum}
          className="mt-1 w-16 bg-gray-700 text-xs p-1 rounded text-center"
        />
      </div>

      {/* Mix */}
      <div>
        <label className="text-[11px] opacity-80 block mb-1">
          Mix: <span className="font-mono opacity-100">{mix.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={mix}
          onChange={handleMix}
          className="w-full accent-lime-400"
        />
      </div>
    </div>
  );
}
