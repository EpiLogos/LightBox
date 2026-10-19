/**
 * Core types for LuxOptics Ray Tracing Simulation
 */

export interface Vector2D {
  x: number;
  y: number;
}

export type OpticalElementType =
  | 'laser-single'
  | 'laser-array'
  | 'radial-source'
  | 'polychromatic-source'
  | 'biconvex-lens'
  | 'biconcave-lens'
  | 'plano-convex-lens'
  | 'plano-concave-lens'
  | 'meniscus-converging-lens'
  | 'meniscus-diverging-lens'
  | 'achromatic-doublet-lens'
  | 'aspheric-lens'
  | 'cylindrical-lens'
  | 'ball-lens'
  | 'prism'
  | 'right-angle-prism'
  | 'dove-prism'
  | 'block-lens'
  | 'polygon-lens'
  | 'flat-mirror'
  | 'concave-mirror'
  | 'convex-mirror'
  | 'parabolic-mirror'
  | 'corner-cube'
  | 'kaleidoscope'
  | 'beam-splitter'
  | 'diffraction-grating'
  | 'aperture'
  | 'screen'
  | 'sensor';

export interface BaseElement {
  id: string;
  type: OpticalElementType;
  name: string;
  x: number;
  y: number;
  rotation: number; // in degrees
  selected?: boolean;
}

// Light Emitters
export type LightColorProfile = 'golden' | 'white' | 'green' | 'cyan' | 'ruby' | 'custom';

export interface LaserSingleElement extends BaseElement {
  type: 'laser-single';
  wavelength: number; // in nm, e.g. 532 (green), 650 (red), 450 (blue)
  color: string;
  colorMode?: 'golden' | 'white' | 'monochrome';
  power: number; // 0.1 to 5.0
  beamWidth: number;
  enabled: boolean;
}

export interface LaserArrayElement extends BaseElement {
  type: 'laser-array';
  wavelength: number;
  color: string;
  colorMode?: 'golden' | 'white' | 'monochrome';
  power: number;
  rayCount: number; // 3 to 31
  spacing: number; // distance between rays in px
  enabled: boolean;
}

export interface RadialSourceElement extends BaseElement {
  type: 'radial-source';
  wavelength: number;
  color: string;
  colorMode?: 'golden' | 'white' | 'monochrome';
  power: number;
  rayCount: number; // 12 to 360
  spreadAngle: number; // 10 to 360 degrees
  enabled: boolean;
}

export interface PolychromaticSourceElement extends BaseElement {
  type: 'polychromatic-source';
  power: number;
  rayCount: number; // parallel rays
  spacing: number;
  colorMode?: 'golden' | 'white' | 'monochrome';
  spectralBands: number[]; // wavelengths, e.g. [650, 580, 532, 490, 450, 410]
  enabled: boolean;
}

// Refractive Lenses & Glass Elements
export interface BiconvexLensElement extends BaseElement {
  type: 'biconvex-lens';
  width: number;
  height: number;
  curvatureRadius: number;
  refractiveIndex: number; // e.g. 1.5168
  dispersion: number; // Cauchy coefficient B in um^2
}

export interface BiconcaveLensElement extends BaseElement {
  type: 'biconcave-lens';
  width: number;
  height: number;
  curvatureRadius: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface PlanoConvexLensElement extends BaseElement {
  type: 'plano-convex-lens';
  width: number;
  height: number;
  curvatureRadius: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface PlanoConcaveLensElement extends BaseElement {
  type: 'plano-concave-lens';
  width: number;
  height: number;
  curvatureRadius: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface MeniscusConvergingLensElement extends BaseElement {
  type: 'meniscus-converging-lens';
  width: number;
  height: number;
  curvatureRadius1: number; // front convex surface R1
  curvatureRadius2: number; // back concave surface R2 (R1 < R2 for positive meniscus)
  refractiveIndex: number;
  dispersion: number;
}

export interface MeniscusDivergingLensElement extends BaseElement {
  type: 'meniscus-diverging-lens';
  width: number;
  height: number;
  curvatureRadius1: number; // front concave surface R1
  curvatureRadius2: number; // back surface R2
  refractiveIndex: number;
  dispersion: number;
}

export interface AchromaticDoubletElement extends BaseElement {
  type: 'achromatic-doublet-lens';
  width: number;
  height: number;
  curvatureRadiusFront: number; // front surface R1 (Crown)
  curvatureRadiusInterface: number; // cemented interface R2
  curvatureRadiusBack: number; // back surface R3 (Flint)
  refractiveIndexCrown: number; // e.g. 1.5168 (N-BK7 Crown)
  dispersionCrown: number; // e.g. 0.0042
  refractiveIndexFlint: number; // e.g. 1.6727 (N-SF11 Flint)
  dispersionFlint: number; // e.g. 0.0165
}

export interface AsphericLensElement extends BaseElement {
  type: 'aspheric-lens';
  width: number;
  height: number;
  apexCurvatureRadius: number; // R
  conicConstant: number; // k = -1 for true paraboloid (zero spherical aberration)
  refractiveIndex: number;
  dispersion: number;
}

export interface CylindricalLensElement extends BaseElement {
  type: 'cylindrical-lens';
  width: number;
  height: number;
  curvatureRadius: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface RightAnglePrismElement extends BaseElement {
  type: 'right-angle-prism';
  legLength: number; // legs of 45-90-45 degree prism
  refractiveIndex: number;
  dispersion: number;
}

export interface DovePrismElement extends BaseElement {
  type: 'dove-prism';
  height: number;
  baseLength: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface BallLensElement extends BaseElement {
  type: 'ball-lens';
  radius: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface PrismElement extends BaseElement {
  type: 'prism';
  sideLength: number;
  apexAngle: number; // degrees, default 60
  refractiveIndex: number;
  dispersion: number;
}

export interface BlockLensElement extends BaseElement {
  type: 'block-lens';
  width: number;
  height: number;
  refractiveIndex: number;
  dispersion: number;
}

export interface PolygonLensElement extends BaseElement {
  type: 'polygon-lens';
  vertices: Vector2D[]; // relative to (x, y)
  refractiveIndex: number;
  dispersion: number;
}

// Mirrors
export interface FlatMirrorElement extends BaseElement {
  type: 'flat-mirror';
  length: number;
  twoSided?: boolean;
}

export interface ConcaveMirrorElement extends BaseElement {
  type: 'concave-mirror';
  width: number;
  curvatureRadius: number;
}

export interface ConvexMirrorElement extends BaseElement {
  type: 'convex-mirror';
  width: number;
  curvatureRadius: number;
}

export interface ParabolicMirrorElement extends BaseElement {
  type: 'parabolic-mirror';
  width: number;
  focalLength: number;
}

export interface CornerCubeElement extends BaseElement {
  type: 'corner-cube';
  size: number;
}

export interface KaleidoscopeElement extends BaseElement {
  type: 'kaleidoscope';
  sides: number; // 3 (triangle), 4 (square), 6 (hexagon)
  radius: number;
  length: number;
}

// Splitters & Specialty
export interface BeamSplitterElement extends BaseElement {
  type: 'beam-splitter';
  length: number;
  splitRatio: number; // 0.1 to 0.9 (default 0.5)
}

export interface DiffractionGratingElement extends BaseElement {
  type: 'diffraction-grating';
  length: number;
  linesPerMm: number; // 300 to 1200
}

export interface ApertureElement extends BaseElement {
  type: 'aperture';
  width: number;
  slitWidth: number;
}

export interface ScreenElement extends BaseElement {
  type: 'screen';
  length: number;
}

export interface SensorElement extends BaseElement {
  type: 'sensor';
  length: number;
  detectedPower: number;
  detectedRays: number;
}

export type OpticalElement =
  | LaserSingleElement
  | LaserArrayElement
  | RadialSourceElement
  | PolychromaticSourceElement
  | BiconvexLensElement
  | BiconcaveLensElement
  | PlanoConvexLensElement
  | PlanoConcaveLensElement
  | MeniscusConvergingLensElement
  | MeniscusDivergingLensElement
  | AchromaticDoubletElement
  | AsphericLensElement
  | CylindricalLensElement
  | BallLensElement
  | PrismElement
  | RightAnglePrismElement
  | DovePrismElement
  | BlockLensElement
  | PolygonLensElement
  | FlatMirrorElement
  | ConcaveMirrorElement
  | ConvexMirrorElement
  | ParabolicMirrorElement
  | CornerCubeElement
  | KaleidoscopeElement
  | BeamSplitterElement
  | DiffractionGratingElement
  | ApertureElement
  | ScreenElement
  | SensorElement;

// Ray Tracing Types
export interface Ray {
  origin: Vector2D;
  direction: Vector2D; // normalized
  wavelength: number; // in nm
  color: string;
  intensity: number; // 0.0 to 1.0
  generation: number; // bounce counter
}

export interface RaySegment {
  p1: Vector2D;
  p2: Vector2D;
  wavelength: number;
  color: string;
  intensity: number;
}

export type SurfaceType =
  | 'mirror'
  | 'dielectric'
  | 'splitter'
  | 'diffractor'
  | 'absorber'
  | 'sensor';

export interface BaseSurface {
  elementId: string;
  surfaceType: SurfaceType;
  n1: number; // refractive index on "outer" side (usually air 1.0)
  n2: number; // refractive index on "inner" side (medium)
  dispersion: number; // Cauchy dispersion coefficient B for n2
  dispersion1?: number; // Cauchy dispersion coefficient B for n1 (if transitioning between glasses)
  absorptionCoeff?: number; // Beer-Lambert linear absorption coefficient (1/cm)
  splitRatio?: number;
  linesPerMm?: number;
}

export interface LineSurface extends BaseSurface {
  geometry: 'line';
  p1: Vector2D;
  p2: Vector2D;
  normal: Vector2D; // points outward (from medium to air, or reflective face)
}

export interface ArcSurface extends BaseSurface {
  geometry: 'arc';
  center: Vector2D;
  radius: number;
  startAngle: number; // in radians
  endAngle: number; // in radians
  outwardNormal: boolean; // true if normal points away from center
}

export type Surface = LineSurface | ArcSurface;

export interface HitResult {
  t: number; // distance along ray
  point: Vector2D;
  normal: Vector2D; // normalized surface normal facing ray origin
  surface: Surface;
  fromInside: boolean;
}

export interface SimulationStats {
  rayCount: number;
  segmentCount: number;
  elementCount: number;
  computeTimeMs: number;
  tirCount: number;
  refractionCount: number;
  totalLengthMeters: number;
}

export interface PhysicsSettings {
  dispersionMultiplier: number; // 0.0 to 5.0 (default 1.5)
  ambientMediumIndex: number; // 1.0 (Air), 1.333 (Water), etc.
  fresnelSplitting: boolean;
  fresnelThreshold: number; // 0.01 to 0.2
  maxBounces: number; // 10 to 80
  maxSegments: number; // 1000 to 8000
  minIntensity: number; // 0.005 to 0.05
  spectralQuality: 'fast' | 'balanced' | 'ultra'; // 5 vs 9 vs 15 spectral bands
  lightProfile: LightColorProfile;
  beamOverlayWidth: number; // 0 to 45 px wide volumetric beam overlay / halo
}
