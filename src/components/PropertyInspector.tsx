/**
 * Comprehensive Side Inspector Panel for Optical Properties & Physics Simulation Settings
 */

import React, { useState } from 'react';
import {
  Trash2,
  Copy,
  Compass,
  Sliders,
  Settings,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Atom,
  Eye,
  Gauge,
  Flame,
  Info,
  X,
} from 'lucide-react';
import type { OpticalElement, SimulationStats, PhysicsSettings, LightColorProfile } from '../optics/types.ts';
import { wavelengthToRGB } from '../optics/math.ts';

interface PropertyInspectorProps {
  selectedElement: OpticalElement | null;
  onUpdateElement: (updated: OpticalElement) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  hazeDensity: number;
  setHazeDensity: (val: number) => void;
  physicsSettings: PhysicsSettings;
  onUpdatePhysics: (settings: Partial<PhysicsSettings>) => void;
  stats: SimulationStats;
  onClose?: () => void;
}

const MATERIAL_PRESETS = [
  { name: 'Water', n: 1.333, B: 0.004 },
  { name: 'Acrylic', n: 1.491, B: 0.008 },
  { name: 'Crown Glass', n: 1.517, B: 0.012 },
  { name: 'Flint Glass', n: 1.650, B: 0.026 },
  { name: 'Diamond', n: 2.417, B: 0.045 },
];

const AMBIENT_PRESETS = [
  { name: 'Air / Vacuum', n: 1.000 },
  { name: 'Water Tank', n: 1.333 },
  { name: 'Mineral Oil', n: 1.470 },
];

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  hazeDensity,
  setHazeDensity,
  physicsSettings,
  onUpdatePhysics,
  stats,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'diagnostics'>('physics');

  if (!selectedElement) {
    return (
      <aside
        aria-label="Scene Properties Inspector"
        className="w-80 bg-neutral-900/90 backdrop-blur-md border-l border-neutral-800 flex flex-col h-full z-10 shrink-0 text-neutral-200"
      >
        {/* Header with Navigation Tabs */}
        <div className="p-3 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Atom className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                Physics Simulation Engine
              </h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close Settings"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveTab('physics')}
              className={`py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'physics'
                  ? 'bg-neutral-800 text-emerald-400 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Optics Physics
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'diagnostics'
                  ? 'bg-neutral-800 text-sky-400 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Telemetry HUD
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'physics' ? (
            <>
              {/* Global Light Profile (Golden vs White vs Monochromatic) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Light Emission Profile
                  </label>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300">
                    {physicsSettings.lightProfile}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => onUpdatePhysics({ lightProfile: 'golden' })}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      physicsSettings.lightProfile === 'golden'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-200 shadow-xs'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-sm" />
                      Warm Golden
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">3000K Optics Lab</div>
                  </button>
                  <button
                    onClick={() => onUpdatePhysics({ lightProfile: 'white' })}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      physicsSettings.lightProfile === 'white'
                        ? 'border-sky-400 bg-sky-400/10 text-white shadow-xs'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                      Pure White
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">6500K Xenon Arc</div>
                  </button>
                  <button
                    onClick={() => onUpdatePhysics({ lightProfile: 'green' })}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      physicsSettings.lightProfile === 'green'
                        ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 shadow-xs'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                      Emerald Laser
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">532nm DPSS</div>
                  </button>
                  <button
                    onClick={() => onUpdatePhysics({ lightProfile: 'cyan' })}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      physicsSettings.lightProfile === 'cyan'
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-xs'
                        : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm" />
                      Cyan Argon
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">488nm Gas</div>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Golden & White profiles emit continuous spectral bundles that appear as luminous white/gold beams and disperse into vivid rainbow spectra when entering prisms & lenses.
                </p>
              </div>

              {/* Extra Wide Beam Overlay Slider (White & Golden Rays) */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Wide Beam Overlay Width
                  </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {physicsSettings.beamOverlayWidth ?? 16} px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="1"
                  value={physicsSettings.beamOverlayWidth ?? 16}
                  onChange={(e) =>
                    onUpdatePhysics({ beamOverlayWidth: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                  {[
                    { label: 'Off', val: 0 },
                    { label: '8px', val: 8 },
                    { label: '18px', val: 18 },
                    { label: '32px', val: 32 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onUpdatePhysics({ beamOverlayWidth: p.val })}
                      className={`py-1 rounded border transition-colors cursor-pointer ${
                        physicsSettings.beamOverlayWidth === p.val
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Volumetric luminous halo shaft layered over white and warm golden laser beams, replicating cylindrical lens expansion.
                </p>
              </div>

              {/* Chromatic Dispersion Engine */}
              <div className="space-y-3 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Dispersion Multiplier
                  </span>
                  <span className="font-mono text-purple-400 font-bold">
                    {physicsSettings.dispersionMultiplier.toFixed(1)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="4.0"
                  step="0.2"
                  value={physicsSettings.dispersionMultiplier}
                  onChange={(e) =>
                    onUpdatePhysics({ dispersionMultiplier: parseFloat(e.target.value) })
                  }
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                  {[
                    { label: 'Off', val: 0.0 },
                    { label: '1.0×', val: 1.0 },
                    { label: '2.0×', val: 2.0 },
                    { label: '3.5×', val: 3.5 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onUpdatePhysics({ dispersionMultiplier: p.val })}
                      className={`py-1 rounded border transition-colors cursor-pointer ${
                        physicsSettings.dispersionMultiplier === p.val
                          ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spectral Ray Density */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                  Spectral Ray Precision
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                  {[
                    { id: 'fast', label: '5 Bands', desc: 'Fast' },
                    { id: 'balanced', label: '9 Bands', desc: 'Standard' },
                    { id: 'ultra', label: '13 Bands', desc: 'Dense' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => onUpdatePhysics({ spectralQuality: q.id as any })}
                      className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                        physicsSettings.spectralQuality === q.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">{q.label}</div>
                      <div className="text-[9px] text-neutral-400">{q.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ambient Medium Index */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider">
                    Ambient Medium (n₀)
                  </span>
                  <span className="font-mono text-sky-400">
                    {physicsSettings.ambientMediumIndex.toFixed(3)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {AMBIENT_PRESETS.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => onUpdatePhysics({ ambientMediumIndex: m.n })}
                      className={`p-1.5 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                        Math.abs(physicsSettings.ambientMediumIndex - m.n) < 0.01
                          ? 'border-sky-500 bg-sky-500/15 text-sky-200'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-medium truncate">{m.name}</div>
                      <div className="text-[10px] font-mono text-neutral-400">n={m.n}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fresnel Partial Dielectric Reflections */}
              <div className="space-y-2.5 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Fresnel Partial Reflections
                  </label>
                  <input
                    type="checkbox"
                    checked={physicsSettings.fresnelSplitting}
                    onChange={(e) => onUpdatePhysics({ fresnelSplitting: e.target.checked })}
                    className="accent-sky-500 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Splits incoming rays into transmitted beams and partial Fresnel surface reflection glints.
                </p>
              </div>

              {/* Atmosphere / Laser Smoke Haze */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Laser Smoke Chamber Haze
                  </span>
                  <span className="font-mono text-emerald-400">
                    {Math.round(hazeDensity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={hazeDensity}
                  onChange={(e) => setHazeDensity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Ray Tracing Limits */}
              <div className="space-y-2 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-300 uppercase tracking-wider">
                    Max Ray Bounces
                  </span>
                  <span className="font-mono text-sky-400">{physicsSettings.maxBounces}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  value={physicsSettings.maxBounces}
                  onChange={(e) => onUpdatePhysics({ maxBounces: parseInt(e.target.value, 10) })}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </>
          ) : (
            /* Telemetry & Optical Diagnostics HUD */
            <div className="space-y-4">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-sky-400" />
                Live Optical Engine State
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Primary Rays</div>
                  <div className="text-emerald-400 font-bold text-base mt-0.5">{stats.rayCount}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Ray Segments</div>
                  <div className="text-sky-400 font-bold text-base mt-0.5">{stats.segmentCount}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">TIR Bounces</div>
                  <div className="text-amber-400 font-bold text-base mt-0.5">{stats.tirCount || 0}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Refractions</div>
                  <div className="text-purple-400 font-bold text-base mt-0.5">{stats.refractionCount || 0}</div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 col-span-2">
                  <div className="text-[10px] text-neutral-400 uppercase">Traversed Path Distance</div>
                  <div className="text-neutral-200 font-bold text-sm mt-0.5">
                    {stats.totalLengthMeters || 0} meters (scaled)
                  </div>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 col-span-2">
                  <div className="text-[10px] text-neutral-400 uppercase">Computation Solve Time</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5 flex items-center justify-between">
                    <span>{stats.computeTimeMs} ms</span>
                    <span className="text-[10px] text-neutral-400 font-sans font-normal">60 FPS Real-Time</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-neutral-800/80 bg-neutral-950/40 text-[11px] text-neutral-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  All calculations solve Snell's Law and Fresnel equations in real time via analytical 2D geometry intersections.
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  }

  const el = selectedElement;

  return (
    <aside
      aria-label="Element Properties Inspector"
      className="w-80 bg-neutral-900/90 backdrop-blur-md border-l border-neutral-800 flex flex-col h-full z-10 shrink-0 text-neutral-200"
    >
      {/* Element Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white truncate max-w-[180px]">
            {el.name || el.type}
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono">
            {el.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateElement(el.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Duplicate Element"
            aria-label="Duplicate Element"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteElement(el.id)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Delete Element"
            aria-label="Delete Element"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
              title="Close Properties Panel"
              aria-label="Close Properties Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Transform: Position & Rotation */}
        <div className="space-y-3">
          <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            Position & Orientation
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Position X (px)</label>
              <input
                type="number"
                value={Math.round(el.x)}
                onChange={(e) => onUpdateElement({ ...el, x: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Position Y (px)</label>
              <input
                type="number"
                value={Math.round(el.y)}
                onChange={(e) => onUpdateElement({ ...el, y: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 font-mono text-neutral-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[10px] text-neutral-400">Rotation Angle</span>
              <span className="font-mono text-sky-400 text-xs">{Math.round(el.rotation)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={((Math.round(el.rotation) % 360) + 360) % 360}
              onChange={(e) => onUpdateElement({ ...el, rotation: parseInt(e.target.value, 10) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <div className="flex gap-1.5 mt-2">
              {[0, 45, 90, 135, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() => onUpdateElement({ ...el, rotation: deg })}
                  className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 hover:border-neutral-700 cursor-pointer"
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Laser Emitters */}
        {'wavelength' in el && (
          <div className="space-y-4 pt-3 border-t border-neutral-800">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Light Color Mode</span>
              <span className="font-mono text-emerald-400 text-xs">
                {el.colorMode || 'profile'}
              </span>
            </div>

            {/* Color Mode Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  onUpdateElement({
                    ...el,
                    colorMode: 'golden',
                    color: '#fff1aa',
                  })
                }
                className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                  el.colorMode === 'golden'
                    ? 'border-amber-400 bg-amber-400/15 text-amber-200'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="font-semibold flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  Warm Golden
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Rainbow refractions</div>
              </button>

              <button
                onClick={() =>
                  onUpdateElement({
                    ...el,
                    colorMode: 'white',
                    color: '#ffffff',
                  })
                }
                className={`p-2 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                  el.colorMode === 'white'
                    ? 'border-sky-400 bg-sky-400/15 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="font-semibold flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  Pure White
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Full spectral rainbow</div>
              </button>
            </div>

            {/* Quick Beam Overlay Slider for White / Golden Emitters */}
            <div className="pt-2 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-amber-400" />
                  Wide Beam Overlay Width
                </span>
                <span className="font-mono text-amber-400 font-semibold">{physicsSettings.beamOverlayWidth ?? 16} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={physicsSettings.beamOverlayWidth ?? 16}
                onChange={(e) => onUpdatePhysics({ beamOverlayWidth: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Custom Wavelength if monochrome */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[10px] text-neutral-400">Monochromatic Wavelength</span>
                <span className="font-mono text-emerald-400">{el.wavelength} nm</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg border border-neutral-700 shrink-0 shadow-md"
                  style={{ backgroundColor: el.color || wavelengthToRGB(el.wavelength).hex }}
                />
                <input
                  type="range"
                  min="380"
                  max="750"
                  value={el.wavelength}
                  onChange={(e) => {
                    const wl = parseInt(e.target.value, 10);
                    const rgb = wavelengthToRGB(wl);
                    onUpdateElement({
                      ...el,
                      wavelength: wl,
                      color: rgb.hex,
                      colorMode: 'monochrome',
                    });
                  }}
                  className="w-full cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            {/* Ray Array Count */}
            {'rayCount' in el && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[10px] text-neutral-400">Ray Density / Count</span>
                  <span className="font-mono text-sky-400 text-xs">{el.rayCount}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="120"
                  step="2"
                  value={el.rayCount}
                  onChange={(e) =>
                    onUpdateElement({ ...el, rayCount: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Refractive Optics (Lenses, Prisms, Blocks) */}
        {'refractiveIndex' in el && (
          <div className="space-y-4 pt-3 border-t border-neutral-800">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
              <span>Refractive Index (n)</span>
              <span className="font-mono text-emerald-400">{el.refractiveIndex.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.42"
              step="0.005"
              value={el.refractiveIndex}
              onChange={(e) =>
                onUpdateElement({ ...el, refractiveIndex: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />

            {/* Quick Material Presets */}
            <div>
              <span className="text-[10px] text-neutral-400 block mb-1.5">Material Presets:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {MATERIAL_PRESETS.map((mat) => (
                  <button
                    key={mat.name}
                    onClick={() =>
                      onUpdateElement({
                        ...el,
                        refractiveIndex: mat.n,
                        dispersion: mat.B,
                      })
                    }
                    className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:border-emerald-500 text-left text-[11px] cursor-pointer"
                  >
                    <div className="text-neutral-200 font-medium">{mat.name}</div>
                    <div className="text-neutral-400 font-mono text-[10px]">n = {mat.n}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chromatic Dispersion Cauchy Coefficient */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[10px] text-neutral-400">Chromatic Dispersion (B)</span>
                <span className="font-mono text-purple-400 text-xs">
                  {el.dispersion.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.06"
                step="0.002"
                value={el.dispersion}
                onChange={(e) =>
                  onUpdateElement({ ...el, dispersion: parseFloat(e.target.value) })
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex gap-1 mt-1.5">
                {[
                  { label: 'None', B: 0 },
                  { label: 'Crown', B: 0.012 },
                  { label: 'Flint', B: 0.026 },
                  { label: 'Rainbow', B: 0.045 },
                ].map((b) => (
                  <button
                    key={b.label}
                    onClick={() => onUpdateElement({ ...el, dispersion: b.B })}
                    className="flex-1 py-1 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 hover:border-purple-500 cursor-pointer"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mirrors & Standard Single-Curvature Lenses */}
        {'curvatureRadius' in el && (
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400">Curvature Radius</span>
              <span className="font-mono text-sky-400 text-xs">{Math.round(el.curvatureRadius)} px</span>
            </div>
            <input
              type="range"
              min="40"
              max="400"
              value={el.curvatureRadius}
              onChange={(e) =>
                onUpdateElement({ ...el, curvatureRadius: parseInt(e.target.value, 10) })
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        )}

        {/* Meniscus Dual Curvatures */}
        {('curvatureRadius1' in el && 'curvatureRadius2' in el) && (
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Meniscus Curvatures
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] text-neutral-400">Front Surface R1</span>
                <span className="font-mono text-emerald-400">{Math.round(el.curvatureRadius1)} px</span>
              </div>
              <input
                type="range"
                min="50"
                max="350"
                value={el.curvatureRadius1}
                onChange={(e) =>
                  onUpdateElement({ ...el, curvatureRadius1: parseInt(e.target.value, 10) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] text-neutral-400">Back Surface R2</span>
                <span className="font-mono text-sky-400">{Math.round(el.curvatureRadius2)} px</span>
              </div>
              <input
                type="range"
                min="60"
                max="450"
                value={el.curvatureRadius2}
                onChange={(e) =>
                  onUpdateElement({ ...el, curvatureRadius2: parseInt(e.target.value, 10) })
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Achromatic Doublet Dual Glass Controls */}
        {el.type === 'achromatic-doublet-lens' && (
          <div className="space-y-4 pt-3 border-t border-neutral-800">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              Achromatic Doublet Optics
            </div>
            {/* Crown Glass */}
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-sky-500/30 space-y-2">
              <div className="text-xs font-semibold text-sky-400 flex items-center justify-between">
                <span>Crown Glass (Element 1)</span>
                <span className="font-mono text-[10px]">n={el.refractiveIndexCrown.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="1.3"
                max="1.8"
                step="0.005"
                value={el.refractiveIndexCrown}
                onChange={(e) =>
                  onUpdateElement({ ...el, refractiveIndexCrown: parseFloat(e.target.value) })
                }
                className="w-full accent-sky-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>Dispersion B: {el.dispersionCrown.toFixed(4)}</span>
                <button
                  onClick={() => onUpdateElement({ ...el, refractiveIndexCrown: 1.5168, dispersionCrown: 0.0042 })}
                  className="text-sky-400 hover:underline cursor-pointer"
                >
                  N-BK7 Preset
                </button>
              </div>
            </div>

            {/* Flint Glass */}
            <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-amber-500/30 space-y-2">
              <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                <span>Flint Glass (Element 2)</span>
                <span className="font-mono text-[10px]">n={el.refractiveIndexFlint.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="1.4"
                max="2.1"
                step="0.005"
                value={el.refractiveIndexFlint}
                onChange={(e) =>
                  onUpdateElement({ ...el, refractiveIndexFlint: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-400 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>Dispersion B: {el.dispersionFlint.toFixed(4)}</span>
                <button
                  onClick={() => onUpdateElement({ ...el, refractiveIndexFlint: 1.6727, dispersionFlint: 0.0165 })}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  N-SF11 Preset
                </button>
              </div>
            </div>

            {/* Cemented Interface Curvature */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] text-neutral-400">Cemented Seam Radius R2</span>
                <span className="font-mono text-purple-400">{Math.round(el.curvatureRadiusInterface)} px</span>
              </div>
              <input
                type="range"
                min="40"
                max="250"
                value={el.curvatureRadiusInterface}
                onChange={(e) =>
                  onUpdateElement({ ...el, curvatureRadiusInterface: parseInt(e.target.value, 10) })
                }
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Aspheric Parabolic Conic Controls */}
        {el.type === 'aspheric-lens' && (
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Aspheric Profile
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[10px] text-neutral-400">Apex Curvature Radius</span>
                <span className="font-mono text-indigo-400">{Math.round(el.apexCurvatureRadius)} px</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                value={el.apexCurvatureRadius}
                onChange={(e) =>
                  onUpdateElement({ ...el, apexCurvatureRadius: parseInt(e.target.value, 10) })
                }
                className="w-full accent-indigo-400 cursor-pointer"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
              Conic Constant: <span className="font-mono text-indigo-300 font-bold">k = -1.0 (True Paraboloid)</span>
              <p className="mt-1 text-[10px] text-neutral-400">
                Parabolic curvature mathematically eliminates spherical aberration, focusing all parallel rays to a single point.
              </p>
            </div>
          </div>
        )}

        {/* Porro Prism Leg Length */}
        {el.type === 'right-angle-prism' && (
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400">Leg Length</span>
              <span className="font-mono text-sky-400">{Math.round(el.legLength)} px</span>
            </div>
            <input
              type="range"
              min="50"
              max="220"
              value={el.legLength}
              onChange={(e) =>
                onUpdateElement({ ...el, legLength: parseInt(e.target.value, 10) })
              }
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        )}

        {/* Dove Prism Geometry */}
        {el.type === 'dove-prism' && (
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-neutral-400">Base Length</span>
              <span className="font-mono text-purple-400">{Math.round(el.baseLength)} px</span>
            </div>
            <input
              type="range"
              min="80"
              max="260"
              value={el.baseLength}
              onChange={(e) =>
                onUpdateElement({ ...el, baseLength: parseInt(e.target.value, 10) })
              }
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
