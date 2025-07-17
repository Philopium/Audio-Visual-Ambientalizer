import React from 'react';
import { ModuleCard } from '../ui/DesignSystem';
import {
  SlidersHorizontal, // sostituisce Equalizer (non esiste in lucide)
  VolumeX,
  Play,
} from 'lucide-react';

interface Props {
  low: number;
  mid: number;
  high: number;
  volume: number;
  gateThresh: number;
  gateRelease: number;
  gateOpen: boolean;
  gateLevel: number;
  fadeDur: number;
  onLowChange: (n: number) => void;
  onMidChange: (n: number) => void;
  onHighChange: (n: number) => void;
  onVolumeChange: (n: number) => void;
  onGateThreshChange: (n: number) => void;
  onGateReleaseChange: (n: number) => void;
  onFadeDurChange: (n: number) => void;
  onFadeIn: () => void;
  onFadeOut: () => void;
  className?: string;
}

export function MasterEQ({
  low,
  mid,
  high,
  volume,
  gateThresh,
  gateRelease,
  gateOpen,
  gateLevel,
  fadeDur,
  onLowChange,
  onMidChange,
  onHighChange,
  onVolumeChange,
  onGateThreshChange,
  onGateReleaseChange,
  onFadeDurChange,
  onFadeIn,
  onFadeOut,
  className,
}: Props) {
  const handleLow = (e: React.ChangeEvent<HTMLInputElement>) =>
    onLowChange(Number(e.target.value));
  const handleMid = (e: React.ChangeEvent<HTMLInputElement>) =>
    onMidChange(Number(e.target.value));
  const handleHigh = (e: React.ChangeEvent<HTMLInputElement>) =>
    onHighChange(Number(e.target.value));
  const handleVol = (e: React.ChangeEvent<HTMLInputElement>) =>
    onVolumeChange(Number(e.target.value));
  const handleGateT = (e: React.ChangeEvent<HTMLInputElement>) =>
    onGateThreshChange(Number(e.target.value));
  const handleGateR = (e: React.ChangeEvent<HTMLInputElement>) =>
    onGateReleaseChange(Number(e.target.value));
  const handleFadeDur = (e: React.ChangeEvent<HTMLInputElement>) =>
    onFadeDurChange(Number(e.target.value));

  // Indicatore livello gate: mappa gateLevel (dB) su 0..1
  const gateNorm = (() => {
    const min = -100;
    const max = 0;
    const clamped = Math.max(min, Math.min(max, gateLevel));
    return (clamped - min) / (max - min);
  })();

  return (
    <ModuleCard
      title={
        <span className="inline-flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
          Master / EQ
        </span>
      }
      accent="master"
      className={className}
      titleSize="xl"          // Master più evidente
    >
      {/* --- EQ --- */}
      <div className="mb-4">
        <h4 className="text-xs uppercase opacity-70 mb-2">EQ</h4>

        {/* Low */}
        <div className="mb-2">
          <label className="text-xs opacity-80 block mb-1">
            Low: <span className="font-mono opacity-100">{low.toFixed(1)} dB</span>
          </label>
          <input
            type="range"
            min={-24}
            max={24}
            step={0.1}
            value={low}
            onChange={handleLow}
            className="w-full accent-amber-400"
          />
        </div>

        {/* Mid */}
        <div className="mb-2">
          <label className="text-xs opacity-80 block mb-1">
            Mid: <span className="font-mono opacity-100">{mid.toFixed(1)} dB</span>
          </label>
          <input
            type="range"
            min={-24}
            max={24}
            step={0.1}
            value={mid}
            onChange={handleMid}
            className="w-full accent-amber-400"
          />
        </div>

        {/* High */}
        <div className="mb-3">
          <label className="text-xs opacity-80 block mb-1">
            High: <span className="font-mono opacity-100">{high.toFixed(1)} dB</span>
          </label>
          <input
            type="range"
            min={-24}
            max={24}
            step={0.1}
            value={high}
            onChange={handleHigh}
            className="w-full accent-amber-400"
          />
        </div>
      </div>

      {/* --- MASTER VOLUME --- */}
      <div className="mb-4">
        <h4 className="text-xs uppercase opacity-70 mb-2">Master Volume</h4>
        <label className="text-xs opacity-80 block mb-1">
          {volume.toFixed(1)} dB
        </label>
        <input
          type="range"
          min={-60}
          max={0}
          step={0.1}
          value={volume}
          onChange={handleVol}
          className="w-full accent-amber-400"
        />
      </div>

      {/* --- GATE --- */}
      <div className="mb-4">
        <h4 className="text-xs uppercase opacity-70 mb-2">Noise Gate</h4>
        <label className="text-xs opacity-80 block mb-1">
          Threshold: <span className="font-mono opacity-100">{gateThresh.toFixed(0)} dB</span>
        </label>
        <input
          type="range"
          min={-100}
          max={0}
          step={1}
          value={gateThresh}
          onChange={handleGateT}
          className="w-full accent-amber-400 mb-2"
        />

        <label className="text-xs opacity-80 block mb-1">
          Release: <span className="font-mono opacity-100">{gateRelease.toFixed(2)}s</span>
        </label>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={gateRelease}
          onChange={handleGateR}
          className="w-full accent-amber-400 mb-2"
        />

        {/* Gate meter */}
        <div className="h-2 w-full bg-gray-700 rounded overflow-hidden mb-1">
          <div
            className={`h-full ${gateOpen ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${(gateNorm * 100).toFixed(1)}%` }}
          />
        </div>
        <div className="text-[10px] opacity-60 font-mono text-right">
          {gateLevel === -Infinity ? '-inf' : gateLevel.toFixed(1)} dB
        </div>
      </div>

      {/* --- FADE --- */}
      <div className="mb-2">
        <h4 className="text-xs uppercase opacity-70 mb-2">Fade</h4>
        <label className="text-xs opacity-80 block mb-1">
          Duration: <span className="font-mono opacity-100">{fadeDur.toFixed(1)}s</span>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={fadeDur}
          onChange={handleFadeDur}
          className="w-full accent-amber-400 mb-2"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onFadeIn}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-[11px]"
          >
            <Play className="w-3 h-3" />
            Fade In
          </button>
          <button
            type="button"
            onClick={onFadeOut}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-[11px]"
          >
            <VolumeX className="w-3 h-3" />
            Fade Out
          </button>
        </div>
      </div>
    </ModuleCard>
  );
}
