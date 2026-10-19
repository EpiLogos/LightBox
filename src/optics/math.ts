/**
 * Optics Mathematical Foundations & Vector Utilities
 */

import type { Vector2D } from './types.ts';

export function vec(x: number, y: number): Vector2D {
  return { x, y };
}

export function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}

export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

export function lengthSq(v: Vector2D): number {
  return v.x * v.x + v.y * v.y;
}

export function length(v: Vector2D): number {
  return Math.sqrt(lengthSq(v));
}

export function normalize(v: Vector2D): Vector2D {
  const len = length(v);
  if (len < 1e-12) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function distance(a: Vector2D, b: Vector2D): number {
  return length(sub(b, a));
}

export function rotate(v: Vector2D, angleRad: number): Vector2D {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates ideal mirror reflection: r = v - 2(v · n)n
 * assumes n is normalized.
 */
export function reflect(v: Vector2D, n: Vector2D): Vector2D {
  const d = dot(v, n);
  return {
    x: v.x - 2 * d * n.x,
    y: v.y - 2 * d * n.y,
  };
}

/**
 * Calculates Snell's Law refraction in 2D vector form.
 * v: incident direction (normalized, pointing towards surface)
 * n: surface normal (normalized, pointing towards incident side such that dot(v, n) <= 0)
 * n1: refractive index of incident medium
 * n2: refractive index of transmitted medium
 *
 * Returns: { refracted: Vector2D, tir: boolean, rCoeff: number }
 */
export function refract(
  v: Vector2D,
  n: Vector2D,
  n1: number,
  n2: number
): { refracted: Vector2D; tir: boolean; rCoeff: number } {
  // cosTheta1 = -dot(v, n) since n opposes v
  let cosTheta1 = -dot(v, n);
  let normal = n;

  // Ensure normal is opposing incident ray
  if (cosTheta1 < 0) {
    cosTheta1 = -cosTheta1;
    normal = { x: -n.x, y: -n.y };
  }

  const eta = n1 / n2;
  const sin2Theta1 = Math.max(0, 1 - cosTheta1 * cosTheta1);
  const sin2Theta2 = eta * eta * sin2Theta1;

  // Check for Total Internal Reflection (TIR)
  if (sin2Theta2 > 1.0) {
    return {
      refracted: reflect(v, normal),
      tir: true,
      rCoeff: 1.0,
    };
  }

  const cosTheta2 = Math.sqrt(Math.max(0, 1.0 - sin2Theta2));

  // Exact physical Fresnel equations for unpolarized light (s- and p-polarization)
  const rs = (n1 * cosTheta1 - n2 * cosTheta2) / (n1 * cosTheta1 + n2 * cosTheta2);
  const rp = (n2 * cosTheta1 - n1 * cosTheta2) / (n2 * cosTheta1 + n1 * cosTheta2);
  const rCoeff = Math.min(1.0, Math.max(0.0, 0.5 * (rs * rs + rp * rp)));

  const refractedDir = normalize({
    x: eta * v.x + (eta * cosTheta1 - cosTheta2) * normal.x,
    y: eta * v.y + (eta * cosTheta1 - cosTheta2) * normal.y,
  });

  return {
    refracted: refractedDir,
    tir: false,
    rCoeff,
  };
}

/**
 * Calculates refractive index with Cauchy's chromatic dispersion formula:
 * n(lambda) = n0 + B * multiplier / (lambda_um^2)
 * lambda is in nm (e.g. 532nm -> 0.532 um)
 * Reference wavelength is green 532nm.
 */
export function getRefractiveIndexAtWavelength(
  n0: number,
  B: number,
  wavelengthNm: number,
  multiplier: number = 1.0
): number {
  if (B <= 0 || wavelengthNm <= 0 || multiplier <= 0) return n0;
  const lambdaUm = wavelengthNm / 1000.0;
  const refLambdaUm = 0.532; // reference wavelength for n0
  // Offset so that n(532nm) === n0
  const delta = (B * multiplier) * (1 / (lambdaUm * lambdaUm) - 1 / (refLambdaUm * refLambdaUm));
  return Math.max(1.0, n0 + delta);
}

/**
 * Returns calibrated visible wavelengths across the spectrum for polychromatic dispersion
 */
export function getSpectralBands(quality: 'fast' | 'balanced' | 'ultra' = 'balanced'): number[] {
  if (quality === 'fast') {
    return [660, 595, 532, 480, 420];
  }
  if (quality === 'ultra') {
    return [690, 660, 630, 605, 580, 560, 540, 520, 500, 480, 460, 435, 410];
  }
  // Balanced default (9 bands from red to deep violet)
  return [670, 635, 600, 570, 532, 500, 470, 440, 410];
}

/**
 * Converts visible wavelength in nanometers (380 - 750 nm) to CSS hex or RGB color
 */
export function wavelengthToRGB(wavelength: number): { r: number; g: number; b: number; hex: string } {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0.0;
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
    b = 0.0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  } else {
    // Fallback default laser green
    return { r: 34, g: 255, b: 120, hex: '#22ff78' };
  }

  // Intensity falloff near edges of vision
  let factor = 1.0;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  } else if (wavelength >= 700 && wavelength <= 780) {
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  }

  const gamma = 0.8;
  const R = Math.round(255 * Math.pow(Math.max(0, r * factor), gamma));
  const G = Math.round(255 * Math.pow(Math.max(0, g * factor), gamma));
  const B = Math.round(255 * Math.pow(Math.max(0, b * factor), gamma));

  const hex = `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  return { r: R, g: G, b: B, hex };
}
