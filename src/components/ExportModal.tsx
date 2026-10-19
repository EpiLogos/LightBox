/**
 * High-Resolution Vector (SVG) & Raster Export Modal
 */

import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  FileCode,
  Image as ImageIcon,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type { OpticalElement, RaySegment } from '../optics/types.ts';
import type { Quark, HadronCluster } from '../qcd/types.ts';
import { exportSceneToSvg, SvgExportOptions } from '../optics/svgExport.ts';
import { exportQCDToSvg } from '../qcd/qcdSvgExport.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: OpticalElement[];
  segments: RaySegment[];
  beamOverlayWidth?: number;
  mode?: 'optics' | 'qcd';
  quarks?: Quark[];
  hadronCluster?: HadronCluster | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  elements,
  segments,
  beamOverlayWidth = 16,
  mode = 'optics',
  quarks = [],
  hadronCluster = null,
}) => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'blueprint' | 'transparent'>('dark');
  const [includeRays, setIncludeRays] = useState(true);
  const [includeElements, setIncludeElements] = useState(true);
  const [includeGlow, setIncludeGlow] = useState(true);
  const [rayStrokeWidth, setRayStrokeWidth] = useState(1.6);
  const [exportBeamOverlay, setExportBeamOverlay] = useState(beamOverlayWidth);
  const [copied, setCopied] = useState(false);

  const svgContent = useMemo(() => {
    if (!isOpen) return '';
    if (mode === 'qcd') {
      return exportQCDToSvg(quarks, hadronCluster, {
        theme,
        includeGrid: true,
        includeLabels: true,
        includeStatsFooter: true,
      });
    }
    return exportSceneToSvg(elements, segments, {
      theme,
      includeRays,
      includeElements,
      includeGlow,
      rayStrokeWidth,
      beamOverlayWidth: exportBeamOverlay,
      title: 'LuxOptics Geometric Simulation',
    });
  }, [
    isOpen,
    mode,
    quarks,
    hadronCluster,
    elements,
    segments,
    theme,
    includeRays,
    includeElements,
    includeGlow,
    rayStrokeWidth,
    exportBeamOverlay,
  ]);

  if (!isOpen) return null;

  const handleDownloadSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luxoptics-scene-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySvg = async () => {
    try {
      await navigator.clipboard.writeText(svgContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDownloadPng = (scaleMultiplier: number) => {
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = (img.width || 1200) * scaleMultiplier;
      canvas.height = (img.height || 800) * scaleMultiplier;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scaleMultiplier, scaleMultiplier);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `luxoptics-render-${scaleMultiplier}x-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-dialog-title" className="text-base font-semibold text-white">
                Export High-Resolution Vector (SVG)
              </h2>
              <p className="text-xs text-neutral-400">
                Scalable vector paths suitable for Adobe Illustrator, CAD, Inkscape, or laser cutting.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
          {/* Live Vector SVG Preview */}
          <div className="p-6 bg-neutral-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-neutral-800 relative overflow-hidden min-h-[300px]">
            <div className="text-[11px] font-mono text-neutral-400 absolute top-3 left-4 uppercase tracking-wider">
              Live Vector Preview
            </div>
            <div
              className="w-full h-full max-h-[380px] flex items-center justify-center rounded-xl overflow-hidden border border-neutral-800/80 shadow-inner p-2"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>

          {/* Export Settings & Options */}
          <div className="p-6 overflow-y-auto space-y-5 bg-neutral-900/60">
            {/* Visual Theme */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
                Color & Canvas Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'dark', label: 'Dark Laboratory', desc: '#090a0f Deep Slate' },
                  { id: 'blueprint', label: 'Cyan Blueprint', desc: '#0f172a Technical Blue' },
                  { id: 'light', label: 'Paper White', desc: '#ffffff For Printing' },
                  { id: 'transparent', label: 'Transparent', desc: 'No background fill' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      theme === t.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="text-xs font-medium">{t.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                Included Vector Layers
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRays}
                    onChange={(e) => setIncludeRays(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Include Laser Rays & Paths</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeElements}
                    onChange={(e) => setIncludeElements(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Include Lenses, Mirrors & Prisms</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGlow}
                    onChange={(e) => setIncludeGlow(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Include Laser Glow Gaussian Blur Filter</span>
                </label>
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-300">Ray Vector Stroke Width</span>
                <span className="font-mono text-emerald-400">{rayStrokeWidth} px</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={rayStrokeWidth}
                onChange={(e) => setRayStrokeWidth(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Wide Beam Overlay Width */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-300">White/Gold Wide Beam Overlay</span>
                <span className="font-mono text-amber-400">{exportBeamOverlay} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={exportBeamOverlay}
                onChange={(e) => setExportBeamOverlay(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="pt-4 border-t border-neutral-800 space-y-2.5">
              <button
                onClick={handleDownloadSvg}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Vector SVG (.svg)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopySvg}
                  className="py-2 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied XML!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy SVG Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadPng(2)}
                  className="py-2 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-sky-400" />
                  <span>Download 2x PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
