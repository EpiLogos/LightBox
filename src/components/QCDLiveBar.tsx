/**
 * Floating Live Tuning Bar for Quantum Chromodynamics (QCD)
 * Placed directly on the canvas for instant physics adjustments.
 */

import React from 'react';
import {
  Play,
  Pause,
  Flame,
  Sparkles,
  Zap,
  Activity,
  Layers,
  RotateCcw,
} from 'lucide-react';
import type { QCDPhysicsSettings, HadronCluster } from '../qcd/types.ts';
import { CRITICAL_TEMPERATURE_TC_MEV } from '../qcd/physics.ts';

interface QCDLiveBarProps {
  physicsSettings: QCDPhysicsSettings;
  onUpdatePhysics: (partial: Partial<QCDPhysicsSettings>) => void;
  hadronCluster: HadronCluster | null;
  onTriggerVacuumPair: () => void;
  onAutoBalanceSinglet: () => void;
}

export const QCDLiveBar: React.FC<QCDLiveBarProps> = ({
  physicsSettings,
  onUpdatePhysics,
  hadronCluster,
  onTriggerVacuumPair,
  onAutoBalanceSinglet,
}) => {
  const isQGP = physicsSettings.temperatureMeV >= CRITICAL_TEMPERATURE_TC_MEV;

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 bg-neutral-900/90 backdrop-blur-md px-3 sm:px-4 py-2 rounded-2xl border border-neutral-800 shadow-2xl select-none max-w-[95vw] overflow-x-auto"
      data-testid="qcd-live-bar"
    >
      {/* Dynamics Play / Pause */}
      <button
        onClick={() => onUpdatePhysics({ dynamicsRunning: !physicsSettings.dynamicsRunning })}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold cursor-pointer border transition-all shrink-0 ${
          physicsSettings.dynamicsRunning
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
        }`}
        title="Toggle real-time Cornell confinement attraction & orbits"
      >
        {physicsSettings.dynamicsRunning ? (
          <>
            <Pause className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dynamics</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 text-neutral-400" />
            <span>Paused</span>
          </>
        )}
      </button>

      <div className="w-px h-5 bg-neutral-800 shrink-0" />

      {/* String Tension Slider */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-mono text-neutral-400">
          σ: <span className="text-amber-400 font-bold">{physicsSettings.stringTensionGeVfm.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0.1}
          max={1.8}
          step={0.1}
          value={physicsSettings.stringTensionGeVfm}
          onChange={(e) => onUpdatePhysics({ stringTensionGeVfm: parseFloat(e.target.value) })}
          className="w-18 sm:w-24 accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
          title="String Tension sigma in GeV/fm"
        />
      </div>

      <div className="w-px h-5 bg-neutral-800 shrink-0" />

      {/* Temperature Slider with QGP Warning */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-mono flex items-center gap-1">
          <Flame className={`w-3.5 h-3.5 ${isQGP ? 'text-red-400 animate-pulse' : 'text-neutral-400'}`} />
          <span className={isQGP ? 'text-red-400 font-bold' : 'text-neutral-300'}>
            {physicsSettings.temperatureMeV}
          </span>
          <span className="text-[10px] text-neutral-400">MeV</span>
        </span>
        <input
          type="range"
          min={0}
          max={260}
          step={10}
          value={physicsSettings.temperatureMeV}
          onChange={(e) => onUpdatePhysics({ temperatureMeV: parseInt(e.target.value, 10) })}
          className={`w-18 sm:w-24 cursor-pointer h-1.5 rounded-lg ${
            isQGP ? 'accent-red-500 bg-red-950' : 'accent-neutral-400 bg-neutral-800'
          }`}
          title="QCD Temperature (Tc = 155 MeV triggers QGP deconfinement)"
        />
        {isQGP && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            QGP
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-neutral-800 shrink-0" />

      {/* Vacuum Fluctuation Trigger */}
      <button
        onClick={onTriggerVacuumPair}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 cursor-pointer text-xs font-mono shrink-0 transition-all"
        title="Spontaneously create a virtual quark-antiquark pair from the QCD vacuum"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline">Vacuum Pair</span>
      </button>

      {/* Singlet status badge */}
      {hadronCluster && (
        <button
          onClick={onAutoBalanceSinglet}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold border cursor-pointer shrink-0 transition-all ${
            hadronCluster.isColorSinglet
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
          }`}
          title={hadronCluster.isColorSinglet ? 'SU(3) Singlet Valid' : 'Click to Auto-Balance Color Singlet'}
        >
          {hadronCluster.isColorSinglet ? 'Singlet 1' : 'Balance SU(3)'}
        </button>
      )}
    </div>
  );
};
