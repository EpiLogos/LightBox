/**
 * Geometry decomposition & Ray-Surface Intersection algorithms
 */

import type {
  OpticalElement,
  Surface,
  LineSurface,
  ArcSurface,
  HitResult,
  Vector2D,
  Ray,
} from './types.ts';
import {
  vec,
  add,
  sub,
  scale,
  dot,
  cross,
  length,
  normalize,
  rotate,
  degToRad,
} from './math.ts';

const EPSILON = 1e-4;

/**
 * Intersects a ray with a line segment [p1, p2].
 */
export function intersectRayLine(
  ray: Ray,
  line: LineSurface
): HitResult | null {
  const p1 = line.p1;
  const p2 = line.p2;
  const ro = ray.origin;
  const rd = ray.direction;

  const v1 = sub(ro, p1);
  const v2 = sub(p2, p1);
  const v3 = vec(-rd.y, rd.x); // perpendicular to rd

  const dotV2V3 = dot(v2, v3);
  if (Math.abs(dotV2V3) < 1e-9) {
    return null; // Ray and line segment are parallel
  }

  const t1 = cross(v2, v1) / dotV2V3; // Distance along ray
  const t2 = dot(v1, v3) / dotV2V3;   // Parameter u along segment [0, 1]

  if (t1 > EPSILON && t2 >= 0.0 && t2 <= 1.0) {
    const hitPoint = add(ro, scale(rd, t1));
    // Determine whether the ray hits the normal side or opposing side
    const hitDot = dot(rd, line.normal);
    const facingNormal = hitDot <= 0 ? line.normal : scale(line.normal, -1);
    const fromInside = hitDot > 0;

    return {
      t: t1,
      point: hitPoint,
      normal: facingNormal,
      surface: line,
      fromInside,
    };
  }

  return null;
}

/**
 * Normalizes an angle into [0, 2pi)
 */
function normalizeAngle(a: number): number {
  let res = a % (2 * Math.PI);
  if (res < 0) res += 2 * Math.PI;
  return res;
}

/**
 * Checks if an angle lies within the range [startAngle, endAngle] in counter-clockwise sense
 */
function isAngleBetween(angle: number, start: number, end: number): boolean {
  const normA = normalizeAngle(angle);
  const normS = normalizeAngle(start);
  const normE = normalizeAngle(end);

  if (normS < normE) {
    return normA >= normS - 1e-4 && normA <= normE + 1e-4;
  } else {
    // Wraps around 0 / 2pi
    return normA >= normS - 1e-4 || normA <= normE + 1e-4;
  }
}

/**
 * Intersects a ray with a circular arc.
 */
export function intersectRayArc(
  ray: Ray,
  arc: ArcSurface
): HitResult | null {
  const ro = ray.origin;
  const rd = ray.direction;
  const oc = sub(ro, arc.center);

  // Quadratic equation: ||ro + t*rd - center||^2 = radius^2
  // t^2 + 2 * t * dot(rd, oc) + ||oc||^2 - radius^2 = 0
  const b = 2 * dot(rd, oc);
  const c = dot(oc, oc) - arc.radius * arc.radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) return null;

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / 2;
  const t2 = (-b + sqrtDisc) / 2;

  let bestHit: HitResult | null = null;
  let minT = Infinity;

  const candidateTs = [t1, t2];
  for (const t of candidateTs) {
    if (t > EPSILON && t < minT) {
      const hitPoint = add(ro, scale(rd, t));
      const hitAngle = Math.atan2(hitPoint.y - arc.center.y, hitPoint.x - arc.center.x);

      if (isAngleBetween(hitAngle, arc.startAngle, arc.endAngle)) {
        minT = t;
        // Normal points from center outwards if outwardNormal is true
        let radialNormal = normalize(sub(hitPoint, arc.center));
        if (!arc.outwardNormal) {
          radialNormal = scale(radialNormal, -1);
        }

        const hitDot = dot(rd, radialNormal);
        const facingNormal = hitDot <= 0 ? radialNormal : scale(radialNormal, -1);
        const fromInside = hitDot > 0;

        bestHit = {
          t,
          point: hitPoint,
          normal: facingNormal,
          surface: arc,
          fromInside,
        };
      }
    }
  }

  return bestHit;
}

/**
 * Find the closest surface hit for a given ray.
 */
export function findClosestHit(ray: Ray, surfaces: Surface[]): HitResult | null {
  let closest: HitResult | null = null;
  let minDistance = Infinity;

  for (let i = 0; i < surfaces.length; i++) {
    const s = surfaces[i];
    let hit: HitResult | null = null;
    if (s.geometry === 'line') {
      hit = intersectRayLine(ray, s);
    } else {
      hit = intersectRayArc(ray, s);
    }

    if (hit && hit.t < minDistance) {
      minDistance = hit.t;
      closest = hit;
    }
  }

  return closest;
}

/**
 * Converts any OpticalElement into a list of geometric boundary surfaces.
 */
export function extractSurfaces(element: OpticalElement): Surface[] {
  const surfaces: Surface[] = [];
  const rotRad = degToRad(element.rotation);
  const pos = vec(element.x, element.y);

  // Helper to transform a local point to world space
  function toWorld(local: Vector2D): Vector2D {
    return add(pos, rotate(local, rotRad));
  }

  // Helper to transform a local direction/normal to world space
  function toWorldDir(dir: Vector2D): Vector2D {
    return normalize(rotate(dir, rotRad));
  }

  switch (element.type) {
    case 'flat-mirror': {
      const halfL = element.length / 2;
      const p1 = toWorld(vec(-halfL, 0));
      const p2 = toWorld(vec(halfL, 0));
      const normal = toWorldDir(vec(0, -1));

      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'mirror',
        p1,
        p2,
        normal,
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });

      if (element.twoSided) {
        surfaces.push({
          geometry: 'line',
          elementId: element.id,
          surfaceType: 'mirror',
          p1: p2,
          p2: p1,
          normal: scale(normal, -1),
          n1: 1.0,
          n2: 1.0,
          dispersion: 0,
        });
      }
      break;
    }

    case 'concave-mirror': {
      // Concave mirror is a circular arc opening towards y-negative
      const R = element.curvatureRadius;
      const halfW = Math.min(element.width / 2, R * 0.95);
      const halfAngle = Math.asin(halfW / R);
      const localCenter = vec(0, -R);
      const center = toWorld(localCenter);

      const baseAngle = Math.PI / 2 + rotRad;
      const startAngle = baseAngle - halfAngle;
      const endAngle = baseAngle + halfAngle;

      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'mirror',
        center,
        radius: R,
        startAngle,
        endAngle,
        outwardNormal: false, // reflective side faces center (inward)
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });
      break;
    }

    case 'convex-mirror': {
      const R = element.curvatureRadius;
      const halfW = Math.min(element.width / 2, R * 0.95);
      const halfAngle = Math.asin(halfW / R);
      const localCenter = vec(0, R);
      const center = toWorld(localCenter);

      const baseAngle = -Math.PI / 2 + rotRad;
      const startAngle = baseAngle - halfAngle;
      const endAngle = baseAngle + halfAngle;

      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'mirror',
        center,
        radius: R,
        startAngle,
        endAngle,
        outwardNormal: true, // reflective side faces outward
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });
      break;
    }

    case 'parabolic-mirror': {
      // Parabola y = x^2 / (4*f), approximated by 16 segments
      const f = element.focalLength;
      const halfW = element.width / 2;
      const numSegments = 16;
      let prevPt = toWorld(vec(-halfW, (halfW * halfW) / (4 * f)));

      for (let i = 1; i <= numSegments; i++) {
        const lx = -halfW + (2 * halfW * i) / numSegments;
        const ly = (lx * lx) / (4 * f);
        const currPt = toWorld(vec(lx, ly));

        const segVec = sub(currPt, prevPt);
        const norm = normalize(vec(segVec.y, -segVec.x)); // points upward/inward

        surfaces.push({
          geometry: 'line',
          elementId: element.id,
          surfaceType: 'mirror',
          p1: prevPt,
          p2: currPt,
          normal: norm,
          n1: 1.0,
          n2: 1.0,
          dispersion: 0,
        });
        prevPt = currPt;
      }
      break;
    }

    case 'corner-cube': {
      // Two perpendicular mirrors meeting at 90 deg (or 3)
      const s = element.size / 2;
      const pCorner = toWorld(vec(0, s));
      const pLeft = toWorld(vec(-s, 0));
      const pRight = toWorld(vec(s, 0));

      const n1 = toWorldDir(vec(1, -1));
      const n2 = toWorldDir(vec(-1, -1));

      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'mirror',
        p1: pLeft,
        p2: pCorner,
        normal: n1,
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });

      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'mirror',
        p1: pCorner,
        p2: pRight,
        normal: n2,
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });
      break;
    }

    case 'kaleidoscope': {
      // Regular polygon tube with reflective inner walls
      const sides = Math.max(3, element.sides);
      const r = element.radius;
      const pts: Vector2D[] = [];
      for (let i = 0; i < sides; i++) {
        const theta = (i * 2 * Math.PI) / sides;
        pts.push(toWorld(vec(r * Math.cos(theta), r * Math.sin(theta))));
      }

      for (let i = 0; i < sides; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % sides];
        const seg = sub(p2, p1);
        // inward normal faces center
        const normal = normalize(vec(seg.y, -seg.x));

        surfaces.push({
          geometry: 'line',
          elementId: element.id,
          surfaceType: 'mirror',
          p1,
          p2,
          normal,
          n1: 1.0,
          n2: 1.0,
          dispersion: 0,
        });
      }
      break;
    }

    case 'beam-splitter': {
      const halfL = element.length / 2;
      const p1 = toWorld(vec(-halfL, 0));
      const p2 = toWorld(vec(halfL, 0));
      const normal = toWorldDir(vec(0, -1));

      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'splitter',
        p1,
        p2,
        normal,
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
        splitRatio: element.splitRatio || 0.5,
      });
      break;
    }

    case 'diffraction-grating': {
      const halfL = element.length / 2;
      const p1 = toWorld(vec(-halfL, 0));
      const p2 = toWorld(vec(halfL, 0));
      const normal = toWorldDir(vec(0, -1));

      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'diffractor',
        p1,
        p2,
        normal,
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
        linesPerMm: element.linesPerMm || 600,
      });
      break;
    }

    case 'aperture': {
      const halfW = element.width / 2;
      const halfSlit = Math.min(element.slitWidth / 2, halfW - 5);

      // Left wing
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'absorber',
        p1: toWorld(vec(-halfW, 0)),
        p2: toWorld(vec(-halfSlit, 0)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });

      // Right wing
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'absorber',
        p1: toWorld(vec(halfSlit, 0)),
        p2: toWorld(vec(halfW, 0)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });
      break;
    }

    case 'screen': {
      const halfL = element.length / 2;
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'absorber',
        p1: toWorld(vec(-halfL, 0)),
        p2: toWorld(vec(halfL, 0)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });
      break;
    }

    case 'sensor': {
      const halfL = element.length / 2;
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'sensor',
        p1: toWorld(vec(-halfL, 0)),
        p2: toWorld(vec(halfL, 0)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: 1.0,
        dispersion: 0,
      });
      break;
    }

    case 'ball-lens': {
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: pos,
        radius: element.radius,
        startAngle: 0,
        endAngle: 2 * Math.PI,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'biconvex-lens': {
      // Two circular arcs facing each other
      const R = Math.max(element.curvatureRadius, element.height / 2 + 1);
      const halfH = element.height / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));
      const centerDist = R - sagitta; // Center offset along x
      const halfAngle = Math.asin(halfH / R);

      // Arc 1 (Left surface, outward normal towards -x)
      const centerLeft = toWorld(vec(centerDist, 0));
      const baseAngleLeft = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerLeft,
        radius: R,
        startAngle: baseAngleLeft - halfAngle,
        endAngle: baseAngleLeft + halfAngle,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Arc 2 (Right surface, outward normal towards +x)
      const centerRight = toWorld(vec(-centerDist, 0));
      const baseAngleRight = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerRight,
        radius: R,
        startAngle: baseAngleRight - halfAngle,
        endAngle: baseAngleRight + halfAngle,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'biconcave-lens': {
      // Biconcave lens has two inward arcs + top & bottom flat caps
      const R = Math.max(element.curvatureRadius, element.height / 2 + 1);
      const halfH = element.height / 2;
      const halfW = element.width / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));
      const halfAngle = Math.asin(halfH / R);

      // Center of left inward arc is at (-halfW - R + sagitta, 0)
      const centerLeft = toWorld(vec(-halfW - R + sagitta, 0));
      const baseAngleLeft = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerLeft,
        radius: R,
        startAngle: baseAngleLeft - halfAngle,
        endAngle: baseAngleLeft + halfAngle,
        outwardNormal: false, // inward curvature
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Center of right inward arc is at (halfW + R - sagitta, 0)
      const centerRight = toWorld(vec(halfW + R - sagitta, 0));
      const baseAngleRight = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerRight,
        radius: R,
        startAngle: baseAngleRight - halfAngle,
        endAngle: baseAngleRight + halfAngle,
        outwardNormal: false,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Top cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-halfW, -halfH)),
        p2: toWorld(vec(halfW, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Bottom cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, halfH)),
        p2: toWorld(vec(-halfW, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'plano-convex-lens': {
      const R = Math.max(element.curvatureRadius, element.height / 2 + 1);
      const halfH = element.height / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));
      const halfAngle = Math.asin(halfH / R);

      // Flat left face
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-sagitta / 2, halfH)),
        p2: toWorld(vec(-sagitta / 2, -halfH)),
        normal: toWorldDir(vec(-1, 0)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Curved right face
      const centerRight = toWorld(vec(-sagitta / 2 - (R - sagitta), 0));
      const baseAngleRight = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerRight,
        radius: R,
        startAngle: baseAngleRight - halfAngle,
        endAngle: baseAngleRight + halfAngle,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'plano-concave-lens': {
      const R = Math.max(element.curvatureRadius, element.height / 2 + 1);
      const halfH = element.height / 2;
      const halfW = element.width / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));
      const halfAngle = Math.asin(halfH / R);

      // Flat left face
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-halfW, halfH)),
        p2: toWorld(vec(-halfW, -halfH)),
        normal: toWorldDir(vec(-1, 0)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Curved right face (inward)
      const centerRight = toWorld(vec(halfW + R - sagitta, 0));
      const baseAngleRight = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerRight,
        radius: R,
        startAngle: baseAngleRight - halfAngle,
        endAngle: baseAngleRight + halfAngle,
        outwardNormal: false,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Top and bottom caps
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-halfW, -halfH)),
        p2: toWorld(vec(halfW, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, halfH)),
        p2: toWorld(vec(-halfW, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'meniscus-converging-lens': {
      // Positive meniscus: front convex (R1), back concave (R2), R1 < R2
      const halfH = element.height / 2;
      const R1 = Math.max(element.curvatureRadius1 || 90, halfH + 2);
      const R2 = Math.max(element.curvatureRadius2 || 150, R1 + 10);
      const sag1 = R1 - Math.sqrt(Math.max(0, R1 * R1 - halfH * halfH));
      const sag2 = R2 - Math.sqrt(Math.max(0, R2 * R2 - halfH * halfH));
      const centerThick = Math.max(20, element.width || 30);
      const edgeThick = Math.max(6, centerThick - sag1 + sag2);

      // Front convex surface: apex at -centerThick/2, center at -centerThick/2 + R1
      const center1 = toWorld(vec(-centerThick / 2 + R1, 0));
      const halfAngle1 = Math.asin(halfH / R1);
      const baseAngle1 = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center1,
        radius: R1,
        startAngle: baseAngle1 - halfAngle1,
        endAngle: baseAngle1 + halfAngle1,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Back concave surface: apex at centerThick/2, curves in same direction
      const center2 = toWorld(vec(centerThick / 2 + R2, 0));
      const halfAngle2 = Math.asin(halfH / R2);
      const baseAngle2 = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center2,
        radius: R2,
        startAngle: baseAngle2 - halfAngle2,
        endAngle: baseAngle2 + halfAngle2,
        outwardNormal: false, // inward curvature
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Top cap connecting front arc top to back arc top
      const topP1 = toWorld(vec(-centerThick / 2 + sag1, -halfH));
      const topP2 = toWorld(vec(-centerThick / 2 + sag1 + edgeThick, -halfH));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: topP1,
        p2: topP2,
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Bottom cap
      const botP1 = toWorld(vec(-centerThick / 2 + sag1 + edgeThick, halfH));
      const botP2 = toWorld(vec(-centerThick / 2 + sag1, halfH));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: botP1,
        p2: botP2,
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'meniscus-diverging-lens': {
      // Negative meniscus: center is thinner than edge (R1 < R2, front concave, back convex)
      const halfH = element.height / 2;
      const R1 = Math.max(element.curvatureRadius1 || 100, halfH + 2);
      const R2 = Math.max(element.curvatureRadius2 || 160, R1 + 10);
      const sag1 = R1 - Math.sqrt(Math.max(0, R1 * R1 - halfH * halfH));
      const sag2 = R2 - Math.sqrt(Math.max(0, R2 * R2 - halfH * halfH));
      const centerThick = Math.max(10, element.width || 18);
      const edgeThick = centerThick + sag1 - sag2;

      // Front concave surface (center of curvature to left)
      const center1 = toWorld(vec(-centerThick / 2 - R1 + sag1, 0));
      const halfAngle1 = Math.asin(halfH / R1);
      const baseAngle1 = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center1,
        radius: R1,
        startAngle: baseAngle1 - halfAngle1,
        endAngle: baseAngle1 + halfAngle1,
        outwardNormal: false,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Back surface
      const center2 = toWorld(vec(centerThick / 2 - R2 + sag2, 0));
      const halfAngle2 = Math.asin(halfH / R2);
      const baseAngle2 = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center2,
        radius: R2,
        startAngle: baseAngle2 - halfAngle2,
        endAngle: baseAngle2 + halfAngle2,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Top cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-centerThick / 2 - sag1, -halfH)),
        p2: toWorld(vec(-centerThick / 2 - sag1 + edgeThick, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Bottom cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-centerThick / 2 - sag1 + edgeThick, halfH)),
        p2: toWorld(vec(-centerThick / 2 - sag1, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'achromatic-doublet-lens': {
      // Achromatic doublet: Crown element (left) + Flint element (right) with cemented boundary
      const halfH = element.height / 2;
      const halfW = element.width / 2;
      const R1 = Math.max(element.curvatureRadiusFront || 95, halfH + 2);
      const R2 = Math.max(element.curvatureRadiusInterface || 80, halfH + 2);
      const R3 = Math.max(element.curvatureRadiusBack || 220, halfH + 2);

      const sag1 = R1 - Math.sqrt(Math.max(0, R1 * R1 - halfH * halfH));
      const sag2 = R2 - Math.sqrt(Math.max(0, R2 * R2 - halfH * halfH));
      const sag3 = R3 - Math.sqrt(Math.max(0, R3 * R3 - halfH * halfH));

      const crownN = element.refractiveIndexCrown || 1.5168; // N-BK7 Crown
      const crownB = element.dispersionCrown || 0.0042;
      const flintN = element.refractiveIndexFlint || 1.6727; // N-SF11 Flint
      const flintB = element.dispersionFlint || 0.0165;

      // Surface 1: Front Arc (Air -> Crown)
      const center1 = toWorld(vec(-halfW + (R1 - sag1), 0));
      const halfAngle1 = Math.asin(halfH / R1);
      const baseAngle1 = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center1,
        radius: R1,
        startAngle: baseAngle1 - halfAngle1,
        endAngle: baseAngle1 + halfAngle1,
        outwardNormal: true,
        n1: 1.0,
        n2: crownN,
        dispersion: crownB,
      });

      // Surface 2: Cemented Internal Interface (Crown -> Flint)
      // Normal points from Crown into Flint (along +x)
      const center2 = toWorld(vec(0 - (R2 - sag2), 0));
      const halfAngle2 = Math.asin(halfH / R2);
      const baseAngle2 = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center2,
        radius: R2,
        startAngle: baseAngle2 - halfAngle2,
        endAngle: baseAngle2 + halfAngle2,
        outwardNormal: true,
        n1: crownN,
        n2: flintN,
        dispersion1: crownB,
        dispersion: flintB,
      });

      // Surface 3: Back Arc (Flint -> Air)
      const center3 = toWorld(vec(halfW + (R3 - sag3), 0));
      const halfAngle3 = Math.asin(halfH / R3);
      const baseAngle3 = 0 + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: center3,
        radius: R3,
        startAngle: baseAngle3 - halfAngle3,
        endAngle: baseAngle3 + halfAngle3,
        outwardNormal: true,
        n1: 1.0,
        n2: flintN,
        dispersion: flintB,
      });

      // Top cap for Crown
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-halfW, -halfH)),
        p2: toWorld(vec(0, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: crownN,
        dispersion: crownB,
      });

      // Top cap for Flint
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(0, -halfH)),
        p2: toWorld(vec(halfW, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: flintN,
        dispersion: flintB,
      });

      // Bottom cap for Flint
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, halfH)),
        p2: toWorld(vec(0, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: flintN,
        dispersion: flintB,
      });

      // Bottom cap for Crown
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(0, halfH)),
        p2: toWorld(vec(-halfW, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: crownN,
        dispersion: crownB,
      });
      break;
    }

    case 'aspheric-lens': {
      // Parabolic aspheric surface: zero spherical aberration
      const halfH = element.height / 2;
      const halfW = element.width / 2;
      const R = Math.max(element.apexCurvatureRadius || 60, 20);
      const numSegments = 24;

      // Parabolic profile: x = y^2 / (2 * R) - halfW
      let prevPt = toWorld(vec((halfH * halfH) / (2 * R) - halfW, -halfH));

      for (let i = 1; i <= numSegments; i++) {
        const ly = -halfH + (2 * halfH * i) / numSegments;
        const lx = (ly * ly) / (2 * R) - halfW;
        const currPt = toWorld(vec(lx, ly));

        const seg = sub(currPt, prevPt);
        // Outward normal facing -x
        const normal = normalize(vec(seg.y, -seg.x));

        surfaces.push({
          geometry: 'line',
          elementId: element.id,
          surfaceType: 'dielectric',
          p1: prevPt,
          p2: currPt,
          normal,
          n1: 1.0,
          n2: element.refractiveIndex,
          dispersion: element.dispersion,
        });
        prevPt = currPt;
      }

      // Flat back face
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, -halfH)),
        p2: toWorld(vec(halfW, halfH)),
        normal: toWorldDir(vec(1, 0)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Top cap
      const topApexX = (halfH * halfH) / (2 * R) - halfW;
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(topApexX, -halfH)),
        p2: toWorld(vec(halfW, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Bottom cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, halfH)),
        p2: toWorld(vec(topApexX, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'cylindrical-lens': {
      const halfH = element.height / 2;
      const halfW = element.width / 2;
      const R = Math.max(element.curvatureRadius || 80, halfH + 2);
      const sag = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));
      const halfAngle = Math.asin(halfH / R);

      // Curved front arc
      const centerFront = toWorld(vec(-halfW + (R - sag), 0));
      const baseAngle = Math.PI + rotRad;
      surfaces.push({
        geometry: 'arc',
        elementId: element.id,
        surfaceType: 'dielectric',
        center: centerFront,
        radius: R,
        startAngle: baseAngle - halfAngle,
        endAngle: baseAngle + halfAngle,
        outwardNormal: true,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Flat back face
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, -halfH)),
        p2: toWorld(vec(halfW, halfH)),
        normal: toWorldDir(vec(1, 0)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Top cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(-halfW + sag, -halfH)),
        p2: toWorld(vec(halfW, -halfH)),
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Bottom cap
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: toWorld(vec(halfW, halfH)),
        p2: toWorld(vec(-halfW + sag, halfH)),
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'right-angle-prism': {
      // 45-90-45 Porro prism
      const L = element.legLength || 100;
      const halfL = L / 2;
      // Right angle vertex at (-halfL, halfL), leg 1 to (-halfL, -halfL), leg 2 to (halfL, halfL)
      const pRight = toWorld(vec(-halfL, halfL));
      const pTop = toWorld(vec(-halfL, -halfL));
      const pFar = toWorld(vec(halfL, halfL));

      // Leg 1 (vertical left side)
      const s1 = sub(pTop, pRight);
      const n1 = normalize(vec(s1.y, -s1.x));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pRight,
        p2: pTop,
        normal: n1,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Hypotenuse (diagonal from top to far)
      const s2 = sub(pFar, pTop);
      const n2 = normalize(vec(-s2.y, s2.x));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pTop,
        p2: pFar,
        normal: n2,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Leg 2 (horizontal bottom side from far to right angle)
      const s3 = sub(pRight, pFar);
      const n3 = normalize(vec(-s3.y, s3.x));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pFar,
        p2: pRight,
        normal: n3,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'dove-prism': {
      const H = element.height || 50;
      const B = element.baseLength || 140;
      const halfB = B / 2;
      const halfH = H / 2;
      const topHalf = halfB - H; // 45 degree angle on sides

      const pBotLeft = toWorld(vec(-halfB, halfH));
      const pBotRight = toWorld(vec(halfB, halfH));
      const pTopRight = toWorld(vec(topHalf, -halfH));
      const pTopLeft = toWorld(vec(-topHalf, -halfH));

      // Side 1: Bottom base (TIR reflection face)
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pBotRight,
        p2: pBotLeft,
        normal: toWorldDir(vec(0, 1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Side 2: Left face (angled 45 deg)
      const sLeft = sub(pTopLeft, pBotLeft);
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pBotLeft,
        p2: pTopLeft,
        normal: normalize(vec(sLeft.y, -sLeft.x)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Side 3: Top face
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pTopLeft,
        p2: pTopRight,
        normal: toWorldDir(vec(0, -1)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Side 4: Right face (angled 45 deg)
      const sRight = sub(pBotRight, pTopRight);
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: pTopRight,
        p2: pBotRight,
        normal: normalize(vec(sRight.y, -sRight.x)),
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'prism': {
      // Isosceles or equilateral triangle prism
      const s = element.sideLength;
      const apexAngleRad = degToRad(element.apexAngle || 60);
      const halfApex = apexAngleRad / 2;
      const height = s * Math.cos(halfApex);
      const halfBase = s * Math.sin(halfApex);

      // Apex at top (0, -height / 2), base corners at (-halfBase, height/2) and (+halfBase, height/2)
      const vTop = toWorld(vec(0, -height / 2));
      const vRight = toWorld(vec(halfBase, height / 2));
      const vLeft = toWorld(vec(-halfBase, height / 2));

      // Side 1: Top to Right
      const seg1 = sub(vRight, vTop);
      const norm1 = normalize(vec(-seg1.y, seg1.x));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: vTop,
        p2: vRight,
        normal: norm1,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Side 2: Right to Left (Base)
      const seg2 = sub(vLeft, vRight);
      const norm2 = normalize(vec(-seg2.y, seg2.x));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: vRight,
        p2: vLeft,
        normal: norm2,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });

      // Side 3: Left to Top
      const seg3 = sub(vTop, vLeft);
      const norm3 = normalize(vec(-seg3.y, seg3.x));
      surfaces.push({
        geometry: 'line',
        elementId: element.id,
        surfaceType: 'dielectric',
        p1: vLeft,
        p2: vTop,
        normal: norm3,
        n1: 1.0,
        n2: element.refractiveIndex,
        dispersion: element.dispersion,
      });
      break;
    }

    case 'block-lens': {
      const halfW = element.width / 2;
      const halfH = element.height / 2;
      const corners = [
        toWorld(vec(-halfW, -halfH)),
        toWorld(vec(halfW, -halfH)),
        toWorld(vec(halfW, halfH)),
        toWorld(vec(-halfW, halfH)),
      ];

      for (let i = 0; i < 4; i++) {
        const p1 = corners[i];
        const p2 = corners[(i + 1) % 4];
        const seg = sub(p2, p1);
        const normal = normalize(vec(-seg.y, seg.x)); // outward normal (counter-clockwise winding)

        surfaces.push({
          geometry: 'line',
          elementId: element.id,
          surfaceType: 'dielectric',
          p1,
          p2,
          normal,
          n1: 1.0,
          n2: element.refractiveIndex,
          dispersion: element.dispersion,
        });
      }
      break;
    }

    case 'polygon-lens': {
      if (!element.vertices || element.vertices.length < 3) break;
      const n = element.vertices.length;
      const worldPts = element.vertices.map((v) => toWorld(v));

      for (let i = 0; i < n; i++) {
        const p1 = worldPts[i];
        const p2 = worldPts[(i + 1) % n];
        const seg = sub(p2, p1);
        const normal = normalize(vec(-seg.y, seg.x));

        surfaces.push({
          geometry: 'line',
          elementId: element.id,
          surfaceType: 'dielectric',
          p1,
          p2,
          normal,
          n1: 1.0,
          n2: element.refractiveIndex,
          dispersion: element.dispersion,
        });
      }
      break;
    }

    default:
      // Sources do not produce boundary collision surfaces directly
      break;
  }

  return surfaces;
}
