/**
 * High-Resolution Vector (SVG) Exporter for Quantum Chromodynamics (QCD) Systems
 * Generates publication-ready SVG diagrams of quarks, Wilson flux tubes, Steiner Y-junctions, and hadron metadata.
 */

import type { Quark, HadronCluster } from './types.ts';
import {
  calculateBaryonSteinerJunction,
  calculateCornellPotentialMeV,
  getQuarkColorHex,
  PIXELS_PER_FM,
} from './physics.ts';

export interface QCDSvgExportOptions {
  theme?: 'dark' | 'light' | 'blueprint' | 'transparent';
  includeLabels?: boolean;
  includeGrid?: boolean;
  includeStatsFooter?: boolean;
}

export function exportQCDToSvg(
  quarks: Quark[],
  hadronCluster: HadronCluster | null,
  options: QCDSvgExportOptions = {}
): string {
  const {
    theme = 'dark',
    includeLabels = true,
    includeGrid = true,
    includeStatsFooter = true,
  } = options;

  const width = 1200;
  const height = 800;

  let bgFill = '#06070a';
  let gridStroke = '#0f172a';
  let textFill = '#f8fafc';
  let subTextFill = '#94a3b8';

  if (theme === 'light') {
    bgFill = '#ffffff';
    gridStroke = '#e2e8f0';
    textFill = '#0f172a';
    subTextFill = '#64748b';
  } else if (theme === 'blueprint') {
    bgFill = '#0b192c';
    gridStroke = '#1e3e62';
    textFill = '#e0f2fe';
    subTextFill = '#7dd3fc';
  } else if (theme === 'transparent') {
    bgFill = 'none';
    gridStroke = '#1e293b';
  }

  const defs = `
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  `;

  // Draw background
  let svgBody = bgFill !== 'none' ? `<rect width="100%" height="100%" fill="${bgFill}"/>\n` : '';

  // Draw Grid if requested
  if (includeGrid) {
    const step = PIXELS_PER_FM;
    svgBody += `  <g stroke="${gridStroke}" stroke-width="1" opacity="0.6">\n`;
    for (let x = 0; x <= width; x += step) {
      svgBody += `    <line x1="${x}" y1="0" x2="${x}" y2="${height}"/>\n`;
    }
    for (let y = 0; y <= height; y += step) {
      svgBody += `    <line x1="0" y1="${y}" x2="${width}" y2="${y}"/>\n`;
    }
    svgBody += `  </g>\n`;
  }

  // Draw Wilson Flux Tubes
  if (quarks.length === 2) {
    const q1 = quarks[0];
    const q2 = quarks[1];
    const c1 = getQuarkColorHex(q1.color);
    const c2 = getQuarkColorHex(q2.color);

    svgBody += `  <g id="flux-tube">\n`;
    // Outer glow
    svgBody += `    <line x1="${q1.x}" y1="${q1.y}" x2="${q2.x}" y2="${q2.y}" stroke="${c1}" stroke-width="16" opacity="0.25" stroke-linecap="round"/>\n`;
    // Core string
    svgBody += `    <line x1="${q1.x}" y1="${q1.y}" x2="${q2.x}" y2="${q2.y}" stroke="#ffffff" stroke-width="2.5" opacity="0.9" stroke-linecap="round"/>\n`;

    const midX = (q1.x + q2.x) / 2;
    const midY = (q1.y + q2.y) / 2;
    const distFm = (Math.hypot(q2.x - q1.x, q2.y - q1.y) / PIXELS_PER_FM).toFixed(2);
    const vMeV = Math.round(calculateCornellPotentialMeV(parseFloat(distFm), 0.9));
    svgBody += `    <text x="${midX}" y="${midY - 12}" fill="${subTextFill}" font-family="monospace" font-size="12" text-anchor="middle">${distFm} fm | ${vMeV} MeV</text>\n`;
    svgBody += `  </g>\n`;
  } else if (quarks.length === 3) {
    const junction = calculateBaryonSteinerJunction(quarks[0], quarks[1], quarks[2]);
    svgBody += `  <g id="steiner-junction">\n`;
    for (const q of quarks) {
      const c = getQuarkColorHex(q.color);
      svgBody += `    <line x1="${q.x}" y1="${q.y}" x2="${junction.x}" y2="${junction.y}" stroke="${c}" stroke-width="14" opacity="0.25" stroke-linecap="round"/>\n`;
      svgBody += `    <line x1="${q.x}" y1="${q.y}" x2="${junction.x}" y2="${junction.y}" stroke="#ffffff" stroke-width="2" opacity="0.9"/>\n`;
    }
    svgBody += `    <circle cx="${junction.x}" cy="${junction.y}" r="6" fill="#ffffff" filter="url(#glow)"/>\n`;
    svgBody += `    <text x="${junction.x}" y="${junction.y - 14}" fill="#38bdf8" font-family="monospace" font-size="10" text-anchor="middle">120° STEINER JUNCTION</text>\n`;
    svgBody += `  </g>\n`;
  } else if (quarks.length > 3) {
    // Multi-quark complex
    svgBody += `  <g id="multi-flux-tubes">\n`;
    for (let i = 0; i < quarks.length; i++) {
      for (let j = i + 1; j < quarks.length; j++) {
        const qA = quarks[i];
        const qB = quarks[j];
        const d = Math.hypot(qB.x - qA.x, qB.y - qA.y);
        if (d < 300) {
          svgBody += `    <line x1="${qA.x}" y1="${qA.y}" x2="${qB.x}" y2="${qB.y}" stroke="#38bdf8" stroke-width="8" opacity="0.2"/>\n`;
          svgBody += `    <line x1="${qA.x}" y1="${qA.y}" x2="${qB.x}" y2="${qB.y}" stroke="#ffffff" stroke-width="1.5" opacity="0.7"/>\n`;
        }
      }
    }
    svgBody += `  </g>\n`;
  }

  // Draw Quarks
  svgBody += `  <g id="quarks">\n`;
  for (const q of quarks) {
    const cHex = getQuarkColorHex(q.color);
    const symbol = q.isAntiquark ? `${q.flavor[0]}̄` : q.flavor[0];
    const chargeStr =
      q.charge > 0
        ? `+${q.charge.toFixed(2).replace('.67', '⅔').replace('.33', '⅓')}e`
        : `${q.charge.toFixed(2).replace('-.33', '-⅓').replace('-.67', '-⅔')}e`;

    // Glow halo
    svgBody += `    <circle cx="${q.x}" cy="${q.y}" r="32" fill="${cHex}" opacity="0.25"/>\n`;
    // Body
    svgBody += `    <circle cx="${q.x}" cy="${q.y}" r="22" fill="#0f172a" stroke="${cHex}" stroke-width="3"/>\n`;
    // Core dot
    svgBody += `    <circle cx="${q.x}" cy="${q.y}" r="5" fill="${cHex}"/>\n`;
    // Label
    svgBody += `    <text x="${q.x}" y="${q.y + 5}" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" text-anchor="middle">${symbol}</text>\n`;
    // Charge & Color Tag
    if (includeLabels) {
      svgBody += `    <text x="${q.x}" y="${q.y - 30}" fill="${cHex}" font-family="monospace" font-size="10" text-anchor="middle">${q.color.toUpperCase()}</text>\n`;
      svgBody += `    <text x="${q.x}" y="${q.y + 40}" fill="${subTextFill}" font-family="monospace" font-size="10" text-anchor="middle">${chargeStr}</text>\n`;
    }
  }
  svgBody += `  </g>\n`;

  // Draw Hadron Header & Specs Footer
  if (includeStatsFooter && hadronCluster) {
    svgBody += `  <g id="hadron-metadata">\n`;
    svgBody += `    <text x="40" y="50" fill="${textFill}" font-family="system-ui, sans-serif" font-size="20" font-weight="bold">${hadronCluster.name}</text>\n`;
    svgBody += `    <text x="40" y="75" fill="${subTextFill}" font-family="monospace" font-size="12">SU(3) Singlet: ${hadronCluster.isColorSinglet ? 'VERIFIED (White)' : 'UNCONFINED'} | Mass: ${hadronCluster.invariantMassMeV} MeV | Charge: ${hadronCluster.totalCharge}e</text>\n`;
    svgBody += `    <text x="40" y="760" fill="${subTextFill}" font-family="monospace" font-size="11">Generated with LuxOptics Quantum Chromodynamics Studio (SU(3) Gauge Symmetry & Cornell Confinement)</text>\n`;
    svgBody += `  </g>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${defs}
${svgBody}
</svg>`;
}
