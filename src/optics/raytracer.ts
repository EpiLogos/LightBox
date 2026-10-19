/**
 * Core 2D Geometric Optics Ray Tracing Engine
 */

import type {
  OpticalElement,
  Ray,
  RaySegment,
  Surface,
  SimulationStats,
  Vector2D,
} from './types.ts';
import {
  vec,
  add,
  sub,
  scale,
  dot,
  length,
  normalize,
  rotate,
  degToRad,
  reflect,
  refract,
  getRefractiveIndexAtWavelength,
  wavelengthToRGB,
  getSpectralBands,
} from './math.ts';
import { extractSurfaces, findClosestHit } from './geometry.ts';

export interface RayTracerOptions {
  maxBounces?: number;
  maxSegments?: number;
  minIntensity?: number;
  fresnelSplitting?: boolean;
  fresnelThreshold?: number;
  dispersionMultiplier?: number;
  ambientMediumIndex?: number;
  spectralQuality?: 'fast' | 'balanced' | 'ultra';
  lightProfile?: 'golden' | 'white' | 'green' | 'cyan' | 'ruby' | 'custom';
  beamOverlayWidth?: number;
}

const DEFAULT_OPTIONS: Required<RayTracerOptions> = {
  maxBounces: 35,
  maxSegments: 4500,
  minIntensity: 0.012,
  fresnelSplitting: true,
  fresnelThreshold: 0.04,
  dispersionMultiplier: 1.6,
  ambientMediumIndex: 1.0,
  spectralQuality: 'balanced',
  lightProfile: 'golden',
  beamOverlayWidth: 14,
};

export interface RayTracingResult {
  segments: RaySegment[];
  stats: SimulationStats;
  sensorReadings: Record<string, { power: number; rayCount: number }>;
}

/**
 * Generate initial primary rays from all light sources.
 */
export function generatePrimaryRays(
  elements: OpticalElement[],
  options?: RayTracerOptions
): Ray[] {
  const primaryRays: Ray[] = [];
  const config = { ...DEFAULT_OPTIONS, ...options };
  const spectralBands = getSpectralBands(config.spectralQuality);

  for (const el of elements) {
    const rotRad = degToRad(el.rotation);
    const forward = normalize(vec(Math.cos(rotRad), Math.sin(rotRad)));
    const lateral = vec(-forward.y, forward.x);
    const pos = vec(el.x, el.y);

    const isGlobalWhiteOrGolden =
      config.lightProfile === 'white' || config.lightProfile === 'golden';
    const isPolychromatic =
      el.type === 'polychromatic-source' ||
      ('colorMode' in el && (el.colorMode === 'white' || el.colorMode === 'golden')) ||
      (isGlobalWhiteOrGolden && !('colorMode' in el && el.colorMode === 'monochrome'));

    const elemColor = 'color' in el && typeof el.color === 'string' ? el.color : null;
    const elemWavelength = 'wavelength' in el && typeof el.wavelength === 'number' ? el.wavelength : 532;

    const initialColor =
      config.lightProfile === 'golden' || ('colorMode' in el && el.colorMode === 'golden')
        ? '#fff1aa' // Incandescent warm golden
        : config.lightProfile === 'white' || ('colorMode' in el && el.colorMode === 'white')
        ? '#ffffff' // Crisp pure white
        : elemColor || wavelengthToRGB(elemWavelength).hex;

    if (el.type === 'laser-single') {
      if (!el.enabled) continue;

      if (isPolychromatic) {
        // Spawn spectral bundle along single beam
        for (const wl of spectralBands) {
          primaryRays.push({
            origin: pos,
            direction: forward,
            wavelength: wl,
            color: initialColor,
            intensity: Math.min(el.power || 1.0, 1.0) / Math.sqrt(spectralBands.length / 4),
            generation: 0,
          });
        }
      } else {
        const rgb = wavelengthToRGB(el.wavelength);
        primaryRays.push({
          origin: pos,
          direction: forward,
          wavelength: el.wavelength,
          color: el.color || rgb.hex,
          intensity: Math.min(el.power || 1.0, 1.0),
          generation: 0,
        });
      }
    } else if (el.type === 'laser-array') {
      if (!el.enabled) continue;
      const count = Math.max(1, el.rayCount || 5);
      const spacing = el.spacing || 15;
      const startOffset = -((count - 1) * spacing) / 2;

      for (let i = 0; i < count; i++) {
        const offset = startOffset + i * spacing;
        const rayOrigin = add(pos, scale(lateral, offset));

        if (isPolychromatic) {
          for (const wl of spectralBands) {
            primaryRays.push({
              origin: rayOrigin,
              direction: forward,
              wavelength: wl,
              color: initialColor,
              intensity: Math.min(el.power || 1.0, 1.0) / Math.sqrt(spectralBands.length / 4),
              generation: 0,
            });
          }
        } else {
          const rgb = wavelengthToRGB(el.wavelength);
          primaryRays.push({
            origin: rayOrigin,
            direction: forward,
            wavelength: el.wavelength,
            color: el.color || rgb.hex,
            intensity: Math.min(el.power || 1.0, 1.0),
            generation: 0,
          });
        }
      }
    } else if (el.type === 'radial-source') {
      if (!el.enabled) continue;
      const count = Math.max(4, el.rayCount || 36);
      const spread = degToRad(el.spreadAngle || 360);
      const isFullCircle = (el.spreadAngle || 360) >= 359;

      const step = isFullCircle ? spread / count : spread / Math.max(1, count - 1);
      const startAngle = rotRad - (isFullCircle ? 0 : spread / 2);

      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * step;
        const dir = normalize(vec(Math.cos(angle), Math.sin(angle)));

        if (isPolychromatic) {
          // For radial source, use balanced or fast bands to keep high FPS
          const radialBands = config.spectralQuality === 'ultra' ? spectralBands : getSpectralBands('fast');
          for (const wl of radialBands) {
            primaryRays.push({
              origin: pos,
              direction: dir,
              wavelength: wl,
              color: initialColor,
              intensity: Math.min(el.power || 1.0, 1.0) / 1.5,
              generation: 0,
            });
          }
        } else {
          const rgb = wavelengthToRGB(el.wavelength);
          primaryRays.push({
            origin: pos,
            direction: dir,
            wavelength: el.wavelength,
            color: el.color || rgb.hex,
            intensity: Math.min(el.power || 1.0, 1.0),
            generation: 0,
          });
        }
      }
    } else if (el.type === 'polychromatic-source') {
      if (!el.enabled) continue;
      const bands = el.spectralBands && el.spectralBands.length > 0
        ? el.spectralBands
        : spectralBands;
      const rayCount = Math.max(1, el.rayCount || 3);
      const spacing = el.spacing || 18;
      const startOffset = -((rayCount - 1) * spacing) / 2;

      for (let i = 0; i < rayCount; i++) {
        const offset = startOffset + i * spacing;
        const beamOrigin = add(pos, scale(lateral, offset));

        for (const wl of bands) {
          primaryRays.push({
            origin: beamOrigin,
            direction: forward,
            wavelength: wl,
            color: initialColor,
            intensity: Math.min(el.power || 1.0, 1.0) / 1.4,
            generation: 0,
          });
        }
      }
    }
  }

  return primaryRays;
}

/**
 * Executes full ray-tracing pass across all elements in the scene.
 */
export function traceRays(
  elements: OpticalElement[],
  options?: RayTracerOptions
): RayTracingResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const config = { ...DEFAULT_OPTIONS, ...options };

  // 1. Gather all optical surfaces
  const surfaces: Surface[] = [];
  for (const el of elements) {
    const elSurfaces = extractSurfaces(el);
    for (let i = 0; i < elSurfaces.length; i++) {
      surfaces.push(elSurfaces[i]);
    }
  }

  // 2. Initialize primary rays
  const primaryRays = generatePrimaryRays(elements, config);
  const rayQueue: Ray[] = [...primaryRays];
  const segments: RaySegment[] = [];
  const sensorReadings: Record<string, { power: number; rayCount: number }> = {};
  let tirCount = 0;
  let refractionCount = 0;
  let totalLength = 0;

  // Initialize sensors
  for (const el of elements) {
    if (el.type === 'sensor') {
      sensorReadings[el.id] = { power: 0, rayCount: 0 };
    }
  }

  const MAX_ESCAPE_DIST = 3200; // Ray continues into void if no surface hit

  // 3. Process ray queue
  while (rayQueue.length > 0 && segments.length < config.maxSegments) {
    const currentRay = rayQueue.shift()!;

    if (
      currentRay.generation >= config.maxBounces ||
      currentRay.intensity < config.minIntensity
    ) {
      continue;
    }

    const hit = findClosestHit(currentRay, surfaces);

    if (!hit) {
      // Ray escapes into the scene distance
      const endPoint = add(currentRay.origin, scale(currentRay.direction, MAX_ESCAPE_DIST));
      segments.push({
        p1: currentRay.origin,
        p2: endPoint,
        wavelength: currentRay.wavelength,
        color: currentRay.color,
        intensity: currentRay.intensity,
      });
      totalLength += MAX_ESCAPE_DIST;
      continue;
    }

    // Ray hit a surface
    const segDist = length(sub(hit.point, currentRay.origin));
    totalLength += segDist;

    segments.push({
      p1: currentRay.origin,
      p2: hit.point,
      wavelength: currentRay.wavelength,
      color: currentRay.color,
      intensity: currentRay.intensity,
    });

    const surf = hit.surface;

    // Handle Surface Types
    if (surf.surfaceType === 'mirror') {
      const reflectedDir = reflect(currentRay.direction, hit.normal);
      rayQueue.push({
        origin: add(hit.point, scale(reflectedDir, 1e-3)),
        direction: reflectedDir,
        wavelength: currentRay.wavelength,
        color: currentRay.color,
        intensity: currentRay.intensity * 0.98, // small realistic reflectance loss
        generation: currentRay.generation + 1,
      });
    } else if (surf.surfaceType === 'dielectric') {
      // Medium 1 to Medium 2 or vice versa (supports glass-to-glass like cemented doublets)
      const ambientN = config.ambientMediumIndex || 1.0;
      const outerN = surf.n1 > 0 ? surf.n1 : ambientN;
      const outerDisp = surf.dispersion1 || 0;
      const innerN = surf.n2;
      const innerDisp = surf.dispersion || 0;

      const outerIndexAtLambda = outerN > 1.0 && outerDisp > 0
        ? getRefractiveIndexAtWavelength(outerN, outerDisp, currentRay.wavelength, config.dispersionMultiplier)
        : outerN;
      const innerIndexAtLambda = getRefractiveIndexAtWavelength(
        innerN,
        innerDisp,
        currentRay.wavelength,
        config.dispersionMultiplier
      );

      const n1 = hit.fromInside ? innerIndexAtLambda : outerIndexAtLambda;
      const n2 = hit.fromInside ? outerIndexAtLambda : innerIndexAtLambda;

      // Beer-Lambert absorption inside absorbing glass
      if (hit.fromInside && surf.absorptionCoeff && surf.absorptionCoeff > 0) {
        const distCm = segDist / 50.0;
        currentRay.intensity *= Math.exp(-surf.absorptionCoeff * distCm);
      }

      const { refracted, tir, rCoeff } = refract(
        currentRay.direction,
        hit.normal,
        n1,
        n2
      );

      // Reveal spectral color once the beam undergoes dispersion
      const hasDispersion = (innerDisp > 0 || outerDisp > 0) && config.dispersionMultiplier > 0.05;
      const spectralColor = hasDispersion
        ? wavelengthToRGB(currentRay.wavelength).hex
        : currentRay.color;

      if (tir) {
        // Total Internal Reflection
        tirCount++;
        rayQueue.push({
          origin: add(hit.point, scale(refracted, 1e-3)),
          direction: refracted,
          wavelength: currentRay.wavelength,
          color: spectralColor,
          intensity: currentRay.intensity,
          generation: currentRay.generation + 1,
        });
      } else {
        // Transmitted Ray
        refractionCount++;
        const transmittedIntensity = currentRay.intensity * (1.0 - rCoeff);
        if (transmittedIntensity > config.minIntensity) {
          rayQueue.push({
            origin: add(hit.point, scale(refracted, 1e-3)),
            direction: refracted,
            wavelength: currentRay.wavelength,
            color: spectralColor,
            intensity: transmittedIntensity,
            generation: currentRay.generation + 1,
          });
        }

        // Partial Fresnel Reflection (if enabled and within budget)
        if (
          config.fresnelSplitting &&
          rCoeff > (config.fresnelThreshold || 0.04) &&
          currentRay.generation < 12 &&
          rayQueue.length < 900
        ) {
          const reflDir = reflect(currentRay.direction, hit.normal);
          const reflectedIntensity = currentRay.intensity * rCoeff;
          if (reflectedIntensity > config.minIntensity) {
            rayQueue.push({
              origin: add(hit.point, scale(reflDir, 1e-3)),
              direction: reflDir,
              wavelength: currentRay.wavelength,
              color: currentRay.color,
              intensity: reflectedIntensity,
              generation: currentRay.generation + 1,
            });
          }
        }
      }
    } else if (surf.surfaceType === 'splitter') {
      const splitRatio = surf.splitRatio || 0.5;

      // Transmitted Ray
      const transDir = currentRay.direction;
      const transIntensity = currentRay.intensity * (1.0 - splitRatio);
      if (transIntensity > config.minIntensity) {
        rayQueue.push({
          origin: add(hit.point, scale(transDir, 1e-3)),
          direction: transDir,
          wavelength: currentRay.wavelength,
          color: currentRay.color,
          intensity: transIntensity,
          generation: currentRay.generation + 1,
        });
      }

      // Reflected Ray
      const reflDir = reflect(currentRay.direction, hit.normal);
      const reflIntensity = currentRay.intensity * splitRatio;
      if (reflIntensity > config.minIntensity) {
        rayQueue.push({
          origin: add(hit.point, scale(reflDir, 1e-3)),
          direction: reflDir,
          wavelength: currentRay.wavelength,
          color: currentRay.color,
          intensity: reflIntensity,
          generation: currentRay.generation + 1,
        });
      }
    } else if (surf.surfaceType === 'diffractor') {
      const linesPerMm = surf.linesPerMm || 600;
      const d = 1e-3 / linesPerMm;
      const lambdaM = currentRay.wavelength * 1e-9;

      const tan = vec(-hit.normal.y, hit.normal.x);
      const sinThetaI = dot(currentRay.direction, tan);

      // m = 0
      rayQueue.push({
        origin: add(hit.point, scale(currentRay.direction, 1e-3)),
        direction: currentRay.direction,
        wavelength: currentRay.wavelength,
        color: currentRay.color,
        intensity: currentRay.intensity * 0.45,
        generation: currentRay.generation + 1,
      });

      // m = +1 and -1
      for (const m of [-1, 1]) {
        const sinThetaM = sinThetaI + (m * lambdaM) / d;
        if (Math.abs(sinThetaM) <= 0.999) {
          const cosThetaM = Math.sqrt(1 - sinThetaM * sinThetaM);
          const diffDir = normalize(
            add(scale(tan, sinThetaM), scale(hit.normal, -cosThetaM))
          );
          rayQueue.push({
            origin: add(hit.point, scale(diffDir, 1e-3)),
            direction: diffDir,
            wavelength: currentRay.wavelength,
            color: wavelengthToRGB(currentRay.wavelength).hex,
            intensity: currentRay.intensity * 0.25,
            generation: currentRay.generation + 1,
          });
        }
      }
    } else if (surf.surfaceType === 'sensor') {
      const id = surf.elementId;
      if (!sensorReadings[id]) {
        sensorReadings[id] = { power: 0, rayCount: 0 };
      }
      sensorReadings[id].power += currentRay.intensity;
      sensorReadings[id].rayCount += 1;
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    segments,
    stats: {
      rayCount: primaryRays.length,
      segmentCount: segments.length,
      elementCount: elements.length,
      computeTimeMs: Math.round((endTime - startTime) * 10) / 10,
      tirCount,
      refractionCount,
      totalLengthMeters: Math.round((totalLength / 100) * 10) / 10,
    },
    sensorReadings,
  };
}
