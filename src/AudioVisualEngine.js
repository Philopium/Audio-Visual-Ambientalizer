import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  Zap, 
  Layers, 
  Clock, 
  RotateCcw, 
  Upload, 
  Download,
  Grid3x3,
  Sliders,
  Waves,
  Activity,
  Square,
  ChevronUp,
  ChevronDown,
  Power,
  Mic,
  Save
} from 'lucide-react';

// Design System Components
const Card = ({ children, className = '', ...props }) => (
  <div 
    className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-gray-700 shadow-lg backdrop-blur-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 flex items-center gap-2 justify-center';
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600',
    accent: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Knob = ({ value, min = 0, max = 100, step = 1, onChange, label, size = 'md', color = 'blue' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef(null);
  
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };
  
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    emerald: 'from-emerald-500 to-emerald-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600'
  };
  
  const normalizedValue = ((value - min) / (max - min)) * 270 - 135;
  
  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };
  
  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !knobRef.current) return;
    
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const degrees = (angle * 180) / Math.PI + 90;
    const normalizedAngle = ((degrees + 135) % 360) - 135;
    const clampedAngle = Math.max(-135, Math.min(135, normalizedAngle));
    
    const newValue = min + ((clampedAngle + 135) / 270) * (max - min);
    onChange(Math.round(newValue / step) * step);
  }, [isDragging, min, max, step, onChange]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        ref={knobRef}
        className={`${sizes[size]} relative cursor-pointer select-none`}
        onMouseDown={handleMouseDown}
      >
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${colors[color]} shadow-lg border-2 border-gray-600 hover:border-gray-500 transition-all duration-200`}>
          <div className="absolute inset-2 rounded-full bg-gray-900 shadow-inner">
            <div 
              className="absolute top-1 left-1/2 w-0.5 h-3 bg-white rounded-full transform -translate-x-1/2 origin-bottom transition-transform duration-150"
              style={{ transform: `translate(-50%, 0) rotate(${normalizedValue}deg)` }}
            />
          </div>
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
      </div>
      {label && (
        <div className="text-center">
          <div className="text-xs text-gray-400 font-medium">{label}</div>
          <div className="text-xs text-gray-300">{value}</div>
        </div>
      )}
    </div>
  );
};

const Slider = ({ value, min = 0, max = 100, step = 1, onChange, label, vertical = false, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  };
  
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`flex ${vertical ? 'flex-col h-32' : 'flex-row'} items-center gap-3`}>
      {!vertical && label && (
        <div className="text-xs text-gray-400 font-medium min-w-fit">{label}</div>
      )}
      <div className={`relative ${vertical ? 'w-2 flex-1' : 'flex-1 h-2'} bg-gray-700 rounded-full`}>
        <div 
          className={`absolute ${colors[color]} rounded-full transition-all duration-150 ${vertical ? 'bottom-0 left-0 right-0' : 'top-0 left-0 bottom-0'}`}
          style={vertical ? { height: `${percentage}%` } : { width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`absolute inset-0 opacity-0 cursor-pointer ${vertical ? 'slider-vertical' : ''}`}
        />
        <div 
          className={`absolute w-4 h-4 ${colors[color]} rounded-full border-2 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150`}
          style={vertical ? 
            { left: '50%', bottom: `${percentage}%`, transform: 'translate(-50%, 50%)' } : 
            { top: '50%', left: `${percentage}%` }
          }
        />
      </div>
      {vertical && label && (
        <div className="text-xs text-gray-400 font-medium text-center">{label}</div>
      )}
      {!vertical && (
        <div className="text-xs text-gray-300 min-w-fit">{value}</div>
      )}
    </div>
  );
};

const ModuleCard = ({ title, icon: Icon, children, className = '' }) => (
  <Card className={`p-4 mb-4 ${className}`}>
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
      <Icon className="w-4 h-4 text-blue-400" />
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </Card>
);

const EffectModule = ({ title, icon: Icon, order, maxOrder, onOrderChange, children }) => (
  <Card className="p-4 mb-3 hover:border-blue-500/50 transition-all duration-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onOrderChange(Math.max(1, order - 1))}
          className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          disabled={order <= 1}
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <span className="text-xs text-gray-400 px-2">{order}</span>
        <button 
          onClick={() => onOrderChange(Math.min(maxOrder, order + 1))}
          className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          disabled={order >= maxOrder}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </Card>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
        checked ? 'bg-blue-500' : 'bg-gray-600'
      }`}>
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
          checked ? 'transform translate-x-4' : ''
        }`} />
      </div>
    </div>
    <span className="text-sm text-gray-300">{label}</span>
  </label>
);

const VUMeter = ({ level, label }) => {
  const normalizedLevel = Math.max(0, Math.min(100, (level + 60) / 60 * 100));
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 min-w-fit">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
          style={{ width: `${normalizedLevel}%` }}
        />
      </div>
      <span className="text-xs text-gray-300 min-w-fit">{Math.round(level)}dB</span>
    </div>
  );
};

// Mock components for missing imports
const UnlockOverlay = ({ visible, onClick }) => visible ? (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
    <Button onClick={onClick} size="lg" className="animate-pulse">
      <Play className="w-5 h-5" />
      Start Audio Engine
    </Button>
  </div>
) : null;

const RecordControls = ({ canvasRef, getAudioStream }) => (
  <ModuleCard title="Recording" icon={Mic}>
    <div className="flex gap-2">
      <Button variant="danger" size="sm">
        <Mic className="w-3 h-3" />
        Record
      </Button>
      <Button variant="secondary" size="sm">
        <Save className="w-3 h-3" />
        Save
      </Button>
    </div>
  </ModuleCard>
);

const OfflineRenderControls = ({ renderFrame, getAudioStream }) => (
  <ModuleCard title="Render" icon={Download}>
    <Button variant="accent" size="sm">
      <Download className="w-3 h-3" />
      Export
    </Button>
  </ModuleCard>
);

// Main App Component
export default function App() {
  // State management (keeping your original state structure)
  const [unlocked, setUnlocked] = useState(true); // Set to true for demo
  
  // LFO
  const [lfoRate, setLfoRate] = useState(0.2);
  const [lfoDepth, setLfoDepth] = useState(0);
  const [lfoTarget, setLfoTarget] = useState('none');
  
  // Microloop
  const [microIntensity, setMicroIntensity] = useState(0);
  const [microStepMs, setMicroStepMs] = useState(250);
  
  // Effects
  const [ringFreq, setRingFreq] = useState(440);
  const [ringMix, setRingMix] = useState(0);
  const [ringWave, setRingWave] = useState('sine');
  
  const [pixScale, setPixScale] = useState(4);
  const [pixMix, setPixMix] = useState(0);
  
  const [delayTime, setDelayTime] = useState(0.2);
  const [delayMix, setDelayMix] = useState(0);
  
  const [feedbackAmt, setFeedbackAmt] = useState(0);
  
  // Post effects
  const [edgeAmt, setEdgeAmt] = useState(0);
  const [posterLevels, setPosterLevels] = useState(0);
  
  // Global
  const [globalContrast, setGlobalContrast] = useState(1);
  const [globalGamma, setGlobalGamma] = useState(1);
  
  // Master
  const [low, setLow] = useState(0);
  const [mid, setMid] = useState(0);
  const [high, setHigh] = useState(0);
  const [volume, setVolume] = useState(-20);
  const [gateLevel, setGateLevel] = useState(-40);
  const [gateOpen, setGateOpen] = useState(false);
  
  // Harmonizer
  const [harmoEnabled, setHarmoEnabled] = useState(false);
  const [harmoVoices, setHarmoVoices] = useState([
    { enabled: false, semitones: 7, mix: 0.2 },
    { enabled: false, semitones: 12, mix: 0.2 },
    { enabled: false, semitones: -12, mix: 0.2 }
  ]);
  
  const [baseLocked, setBaseLocked] = useState(true);
  
  const handleUnlock = () => setUnlocked(true);
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File uploaded:', file.name);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <UnlockOverlay visible={!unlocked} onClick={handleUnlock} />
      
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Audio Visual Engine
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${gateOpen ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-xs text-gray-400">
              {gateOpen ? 'Active' : 'Gated'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Modulation & Controls */}
        <div className="w-80 border-r border-gray-700 bg-gray-900/30 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* LFO Module */}
            <ModuleCard title="LFO Modulation" icon={Activity}>
              <div className="grid grid-cols-2 gap-4">
                <Knob
                  value={lfoRate}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onChange={setLfoRate}
                  label="Rate"
                  color="purple"
                />
                <Knob
                  value={lfoDepth}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setLfoDepth}
                  label="Depth"
                  color="blue"
                />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">Target</label>
                <select 
                  value={lfoTarget}
                  onChange={(e) => setLfoTarget(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="none">None</option>
                  <option value="ringFreq">Ring Frequency</option>
                  <option value="pixelate">Pixelate</option>
                  <option value="delay">Delay</option>
                  <option value="feedback">Feedback</option>
                  <option value="masterVol">Master Volume</option>
                </select>
              </div>
            </ModuleCard>
            
            {/* Micro Loop */}
            <ModuleCard title="Micro Loop" icon={RotateCcw}>
              <Slider
                value={microIntensity}
                min={0}
                max={1}
                step={0.01}
                onChange={setMicroIntensity}
                label="Intensity"
                color="emerald"
              />
              <Slider
                value={microStepMs}
                min={50}
                max={1000}
                step={10}
                onChange={setMicroStepMs}
                label="Step (ms)"
                color="orange"
              />
            </ModuleCard>
            
            {/* File Controls */}
            <ModuleCard title="Source" icon={Upload}>
              <div className="space-y-3">
                <Toggle
                  checked={baseLocked}
                  onChange={(e) => setBaseLocked(e.target.checked)}
                  label="Base Locked"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Upload className="w-3 h-3" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    Upload Image
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Grid3x3 className="w-3 h-3" />
                    Squares
                  </Button>
                </div>
              </div>
            </ModuleCard>
            
            {/* Recording & Render */}
            <RecordControls />
            <OfflineRenderControls />
            
          </div>
        </div>
        
        {/* Center - Canvas */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          <div className="relative">
            <canvas
              width={512}
              height={512}
              className="border border-gray-600 rounded-lg shadow-2xl bg-gray-900"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400">Live Preview</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Effects Chain */}
        <div className="w-80 border-l border-gray-700 bg-gray-900/30 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-4">
            
            {/* Harmonizer */}
            <ModuleCard title="Harmonizer" icon={Layers}>
              <Toggle
                checked={harmoEnabled}
                onChange={(e) => setHarmoEnabled(e.target.checked)}
                label="Enable Harmonizer"
              />
              {harmoEnabled && (
                <div className="space-y-2 mt-3">
                  {harmoVoices.map((voice, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg">
                      <Toggle
                        checked={voice.enabled}
                        onChange={(e) => {
                          const newVoices = [...harmoVoices];
                          newVoices[i] = { ...voice, enabled: e.target.checked };
                          setHarmoVoices(newVoices);
                        }}
                        label={`Voice ${i + 1}`}
                      />
                      <Slider
                        value={voice.mix}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(val) => {
                          const newVoices = [...harmoVoices];
                          newVoices[i] = { ...voice, mix: val };
                          setHarmoVoices(newVoices);
                        }}
                        label="Mix"
                        color="pink"
                      />
                    </div>
                  ))}
                </div>
              )}
            </ModuleCard>
            
            {/* Effects Chain Header */}
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              Effects Chain
            </div>
            
            {/* Ring Modulator */}
            <EffectModule title="Ring Modulator" icon={Zap} order={1} maxOrder={4} onOrderChange={() => {}}>
              <div className="grid grid-cols-2 gap-4">
                <Knob
                  value={ringFreq}
                  min={20}
                  max={2000}
                  step={1}
                  onChange={setRingFreq}
                  label="Frequency"
                  color="orange"
                />
                <Knob
                  value={ringMix}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setRingMix}
                  label="Mix"
                  color="purple"
                />
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-1">Waveform</label>
                <select 
                  value={ringWave}
                  onChange={(e) => setRingWave(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="sine">Sine</option>
                  <option value="square">Square</option>
                  <option value="sawtooth">Sawtooth</option>
                  <option value="triangle">Triangle</option>
                </select>
              </div>
            </EffectModule>
            
            {/* Pixelate */}
            <EffectModule title="Pixelate" icon={Square} order={2} maxOrder={4} onOrderChange={() => {}}>
              <Slider
                value={pixScale}
                min={1}
                max={128}
                step={1}
                onChange={setPixScale}
                label="Scale"
                color="blue"
              />
              <Slider
                value={pixMix}
                min={0}
                max={1}
                step={0.01}
                onChange={setPixMix}
                label="Mix"
                color="purple"
              />
            </EffectModule>
            
            {/* Delay */}
            <EffectModule title="Delay" icon={Clock} order={3} maxOrder={4} onOrderChange={() => {}}>
              <Knob
                value={delayTime}
                min={0}
                max={1}
                step={0.01}
                onChange={setDelayTime}
                label="Time"
                color="emerald"
              />
              <Slider
                value={delayMix}
                min={0}
                max={1}
                step={0.01}
                onChange={setDelayMix}
                label="Mix"
                color="purple"
              />
            </EffectModule>
            
            {/* Feedback */}
            <EffectModule title="Feedback" icon={RotateCcw} order={4} maxOrder={4} onOrderChange={() => {}}>
              <Knob
                value={feedbackAmt}
                min={0}
                max={1}
                step={0.01}
                onChange={setFeedbackAmt}
                label="Amount"
                color="pink"
                size="lg"
              />
            </EffectModule>
            
            {/* Master EQ */}
            <ModuleCard title="Master EQ" icon={Volume2}>
              <div className="flex justify-center gap-6">
                <Slider
                  value={low}
                  min={-20}
                  max={20}
                  step={0.1}
                  onChange={setLow}
                  label="Low"
                  vertical
                  color="blue"
                />
                <Slider
                  value={mid}
                  min={-20}
                  max={20}
                  step={0.1}
                  onChange={setMid}
                  label="Mid"
                  vertical
                  color="emerald"
                />
                <Slider
                  value={high}
                  min={-20}
                  max={20}
                  step={0.1}
                  onChange={setHigh}
                  label="High"
                  vertical
                  color="orange"
                />
              </div>
              <div className="mt-4 space-y-2">
                <VUMeter level={gateLevel} label="Gate" />
                <Slider
                  value={volume}
                  min={-60}
                  max={0}
                  step={0.1}
                  onChange={setVolume}
                  label="Master"
                  color="purple"
                />
              </div>
            </ModuleCard>
            
          </div>
        </div>
      </div>
    </div>
  );
}