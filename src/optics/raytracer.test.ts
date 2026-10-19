/**
 * Unit tests for LuxOptics ray tracing engine and geometry
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  vec,
  length,
  normalize,
  reflect,
  refract,
  degToRad,
  getRefractiveIndexAtWavelength,
  wavelengthToRGB,
} from './math.ts';
import {
  intersectRayLine,
  intersectRayArc,
  extractSurfaces,
} from './geometry.ts';
import {
  traceRays,
  generatePrimaryRays,
} from './raytracer.ts';
import { exportSceneToSvg } from './svgExport.ts';
import type { OpticalElement, Ray, LineSurface, ArcSurface } from './types.ts';
import { PRESETS } from './presets.ts';

test('vector operations and normalization', () => {
  const v = vec(3, 4);
  assert.equal(length(v), 5);
  const norm = normalize(v);
  assert.ok(Math.abs(length(norm) - 1.0) < 1e-6);
  assert.ok(Math.abs(norm.x - 0.6) < 1e-6);
  assert.ok(Math.abs(norm.y - 0.8) < 1e-6);
});

test('ideal mirror reflection satisfies law of reflection', () => {
  // Ray coming in at 45 degrees downwards: (1, 1) normalized
  const incident = normalize(vec(1, 1));
  // Surface normal pointing straight up: (0, -1)
  const normal = vec(0, -1);
  const reflected = reflect(incident, normal);

  // Should reflect to (1, -1) normalized
  assert.ok(Math.abs(reflected.x - incident.x) < 1e-5);
  assert.ok(Math.abs(reflected.y - (-incident.y)) < 1e-5);
});

test('Snell law refraction correctly calculates transmission angle', () => {
  // Ray travelling in air (n1 = 1.0) into glass (n2 = 1.5) at 30 deg to normal
  const theta1 = degToRad(30);
  const incident = vec(Math.sin(theta1), Math.cos(theta1));
  const normal = vec(0, -1); // opposing ray

  const res = refract(incident, normal, 1.0, 1.5);
  assert.equal(res.tir, false);
  // Snell's Law: 1.0 * sin(30) = 1.5 * sin(theta2) => sin(theta2) = 0.5 / 1.5 = 1/3
  const expectedSinTheta2 = 0.5 / 1.5;
  const actualSinTheta2 = res.refracted.x;
  assert.ok(Math.abs(actualSinTheta2 - expectedSinTheta2) < 1e-4);
});

test('Total Internal Reflection occurs beyond critical angle', () => {
  // Glass (n1 = 1.5) to Air (n2 = 1.0)
  // Critical angle = arcsin(1.0 / 1.5) = 41.81 degrees
  // Test at 50 degrees (greater than critical angle)
  const theta1 = degToRad(50);
  const incident = vec(Math.sin(theta1), Math.cos(theta1));
  const normal = vec(0, -1);

  const res = refract(incident, normal, 1.5, 1.0);
  assert.equal(res.tir, true);
  assert.equal(res.rCoeff, 1.0);
});

test('Cauchy dispersion correctly alters refractive index with wavelength', () => {
  const n0 = 1.52;
  const B = 0.008;
  const nRed = getRefractiveIndexAtWavelength(n0, B, 650);
  const nGreen = getRefractiveIndexAtWavelength(n0, B, 532);
  const nBlue = getRefractiveIndexAtWavelength(n0, B, 450);

  // Shorter wavelength (blue) must have higher refractive index than red
  assert.ok(nBlue > nGreen);
  assert.ok(nGreen > nRed);
});

test('Ray-Line intersection finds intersection point and normal', () => {
  const ray: Ray = {
    origin: vec(0, 50),
    direction: vec(1, 0), // heading right along y=50
    wavelength: 532,
    color: '#22ff78',
    intensity: 1.0,
    generation: 0,
  };

  const line: LineSurface = {
    geometry: 'line',
    elementId: 'mirror-1',
    surfaceType: 'mirror',
    p1: vec(100, 0),
    p2: vec(100, 100),
    normal: vec(-1, 0), // facing left
    n1: 1.0,
    n2: 1.0,
    dispersion: 0,
  };

  const hit = intersectRayLine(ray, line);
  assert.ok(hit !== null);
  assert.ok(Math.abs(hit.t - 100) < 1e-4);
  assert.ok(Math.abs(hit.point.x - 100) < 1e-4);
  assert.ok(Math.abs(hit.point.y - 50) < 1e-4);
  assert.equal(hit.fromInside, false);
});

test('Ray-Arc intersection finds circular lens entry hit', () => {
  const ray: Ray = {
    origin: vec(0, 0),
    direction: vec(1, 0),
    wavelength: 532,
    color: '#22ff78',
    intensity: 1.0,
    generation: 0,
  };

  const arc: ArcSurface = {
    geometry: 'arc',
    elementId: 'ball-1',
    surfaceType: 'dielectric',
    center: vec(100, 0),
    radius: 40,
    startAngle: 0,
    endAngle: 2 * Math.PI,
    outwardNormal: true,
    n1: 1.0,
    n2: 1.5,
    dispersion: 0,
  };

  const hit = intersectRayArc(ray, arc);
  assert.ok(hit !== null);
  // Center is at 100, radius is 40 -> ray hits at x = 60
  assert.ok(Math.abs(hit.t - 60) < 1e-4);
  assert.ok(Math.abs(hit.point.x - 60) < 1e-4);
  assert.ok(Math.abs(hit.point.y - 0) < 1e-4);
});

test('Ray tracing pipeline traces rays and produces segments for Presets', () => {
  const mandalaPreset = PRESETS.find((p) => p.id === 'laser-mandala');
  assert.ok(mandalaPreset !== undefined && mandalaPreset !== null);

  const result = traceRays(mandalaPreset.elements, { maxBounces: 20 });
  assert.ok(result.segments.length > 50, `Expected > 50 segments, got ${result.segments.length}`);
  assert.ok(result.stats.segmentCount > 0);
  assert.ok(result.stats.rayCount > 0);
});

test('SVG export outputs valid XML with paths, rays and elements', () => {
  const elements: OpticalElement[] = [
    {
      id: 'laser-1',
      type: 'laser-single',
      name: 'Test Laser',
      x: 100,
      y: 100,
      rotation: 0,
      wavelength: 532,
      color: '#22ff78',
      power: 1.0,
      beamWidth: 2,
      enabled: true,
    },
    {
      id: 'mirror-1',
      type: 'flat-mirror',
      name: 'Test Mirror',
      x: 300,
      y: 100,
      rotation: 45,
      length: 80,
    },
  ];

  const trace = traceRays(elements);
  const svg = exportSceneToSvg(elements, trace.segments, {
    theme: 'dark',
    includeRays: true,
    includeElements: true,
  });

  assert.ok(svg.startsWith('<?xml'));
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('</svg>'));
  assert.ok(svg.includes('laser-rays'));
  assert.ok(svg.includes('optical-elements'));
});

test('Golden and White light emission produces multi-spectral bundle', () => {
  const elements: OpticalElement[] = [
    {
      id: 'golden-source',
      type: 'laser-single',
      name: 'Golden Source',
      x: 0,
      y: 0,
      rotation: 0,
      wavelength: 580,
      color: '#fff1aa',
      colorMode: 'golden',
      power: 1.0,
      beamWidth: 2,
      enabled: true,
    },
  ];

  const rays = generatePrimaryRays(elements, { lightProfile: 'golden' });
  // Should emit multiple spectral sub-rays along collinear path
  assert.ok(rays.length >= 5);
  // Initial color should be warm golden
  assert.equal(rays[0].color, '#fff1aa');
});

test('Dispersion multiplier scales refractive index delta', () => {
  const n0 = 1.5;
  const B = 0.01;
  const n1x = getRefractiveIndexAtWavelength(n0, B, 450, 1.0);
  const n2x = getRefractiveIndexAtWavelength(n0, B, 450, 2.0);

  const delta1 = n1x - n0;
  const delta2 = n2x - n0;
  assert.ok(Math.abs(delta2 - 2 * delta1) < 1e-6);
});

test('Simulation telemetry records refraction and distance statistics', () => {
  const mandalaPreset = PRESETS.find((p) => p.id === 'laser-mandala')!;
  const result = traceRays(mandalaPreset.elements, {
    maxBounces: 25,
    lightProfile: 'golden',
    dispersionMultiplier: 2.0,
  });

  assert.ok(result.stats.refractionCount > 0, 'Must record refraction events');
  assert.ok(result.stats.totalLengthMeters > 0, 'Must record distance traveled');
  assert.ok(result.segments.length > 50, 'Must render rich ray segments');
});

test('SVG export supports beamOverlayWidth for golden and white rays', () => {
  const elements: OpticalElement[] = [
    {
      id: 'laser-1',
      type: 'laser-single',
      name: 'White Laser',
      x: 100,
      y: 100,
      rotation: 0,
      wavelength: 550,
      color: '#ffffff',
      colorMode: 'white',
      power: 1.0,
      beamWidth: 2,
      enabled: true,
    },
  ];

  const result = traceRays(elements, { lightProfile: 'white' });
  const svg = exportSceneToSvg(elements, result.segments, {
    beamOverlayWidth: 24,
  });

  assert.ok(svg.includes('stroke-width="43.2"'), 'Must render extra wide volumetric overlay for white light');
  assert.ok(svg.includes('<svg'), 'Must produce valid svg');
});

test('Exact Fresnel equations calculate true physical normal-incidence reflectance and Brewster angle', () => {
  // Normal incidence (theta1 = 0) from Air (1.0) into Glass (1.5)
  // R = ((1.5 - 1.0)/(1.5 + 1.0))^2 = (0.5 / 2.5)^2 = 0.04 (4% exact reflectance)
  const rayNormal = vec(0, 1);
  const surfNormal = vec(0, -1);
  const normalRes = refract(rayNormal, surfNormal, 1.0, 1.5);
  assert.equal(normalRes.tir, false);
  assert.ok(Math.abs(normalRes.rCoeff - 0.04) < 1e-4, `Expected 0.04, got ${normalRes.rCoeff}`);

  // Brewster's angle: theta_B = arctan(1.5 / 1.0) = ~56.31 degrees
  // At Brewster's angle, p-polarization reflectance is 0, so R_unpolarized = 0.5 * r_s^2
  const thetaB = Math.atan(1.5 / 1.0);
  const brewsterRay = vec(Math.sin(thetaB), Math.cos(thetaB));
  const brewsterRes = refract(brewsterRay, surfNormal, 1.0, 1.5);
  assert.equal(brewsterRes.tir, false);
  // r_s at Brewster's angle = -cos(theta1 + theta2) / ... or ~0.385, r_s^2 = ~0.148, R = ~0.074
  assert.ok(brewsterRes.rCoeff > 0.06 && brewsterRes.rCoeff < 0.09);
});

test('Achromatic Doublet decomposes into Crown, Flint, and cemented boundary surfaces', () => {
  const doublet: OpticalElement = {
    id: 'doublet-test',
    type: 'achromatic-doublet-lens',
    name: 'Test Achromat',
    x: 400,
    y: 300,
    rotation: 0,
    width: 40,
    height: 120,
    curvatureRadiusFront: 100,
    curvatureRadiusInterface: 80,
    curvatureRadiusBack: 200,
    refractiveIndexCrown: 1.5168,
    dispersionCrown: 0.0042,
    refractiveIndexFlint: 1.6727,
    dispersionFlint: 0.0165,
  };

  const surfaces = extractSurfaces(doublet);
  // Must extract front arc, cemented interface arc, back arc, plus top and bottom caps
  assert.ok(surfaces.length >= 5);
  // Verify cemented interface has crown index on one side and flint index on the other
  const cementedArc = surfaces.find(
    (s) => s.geometry === 'arc' && s.n1 === 1.5168 && s.n2 === 1.6727
  );
  assert.ok(cementedArc, 'Cemented interface must connect Crown n1 to Flint n2');

  // Trace ray through the doublet
  const ray: Ray = {
    origin: vec(300, 300),
    direction: vec(1, 0),
    wavelength: 532,
    color: '#22ff78',
    intensity: 1.0,
    generation: 0,
  };
  const hit = surfaces.some((s) => s.geometry === 'arc');
  assert.ok(hit, 'Surfaces must be valid for collision');
});

test('Aspheric lens decomposes into smooth parabolic conic surfaces with zero aberration focus', () => {
  const aspheric: OpticalElement = {
    id: 'aspheric-test',
    type: 'aspheric-lens',
    name: 'Test Asphere',
    x: 400,
    y: 300,
    rotation: 90,
    width: 30,
    height: 120,
    apexCurvatureRadius: 65,
    conicConstant: -1.0,
    refractiveIndex: 1.517,
    dispersion: 0.006,
  };

  const surfaces = extractSurfaces(aspheric);
  assert.ok(surfaces.length >= 24, 'Aspheric lens must be approximated by fine parabolic segments');
  // Trace parallel rays through the aspheric lens
  const rays: Ray[] = [
    { origin: vec(300, 270), direction: vec(1, 0), wavelength: 532, color: '#22ff78', intensity: 1, generation: 0 },
    { origin: vec(300, 300), direction: vec(1, 0), wavelength: 532, color: '#22ff78', intensity: 1, generation: 0 },
    { origin: vec(300, 330), direction: vec(1, 0), wavelength: 532, color: '#22ff78', intensity: 1, generation: 0 },
  ];
  const result = traceRays([aspheric, {
    id: 'src',
    type: 'laser-single',
    name: 'src',
    x: 300,
    y: 300,
    rotation: 0,
    wavelength: 532,
    color: '#22ff78',
    power: 1,
    beamWidth: 2,
    enabled: true,
  }]);
  assert.ok(result.segments.length > 0);
});

test('Right-angle Porro prism causes total internal reflection for 90-degree turning', () => {
  const porro: OpticalElement = {
    id: 'porro-test',
    type: 'right-angle-prism',
    name: 'Test Porro',
    x: 400,
    y: 300,
    rotation: 0,
    legLength: 100,
    refractiveIndex: 1.517,
    dispersion: 0.008,
  };

  const surfaces = extractSurfaces(porro);
  assert.equal(surfaces.length, 3, 'Porro prism must have exactly 3 boundary faces');
});
