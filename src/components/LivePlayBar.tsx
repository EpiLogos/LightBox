/**
 * Sleek Floating Live-Play & Optics Tuning Capsule
 * Gives instant access to Wide Beam Overlay, Smoke Haze, and Light Mood without covering the canvas
 */

import React, { useState } from 'react';
import { Sliders, Sparkles, Flame, Eye, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import type { PhysicsSettings, LightColorProfile, SimulationStats } from '../optics/types.ts';

interface LivePlayBarProps {
  physicsSettings: PhysicsSettings;
  onUpdatePhysics: (partial: Partial<PhysicsSettings>) => void;
  hazeDensity: number;
  setHazeDensity: (val: number) => void;
  stats: SimulationStats;
}

export const LivePlayBar: React.FC<LivePlayBarProps> = ({
  physicsSettings,
  onUpdatePhysics,
  hazeDensity,
  setHazeDensity,
  stats,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1.5 select-none pointer-events-auto">
      {/* Primary Floating Capsule Button */}
      <div className="flex items-center gap-1.5 bg-neutral-900/90 hover:bg-neutral-900 backdrop-blur-xl border border-neutral-800/90 rounded-2xl p-1 shadow-2xl transition-all">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-neutral-800/80 text-xs font-medium text-neutral-200 transition-colors cursor-pointer"
          title="Toggle Optics Live Controls"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-neutral-100">Live Play Tuning</span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          )}
        </button>

        {/* Quick summary badges */}
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 text-[11px] font-mono border-l border-neutral-800 text-neutral-400">
          <span className="text-amber-300 font-medium">
            Beam: {physicsSettings.beamOverlayWidth ?? 16}px
          </span>
          <span className="text-emerald-400 font-medium">
            Haze: {Math.round(hazeDensity * 100)}%
          </span>
        </div>
      </div>

      {/* Expanded Quick Tuning Drawer */}
      {expanded && (
        <div className="w-72 sm:w-80 bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-3.5 shadow-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 text-neutral-200">
          {/* Slider 1: Wide Beam Overlay (Golden & White Beams) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Wide Beam Overlay
              </span>
              <span className="font-mono text-amber-300 font-bold text-[11px]">
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
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] font-mono text-neutral-400">
              <button
                onClick={() => onUpdatePhysics({ beamOverlayWidth: 0 })}
                className="hover:text-amber-300 cursor-pointer"
              >
                Off (0px)
              </button>
              <button
                onClick={() => onUpdatePhysics({ beamOverlayWidth: 10 })}
                className="hover:text-amber-300 cursor-pointer"
              >
                10px
              </button>
              <button
                onClick={() => onUpdatePhysics({ beamOverlayWidth: 20 })}
                className="hover:text-amber-300 cursor-pointer"
              >
                20px
              </button>
              <button
                onClick={() => onUpdatePhysics({ beamOverlayWidth: 35 })}
                className="hover:text-amber-300 cursor-pointer"
              >
                35px (Volumetric)
              </button>
            </div>
          </div>

          {/* Slider 2: Atmospheric Smoke Chamber Haze */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Laser Smoke Haze
              </span>
              <span className="font-mono text-emerald-400 font-bold text-[11px]">
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
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Slider 3: Chromatic Dispersion Multiplier */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                Prism Dispersion
              </span>
              <span className="font-mono text-purple-400 font-bold text-[11px]">
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
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>

          {/* Real-time stats footer */}
          <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-sky-400" />
              <span>{stats.segmentCount} ray segments</span>
            </div>
            <span className="text-neutral-500">{stats.computeTimeMs}ms compute</span>
          </div>
        </div>
      )}
    </div>
  );
};
