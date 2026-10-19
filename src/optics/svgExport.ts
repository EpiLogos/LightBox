/**
 * High-Resolution Vector (SVG) Exporter for LuxOptics Scenes
 */

import type { OpticalElement, RaySegment } from './types.ts';
import { degToRad, vec, add, rotate } from './math.ts';

export interface SvgExportOptions {
  width?: number;
  height?: number;
  padding?: number;
  theme?: 'dark' | 'light' | 'blueprint' | 'transparent';
  includeRays?: boolean;
  includeElements?: boolean;
  includeGlow?: boolean;
  rayStrokeWidth?: number;
  beamOverlayWidth?: number;
  title?: string;
  author?: string;
}

export function exportSceneToSvg(
  elements: OpticalElement[],
  segments: RaySegment[],
  options: SvgExportOptions = {}
): string {
  const {
    padding = 40,
    theme = 'dark',
    includeRays = true,
    includeElements = true,
    includeGlow = true,
    rayStrokeWidth = 1.6,
    beamOverlayWidth = 16,
    title = 'LuxOptics Light & Optics Ray Tracing Simulation',
    author = 'LuxOptics Laboratory',
  } = options;

  // Calculate bounding box across all elements and ray segments
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    minX = Math.min(minX, el.x - 120);
    maxX = Math.max(maxX, el.x + 120);
    minY = Math.min(minY, el.y - 120);
    maxY = Math.max(maxY, el.y + 120);
  }

  if (includeRays) {
    for (const seg of segments) {
      // Clamp ray bounds to avoid infinite rays blowing up the canvas viewBox
      const p1x = Math.max(-2000, Math.min(3000, seg.p1.x));
      const p1y = Math.max(-2000, Math.min(3000, seg.p1.y));
      const p2x = Math.max(-2000, Math.min(3000, seg.p2.x));
      const p2y = Math.max(-2000, Math.min(3000, seg.p2.y));

      minX = Math.min(minX, p1x, p2x);
      maxX = Math.max(maxX, p1x, p2x);
      minY = Math.min(minY, p1y, p2y);
      maxY = Math.max(maxY, p1y, p2y);
    }
  }

  if (!isFinite(minX)) {
    minX = 0;
    maxX = 1200;
    minY = 0;
    maxY = 800;
  }

  // Add padding
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const viewBoxWidth = Math.max(400, maxX - minX);
  const viewBoxHeight = Math.max(300, maxY - minY);
  const targetWidth = options.width || Math.round(viewBoxWidth);
  const targetHeight = options.height || Math.round(viewBoxHeight);

  // Theme palettes
  const themes = {
    dark: {
      bg: '#090a0f',
      grid: '#181b26',
      elementFill: 'rgba(56, 189, 248, 0.08)',
      elementStroke: '#38bdf8',
      mirrorStroke: '#94a3b8',
      emitterBody: '#1e293b',
      text: '#94a3b8',
    },
    light: {
      bg: '#ffffff',
      grid: '#f1f5f9',
      elementFill: 'rgba(14, 165, 233, 0.08)',
      elementStroke: '#0284c7',
      mirrorStroke: '#475569',
      emitterBody: '#cbd5e1',
      text: '#334155',
    },
    blueprint: {
      bg: '#0f172a',
      grid: '#1e293b',
      elementFill: 'rgba(59, 130, 246, 0.12)',
      elementStroke: '#60a5fa',
      mirrorStroke: '#93c5fd',
      emitterBody: '#1e293b',
      text: '#93c5fd',
    },
    transparent: {
      bg: 'none',
      grid: 'none',
      elementFill: 'rgba(56, 189, 248, 0.15)',
      elementStroke: '#38bdf8',
      mirrorStroke: '#e2e8f0',
      emitterBody: '#334155',
      text: '#e2e8f0',
    },
  };

  const currentTheme = themes[theme] || themes.dark;

  // Build SVG XML
  const svgParts: string[] = [];

  svgParts.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}" viewBox="${minX.toFixed(
      1
    )} ${minY.toFixed(1)} ${viewBoxWidth.toFixed(1)} ${viewBoxHeight.toFixed(
      1
    )}" version="1.1">`
  );

  // Metadata & Description
  svgParts.push(`  <metadata>`);
  svgParts.push(`    <title>${escapeXml(title)}</title>`);
  svgParts.push(`    <creator>${escapeXml(author)}</creator>`);
  svgParts.push(`    <date>${new Date().toISOString()}</date>`);
  svgParts.push(`  </metadata>`);

  // Defs & Filters (Glow and Gradients)
  svgParts.push(`  <defs>`);
  if (includeGlow) {
    svgParts.push(`    <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">`);
    svgParts.push(`      <feGaussianBlur stdDeviation="3.0" result="blur" />`);
    svgParts.push(`      <feMerge>`);
    svgParts.push(`        <feMergeNode in="blur" />`);
    svgParts.push(`        <feMergeNode in="SourceGraphic" />`);
    svgParts.push(`      </feMerge>`);
    svgParts.push(`    </filter>`);
  }
  svgParts.push(`    <linearGradient id="mirror-grad" x1="0%" y1="0%" x2="100%" y2="100%">`);
  svgParts.push(`      <stop offset="0%" stop-color="#cbd5e1" />`);
  svgParts.push(`      <stop offset="50%" stop-color="#f8fafc" />`);
  svgParts.push(`      <stop offset="100%" stop-color="#64748b" />`);
  svgParts.push(`    </linearGradient>`);
  svgParts.push(`  </defs>`);

  // Background
  if (currentTheme.bg !== 'none') {
    svgParts.push(
      `  <rect x="${minX}" y="${minY}" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="${currentTheme.bg}" />`
    );
  }

  // Optical Elements Layer
  if (includeElements) {
    svgParts.push(`  <g id="optical-elements" stroke-linecap="round" stroke-linejoin="round">`);
    for (const el of elements) {
      svgParts.push(renderElementToSvg(el, currentTheme));
    }
    svgParts.push(`  </g>`);
  }

  // Laser Rays Layer
  if (includeRays && segments.length > 0) {
    svgParts.push(
      `  <g id="laser-rays" ${includeGlow ? 'filter="url(#laser-glow)"' : ''} stroke-linecap="round">`
    );

    // Optional Extra Wide Volumetric Overlay for White & Golden Beams
    if (beamOverlayWidth > 0) {
      svgParts.push(`    <!-- Volumetric Wide Beam Overlays -->`);
      for (const seg of segments) {
        const cLower = seg.color.toLowerCase();
        const isWhiteOrGold =
          cLower === '#ffffff' ||
          cLower === '#fff1aa' ||
          cLower.includes('fff') ||
          cLower.includes('ffd') ||
          cLower.includes('ffea');

        if (isWhiteOrGold) {
          const overlayColor = cLower === '#fff1aa' ? '#ffe082' : '#ffffff';
          const overlayAlpha = Math.min(0.24, seg.intensity * 0.28);
          svgParts.push(
            `    <line x1="${seg.p1.x.toFixed(2)}" y1="${seg.p1.y.toFixed(2)}" x2="${seg.p2.x.toFixed(
              2
            )}" y2="${seg.p2.y.toFixed(2)}" stroke="${overlayColor}" stroke-width="${(
              beamOverlayWidth * 1.8
            ).toFixed(1)}" stroke-opacity="${overlayAlpha.toFixed(3)}" />`
          );
        }
      }
    }

    // Laser Core Beams
    for (const seg of segments) {
      const alpha = Math.min(1.0, Math.max(0.15, seg.intensity));
      svgParts.push(
        `    <line x1="${seg.p1.x.toFixed(2)}" y1="${seg.p1.y.toFixed(2)}" x2="${seg.p2.x.toFixed(
          2
        )}" y2="${seg.p2.y.toFixed(2)}" stroke="${seg.color}" stroke-width="${rayStrokeWidth}" stroke-opacity="${alpha.toFixed(
          2
        )}" />`
      );
    }

    svgParts.push(`  </g>`);
  }

  // Close SVG
  svgParts.push(`</svg>`);

  return svgParts.join('\n');
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function renderElementToSvg(
  el: OpticalElement,
  palette: {
    elementFill: string;
    elementStroke: string;
    mirrorStroke: string;
    emitterBody: string;
    text: string;
  }
): string {
  const rot = el.rotation;
  const transform = `transform="translate(${el.x.toFixed(2)}, ${el.y.toFixed(2)}) rotate(${rot.toFixed(1)})"`;

  switch (el.type) {
    case 'laser-single':
    case 'laser-array':
    case 'radial-source':
    case 'polychromatic-source': {
      return `    <g id="emitter-${el.id}" ${transform}>
      <rect x="-18" y="-12" width="36" height="24" rx="4" fill="${palette.emitterBody}" stroke="#64748b" stroke-width="1.5" />
      <polygon points="18,-6 26,0 18,6" fill="#38bdf8" />
      <circle cx="0" cy="0" r="4" fill="#38bdf8" />
    </g>`;
    }

    case 'flat-mirror': {
      const halfL = el.length / 2;
      return `    <g id="mirror-${el.id}" ${transform}>
      <line x1="${-halfL}" y1="0" x2="${halfL}" y2="0" stroke="url(#mirror-grad)" stroke-width="4.5" />
      <line x1="${-halfL}" y1="3" x2="${halfL}" y2="3" stroke="#475569" stroke-width="2" stroke-dasharray="3,3" />
    </g>`;
    }

    case 'concave-mirror':
    case 'convex-mirror': {
      const R = el.curvatureRadius;
      const halfW = Math.min(el.width / 2, R * 0.95);
      const halfAngle = Math.asin(halfW / R);
      const sagitta = R - Math.sqrt(R * R - halfW * halfW);
      const isConcave = el.type === 'concave-mirror';
      const arcY = isConcave ? -sagitta : sagitta;

      return `    <g id="curved-mirror-${el.id}" ${transform}>
      <path d="M ${-halfW} 0 Q 0 ${arcY * 2} ${halfW} 0" fill="none" stroke="url(#mirror-grad)" stroke-width="4.5" />
    </g>`;
    }

    case 'ball-lens': {
      return `    <g id="ball-lens-${el.id}" ${transform}>
      <circle cx="0" cy="0" r="${el.radius}" fill="${palette.elementFill}" stroke="${palette.elementStroke}" stroke-width="2" />
      <circle cx="${-el.radius * 0.25}" cy="${-el.radius * 0.25}" r="${el.radius * 0.2}" fill="rgba(255,255,255,0.2)" stroke="none" />
    </g>`;
    }

    case 'prism': {
      const s = el.sideLength;
      const apexAngleRad = degToRad(el.apexAngle || 60);
      const height = s * Math.cos(apexAngleRad / 2);
      const halfBase = s * Math.sin(apexAngleRad / 2);

      const pTop = `0,${(-height / 2).toFixed(2)}`;
      const pRight = `${halfBase.toFixed(2)},${(height / 2).toFixed(2)}`;
      const pLeft = `${(-halfBase).toFixed(2)},${(height / 2).toFixed(2)}`;

      return `    <g id="prism-${el.id}" ${transform}>
      <polygon points="${pTop} ${pRight} ${pLeft}" fill="${palette.elementFill}" stroke="${palette.elementStroke}" stroke-width="2" />
    </g>`;
    }

    case 'biconvex-lens': {
      const R = Math.max(el.curvatureRadius, el.height / 2 + 1);
      const halfH = el.height / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));

      return `    <g id="biconvex-${el.id}" ${transform}>
      <path d="M 0 ${-halfH} Q ${sagitta * 2} 0 0 ${halfH} Q ${-sagitta * 2} 0 0 ${-halfH}" fill="${palette.elementFill}" stroke="${palette.elementStroke}" stroke-width="2" />
    </g>`;
    }

    case 'biconcave-lens': {
      const halfH = el.height / 2;
      const halfW = el.width / 2;
      return `    <g id="biconcave-${el.id}" ${transform}>
      <path d="M ${-halfW} ${-halfH} L ${halfW} ${-halfH} Q 0 0 ${halfW} ${halfH} L ${-halfW} ${halfH} Q 0 0 ${-halfW} ${-halfH}" fill="${palette.elementFill}" stroke="${palette.elementStroke}" stroke-width="2" />
    </g>`;
    }

    case 'block-lens': {
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      return `    <g id="block-${el.id}" ${transform}>
      <rect x="${-halfW}" y="${-halfH}" width="${el.width}" height="${el.height}" rx="2" fill="${palette.elementFill}" stroke="${palette.elementStroke}" stroke-width="2" />
    </g>`;
    }

    case 'beam-splitter': {
      const halfL = el.length / 2;
      return `    <g id="splitter-${el.id}" ${transform}>
      <line x1="${-halfL}" y1="0" x2="${halfL}" y2="0" stroke="#a855f7" stroke-width="3" stroke-dasharray="4,2" />
    </g>`;
    }

    case 'kaleidoscope': {
      const sides = Math.max(3, el.sides);
      const r = el.radius;
      const pts: string[] = [];
      for (let i = 0; i < sides; i++) {
        const theta = (i * 2 * Math.PI) / sides;
        pts.push(`${(r * Math.cos(theta)).toFixed(2)},${(r * Math.sin(theta)).toFixed(2)}`);
      }
      return `    <g id="kaleidoscope-${el.id}" ${transform}>
      <polygon points="${pts.join(' ')}" fill="rgba(168, 85, 247, 0.05)" stroke="url(#mirror-grad)" stroke-width="3" />
    </g>`;
    }

    default:
      return '';
  }
}
