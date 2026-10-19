/**
 * Interactive Guide, Shortcuts & Physics Theory Modal
 * Comprehensive documentation for Geometric Optics and Quantum Chromodynamics (QCD).
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Lightbulb,
  Zap,
  Keyboard,
  Atom,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'optics' | 'qcd';
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'optics',
}) => {
  const [activeTab, setActiveTab] = useState<'optics' | 'qcd'>(initialTab);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              {activeTab === 'optics' ? <Sparkles className="w-5 h-5" /> : <Atom className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <h2 id="help-dialog-title" className="text-base font-semibold text-white">
                Lux Physics Guide & Theory
              </h2>
              <p className="text-xs text-neutral-400">
                Geometric Optics, Chromatic Dispersion & Quantum Chromodynamics (QCD)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close help guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('optics')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'optics'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Geometric Optics & Laser Physics
          </button>
          <button
            onClick={() => setActiveTab('qcd')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qcd'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            Quantum Chromodynamics (QCD)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-neutral-300 text-xs leading-relaxed">
          {activeTab === 'optics' ? (
            <>
              {/* Viral Short Inspiration */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-4 h-4" />
                  Creating Geometries Like the Viral Video
                </h3>
                <p className="text-neutral-300">
                  In the viral video, high-power colored and white lasers interact with acrylic prisms, biconvex lenses, spherical glass ball lenses, and cylindrical mirrors inside a dark, haze-filled chamber.
                </p>
                <p className="mt-2 text-neutral-400">
                  To recreate this look: select the <strong>Sacred Laser Mandala</strong> preset, increase the <strong>Smoke / Haze Density</strong> slider, and try adding additional glass ball lenses or rotating outer prisms to watch the caustic patterns twist dynamically in real time!
                </p>
              </div>

              {/* Optics Physics Principles */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  Simulated Optics Principles
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-300">
                  <li className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-sky-300 block mb-0.5">Snell's Law of Refraction</strong>
                    n₁ sin θ₁ = n₂ sin θ₂ with analytical ray-surface intersection.
                  </li>
                  <li className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-emerald-300 block mb-0.5">Total Internal Reflection (TIR)</strong>
                    Occurs when incident angle exceeds critical angle θ_c = arcsin(n₂/n₁).
                  </li>
                  <li className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-purple-300 block mb-0.5">Cauchy Chromatic Dispersion</strong>
                    n(λ) = n₀ + B/λ² splits white laser beams into full spectral rainbows.
                  </li>
                  <li className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-indigo-300 block mb-0.5">Law of Specular Reflection</strong>
                    θ_r = θ_i for flat, spherical, and parabolic optical mirrors.
                  </li>
                </ul>
              </div>

              {/* Keyboard Shortcuts */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                  Keyboard Shortcuts & Controls
                </h3>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400">Select Tool</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">V</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400">Pan Viewport</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">H / Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400">Protractor / Measure</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400">Toggle Grid</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">G</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400">Delete Element</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">Del / Backspace</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-neutral-950 border border-neutral-800">
                    <span className="text-neutral-400">Export SVG</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200">Ctrl/Cmd + E</kbd>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* QCD Fundamentals Overview */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Non-Abelian SU(3) Color Gauge Symmetry & Hadron Physics
                </h3>
                <p className="text-neutral-300">
                  Quantum Chromodynamics (QCD) describes the Strong Nuclear Force mediated by massless spin-1 <strong>gluons</strong> acting on the SU(3) color charges of quarks (Red, Green, Blue) and antiquarks (Cyan, Magenta, Yellow).
                </p>
                <p className="mt-2 text-neutral-400">
                  Unlike Quantum Electrodynamics (QED) where photons are electrically neutral, gluons themselves carry non-Abelian color charge (octet representation <strong>8</strong>). This self-interaction causes color field lines to collimate into narrow <strong>Wilson flux tubes</strong> (strings).
                </p>
              </div>

              {/* Core QCD Principles */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-purple-400" />
                  Key Theoretical QCD Laws Simulated
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-emerald-400 block mb-0.5">Cornell Potential V(r)</strong>
                    <span className="font-mono text-[10px] text-neutral-400 block mb-1">
                      V(r) = - (4/3) αs ℏc / r + σ r
                    </span>
                    Coulombic attraction dominates at sub-fermi scales, while linear string tension σ ≈ 0.9 GeV/fm (~14 metric tons) enforces absolute color confinement.
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-sky-400 block mb-0.5">Asymptotic Freedom</strong>
                    <span className="font-mono text-[10px] text-neutral-400 block mb-1">
                      αs(Q) = 12π / [(33 - 2Nf) ln(Q²/Λ²)]
                    </span>
                    At high momentum / short distances (deep inelastic scattering), the strong coupling drops towards zero (2004 Nobel Prize).
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-amber-400 block mb-0.5">Steiner 3-Way Y-Junctions</strong>
                    In baryons (qqq), the 3 flux tubes meet at a central Torricelli-Steiner junction at 120° angles, minimizing total string action energy.
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-red-400 block mb-0.5">String Breaking & Hadronization</strong>
                    Pulling quarks beyond ~1.35 fm accumulates enough vacuum string energy to materialize a new virtual q-q̄ pair, snapping the string into two color-singlet hadrons.
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-cyan-400 block mb-0.5">Chiral Symmetry Breaking</strong>
                    Bare quark masses (u ≈ 2.2 MeV, d ≈ 4.7 MeV) account for only ~1% of the proton mass (938 MeV). The remaining ~99% is dynamical constituent mass from the chiral condensate ⟨q̄q⟩.
                  </div>

                  <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <strong className="text-pink-400 block mb-0.5">Quark-Gluon Plasma (QGP)</strong>
                    At temperatures T &gt; Tc ≈ 155 MeV, Debye color screening melts string tension (σ → 0), deconfining quarks into a relativistic primordial fluid.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
