/**
 * Optical Elements Palette / Toolbox Dock
 */

import React from 'react';
import {
  Sun,
  CircleDot,
  Sparkles,
  Layers,
  Square,
  Triangle,
  Spline,
  GitFork,
  Radio,
  Sliders,
  Maximize2,
  Eye,
  Shield,
  Gauge,
  Activity,
  X,
} from 'lucide-react';
import type { OpticalElement, OpticalElementType } from '../optics/types.ts';

interface ToolboxProps {
  onAddElement: (type: OpticalElementType) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  onClose?: () => void;
}

interface ToolItem {
  type: OpticalElementType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CATEGORIES = [
  { id: 'sources', label: 'Sources', icon: <Sun className="w-4 h-4 text-emerald-400" /> },
  { id: 'lenses', label: 'Lenses & Prisms', icon: <Spline className="w-4 h-4 text-sky-400" /> },
  { id: 'mirrors', label: 'Mirrors', icon: <Layers className="w-4 h-4 text-indigo-400" /> },
  { id: 'splitters', label: 'Splitters & Sensors', icon: <GitFork className="w-4 h-4 text-purple-400" /> },
];

const TOOLS_BY_CATEGORY: Record<string, ToolItem[]> = {
  sources: [
    {
      type: 'laser-single',
      label: 'Single Laser',
      icon: <Radio className="w-4 h-4 text-emerald-400" />,
      description: 'Directional coherent laser emitter',
    },
    {
      type: 'laser-array',
      label: 'Laser Comb',
      icon: <Sliders className="w-4 h-4 text-emerald-400" />,
      description: 'Parallel multi-beam laser array',
    },
    {
      type: 'radial-source',
      label: 'Radial Star',
      icon: <Sun className="w-4 h-4 text-emerald-400" />,
      description: '360° omnidirectional laser star for mandala patterns',
    },
    {
      type: 'polychromatic-source',
      label: 'White Laser',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      description: 'Multi-spectral white laser for chromatic rainbow dispersion',
    },
  ],
  lenses: [
    {
      type: 'biconvex-lens',
      label: 'Biconvex Lens',
      icon: <Spline className="w-4 h-4 text-sky-400" />,
      description: 'Dual curved converging focus lens',
    },
    {
      type: 'plano-convex-lens',
      label: 'Plano-Convex',
      icon: <Spline className="w-4 h-4 text-sky-400" />,
      description: 'Flat + convex converging lens',
    },
    {
      type: 'meniscus-converging-lens',
      label: 'Meniscus (Converging)',
      icon: <Spline className="w-4 h-4 text-emerald-400" />,
      description: 'Convex-concave positive meniscus (eyepiece / camera front)',
    },
    {
      type: 'meniscus-diverging-lens',
      label: 'Meniscus (Diverging)',
      icon: <Spline className="w-4 h-4 text-emerald-400" />,
      description: 'Convex-concave negative meniscus diverging lens',
    },
    {
      type: 'plano-concave-lens',
      label: 'Plano-Concave',
      icon: <Spline className="w-4 h-4 text-cyan-400" />,
      description: 'Flat + concave diverging lens',
    },
    {
      type: 'biconcave-lens',
      label: 'Biconcave Lens',
      icon: <Spline className="w-4 h-4 text-cyan-400" />,
      description: 'Dual concave diverging lens',
    },
    {
      type: 'achromatic-doublet-lens',
      label: 'Achromatic Doublet',
      icon: <Sparkles className="w-4 h-4 text-amber-300" />,
      description: 'Cemented Crown + Flint glass; eliminates chromatic aberration',
    },
    {
      type: 'aspheric-lens',
      label: 'Aspheric Lens',
      icon: <Spline className="w-4 h-4 text-indigo-400" />,
      description: 'Parabolic profile; eliminates spherical aberration completely',
    },
    {
      type: 'cylindrical-lens',
      label: 'Cylindrical Lens',
      icon: <Square className="w-4 h-4 text-sky-400" />,
      description: 'Cylindrical meridian for anamorphic beam shaping',
    },
    {
      type: 'ball-lens',
      label: 'Ball Sphere',
      icon: <CircleDot className="w-4 h-4 text-sky-400" />,
      description: 'Full 360° spherical glass marble / ball lens',
    },
    {
      type: 'prism',
      label: 'Equilateral Prism',
      icon: <Triangle className="w-4 h-4 text-sky-400" />,
      description: '60° triangular dispersion prism for rainbows',
    },
    {
      type: 'right-angle-prism',
      label: 'Porro / Right-Angle',
      icon: <Triangle className="w-4 h-4 text-sky-400" />,
      description: '45-90-45° prism with total internal reflection',
    },
    {
      type: 'dove-prism',
      label: 'Dove Prism',
      icon: <Square className="w-4 h-4 text-purple-400" />,
      description: 'Trapezoidal prism for image inversion without deflection',
    },
    {
      type: 'block-lens',
      label: 'Glass Slab',
      icon: <Square className="w-4 h-4 text-sky-400" />,
      description: 'Rectangular optical dielectric block',
    },
  ],
  mirrors: [
    {
      type: 'flat-mirror',
      label: 'Flat Mirror',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      description: 'Precision specular mirror',
    },
    {
      type: 'concave-mirror',
      label: 'Concave Mirror',
      icon: <Eye className="w-4 h-4 text-indigo-400" />,
      description: 'Curved focusing mirror',
    },
    {
      type: 'convex-mirror',
      label: 'Convex Mirror',
      icon: <Shield className="w-4 h-4 text-indigo-400" />,
      description: 'Diverging mirror',
    },
    {
      type: 'parabolic-mirror',
      label: 'Parabolic Mirror',
      icon: <Maximize2 className="w-4 h-4 text-indigo-400" />,
      description: 'Aberration-free geometric paraboloid',
    },
    {
      type: 'corner-cube',
      label: 'Retroreflector',
      icon: <Square className="w-4 h-4 text-indigo-400" />,
      description: 'Corner cube 90° retroreflector',
    },
    {
      type: 'kaleidoscope',
      label: 'Kaleidoscope',
      icon: <CircleDot className="w-4 h-4 text-purple-400" />,
      description: 'Polygon mirror tube (infinite symmetry)',
    },
  ],
  splitters: [
    {
      type: 'beam-splitter',
      label: 'Beam Splitter',
      icon: <GitFork className="w-4 h-4 text-purple-400" />,
      description: '50/50 semi-reflective optical plate',
    },
    {
      type: 'diffraction-grating',
      label: 'Diffraction Grating',
      icon: <Sliders className="w-4 h-4 text-purple-400" />,
      description: 'Periodic ruling splitting light into orders',
    },
    {
      type: 'sensor',
      label: 'Optical Sensor',
      icon: <Gauge className="w-4 h-4 text-emerald-400" />,
      description: 'Photodiode measuring beam power & flux',
    },
    {
      type: 'screen',
      label: 'Absorber Screen',
      icon: <Activity className="w-4 h-4 text-neutral-400" />,
      description: 'Observation card blocking beam paths',
    },
  ],
};

export const Toolbox: React.FC<ToolboxProps> = ({
  onAddElement,
  activeCategory,
  setActiveCategory,
  onClose,
}) => {
  const currentTools = TOOLS_BY_CATEGORY[activeCategory] || TOOLS_BY_CATEGORY.sources;

  return (
    <aside
      aria-label="Optics Element Library"
      className="w-72 sm:w-80 bg-neutral-900/95 backdrop-blur-md border-r border-neutral-800 flex flex-col h-full z-10 shrink-0"
    >
      {/* Optional Mobile Header */}
      {onClose && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-neutral-950/80">
          <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            Optical Elements
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Library"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="grid grid-cols-4 border-b border-neutral-800 p-1.5 gap-1 bg-neutral-950/60">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
              title={cat.label}
              aria-label={`Show ${cat.label}`}
            >
              <div className="mb-1">{cat.icon}</div>
              <span className="text-[10px] truncate max-w-full">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tools List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase px-1">
          Add to Scene
        </div>
        <div className="grid grid-cols-1 gap-2">
          {currentTools.map((item) => (
            <button
              key={item.type}
              onClick={() => onAddElement(item.type)}
              className="flex items-start gap-3 p-2.5 rounded-xl border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/60 hover:border-neutral-700 text-left transition-all group cursor-pointer"
              title={`Add ${item.label}`}
            >
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:border-neutral-700 transition-colors shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-200 group-hover:text-emerald-400 transition-colors">
                  {item.label}
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/40 text-[11px] text-neutral-400 leading-relaxed font-sans">
        <p className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Direct Canvas Interaction
        </p>
        <p>• Click & drag elements to reposition</p>
        <p>• Drag top blue handle to rotate (Hold Shift to snap 15°)</p>
        <p>• Scroll wheel to zoom in/out</p>
      </div>
    </aside>
  );
};
