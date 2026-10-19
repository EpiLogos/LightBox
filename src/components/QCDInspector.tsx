/**
 * Quantum Chromodynamics (QCD) Property Inspector & Theoretical Physics Panel
 * Displays SU(3) Color Singlet invariance, Invariant Mass calculation,
 * Cornell Potential V(r) mini-plot, Running Coupling alpha_s plot, and Quark editor.
 */

import React, { useRef, useEffect } from 'react';
import {
  Atom,
  Flame,
  Zap,
  RotateCcw,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Activity,
  X,
} from 'lucide-react';
import type {
  Quark,
  QuarkFlavor,
  QuarkColor,
  QCDPhysicsSettings,
  HadronCluster,
} from '../qcd/types.ts';
import {
  QUARK_PROPERTIES,
  calculateRunningAlphaS,
  calculateCornellPotentialMeV,
  calculateEffectiveStringTension,
  getQuarkColorHex,
  getAnticolor,
  CRITICAL_TEMPERATURE_TC_MEV,
  PIXELS_PER_FM,
} from '../qcd/physics.ts';

interface QCDInspectorProps {
  selectedQuark: Quark | null;
  onUpdateQuark: (updated: Quark) => void;
  onDeleteQuark: (id: string) => void;
  onDuplicateQuark: (id: string) => void;
  quarks: Quark[];
  physicsSettings: QCDPhysicsSettings;
  onUpdatePhysics: (partial: Partial<QCDPhysicsSettings>) => void;
  hadronCluster: HadronCluster | null;
  onClose?: () => void;
}

const FLAVORS: QuarkFlavor[] = ['up', 'down', 'strange', 'charm', 'bottom', 'top'];
const COLORS: QuarkColor[] = ['red', 'green', 'blue', 'antired', 'antigreen', 'antiblue'];

export const QCDInspector: React.FC<QCDInspectorProps> = ({
  selectedQuark,
  onUpdateQuark,
  onDeleteQuark,
  onDuplicateQuark,
  quarks,
  physicsSettings,
  onUpdatePhysics,
  hadronCluster,
  onClose,
}) => {
  const cornellCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const alphaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute average interquark distance in fm
  const interquarkDistFm = React.useMemo(() => {
    if (quarks.length < 2) return 0.8;
    if (quarks.length === 2) {
      return Math.hypot(quarks[1].x - quarks[0].x, quarks[1].y - quarks[0].y) / PIXELS_PER_FM;
    }
    let totalD = 0;
    let pairs = 0;
    for (let i = 0; i < quarks.length; i++) {
      for (let j = i + 1; j < quarks.length; j++) {
        totalD += Math.hypot(quarks[j].x - quarks[i].x, quarks[j].y - quarks[i].y) / PIXELS_PER_FM;
        pairs++;
      }
    }
    return pairs > 0 ? totalD / pairs : 0.8;
  }, [quarks]);

  // Draw Cornell Potential Plot V(r) = -(4/3)*alpha*hbar*c/r + sigma*r
  useEffect(() => {
    const canvas = cornellCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Plot background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 30; x < w; x += 35) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 20);
    }
    for (let y = 10; y < h - 20; y += 25) {
      ctx.moveTo(30, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    const maxR = 2.0; // fm
    const maxV = 1600; // MeV
    const minV = -400; // MeV

    const rToX = (r: number) => 30 + (r / maxR) * (w - 35);
    const vToY = (v: number) => h - 20 - ((v - minV) / (maxV - minV)) * (h - 30);

    // Zero potential reference line
    const zeroY = vToY(0);
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(30, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Draw Coulomb term component (faint cyan)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const r = 0.05 + (i / 60) * (maxR - 0.05);
      const vc = (-4 / 3) * 0.35 * (197.3 / r);
      const px = rToX(r);
      const py = vToY(vc);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw Linear String Confinement term component (faint orange)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
    ctx.beginPath();
    const effSigma = calculateEffectiveStringTension(
      physicsSettings.stringTensionGeVfm,
      physicsSettings.temperatureMeV
    );
    for (let i = 0; i <= 60; i++) {
      const r = (i / 60) * maxR;
      const vl = effSigma * 1000 * r;
      const px = rToX(r);
      const py = vToY(vl);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Total Cornell Potential V(r) (bright emerald curve)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const r = 0.04 + (i / 80) * (maxR - 0.04);
      const v = calculateCornellPotentialMeV(r, effSigma, 0.35);
      const px = rToX(r);
      const py = Math.min(h - 5, Math.max(5, vToY(v)));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current separation marker
    const curR = Math.min(maxR, Math.max(0.04, interquarkDistFm));
    const curV = calculateCornellPotentialMeV(curR, effSigma, 0.35);
    const curX = rToX(curR);
    const curY = Math.min(h - 5, Math.max(5, vToY(curV)));

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Axis labels
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText('1 GeV', 26, vToY(1000));
    ctx.fillText('0', 26, zeroY + 3);
    ctx.textAlign = 'center';
    ctx.fillText('0.5', rToX(0.5), h - 8);
    ctx.fillText('1.0 fm', rToX(1.0), h - 8);
    ctx.fillText('1.5', rToX(1.5), h - 8);
  }, [physicsSettings.stringTensionGeVfm, physicsSettings.temperatureMeV, interquarkDistFm]);

  // Draw Running Coupling Plot alpha_s(Q)
  useEffect(() => {
    const canvas = alphaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 30; x < w; x += 35) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 20);
    }
    for (let y = 10; y < h - 20; y += 22) {
      ctx.moveTo(30, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Logarithmic momentum range: 200 MeV to 100 GeV (100,000 MeV)
    const logMin = Math.log10(200);
    const logMax = Math.log10(100000);
    const qToX = (qMeV: number) =>
      30 + ((Math.log10(qMeV) - logMin) / (logMax - logMin)) * (w - 35);
    const aToY = (a: number) => h - 20 - (a / 1.5) * (h - 28);

    // Alpha_s curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const logQ = logMin + (i / 60) * (logMax - logMin);
      const q = Math.pow(10, logQ);
      const alpha = calculateRunningAlphaS(q, physicsSettings.lambdaQCDMeV, physicsSettings.activeFlavors);
      const px = qToX(q);
      const py = aToY(alpha);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Markers for Lambda_QCD and Z-boson mass
    ctx.fillStyle = '#f59e0b';
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1 GeV', qToX(1000), h - 8);
    ctx.fillText('10 GeV', qToX(10000), h - 8);
    ctx.fillText('MZ', qToX(91200), h - 8);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#64748b';
    ctx.fillText('1.0', 26, aToY(1.0));
    ctx.fillText('0.5', 26, aToY(0.5));
    ctx.fillText('0.1', 26, aToY(0.1));
  }, [physicsSettings.lambdaQCDMeV, physicsSettings.activeFlavors]);

  const isQGP = physicsSettings.temperatureMeV >= CRITICAL_TEMPERATURE_TC_MEV;

  return (
    <aside
      className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-hidden text-neutral-200 select-none z-20 text-xs"
      data-testid="qcd-inspector"
    >
      {/* Panel Header */}
      <div className="h-12 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-950/40">
        <div className="flex items-center gap-2">
          <Atom className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white tracking-wide text-xs">
            QCD Theoretical Inspector
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. Hadron Cluster & SU(3) Color Singlet State */}
        {hadronCluster && (
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Hadron Bound State
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium flex items-center gap-1 ${
                  hadronCluster.isColorSinglet
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {hadronCluster.isColorSinglet ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    SU(3) Singlet (White)
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Color Unconfined
                  </>
                )}
              </span>
            </div>

            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{hadronCluster.name}</span>
              <span className="text-xs font-mono font-normal text-neutral-400 uppercase">
                ({hadronCluster.type})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-800 text-center font-mono">
              <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800/50">
                <div className="text-[9px] text-neutral-400">Total Charge</div>
                <div className="text-xs font-semibold text-white">
                  {hadronCluster.totalCharge > 0 ? `+${hadronCluster.totalCharge}` : hadronCluster.totalCharge} e
                </div>
              </div>
              <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800/50">
                <div className="text-[9px] text-neutral-400">Invariant Mass</div>
                <div className="text-xs font-semibold text-emerald-400">
                  {hadronCluster.invariantMassMeV} MeV
                </div>
              </div>
              <div className="bg-neutral-900/80 p-1.5 rounded-lg border border-neutral-800/50">
                <div className="text-[9px] text-neutral-400">Binding Energy</div>
                <div className="text-xs font-semibold text-amber-400">
                  {hadronCluster.bindingEnergyMeV} MeV
                </div>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 leading-relaxed font-sans bg-neutral-900/40 p-2 rounded-lg">
              Constituent mass includes ~310 MeV dynamical chiral symmetry breaking condensate
              plus chromoelectric flux tube string energy.
            </div>
          </div>
        )}

        {/* 2. Selected Quark Inspector */}
        {selectedQuark ? (
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                Selected Quark ({selectedQuark.id})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuark({ ...selectedQuark, locked: !selectedQuark.locked })}
                  title={selectedQuark.locked ? 'Unlock Position' : 'Pin/Lock Position'}
                  className={`p-1 rounded-md border cursor-pointer ${
                    selectedQuark.locked
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                  }`}
                >
                  {selectedQuark.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onDuplicateQuark(selectedQuark.id)}
                  title="Duplicate Quark"
                  className="p-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteQuark(selectedQuark.id)}
                  title="Delete Quark"
                  className="p-1 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Flavor Selector */}
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                Flavor (Constituent Type)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {FLAVORS.map((f) => {
                  const prop = QUARK_PROPERTIES[f];
                  const active = selectedQuark.flavor === f;
                  return (
                    <button
                      key={f}
                      onClick={() =>
                        onUpdateQuark({
                          ...selectedQuark,
                          flavor: f,
                          massMeV: prop.massMeV,
                          charge: selectedQuark.isAntiquark ? -prop.charge : prop.charge,
                        })
                      }
                      className={`px-2 py-1 rounded text-center font-mono cursor-pointer transition-all ${
                        active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                          : 'bg-neutral-800/60 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {f.toUpperCase()}
                      <span className="text-[9px] block text-neutral-400">
                        {prop.massMeV >= 1000 ? `${(prop.massMeV / 1000).toFixed(1)} GeV` : `${prop.massMeV} MeV`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Matter vs Antimatter Toggle */}
            <div className="flex items-center justify-between bg-neutral-900 p-2 rounded-lg border border-neutral-800">
              <span className="text-neutral-300">Antimatter State (q̄)</span>
              <button
                onClick={() => {
                  const nextAnti = !selectedQuark.isAntiquark;
                  const baseCharge = QUARK_PROPERTIES[selectedQuark.flavor].charge;
                  onUpdateQuark({
                    ...selectedQuark,
                    isAntiquark: nextAnti,
                    charge: nextAnti ? -baseCharge : baseCharge,
                    color: getAnticolor(selectedQuark.color),
                  });
                }}
                className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                  selectedQuark.isAntiquark
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                }`}
              >
                {selectedQuark.isAntiquark ? 'ANTIQUARK (q̄)' : 'QUARK (q)'}
              </button>
            </div>

            {/* SU(3) Color Charge Selector */}
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1 font-mono">
                SU(3) Color Gauge Charge
              </label>
              <div className="grid grid-cols-3 gap-1">
                {COLORS.map((c) => {
                  const active = selectedQuark.color === c;
                  const hex = getQuarkColorHex(c);
                  return (
                    <button
                      key={c}
                      onClick={() => onUpdateQuark({ ...selectedQuark, color: c })}
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
            </div>
          </div>
        ) : (
          <div className="p-3 bg-neutral-950/40 rounded-xl border border-neutral-800/60 text-center text-neutral-400 text-xs">
            Click on any quark on canvas to inspect flavor, fractional charge, and SU(3) color state.
          </div>
        )}

        {/* 3. Live Physical Theory Plots */}
        <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Cornell Potential V(r)
            </span>
            <span className="text-[9px] font-mono text-emerald-400">
              r = {interquarkDistFm.toFixed(2)} fm
            </span>
          </div>
          <div className="relative w-full h-28 rounded-lg overflow-hidden border border-neutral-800">
            <canvas
              ref={cornellCanvasRef}
              width={270}
              height={112}
              className="w-full h-full block"
            />
          </div>
          <div className="text-[9px] text-neutral-400 font-mono flex items-center justify-between">
            <span className="text-cyan-400">--- Coulomb (-4/3 α/r)</span>
            <span className="text-orange-400">--- Linear (σ·r)</span>
          </div>
        </div>

        {/* 4. Running Coupling alpha_s(Q^2) */}
        <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
              Asymptotic Freedom αs(Q)
            </span>
            <span className="text-[9px] font-mono text-sky-400">
              αs(1 GeV) ≈ {calculateRunningAlphaS(1000, physicsSettings.lambdaQCDMeV).toFixed(2)}
            </span>
          </div>
          <div className="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-800">
            <canvas
              ref={alphaCanvasRef}
              width={270}
              height={96}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* 5. QCD Environmental Physics Controls */}
        <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 space-y-3">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
            QCD Vacuum & Medium Parameters
          </span>

          {/* String Tension sigma */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-neutral-300">String Tension (σ)</span>
              <span className="font-mono text-amber-400">
                {physicsSettings.stringTensionGeVfm.toFixed(2)} GeV/fm
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2.0}
              step={0.05}
              value={physicsSettings.stringTensionGeVfm}
              onChange={(e) => onUpdatePhysics({ stringTensionGeVfm: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="text-[9px] text-neutral-400">
              Default ~0.9 GeV/fm corresponds to ~14 metric tons of mechanical tension.
            </div>
          </div>

          {/* QCD Temperature T */}
          <div>
            <div className="flex justify-between items-center text-[11px] mb-1">
              <span className="text-neutral-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                Temperature (T)
              </span>
              <span className={`font-mono ${isQGP ? 'text-red-400 font-bold' : 'text-neutral-300'}`}>
                {physicsSettings.temperatureMeV} MeV {isQGP && '(QGP)'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={280}
              step={5}
              value={physicsSettings.temperatureMeV}
              onChange={(e) => onUpdatePhysics({ temperatureMeV: parseInt(e.target.value, 10) })}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] font-mono text-neutral-400">
              <span>0 (Confined)</span>
              <span className="text-amber-400">Tc = 155 MeV</span>
              <span className="text-red-400">QGP Fluid</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1 border-t border-neutral-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-neutral-300">Confinement Dynamics</span>
              <input
                type="checkbox"
                checked={physicsSettings.dynamicsRunning}
                onChange={(e) => onUpdatePhysics({ dynamicsRunning: e.target.checked })}
                className="accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-neutral-300">Vacuum String Breaking</span>
              <input
                type="checkbox"
                checked={physicsSettings.stringBreakingEnabled}
                onChange={(e) => onUpdatePhysics({ stringBreakingEnabled: e.target.checked })}
                className="accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-neutral-300">SU(3) Color Transmutation</span>
              <input
                type="checkbox"
                checked={physicsSettings.colorExchangeEnabled}
                onChange={(e) => onUpdatePhysics({ colorExchangeEnabled: e.target.checked })}
                className="accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-neutral-300">Gluon Quantum Fluctuations</span>
              <input
                type="checkbox"
                checked={physicsSettings.gluonFluctuations}
                onChange={(e) => onUpdatePhysics({ gluonFluctuations: e.target.checked })}
                className="accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};
