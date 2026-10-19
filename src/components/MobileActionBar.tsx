/**
 * Action-focused Floating Bottom Bar for Live Editing & Manipulation
 * Allows direct thumb manipulation on mobile & sleek on-canvas editing on desktop
 */

import React from 'react';
import {
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Sliders,
  X,
  Compass,
  Sparkles,
  Spline,
} from 'lucide-react';
import type { OpticalElement } from '../optics/types.ts';

interface MobileActionBarProps {
  element: OpticalElement | null;
  onUpdateElement: (updated: OpticalElement) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onDeselect: () => void;
  onOpenFullInspector: () => void;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({
  element,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onDeselect,
  onOpenFullInspector,
}) => {
  if (!element) return null;

  const handleRotateDelta = (delta: number) => {
    let newRot = Math.round((element.rotation + delta) / 5) * 5;
    newRot = ((newRot % 360) + 360) % 360;
    onUpdateElement({ ...element, rotation: newRot });
  };

  const isLens =
    element.type === 'biconvex-lens' ||
    element.type === 'biconcave-lens' ||
    element.type === 'plano-convex-lens' ||
    element.type === 'plano-concave-lens' ||
    element.type === 'meniscus-converging-lens' ||
    element.type === 'meniscus-diverging-lens' ||
    element.type === 'achromatic-doublet-lens' ||
    element.type === 'aspheric-lens' ||
    element.type === 'cylindrical-lens' ||
    element.type === 'ball-lens' ||
    element.type === 'prism' ||
    element.type === 'right-angle-prism' ||
    element.type === 'dove-prism' ||
    element.type === 'block-lens';

  const isEmitter =
    element.type === 'laser-single' ||
    element.type === 'laser-array' ||
    element.type === 'radial-source' ||
    element.type === 'polychromatic-source';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-lg bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-150 select-none pointer-events-auto">
      {/* Top Header Row: Element Name, Angle readout, and Actions */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-neutral-800/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
            {element.name || element.type}
          </span>
          <span className="text-[10px] font-mono text-sky-400 px-1 py-0.5 rounded bg-neutral-800">
            {Math.round(element.rotation)}°
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onDuplicateElement(element.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Duplicate Element"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteElement(element.id)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Delete Element"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenFullInspector}
            className="p-1.5 rounded-lg text-neutral-300 hover:text-emerald-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Full Properties Sheet"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDeselect}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
            title="Deselect"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Controls Row */}
      <div className="flex flex-col gap-2">
        {/* Rotation Slider & Quick Step Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRotateDelta(-15)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono text-[11px] cursor-pointer shrink-0"
            title="Rotate -15°"
          >
            <RotateCcw className="w-3 h-3 text-sky-400" />
            <span>-15°</span>
          </button>

          <input
            type="range"
            min="0"
            max="360"
            value={((Math.round(element.rotation) % 360) + 360) % 360}
            onChange={(e) =>
              onUpdateElement({ ...element, rotation: parseInt(e.target.value, 10) })
            }
            className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            title="Drag to Rotate Element"
          />

          <button
            onClick={() => handleRotateDelta(15)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-mono text-[11px] cursor-pointer shrink-0"
            title="Rotate +15°"
          >
            <span>+15°</span>
            <RotateCw className="w-3 h-3 text-sky-400" />
          </button>
        </div>

        {/* Dynamic Secondary Quick Slider: Refractive Index or Power */}
        {isLens && 'refractiveIndex' in element && (
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-neutral-800/60">
            <span className="text-[10px] text-neutral-400 shrink-0 font-medium">
              Refraction Index:
            </span>
            <input
              type="range"
              min="1.1"
              max="2.5"
              step="0.02"
              value={element.refractiveIndex}
              onChange={(e) =>
                onUpdateElement({ ...element, refractiveIndex: parseFloat(e.target.value) })
              }
              className="flex-1 accent-emerald-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="font-mono text-emerald-400 text-[10px] w-12 text-right shrink-0">
              n={element.refractiveIndex.toFixed(2)}
            </span>
          </div>
        )}

        {isEmitter && 'power' in element && (
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-neutral-800/60">
            <span className="text-[10px] text-neutral-400 shrink-0 font-medium">Laser Power:</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={element.power}
              onChange={(e) =>
                onUpdateElement({ ...element, power: parseFloat(e.target.value) })
              }
              className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
            <span className="font-mono text-amber-400 text-[10px] w-12 text-right shrink-0">
              {element.power.toFixed(1)}W
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
