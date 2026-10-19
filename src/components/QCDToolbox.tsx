/**
 * Quantum Chromodynamics (QCD) Toolbox & Particle Spawner
 * Spawns Standard Model quarks, antiquarks, and pre-configured SU(3) color singlet hadrons.
 */

import React, { useState } from 'react';
import {
  Atom,
  Sparkles,
  Plus,
  ShieldCheck,
  Zap,
  Trash2,
  RotateCcw,
  Layers,
  Flame,
  X,
} from 'lucide-react';
import type { Quark, QuarkFlavor, QuarkColor } from '../qcd/types.ts';
import { QUARK_PROPERTIES, getQuarkColorHex, getAnticolor } from '../qcd/physics.ts';

interface QCDToolboxProps {
  onAddQuark: (quark: Quark) => void;
  onAddHadronTemplate: (quarks: Quark[]) => void;
  onClearQuarks: () => void;
  onResetPreset: () => void;
  onTriggerVacuumPair: () => void;
  onClose?: () => void;
}

const FLAVORS: QuarkFlavor[] = ['up', 'down', 'strange', 'charm', 'bottom', 'top'];
const COLORS: QuarkColor[] = ['red', 'green', 'blue', 'antired', 'antigreen', 'antiblue'];

export const QCDToolbox: React.FC<QCDToolboxProps> = ({
  onAddQuark,
  onAddHadronTemplate,
  onClearQuarks,
  onResetPreset,
  onTriggerVacuumPair,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'quarks' | 'hadrons' | 'vacuum'>('quarks');
  const [selectedColor, setSelectedColor] = useState<QuarkColor>('red');
  const [isAntiquark, setIsAntiquark] = useState<boolean>(false);

  const handleSpawnQuark = (flavor: QuarkFlavor) => {
    const prop = QUARK_PROPERTIES[flavor];
    const color = isAntiquark ? getAnticolor(selectedColor) : selectedColor;
    const charge = isAntiquark ? -prop.charge : prop.charge;

    // Jitter spawn location around center
    const spawnX = 600 + (Math.random() - 0.5) * 160;
    const spawnY = 400 + (Math.random() - 0.5) * 160;

    const newQuark: Quark = {
      id: `q-${flavor}-${Date.now().toString(36)}`,
      flavor,
      isAntiquark,
      color,
      x: Math.round(spawnX),
      y: Math.round(spawnY),
      vx: 0,
      vy: 0,
      massMeV: prop.massMeV,
      charge,
    };

    onAddQuark(newQuark);
  };

  const handleSpawnProton = () => {
    const cx = 600;
    const cy = 400;
    const pQuarks: Quark[] = [
      { id: `p-u1-${Date.now()}`, flavor: 'up', isAntiquark: false, color: 'red', x: cx - 60, y: cy - 40, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
      { id: `p-u2-${Date.now()}`, flavor: 'up', isAntiquark: false, color: 'green', x: cx + 60, y: cy - 40, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
      { id: `p-d1-${Date.now()}`, flavor: 'down', isAntiquark: false, color: 'blue', x: cx, y: cy + 65, vx: 0, vy: 0, massMeV: 4.7, charge: -1 / 3 },
    ];
    onAddHadronTemplate(pQuarks);
  };

  const handleSpawnNeutron = () => {
    const cx = 600;
    const cy = 400;
    const nQuarks: Quark[] = [
      { id: `n-u1-${Date.now()}`, flavor: 'up', isAntiquark: false, color: 'red', x: cx - 60, y: cy - 40, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
      { id: `n-d1-${Date.now()}`, flavor: 'down', isAntiquark: false, color: 'green', x: cx + 60, y: cy - 40, vx: 0, vy: 0, massMeV: 4.7, charge: -1 / 3 },
      { id: `n-d2-${Date.now()}`, flavor: 'down', isAntiquark: false, color: 'blue', x: cx, y: cy + 65, vx: 0, vy: 0, massMeV: 4.7, charge: -1 / 3 },
    ];
    onAddHadronTemplate(nQuarks);
  };

  const handleSpawnPion = () => {
    const cx = 600;
    const cy = 400;
    const pionQuarks: Quark[] = [
      { id: `pi-u-${Date.now()}`, flavor: 'up', isAntiquark: false, color: 'red', x: cx - 70, y: cy, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
      { id: `pi-dbar-${Date.now()}`, flavor: 'down', isAntiquark: true, color: 'antired', x: cx + 70, y: cy, vx: 0, vy: 0, massMeV: 4.7, charge: 1 / 3 },
    ];
    onAddHadronTemplate(pionQuarks);
  };

  const handleSpawnJPsi = () => {
    const cx = 600;
    const cy = 400;
    const jpsiQuarks: Quark[] = [
      { id: `j-c-${Date.now()}`, flavor: 'charm', isAntiquark: false, color: 'blue', x: cx - 75, y: cy, vx: 0, vy: 0, massMeV: 1275, charge: 2 / 3 },
      { id: `j-cbar-${Date.now()}`, flavor: 'charm', isAntiquark: true, color: 'antiblue', x: cx + 75, y: cy, vx: 0, vy: 0, massMeV: 1275, charge: -2 / 3 },
    ];
    onAddHadronTemplate(jpsiQuarks);
  };

  const handleSpawnTetraquark = () => {
    const cx = 600;
    const cy = 400;
    const tQuarks: Quark[] = [
      { id: `t-c1-${Date.now()}`, flavor: 'charm', isAntiquark: false, color: 'red', x: cx - 60, y: cy - 50, vx: 0, vy: 0, massMeV: 1275, charge: 2 / 3 },
      { id: `t-c2-${Date.now()}`, flavor: 'charm', isAntiquark: false, color: 'green', x: cx + 60, y: cy - 50, vx: 0, vy: 0, massMeV: 1275, charge: 2 / 3 },
      { id: `t-u-${Date.now()}`, flavor: 'up', isAntiquark: true, color: 'antired', x: cx - 50, y: cy + 50, vx: 0, vy: 0, massMeV: 2.2, charge: -2 / 3 },
      { id: `t-d-${Date.now()}`, flavor: 'down', isAntiquark: true, color: 'antigreen', x: cx + 50, y: cy + 50, vx: 0, vy: 0, massMeV: 4.7, charge: 1 / 3 },
    ];
    onAddHadronTemplate(tQuarks);
  };

  return (
    <aside
      className="w-72 h-full bg-neutral-900 border-r border-neutral-800 flex flex-col overflow-hidden text-neutral-200 select-none z-20 text-xs"
      data-testid="qcd-toolbox"
    >
      {/* Header */}
      <div className="h-12 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-950/40">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white tracking-wide text-xs">
            QCD Particle Spawner
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/50 p-1 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('quarks')}
          className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'quarks'
              ? 'bg-neutral-800 text-emerald-300 border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Quarks
        </button>
        <button
          onClick={() => setActiveTab('hadrons')}
          className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'hadrons'
              ? 'bg-neutral-800 text-emerald-300 border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Hadrons
        </button>
        <button
          onClick={() => setActiveTab('vacuum')}
          className={`flex-1 py-1.5 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
            activeTab === 'vacuum'
              ? 'bg-neutral-800 text-emerald-300 border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Vacuum
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tab 1: Single Quarks */}
        {activeTab === 'quarks' && (
          <div className="space-y-4">
            {/* Color Charge Selector */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800 space-y-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                Spawn Color State
              </span>
              <div className="grid grid-cols-3 gap-1">
                {COLORS.map((c) => {
                  const active = selectedColor === c;
                  const hex = getQuarkColorHex(c);
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono cursor-pointer border transition-all ${
                        active
                          ? 'bg-neutral-800 border-white/40 text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="truncate">{c}</span>
                    </button>
                  );
                })}
              </div>

              {/* Antimatter toggle */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-neutral-300">Antiquark Conjugate (q̄)</span>
                <input
                  type="checkbox"
                  checked={isAntiquark}
                  onChange={(e) => setIsAntiquark(e.target.checked)}
                  className="accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Flavor Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                Choose Quark Flavor
              </span>
              <div className="grid grid-cols-2 gap-2">
                {FLAVORS.map((f) => {
                  const prop = QUARK_PROPERTIES[f];
                  const symbol = isAntiquark ? `${prop.symbol}̄` : prop.symbol;
                  const charge = isAntiquark ? -prop.charge : prop.charge;
                  const chargeStr =
                    charge > 0
                      ? `+${charge.toFixed(2).replace('.67', '⅔').replace('.33', '⅓')}e`
                      : `${charge.toFixed(2).replace('-.33', '-⅓').replace('-.67', '-⅔')}e`;

                  return (
                    <button
                      key={f}
                      onClick={() => handleSpawnQuark(f)}
                      className="p-2.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex flex-col items-start gap-1 cursor-pointer transition-all text-left group"
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="font-bold text-white text-sm group-hover:text-emerald-400">
                          {symbol} ({prop.name})
                        </span>
                        <Plus className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400" />
                      </div>
                      <div className="w-full flex items-center justify-between text-[10px] font-mono text-neutral-400">
                        <span>{chargeStr}</span>
                        <span>
                          {prop.massMeV >= 1000
                            ? `${(prop.massMeV / 1000).toFixed(1)} GeV`
                            : `${prop.massMeV} MeV`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Hadron Templates */}
        {activeTab === 'hadrons' && (
          <div className="space-y-2.5">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Pre-Configured Color Singlets
            </span>

            <button
              onClick={handleSpawnProton}
              className="w-full p-2.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex flex-col gap-1 text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-400">
                  Proton p (uud Baryon)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  938 MeV
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Two Up quarks + One Down quark in Red + Green + Blue Y-junction.
              </p>
            </button>

            <button
              onClick={handleSpawnNeutron}
              className="w-full p-2.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex flex-col gap-1 text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-400">
                  Neutron n (udd Baryon)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  939.6 MeV
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Neutral baryon: one Up + two Down quarks with net electric charge 0.
              </p>
            </button>

            <button
              onClick={handleSpawnPion}
              className="w-full p-2.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex flex-col gap-1 text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-400">
                  Charged Pion π⁺ (ud̄ Meson)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  139.6 MeV
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Lightest Goldstone pseudo-scalar meson bound by single chromoelectric flux tube.
              </p>
            </button>

            <button
              onClick={handleSpawnJPsi}
              className="w-full p-2.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex flex-col gap-1 text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-400">
                  J/ψ Charmonium (cc̄)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  3.1 GeV
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Benchmark heavy quarkonium illustrating clean Cornell potential confinement.
              </p>
            </button>

            <button
              onClick={handleSpawnTetraquark}
              className="w-full p-2.5 bg-neutral-950/60 hover:bg-neutral-800/80 border border-neutral-800 hover:border-emerald-500/40 rounded-xl flex flex-col gap-1 text-left cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-400">
                  Tetraquark Tcc⁺ (cc ū d̄)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  3.88 GeV
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Exotic 4-quark color singlet discovered at LHCb.
              </p>
            </button>
          </div>
        )}

        {/* Tab 3: Vacuum & Field Actions */}
        {activeTab === 'vacuum' && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
              Quantum Vacuum Operations
            </span>

            <button
              onClick={onTriggerVacuumPair}
              className="w-full p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-left cursor-pointer transition-all text-emerald-300 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div>Trigger Vacuum Pair Creation</div>
                <div className="text-[10px] font-normal text-emerald-400/80">
                  Materialize virtual q-q̄ pair from QCD vacuum
                </div>
              </div>
            </button>

            <button
              onClick={onResetPreset}
              className="w-full p-2.5 bg-neutral-950/60 hover:bg-neutral-800 border border-neutral-800 rounded-xl flex items-center gap-2 text-neutral-300 hover:text-white cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 text-neutral-400" />
              <span>Reset Active Preset</span>
            </button>

            <button
              onClick={onClearQuarks}
              className="w-full p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Quarks</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
