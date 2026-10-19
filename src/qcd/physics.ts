/**
 * Quantum Chromodynamics (QCD) Physics Engine
 * Non-Abelian SU(3) Color Gauge Theory, Cornell Potential, and Hadron Dynamics
 */

import type {
  Quark,
  QuarkFlavor,
  QuarkColor,
  QCDPhysicsSettings,
  HadronCluster,
  SteinerJunction,
} from './types.ts';

// Fundamental physical constants
export const HBAR_C_MEV_FM = 197.32698; // hbar * c in MeV * fm
export const DEFAULT_STRING_TENSION_GEV_FM = 0.9; // sigma ~ 0.9 GeV/fm ~ 900 MeV/fm
export const DEFAULT_LAMBDA_QCD_MEV = 210; // Lambda_QCD scale ~ 210 MeV
export const CRITICAL_TEMPERATURE_TC_MEV = 155; // QCD deconfinement transition temperature

// Standard Model Quark Properties
export const QUARK_PROPERTIES: Record<
  QuarkFlavor,
  { name: string; massMeV: number; charge: number; symbol: string }
> = {
  up: { name: 'Up', massMeV: 2.2, charge: 2 / 3, symbol: 'u' },
  down: { name: 'Down', massMeV: 4.7, charge: -1 / 3, symbol: 'd' },
  strange: { name: 'Strange', massMeV: 95.0, charge: -1 / 3, symbol: 's' },
  charm: { name: 'Charm', massMeV: 1275.0, charge: 2 / 3, symbol: 'c' },
  bottom: { name: 'Bottom', massMeV: 4180.0, charge: -1 / 3, symbol: 'b' },
  top: { name: 'Top', massMeV: 172760.0, charge: 2 / 3, symbol: 't' },
};

// Coordinate scale: 100 pixels = 1.0 femtometer (1 fm)
export const PIXELS_PER_FM = 120.0;

/**
 * Calculates the Running Strong Coupling alpha_s(Q) via 1-loop beta function:
 * alpha_s(Q) = 12 * pi / ((33 - 2 * N_f) * ln(Q^2 / Lambda^2))
 * Includes infrared regulator to smoothly freeze at confinement scale.
 */
export function calculateRunningAlphaS(
  momentumQMeV: number,
  lambdaQCDMeV: number = DEFAULT_LAMBDA_QCD_MEV,
  activeFlavors: number = 3
): number {
  const beta0 = 33 - 2 * activeFlavors;
  if (beta0 <= 0) return 0.5;

  const q = Math.max(10.0, momentumQMeV);
  const ratio = Math.max(1.05, q / lambdaQCDMeV);
  const logTerm = 2 * Math.log(ratio);

  const rawAlpha = (12 * Math.PI) / (beta0 * logTerm);
  // Infrared saturation limit (lattice QCD freezes around 1.2 - 1.5)
  return Math.min(1.5, Math.max(0.1, rawAlpha));
}

/**
 * Calculates the effective string tension sigma(T) under thermal Debye screening.
 * As temperature approaches Tc ~ 155 MeV, the chromoelectric string melts into QGP.
 */
export function calculateEffectiveStringTension(
  sigma0GeVfm: number,
  temperatureMeV: number
): number {
  if (temperatureMeV <= 0) return sigma0GeVfm;
  if (temperatureMeV >= CRITICAL_TEMPERATURE_TC_MEV) {
    // Screened residual interaction in deconfined plasma
    const tOverTc = temperatureMeV / CRITICAL_TEMPERATURE_TC_MEV;
    return sigma0GeVfm * 0.05 * Math.exp(-(tOverTc - 1));
  }
  const ratio = temperatureMeV / CRITICAL_TEMPERATURE_TC_MEV;
  return sigma0GeVfm * Math.sqrt(Math.max(0, 1 - ratio * ratio));
}

/**
 * Calculates the Cornell Potential V(r) between a quark and an antiquark in a meson:
 * V(r) = - (4/3) * alpha_s * (hbar * c) / r + sigma * r
 *
 * @param rFm Distance in femtometers (fm)
 * @param sigmaGeVfm String tension in GeV/fm
 * @param alphaS Strong coupling constant
 * @returns Potential energy in MeV
 */
export function calculateCornellPotentialMeV(
  rFm: number,
  sigmaGeVfm: number = DEFAULT_STRING_TENSION_GEV_FM,
  alphaS: number = 0.35
): number {
  const r = Math.max(0.02, rFm); // prevent singularity at r -> 0
  const coulombTerm = (-4 / 3) * alphaS * (HBAR_C_MEV_FM / r);
  const stringTerm = (sigmaGeVfm * 1000.0) * r; // convert GeV/fm to MeV/fm
  return coulombTerm + stringTerm;
}

/**
 * Calculates the Torricelli / Steiner Minimal Point for 3 quarks in a Baryon.
 * Flux tubes from each of the 3 quarks meet at 120-degree angles at the Steiner junction,
 * minimizing total string energy E = sigma * (|SA| + |SB| + |SC|).
 */
export function calculateBaryonSteinerJunction(
  q1: { x: number; y: number },
  q2: { x: number; y: number },
  q3: { x: number; y: number }
): { x: number; y: number; totalLengthFm: number } {
  // Compute side vectors and angles
  const d12 = Math.hypot(q2.x - q1.x, q2.y - q1.y);
  const d23 = Math.hypot(q3.x - q2.x, q3.y - q2.y);
  const d31 = Math.hypot(q1.x - q3.x, q1.y - q3.y);

  // Check if any angle is >= 120 degrees (cosine <= -0.5)
  // Angle at q1:
  const cos1 = (d12 * d12 + d31 * d31 - d23 * d23) / (2 * Math.max(1e-4, d12 * d31));
  const cos2 = (d12 * d12 + d23 * d23 - d31 * d31) / (2 * Math.max(1e-4, d12 * d23));
  const cos3 = (d23 * d23 + d31 * d31 - d12 * d12) / (2 * Math.max(1e-4, d23 * d31));

  if (cos1 <= -0.5) {
    return { x: q1.x, y: q1.y, totalLengthFm: (d12 + d31) / PIXELS_PER_FM };
  }
  if (cos2 <= -0.5) {
    return { x: q2.x, y: q2.y, totalLengthFm: (d12 + d23) / PIXELS_PER_FM };
  }
  if (cos3 <= -0.5) {
    return { x: q3.x, y: q3.y, totalLengthFm: (d23 + d31) / PIXELS_PER_FM };
  }

  // Numerical gradient descent for Torricelli-Steiner minimal sum of distances
  let sx = (q1.x + q2.x + q3.x) / 3;
  let sy = (q1.y + q2.y + q3.y) / 3;

  for (let iter = 0; iter < 18; iter++) {
    const r1 = Math.max(1.0, Math.hypot(sx - q1.x, sy - q1.y));
    const r2 = Math.max(1.0, Math.hypot(sx - q2.x, sy - q2.y));
    const r3 = Math.max(1.0, Math.hypot(sx - q3.x, sy - q3.y));

    const w1 = 1 / r1;
    const w2 = 1 / r2;
    const w3 = 1 / r3;
    const wSum = w1 + w2 + w3;

    sx = (w1 * q1.x + w2 * q2.x + w3 * q3.x) / wSum;
    sy = (w1 * q1.y + w2 * q2.y + w3 * q3.y) / wSum;
  }

  const lenPx =
    Math.hypot(sx - q1.x, sy - q1.y) +
    Math.hypot(sx - q2.x, sy - q2.y) +
    Math.hypot(sx - q3.x, sy - q3.y);

  return { x: sx, y: sy, totalLengthFm: lenPx / PIXELS_PER_FM };
}

/**
 * Tests whether a given set of quarks forms an exact SU(3) color singlet (white).
 */
export function isColorSinglet(quarks: Quark[]): boolean {
  if (quarks.length === 0) return false;

  let rCount = 0;
  let gCount = 0;
  let bCount = 0;

  for (const q of quarks) {
    switch (q.color) {
      case 'red':
        rCount++;
        break;
      case 'green':
        gCount++;
        break;
      case 'blue':
        bCount++;
        break;
      case 'antired':
        rCount--;
        break;
      case 'antigreen':
        gCount--;
        break;
      case 'antiblue':
        bCount--;
        break;
    }
  }

  // Meson: 1 quark + 1 antiquark with net zero color
  if (quarks.length === 2) {
    return rCount === 0 && gCount === 0 && bCount === 0 && quarks.some((q) => q.isAntiquark);
  }

  // Baryon: 3 quarks (1 Red + 1 Green + 1 Blue)
  if (quarks.length === 3 && !quarks.some((q) => q.isAntiquark)) {
    return rCount === 1 && gCount === 1 && bCount === 1;
  }

  // Antibaryon: 3 antiquarks (1 antiR + 1 antiG + 1 antiB)
  if (quarks.length === 3 && quarks.every((q) => q.isAntiquark)) {
    return rCount === -1 && gCount === -1 && bCount === -1;
  }

  // General singlet: net 0 color
  return rCount === 0 && gCount === 0 && bCount === 0;
}

/**
 * Identifies Hadron cluster type and computes total invariant mass and binding energy.
 */
export function classifyHadronCluster(quarks: Quark[], tensionGeVfm: number): HadronCluster {
  const isSinglet = isColorSinglet(quarks);
  const totalCharge = quarks.reduce((acc, q) => acc + q.charge, 0);

  let type: HadronCluster['type'] = 'unbound';
  let name = 'Unbound Quarks';

  const nonAnti = quarks.filter((q) => !q.isAntiquark);
  const anti = quarks.filter((q) => q.isAntiquark);

  if (quarks.length === 2 && nonAnti.length === 1 && anti.length === 1 && isSinglet) {
    type = 'meson';
    const q = nonAnti[0];
    const qb = anti[0];
    if (q.flavor === 'up' && qb.flavor === 'down') name = 'Pion π⁺ (ud̄)';
    else if (q.flavor === 'down' && qb.flavor === 'up') name = 'Pion π⁻ (dū)';
    else if (q.flavor === 'up' && qb.flavor === 'up') name = 'Neutral Pion π⁰ (uū)';
    else if (q.flavor === 'charm' && qb.flavor === 'charm') name = 'J/ψ Meson (cc̄)';
    else if (q.flavor === 'bottom' && qb.flavor === 'bottom') name = 'Upsilon Υ (bb̄)';
    else name = `Meson (${q.flavor[0]}${qb.flavor[0]}̄)`;
  } else if (quarks.length === 3 && nonAnti.length === 3 && isSinglet) {
    type = 'baryon';
    const flavorCodes = quarks.map((q) => q.flavor[0]).sort().join('');
    if (flavorCodes === 'duu') name = 'Proton p (uud)';
    else if (flavorCodes === 'ddu') name = 'Neutron n (udd)';
    else if (flavorCodes === 'uuu') name = 'Delta Δ⁺⁺ (uuu)';
    else if (flavorCodes === 'ddd') name = 'Delta Δ⁻ (ddd)';
    else name = `Baryon (${quarks.map((q) => q.flavor[0]).join('')})`;
  } else if (quarks.length === 3 && anti.length === 3 && isSinglet) {
    type = 'antibaryon';
    name = `Antibaryon (${quarks.map((q) => q.flavor[0] + '̄').join('')})`;
  } else if (quarks.length === 4 && isSinglet) {
    type = 'tetraquark';
    name = 'Tetraquark Bound State (q²q̄²)';
  }

  // Calculate string potential binding energy
  let bindingEnergyMeV = 0;
  if (quarks.length === 2) {
    const distPx = Math.hypot(quarks[0].x - quarks[1].x, quarks[0].y - quarks[1].y);
    const distFm = distPx / PIXELS_PER_FM;
    bindingEnergyMeV = calculateCornellPotentialMeV(distFm, tensionGeVfm);
  } else if (quarks.length === 3) {
    const junction = calculateBaryonSteinerJunction(quarks[0], quarks[1], quarks[2]);
    bindingEnergyMeV = junction.totalLengthFm * tensionGeVfm * 1000.0;
  }

  // Invariant mass = constituent quark masses + binding/confinement energy
  const bareMassSum = quarks.reduce((sum, q) => sum + q.massMeV, 0);
  // In hadrons, dynamical chiral symmetry breaking adds ~300 MeV per constituent light quark
  const chiralConstituentBonus = quarks.reduce(
    (sum, q) => sum + (q.massMeV < 10 ? 310 : 50),
    0
  );
  const invariantMassMeV = Math.max(135.0, bareMassSum + chiralConstituentBonus + bindingEnergyMeV * 0.15);

  return {
    id: `hadron-${quarks.map((q) => q.id).join('-')}`,
    name,
    type,
    quarkIds: quarks.map((q) => q.id),
    isColorSinglet: isSinglet,
    totalCharge: Math.round(totalCharge * 3) / 3,
    invariantMassMeV: Math.round(invariantMassMeV * 10) / 10,
    bindingEnergyMeV: Math.round(bindingEnergyMeV * 10) / 10,
  };
}

/**
 * Returns CSS color string for a given QuarkColor.
 */
export function getQuarkColorHex(color: QuarkColor): string {
  switch (color) {
    case 'red':
      return '#ef4444'; // Red
    case 'green':
      return '#10b981'; // Green
    case 'blue':
      return '#3b82f6'; // Blue
    case 'antired':
      return '#06b6d4'; // Cyan (anti-red)
    case 'antigreen':
      return '#ec4899'; // Magenta (anti-green)
    case 'antiblue':
      return '#eab308'; // Yellow (anti-blue)
  }
}

/**
 * Returns conjugate anti-color for SU(3) color representation
 */
export function getAnticolor(color: QuarkColor): QuarkColor {
  switch (color) {
    case 'red':
      return 'antired';
    case 'green':
      return 'antigreen';
    case 'blue':
      return 'antiblue';
    case 'antired':
      return 'red';
    case 'antigreen':
      return 'green';
    case 'antiblue':
      return 'blue';
  }
}

/**
 * Calculates net radial force in MeV/fm between quarks in Cornell potential
 * Includes attractive Coulomb + linear string confinement, balanced by
 * quantum zero-point Fermi motion pressure to stabilize ground-state hadron radius ~0.8 fm.
 */
export function calculateCornellForceMagnitude(
  rFm: number,
  sigmaGeVfm: number = DEFAULT_STRING_TENSION_GEV_FM,
  alphaS: number = 0.35,
  equilibriumRadiusFm: number = 0.8
): number {
  const r = Math.max(0.08, rFm);
  const coulombAttractive = (4 / 3) * alphaS * (HBAR_C_MEV_FM / (r * r));
  const stringConfinement = sigmaGeVfm * 1000.0; // MeV/fm
  const totalAttractive = coulombAttractive + stringConfinement;

  // Quantum zero-point repulsion coefficient chosen so F_net(r0) = 0
  const r0 = Math.max(0.4, equilibriumRadiusFm);
  const kQuantum = ((4 / 3) * alphaS * (HBAR_C_MEV_FM / (r0 * r0)) + stringConfinement) * Math.pow(r0, 3);
  const quantumRepulsion = kQuantum / Math.pow(r, 3);

  // Inward force (positive = attractive toward center/other quark)
  return totalAttractive - quantumRepulsion;
}

/**
 * Executes non-Abelian SU(3) color exchange between two interacting quarks.
 * When gluon carrying (c1, anti-c2) is exchanged, the two quarks swap color states,
 * preserving total color singlet invariance (trace Tr(T_a) = 0).
 */
export function performNonAbelianColorSwap(
  c1: QuarkColor,
  c2: QuarkColor
): { newC1: QuarkColor; newC2: QuarkColor } {
  // Transpose colors (gauge rotation)
  return { newC1: c2, newC2: c1 };
}

/**
 * Integrates one physical time step of QCD confinement dynamics
 */
export function calculateQCDDynamicsStep(
  quarks: Quark[],
  settings: QCDPhysicsSettings,
  dt: number
): Quark[] {
  if (quarks.length === 0 || !settings.dynamicsRunning) {
    return quarks;
  }

  const effectiveTension = calculateEffectiveStringTension(
    settings.stringTensionGeVfm,
    settings.temperatureMeV
  );
  const isQGP = settings.temperatureMeV >= CRITICAL_TEMPERATURE_TC_MEV;
  const runningAlpha = calculateRunningAlphaS(450, settings.lambdaQCDMeV, settings.activeFlavors);

  // Clone quarks
  const updated: Quark[] = quarks.map((q) => ({ ...q }));

  // Acceleration vectors for each quark in pixels/s^2
  const accels: Array<{ ax: number; ay: number }> = updated.map(() => ({ ax: 0, ay: 0 }));

  if (isQGP) {
    // Deconfined Quark-Gluon Plasma: relativistic Brownian thermal kicks and soft screened Coulomb
    const thermalVelocity = Math.min(250, 40 * Math.sqrt(settings.temperatureMeV / CRITICAL_TEMPERATURE_TC_MEV));
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].locked) continue;
      // Thermal Langevin noise
      const angle = Math.random() * Math.PI * 2;
      const kick = (Math.random() - 0.5) * thermalVelocity * 15;
      accels[i].ax += Math.cos(angle) * kick;
      accels[i].ay += Math.sin(angle) * kick;
    }
  } else if (updated.length === 2) {
    // Meson: 2-quark mutual Cornell central force
    const q1 = updated[0];
    const q2 = updated[1];
    const dx = q2.x - q1.x;
    const dy = q2.y - q1.y;
    const distPx = Math.max(5.0, Math.hypot(dx, dy));
    const distFm = distPx / PIXELS_PER_FM;

    const forceMeVfm = calculateCornellForceMagnitude(distFm, effectiveTension, runningAlpha, 0.85);
    // Convert force into screen acceleration scale
    const accelScale = Math.min(450, Math.max(-450, forceMeVfm * 0.45));

    const ux = dx / distPx;
    const uy = dy / distPx;

    if (!q1.locked) {
      accels[0].ax += ux * accelScale;
      accels[0].ay += uy * accelScale;
    }
    if (!q2.locked) {
      accels[1].ax -= ux * accelScale;
      accels[1].ay -= uy * accelScale;
    }
  } else if (updated.length === 3) {
    // Baryon: 3-quark Steiner Y-junction confinement
    const junction = calculateBaryonSteinerJunction(updated[0], updated[1], updated[2]);
    for (let i = 0; i < 3; i++) {
      if (updated[i].locked) continue;
      const q = updated[i];
      const dx = junction.x - q.x;
      const dy = junction.y - q.y;
      const distPx = Math.max(5.0, Math.hypot(dx, dy));
      const distFm = distPx / PIXELS_PER_FM;

      // In a baryon, distance from quark to junction is ~ 0.5 fm at equilibrium
      const forceMeVfm = calculateCornellForceMagnitude(distFm, effectiveTension, runningAlpha, 0.55);
      const accelScale = Math.min(450, Math.max(-450, forceMeVfm * 0.45));

      const ux = dx / distPx;
      const uy = dy / distPx;
      accels[i].ax += ux * accelScale;
      accels[i].ay += uy * accelScale;
    }
  } else {
    // Multi-quark complex: cluster centroid attraction
    const cx = updated.reduce((sum, q) => sum + q.x, 0) / updated.length;
    const cy = updated.reduce((sum, q) => sum + q.y, 0) / updated.length;
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].locked) continue;
      const q = updated[i];
      const dx = cx - q.x;
      const dy = cy - q.y;
      const distPx = Math.max(10.0, Math.hypot(dx, dy));
      const distFm = distPx / PIXELS_PER_FM;
      const force = calculateCornellForceMagnitude(distFm, effectiveTension * 0.5, runningAlpha, 1.1);
      const accelScale = Math.min(300, Math.max(-300, force * 0.3));

      accels[i].ax += (dx / distPx) * accelScale;
      accels[i].ay += (dy / distPx) * accelScale;
    }
  }

  // Symplectic Euler integration with physical viscous damping
  const damping = isQGP ? 0.94 : 0.88;
  const timeStep = Math.min(0.04, dt);

  for (let i = 0; i < updated.length; i++) {
    const q = updated[i];
    if (q.locked) {
      q.vx = 0;
      q.vy = 0;
      continue;
    }

    q.vx = (q.vx + accels[i].ax * timeStep) * damping;
    q.vy = (q.vy + accels[i].ay * timeStep) * damping;

    q.x += q.vx * timeStep * 60;
    q.y += q.vy * timeStep * 60;
  }

  return updated;
}
