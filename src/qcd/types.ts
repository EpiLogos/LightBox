/**
 * Quantum Chromodynamics (QCD) Types & State Definitions
 * Strong force gauge theory with SU(3)_c color symmetry, quarks, gluons, and hadrons
 */

export type QuarkFlavor = 'up' | 'down' | 'strange' | 'charm' | 'bottom' | 'top';

export type QuarkColor = 'red' | 'green' | 'blue' | 'antired' | 'antigreen' | 'antiblue';

export interface ColorRGB {
  r: number; // 0 to 1
  g: number;
  b: number;
}

export interface Quark {
  id: string;
  flavor: QuarkFlavor;
  isAntiquark: boolean;
  color: QuarkColor;
  x: number; // in pixels (screen space)
  y: number;
  vx: number; // velocity
  vy: number;
  massMeV: number;
  charge: number; // fractional electric charge, e.g. +2/3 or -1/3
  selected?: boolean;
  locked?: boolean;
}

export interface GluonExchangeParticle {
  id: string;
  sourceQuarkId: string;
  targetQuarkId: string;
  progress: number; // 0 to 1 along flux tube
  speed: number;
  colorCarried: QuarkColor;
  anticolorCarried: QuarkColor;
  wavelength: number;
}

export interface FluxTube {
  id: string;
  quarkAId: string;
  quarkBId: string;
  tensionGeVfm: number;
  currentEnergyMeV: number;
  lengthFm: number;
  isBreaking: boolean;
}

export interface SteinerJunction {
  junctionPoint: { x: number; y: number };
  quarkIds: [string, string, string];
  totalLengthFm: number;
  totalEnergyMeV: number;
}

export type HadronType =
  | 'meson' // q + qbar (color singlet)
  | 'baryon' // q + q + q (color singlet)
  | 'antibaryon' // qbar + qbar + qbar
  | 'tetraquark' // 2q + 2qbar
  | 'unbound'; // free / breaking state

export interface HadronCluster {
  id: string;
  name: string;
  type: HadronType;
  quarkIds: string[];
  isColorSinglet: boolean;
  totalCharge: number;
  invariantMassMeV: number;
  bindingEnergyMeV: number;
}

export interface QCDPhysicsSettings {
  stringTensionGeVfm: number; // sigma: default 0.9 GeV/fm
  lambdaQCDMeV: number; // Lambda_QCD: default 210 MeV
  activeFlavors: number; // N_f: default 3 (u, d, s)
  temperatureMeV: number; // T: default 0 (confined); T > 155 MeV triggers QGP
  runningCouplingEnabled: boolean;
  stringBreakingEnabled: boolean;
  gluonFluctuations: boolean;
  dynamicsRunning: boolean; // Enables real-time Cornell confinement attraction & orbits
  colorExchangeEnabled: boolean; // Enables non-Abelian SU(3) color swaps on gluon absorption
  simulationRunning: boolean;
  timeSpeed: number; // 0.1 to 2.0
}

export interface QCDSimulationStats {
  quarkCount: number;
  gluonCount: number;
  hadronCount: number;
  totalColorSinglet: boolean;
  averageAlphaS: number;
  maxFluxTensionMeV: number;
  vacuumFluctuationRate: number;
}
