/**
 * Sleek Modern TopBar & Unified Action Bar
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Download,
  ChevronDown,
  MousePointer,
  Hand,
  Ruler,
  Grid,
  RotateCcw,
  Trash2,
  HelpCircle,
  MoreHorizontal,
  Plus,
  Flame,
  Check,
  Atom,
} from 'lucide-react';
import { PRESETS, PresetScene } from '../optics/presets.ts';
import { QCD_PRESETS, QCDPresetScene } from '../qcd/presets.ts';
import type { LightColorProfile } from '../optics/types.ts';

export interface TopBarProps {
  mode: 'optics' | 'qcd';
  onChangeMode: (mode: 'optics' | 'qcd') => void;
  activeTool: 'select' | 'measure' | 'pan';
  setActiveTool: (tool: 'select' | 'measure' | 'pan') => void;
  lasersEnabled: boolean;
  onToggleLasers: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onSelectPreset: (preset: PresetScene) => void;
  onClearCanvas: () => void;
  onResetScene: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  currentPresetId: string;
  mobileToolboxOpen: boolean;
  onToggleMobileToolbox: () => void;
  mobileInspectorOpen: boolean;
  onToggleMobileInspector: () => void;
  lightProfile: LightColorProfile;
  onCycleLightProfile: () => void;
  currentQCDPresetId?: string;
  onSelectQCDPreset?: (preset: QCDPresetScene) => void;
  dynamicsRunning?: boolean;
  onToggleDynamics?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onChangeMode,
  activeTool,
  setActiveTool,
  lasersEnabled,
  onToggleLasers,
  showGrid,
  onToggleGrid,
  onSelectPreset,
  onClearCanvas,
  onResetScene,
  onOpenExport,
  onOpenHelp,
  currentPresetId,
  mobileToolboxOpen,
  onToggleMobileToolbox,
  mobileInspectorOpen,
  onToggleMobileInspector,
  lightProfile,
  onCycleLightProfile,
  currentQCDPresetId = 'proton-baryon',
  onSelectQCDPreset,
  dynamicsRunning = false,
  onToggleDynamics,
}) => {
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const presetDropdownRef = useRef<HTMLDivElement | null>(null);

  // Responsive resize detection & outside click
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);

    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(e.target as Node)) {
        setPresetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const currentOpticsPreset = PRESETS.find((p) => p.id === currentPresetId) || PRESETS[0];
  const currentQCDPreset = QCD_PRESETS.find((p) => p.id === currentQCDPresetId) || QCD_PRESETS[0];
  const displayTitle = mode === 'optics' ? currentOpticsPreset.title : currentQCDPreset.title;

  return (
    <header className="h-13 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-2.5 sm:px-4 z-30 shrink-0 select-none gap-2">
      {/* Left: Brand + Studio Mode Switcher + Presets Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-purple-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-neutral-950 rounded-[6px] flex items-center justify-center">
              {mode === 'optics' ? (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Atom className="w-3.5 h-3.5 text-purple-400" />
              )}
            </div>
          </div>
          <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
            Lux<span className={mode === 'optics' ? 'text-emerald-400' : 'text-purple-400'}>{mode === 'optics' ? 'Optics' : 'QCD'}</span>
          </span>
        </div>

        {/* Studio Mode Switcher Pill */}
        <div className="flex items-center bg-neutral-900/90 p-0.5 rounded-lg border border-neutral-800 text-xs shrink-0">
          <button
            onClick={() => onChangeMode('optics')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'optics'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Switch to Geometric Optics & Laser Sandbox"
          >
            Optics
          </button>
          <button
            onClick={() => onChangeMode('qcd')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              mode === 'qcd'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Switch to Quantum Chromodynamics (QCD) SU(3) Color Studio"
          >
            <Atom className="w-3 h-3 text-purple-400" />
            <span>QCD</span>
          </button>
        </div>

        {/* Mobile Spawner Drawer Button */}
        <button
          onClick={onToggleMobileToolbox}
          className={`lg:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            mobileToolboxOpen
              ? mode === 'optics'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
          }`}
          title={mode === 'optics' ? 'Add Optics Elements' : 'Spawn Quarks & Hadrons'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{mode === 'optics' ? 'Optics' : 'Quarks'}</span>
        </button>

        {/* Preset Selector Dropdown */}
        <div className="relative" ref={presetDropdownRef}>
          <button
            onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-colors cursor-pointer max-w-[120px] sm:max-w-[210px]"
            aria-expanded={presetDropdownOpen}
            title={mode === 'optics' ? 'Choose Optical Demonstration' : 'Choose QCD Physical System'}
          >
            <span className="truncate">{displayTitle}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </button>

          {presetDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-76 sm:w-84 rounded-xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50">
              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-1">
                {mode === 'optics' ? 'Curated Optical Presets' : 'Standard Model QCD Systems'}
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {mode === 'optics'
                  ? PRESETS.map((preset) => {
                      const isSelected = preset.id === currentPresetId;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            onSelectPreset(preset);
                            setPresetDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                              : 'hover:bg-neutral-800 text-neutral-300 border border-transparent'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-neutral-600 mt-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium truncate">{preset.title}</div>
                            <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                              {preset.description}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  : QCD_PRESETS.map((preset) => {
                      const isSelected = preset.id === currentQCDPresetId;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            onSelectQCDPreset?.(preset);
                            setPresetDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                              : 'hover:bg-neutral-800 text-neutral-300 border border-transparent'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-purple-400" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-neutral-600 mt-1" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate text-white">{preset.title}</div>
                            <div className="text-[10px] text-purple-300/80 font-mono">{preset.subtitle}</div>
                            <div className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                              {preset.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Sleek Segmented Tool Switcher */}
      <div className="hidden md:flex items-center bg-neutral-900/90 p-0.5 rounded-xl border border-neutral-800 text-xs shadow-inner">
        <button
          onClick={() => setActiveTool('select')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            activeTool === 'select'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Select & Move Elements / Quarks (V)"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Select</span>
        </button>

        <button
          onClick={() => setActiveTool('pan')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            activeTool === 'pan'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Pan Viewport (H / Space+Drag)"
        >
          <Hand className="w-3.5 h-3.5" />
          <span>Pan</span>
        </button>

        {mode === 'optics' && (
          <button
            onClick={() => setActiveTool('measure')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              activeTool === 'measure'
                ? 'bg-amber-500/20 text-amber-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Protractor & Distance Ruler (M)"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Protractor</span>
          </button>
        )}
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {!isMobile && (
          <>
            {mode === 'optics' ? (
              <>
                {/* Quick Light Color Mood Pill (Desktop/Tablet) */}
                <button
                  onClick={onCycleLightProfile}
                  className="desktop-only-action hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-medium text-neutral-200 transition-all cursor-pointer shrink-0"
                  title="Switch Light Spectrum Profile: Golden (3000K) -> Pure White (6500K) -> Emerald Laser"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shadow-xs shrink-0 ${
                      lightProfile === 'golden'
                        ? 'bg-amber-300 ring-2 ring-amber-400/40'
                        : lightProfile === 'white'
                        ? 'bg-white ring-2 ring-white/50'
                        : 'bg-emerald-400 ring-2 ring-emerald-400/40'
                    }`}
                  />
                  <span className="capitalize font-medium text-xs">
                    {lightProfile === 'golden' ? 'Golden' : lightProfile === 'white' ? 'White' : 'Emerald'}
                  </span>
                </button>

                {/* Lasers Fire / Pause Button (Desktop/Tablet) */}
                <button
                  onClick={onToggleLasers}
                  className="desktop-only-action hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  title={lasersEnabled ? 'Pause Light Emitting' : 'Fire Lasers'}
                >
                  {lasersEnabled ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{lasersEnabled ? 'Active' : 'Paused'}</span>
                </button>
              </>
            ) : (
              /* QCD Confinement Dynamics Play/Pause */
              <button
                onClick={onToggleDynamics}
                className={`desktop-only-action hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all cursor-pointer ${
                  dynamicsRunning
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title="Toggle real-time Cornell force confinement dynamics"
              >
                {dynamicsRunning ? <Pause className="w-3.5 h-3.5 text-purple-400" /> : <Play className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{dynamicsRunning ? 'Dynamics' : 'Paused'}</span>
              </button>
            )}
          </>
        )}

        {/* Primary Action: Export Vector SVG */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          title="Export High-Resolution Vector SVG"
        >
          <Download className="w-3.5 h-3.5" />
          <span>SVG</span>
        </button>

        {/* More Actions Dropdown (Grid, Reset, Clear, Help, and Mobile Light/Laser toggles) */}
        <div className="relative" ref={moreMenuRef}>
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="More Scene Actions & Settings"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {moreMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-56 rounded-xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Mobile-only Light Profile & Lasers toggle */}
              <div className="sm:hidden pb-1 mb-1 border-b border-neutral-800 space-y-1">
                <button
                  onClick={() => {
                    onCycleLightProfile();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        lightProfile === 'golden'
                          ? 'bg-amber-300'
                          : lightProfile === 'white'
                          ? 'bg-white'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span>Light Profile</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-amber-300">
                    {lightProfile}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToggleLasers();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {lasersEnabled ? (
                      <Pause className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>Laser Emitters</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {lasersEnabled ? 'Active' : 'Paused'}
                  </span>
                </button>
              </div>

              <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1 mb-0.5">
                Lab Environment
              </div>

              <button
                onClick={() => {
                  onToggleGrid();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-sky-400" />
                  <span>Optical Bench Grid</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {showGrid ? 'On' : 'Off'}
                </span>
              </button>

              <button
                onClick={() => {
                  onResetScene();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Current Scene</span>
              </button>

              <button
                onClick={() => {
                  onClearCanvas();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear All Elements</span>
              </button>

              <div className="h-px bg-neutral-800 my-1" />

              <button
                onClick={() => {
                  onOpenHelp();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Physics Guide & Keys</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
