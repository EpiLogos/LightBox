/**
 * Unit Tests for Quantum Chromodynamics (QCD) Physics Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRunningAlphaS,
  calculateEffectiveStringTension,
  calculateCornellPotentialMeV,
  calculateBaryonSteinerJunction,
  isColorSinglet,
  classifyHadronCluster,
  calculateCornellForceMagnitude,
  performNonAbelianColorSwap,
  calculateQCDDynamicsStep,
  HBAR_C_MEV_FM,
} from './physics.ts';
import type { Quark } from './types.ts';

test('Running strong coupling exhibits asymptotic freedom', () => {
  // At low momentum transfer (confinement scale ~300 MeV)
  const alphaLowQ = calculateRunningAlphaS(300, 210, 3);
  // At high momentum transfer (perturbative scale ~5000 MeV = 5 GeV)
  const alphaHighQ = calculateRunningAlphaS(5000, 210, 3);
  // At ultra-high scale (Z-boson scale ~91.2 GeV)
  const alphaZ = calculateRunningAlphaS(91200, 210, 5);

  // Alpha_s must strictly decrease as energy increases (Asymptotic Freedom)
  assert.ok(
    alphaLowQ > alphaHighQ,
    `Low Q alpha (${alphaLowQ}) must be greater than High Q alpha (${alphaHighQ})`
  );
  assert.ok(
    alphaHighQ > alphaZ,
    `High Q alpha (${alphaHighQ}) must be greater than Z-scale alpha (${alphaZ})`
  );
  assert.ok(alphaZ < 0.25, `Alpha at 91 GeV should be around ~0.12 - 0.2, got ${alphaZ}`);
});

test('Debye screening melts string tension at Quark-Gluon Plasma critical temperature', () => {
  const sigmaZero = 0.9;
  const sigmaCold = calculateEffectiveStringTension(sigmaZero, 50); // T = 50 MeV < Tc
  const sigmaNearTc = calculateEffectiveStringTension(sigmaZero, 140); // T = 140 MeV ~ Tc
  const sigmaHot = calculateEffectiveStringTension(sigmaZero, 220); // T = 220 MeV > Tc (QGP)

  assert.ok(sigmaCold > sigmaNearTc, 'Cold tension must exceed near-Tc tension');
  assert.ok(sigmaNearTc > sigmaHot, 'Tension near Tc must exceed QGP deconfined tension');
  assert.ok(sigmaHot < 0.1, `QGP phase must have dissolved string tension, got ${sigmaHot}`);
});

test('Cornell potential exhibits short-distance Coulomb term and long-distance linear confinement', () => {
  // At short distance r = 0.1 fm, Coulomb term dominates
  const vShort = calculateCornellPotentialMeV(0.1, 0.9, 0.35);
  // At medium distance r = 0.5 fm
  const vMed = calculateCornellPotentialMeV(0.5, 0.9, 0.35);
  // At long distance r = 1.5 fm, linear sigma * r dominates
  const vLong = calculateCornellPotentialMeV(1.5, 0.9, 0.35);

  // Potential must increase monotonically with separation distance
  assert.ok(vShort < vMed, 'Potential at 0.1 fm must be lower than at 0.5 fm');
  assert.ok(vMed < vLong, 'Potential at 0.5 fm must be lower than at 1.5 fm');

  // Verify the linear slope at large r matches sigma ~ 900 MeV/fm
  const slope = (vLong - vMed) / (1.5 - 0.5);
  assert.ok(
    Math.abs(slope - 900) < 150,
    `Slope at large r should approach sigma (900 MeV/fm), got ${slope}`
  );
});

test('Steiner minimal junction for 3-quark baryon minimizes total flux tube length', () => {
  // Equilateral triangle of quarks
  const q1 = { x: 500, y: 300 };
  const q2 = { x: 700, y: 300 };
  const q3 = { x: 600, y: 473.2 };

  const junction = calculateBaryonSteinerJunction(q1, q2, q3);

  // For symmetric triangle, Steiner point should lie near centroid (600, 357.7)
  assert.ok(Math.abs(junction.x - 600) < 5, `Expected x ~ 600, got ${junction.x}`);
  assert.ok(Math.abs(junction.y - 357.7) < 5, `Expected y ~ 357.7, got ${junction.y}`);
  assert.ok(junction.totalLengthFm > 0);
});

test('SU(3) Color Singlet invariance correctly classifies mesons and baryons', () => {
  // 1. Proton: uud with Red, Green, Blue
  const protonQuarks: Quark[] = [
    { id: '1', flavor: 'up', isAntiquark: false, color: 'red', x: 0, y: 0, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
    { id: '2', flavor: 'up', isAntiquark: false, color: 'green', x: 0, y: 0, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
    { id: '3', flavor: 'down', isAntiquark: false, color: 'blue', x: 0, y: 0, vx: 0, vy: 0, massMeV: 4.7, charge: -1 / 3 },
  ];
  assert.equal(isColorSinglet(protonQuarks), true, 'RGB 3-quark state must be color singlet');

  const protonHadron = classifyHadronCluster(protonQuarks, 0.9);
  assert.equal(protonHadron.type, 'baryon');
  assert.equal(protonHadron.name, 'Proton p (uud)');
  assert.equal(protonHadron.totalCharge, 1);
  assert.ok(protonHadron.invariantMassMeV > 800 && protonHadron.invariantMassMeV < 1100);

  // 2. Non-singlet: 2 Red quarks
  const redPair: Quark[] = [
    { id: '1', flavor: 'up', isAntiquark: false, color: 'red', x: 0, y: 0, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
    { id: '2', flavor: 'down', isAntiquark: false, color: 'red', x: 0, y: 0, vx: 0, vy: 0, massMeV: 4.7, charge: -1 / 3 },
  ];
  assert.equal(isColorSinglet(redPair), false, 'RR state cannot be color singlet');

  // 3. Pion: u (Red) + dbar (Anti-red)
  const pionQuarks: Quark[] = [
    { id: '1', flavor: 'up', isAntiquark: false, color: 'red', x: 0, y: 0, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
    { id: '2', flavor: 'down', isAntiquark: true, color: 'antired', x: 0, y: 0, vx: 0, vy: 0, massMeV: 4.7, charge: 1 / 3 },
  ];
  assert.equal(isColorSinglet(pionQuarks), true, 'Red + Anti-red meson must be color singlet');

  const pionHadron = classifyHadronCluster(pionQuarks, 0.9);
  assert.equal(pionHadron.type, 'meson');
  assert.equal(pionHadron.name, 'Pion π⁺ (ud̄)');
  assert.equal(pionHadron.totalCharge, 1);
});

test('Cornell force exhibits stable hadronic equilibrium radius with linear confinement at large r', () => {
  // At equilibrium radius r = 0.8 fm, net force should be zero (balanced)
  const fEquilibrium = calculateCornellForceMagnitude(0.8, 0.9, 0.35, 0.8);
  assert.ok(Math.abs(fEquilibrium) < 1e-4, `Expected force near 0 at equilibrium, got ${fEquilibrium}`);

  // When stretched to r = 1.6 fm > 0.8 fm, inward attractive force should be positive and dominated by string tension
  const fStretched = calculateCornellForceMagnitude(1.6, 0.9, 0.35, 0.8);
  assert.ok(fStretched > 500, `Stretched quarks should experience strong inward attraction, got ${fStretched}`);

  // When compressed to r = 0.3 fm < 0.8 fm, quantum zero-point core repulsion should be negative (pushing outward)
  const fCompressed = calculateCornellForceMagnitude(0.3, 0.9, 0.35, 0.8);
  assert.ok(fCompressed < -500, `Compressed quarks should experience quantum core repulsion, got ${fCompressed}`);
});

test('Non-Abelian SU(3) color exchange transposes colors preserving singlet representation', () => {
  const { newC1, newC2 } = performNonAbelianColorSwap('red', 'blue');
  assert.equal(newC1, 'blue');
  assert.equal(newC2, 'red');
});

test('QCD confinement dynamics step pulls separated meson quarks toward equilibrium', () => {
  const stretchedMeson: Quark[] = [
    { id: '1', flavor: 'up', isAntiquark: false, color: 'red', x: 200, y: 300, vx: 0, vy: 0, massMeV: 2.2, charge: 2 / 3 },
    { id: '2', flavor: 'down', isAntiquark: true, color: 'antired', x: 600, y: 300, vx: 0, vy: 0, massMeV: 4.7, charge: 1 / 3 },
  ];

  const initialDist = Math.abs(stretchedMeson[1].x - stretchedMeson[0].x);

  const stepped = calculateQCDDynamicsStep(
    stretchedMeson,
    {
      stringTensionGeVfm: 0.9,
      lambdaQCDMeV: 210,
      activeFlavors: 3,
      temperatureMeV: 0,
      runningCouplingEnabled: true,
      stringBreakingEnabled: true,
      gluonFluctuations: true,
      dynamicsRunning: true,
      colorExchangeEnabled: true,
      simulationRunning: true,
      timeSpeed: 1.0,
    },
    0.03
  );

  const newDist = Math.abs(stepped[1].x - stepped[0].x);
  assert.ok(newDist < initialDist, `Quarks should be pulled closer together (initial ${initialDist}, new ${newDist})`);
});
