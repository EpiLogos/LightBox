/**
 * Curated Quantum Chromodynamics (QCD) Presets & Systems
 */

import type { Quark, QCDPhysicsSettings } from './types.ts';

export interface QCDPresetScene {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  quarks: Quark[];
  settings: Partial<QCDPhysicsSettings>;
}

export const QCD_PRESETS: QCDPresetScene[] = [
  {
    id: 'proton-baryon',
    title: 'Proton Bound State (uud Baryon)',
    subtitle: 'SU(3) Color Singlet with 3-Way Y-Flux Tube Junction',
    description:
      'Two Up quarks and one Down quark carrying Red, Green, and Blue color charges. Gluon self-interaction compresses the chromoelectric field into a 3-way Y-shaped Steiner junction, producing net color white and invariant mass ~938 MeV.',
    settings: {
      stringTensionGeVfm: 0.9,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
    },
    quarks: [
      {
        id: 'p-u1',
        flavor: 'up',
        isAntiquark: false,
        color: 'red',
        x: 520,
        y: 330,
        vx: 0,
        vy: 0,
        massMeV: 2.2,
        charge: 2 / 3,
      },
      {
        id: 'p-u2',
        flavor: 'up',
        isAntiquark: false,
        color: 'green',
        x: 680,
        y: 330,
        vx: 0,
        vy: 0,
        massMeV: 2.2,
        charge: 2 / 3,
      },
      {
        id: 'p-d1',
        flavor: 'down',
        isAntiquark: false,
        color: 'blue',
        x: 600,
        y: 470,
        vx: 0,
        vy: 0,
        massMeV: 4.7,
        charge: -1 / 3,
      },
    ],
  },
  {
    id: 'pion-meson',
    title: 'Charged Pion π⁺ (ud̄ Meson)',
    subtitle: 'Quark-Antiquark Color Flux Tube & Cornell Potential',
    description:
      'An Up quark (Red) bound to a Down antiquark (Anti-Red / Cyan) by a chromoelectric flux tube. The system exhibits Coulomb-like 1/r attraction at short distances and linear sigma*r confinement at longer distances.',
    settings: {
      stringTensionGeVfm: 0.9,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
    },
    quarks: [
      {
        id: 'pi-u',
        flavor: 'up',
        isAntiquark: false,
        color: 'red',
        x: 480,
        y: 400,
        vx: 0,
        vy: 0,
        massMeV: 2.2,
        charge: 2 / 3,
      },
      {
        id: 'pi-dbar',
        flavor: 'down',
        isAntiquark: true,
        color: 'antired',
        x: 720,
        y: 400,
        vx: 0,
        vy: 0,
        massMeV: 4.7,
        charge: 1 / 3, // anti-down charge is -(-1/3) = +1/3
      },
    ],
  },
  {
    id: 'neutron-baryon',
    title: 'Neutron (udd Baryon)',
    subtitle: 'Neutral Color Singlet with Zero Net Electric Charge',
    description:
      'One Up quark (+2/3) and two Down quarks (-1/3, -1/3) bound in an RGB color singlet. Total electric charge sums to 0, while the non-Abelian gluon field provides the constituent mass of ~939 MeV.',
    settings: {
      stringTensionGeVfm: 0.9,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
    },
    quarks: [
      {
        id: 'n-u1',
        flavor: 'up',
        isAntiquark: false,
        color: 'red',
        x: 520,
        y: 330,
        vx: 0,
        vy: 0,
        massMeV: 2.2,
        charge: 2 / 3,
      },
      {
        id: 'n-d1',
        flavor: 'down',
        isAntiquark: false,
        color: 'green',
        x: 680,
        y: 330,
        vx: 0,
        vy: 0,
        massMeV: 4.7,
        charge: -1 / 3,
      },
      {
        id: 'n-d2',
        flavor: 'down',
        isAntiquark: false,
        color: 'blue',
        x: 600,
        y: 470,
        vx: 0,
        vy: 0,
        massMeV: 4.7,
        charge: -1 / 3,
      },
    ],
  },
  {
    id: 'string-breaking',
    title: 'Vacuum String Breaking & Hadronization',
    subtitle: 'Dynamic Pair Creation Under Stretched String Tension',
    description:
      'Dragging a quark and antiquark apart accumulates stored string tension energy. When the energy exceeds the threshold to materialize a new quark-antiquark pair from the quantum vacuum, the flux tube snaps, creating two separate mesons.',
    settings: {
      stringTensionGeVfm: 1.1,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
    },
    quarks: [
      {
        id: 'sb-q1',
        flavor: 'up',
        isAntiquark: false,
        color: 'green',
        x: 380,
        y: 400,
        vx: 0,
        vy: 0,
        massMeV: 2.2,
        charge: 2 / 3,
      },
      {
        id: 'sb-q2',
        flavor: 'down',
        isAntiquark: true,
        color: 'antigreen',
        x: 820,
        y: 400,
        vx: 0,
        vy: 0,
        massMeV: 4.7,
        charge: 1 / 3,
      },
    ],
  },
  {
    id: 'qgp-plasma',
    title: 'Quark-Gluon Plasma (QGP Deconfinement)',
    subtitle: 'Extreme Temperature Phase Transition (T = 220 MeV > Tc)',
    description:
      'At temperatures exceeding the Hagedorn / crossover transition (Tc ~ 155 MeV), Debye color screening melts the chromoelectric string tension (sigma -> 0). Quarks and gluons become asymptotically free in a relativistic primordial fluid.',
    settings: {
      stringTensionGeVfm: 0.1,
      temperatureMeV: 220,
      runningCouplingEnabled: true,
      stringBreakingEnabled: false,
      gluonFluctuations: true,
    },
    quarks: [
      { id: 'qgp-1', flavor: 'up', isAntiquark: false, color: 'red', x: 440, y: 320, vx: 0.4, vy: -0.2, massMeV: 2.2, charge: 2 / 3 },
      { id: 'qgp-2', flavor: 'down', isAntiquark: false, color: 'green', x: 540, y: 460, vx: -0.3, vy: 0.5, massMeV: 4.7, charge: -1 / 3 },
      { id: 'qgp-3', flavor: 'strange', isAntiquark: false, color: 'blue', x: 680, y: 350, vx: -0.5, vy: -0.4, massMeV: 95, charge: -1 / 3 },
      { id: 'qgp-4', flavor: 'up', isAntiquark: true, color: 'antired', x: 620, y: 490, vx: 0.2, vy: 0.6, massMeV: 2.2, charge: -2 / 3 },
      { id: 'qgp-5', flavor: 'charm', isAntiquark: false, color: 'green', x: 740, y: 300, vx: 0.3, vy: -0.5, massMeV: 1275, charge: 2 / 3 },
      { id: 'qgp-6', flavor: 'down', isAntiquark: true, color: 'antiblue', x: 480, y: 410, vx: -0.4, vy: 0.2, massMeV: 4.7, charge: 1 / 3 },
    ],
  },
  {
    id: 'jpsi-charmonium',
    title: 'J/ψ Charmonium (c c̄ Bound State)',
    subtitle: 'Heavy Quark-Antiquark Benchmark of Cornell Potential',
    description:
      'A Charm quark and anti-Charm antiquark bound by the Cornell potential. Because charm quarks have large bare mass (~1275 MeV), relativistic effects are subdued, providing the experimental textbook confirmation of linear confinement and asymptotic freedom.',
    settings: {
      stringTensionGeVfm: 0.9,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
      dynamicsRunning: true,
    },
    quarks: [
      { id: 'jpsi-c', flavor: 'charm', isAntiquark: false, color: 'blue', x: 500, y: 400, vx: 0, vy: 0, massMeV: 1275, charge: 2 / 3 },
      { id: 'jpsi-cbar', flavor: 'charm', isAntiquark: true, color: 'antiblue', x: 700, y: 400, vx: 0, vy: 0, massMeV: 1275, charge: -2 / 3 },
    ],
  },
  {
    id: 'delta-resonance',
    title: 'Delta Δ⁺⁺ Baryon (uuu)',
    subtitle: 'Historical Proof of SU(3) Color Symmetry (Charge +2e)',
    description:
      'Three identical Up quarks with parallel spins. Without the SU(3) color degree of freedom (Red + Green + Blue = White), this symmetric wavefunction would violate the Pauli Exclusion Principle. Historical discovery that proved the reality of color charge.',
    settings: {
      stringTensionGeVfm: 0.9,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
      dynamicsRunning: true,
    },
    quarks: [
      { id: 'd-u1', flavor: 'up', isAntiquark: false, color: 'red', x: 530, y: 340, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
      { id: 'd-u2', flavor: 'up', isAntiquark: false, color: 'green', x: 670, y: 340, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
      { id: 'd-u3', flavor: 'up', isAntiquark: false, color: 'blue', x: 600, y: 460, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
    ],
  },
  {
    id: 'tetraquark-exotic',
    title: 'Tetraquark Tcc⁺ (cc ū d̄ Exotic)',
    subtitle: 'Color Singlet 4-Quark Bound State (LHCb Discovery)',
    description:
      'Two heavy charm quarks and two light antiquarks forming a stable multi-quark color singlet state. This exotic hadron was observed by the LHCb collaboration at CERN, demonstrating color singlet clustering beyond ordinary mesons and baryons.',
    settings: {
      stringTensionGeVfm: 0.95,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
      dynamicsRunning: true,
    },
    quarks: [
      { id: 't-c1', flavor: 'charm', isAntiquark: false, color: 'red', x: 500, y: 350, vx: 0, vy: 0, massMeV: 1275, charge: 2 / 3 },
      { id: 't-c2', flavor: 'charm', isAntiquark: false, color: 'green', x: 700, y: 350, vx: 0, vy: 0, massMeV: 1275, charge: 2 / 3 },
      { id: 't-ubar', flavor: 'up', isAntiquark: true, color: 'antired', x: 540, y: 470, vx: 0, vy: 0, massMeV: 2.2, charge: -2 / 3 },
      { id: 't-dbar', flavor: 'down', isAntiquark: true, color: 'antigreen', x: 660, y: 470, vx: 0, vy: 0, massMeV: 4.7, charge: 1 / 3 },
    ],
  },
];

