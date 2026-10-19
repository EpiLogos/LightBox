/**
 * LuxOptics - Interactive Geometric Optics & Ray Tracing Sandbox
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CanvasView } from './components/CanvasView.tsx';
import { Toolbox } from './components/Toolbox.tsx';
import { PropertyInspector } from './components/PropertyInspector.tsx';
import { TopBar } from './components/TopBar.tsx';
import { ExportModal } from './components/ExportModal.tsx';
import { HelpModal } from './components/HelpModal.tsx';
import { LivePlayBar } from './components/LivePlayBar.tsx';
import { MobileActionBar } from './components/MobileActionBar.tsx';
import { QCDCanvas } from './components/QCDCanvas.tsx';
import { QCDInspector } from './components/QCDInspector.tsx';
import { QCDToolbox } from './components/QCDToolbox.tsx';
import { QCDLiveBar } from './components/QCDLiveBar.tsx';
import { PRESETS, PresetScene } from './optics/presets.ts';
import { QCD_PRESETS, QCDPresetScene } from './qcd/presets.ts';
import { traceRays } from './optics/raytracer.ts';
import type { OpticalElement, OpticalElementType, PhysicsSettings, LightColorProfile } from './optics/types.ts';
import type { Quark, QCDPhysicsSettings, HadronCluster } from './qcd/types.ts';
import { performNonAbelianColorSwap } from './qcd/physics.ts';

export default function App() {
  // Studio Mode: Geometric Optics Sandbox vs Quantum Chromodynamics (QCD) Studio
  const [studioMode, setStudioMode] = useState<'optics' | 'qcd'>('optics');

  // Optics Presets and Elements State
  const [currentPresetId, setCurrentPresetId] = useState<string>('laser-mandala');
  const [elements, setElements] = useState<OpticalElement[]>(() => {
    const initial = PRESETS.find((p) => p.id === 'laser-mandala') || PRESETS[0];
    return JSON.parse(JSON.stringify(initial.elements));
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('sources');
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'pan'>('select');

  // Quantum Chromodynamics (QCD) State & Physics Engine
  const [currentQCDPresetId, setCurrentQCDPresetId] = useState<string>('proton-baryon');
  const [quarks, setQuarks] = useState<Quark[]>(() => {
    const initial = QCD_PRESETS.find((p) => p.id === 'proton-baryon') || QCD_PRESETS[0];
    return JSON.parse(JSON.stringify(initial.quarks));
  });
  const [selectedQuarkId, setSelectedQuarkId] = useState<string | null>(null);
  const [hadronCluster, setHadronCluster] = useState<HadronCluster | null>(null);
  const [qcdPhysicsSettings, setQCDPhysicsSettings] = useState<QCDPhysicsSettings>({
    stringTensionGeVfm: 0.9,
    lambdaQCDMeV: 210,
    activeFlavors: 3,
    temperatureMeV: 0,
    runningCouplingEnabled: true,
    stringBreakingEnabled: true,
    gluonFluctuations: true,
    dynamicsRunning: true,
    colorExchangeEnabled: true,
    simulationRunning: true,
    timeSpeed: 1.0,
  });

  // Robust Physics & Optics Simulation Settings
  const [physicsSettings, setPhysicsSettings] = useState<PhysicsSettings>({
    dispersionMultiplier: 1.6,
    ambientMediumIndex: 1.0,
    fresnelSplitting: true,
    fresnelThreshold: 0.04,
    maxBounces: 35,
    maxSegments: 4500,
    minIntensity: 0.012,
    spectralQuality: 'balanced',
    lightProfile: 'golden',
    beamOverlayWidth: 18,
  });

  // Atmosphere & UI Settings
  const [lasersEnabled, setLasersEnabled] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showNormals, setShowNormals] = useState<boolean>(false);
  const [hazeDensity, setHazeDensity] = useState<number>(0.45);

  // Modals & Mobile Drawers
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [mobileToolboxOpen, setMobileToolboxOpen] = useState<boolean>(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState<boolean>(false);
  const [measureResult, setMeasureResult] = useState<{ distance: number; angleDeg: number } | null>(
    null
  );

  const handleUpdatePhysics = useCallback((partial: Partial<PhysicsSettings>) => {
    setPhysicsSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleCycleLightProfile = useCallback(() => {
    setPhysicsSettings((prev) => {
      const nextProfile: LightColorProfile =
        prev.lightProfile === 'golden'
          ? 'white'
          : prev.lightProfile === 'white'
          ? 'green'
          : 'golden';
      return { ...prev, lightProfile: nextProfile };
    });
  }, []);

  // Filter elements by laser toggle
  const activeElements = useMemo(() => {
    if (lasersEnabled) return elements;
    return elements.map((el) => {
      if (
        el.type === 'laser-single' ||
        el.type === 'laser-array' ||
        el.type === 'radial-source' ||
        el.type === 'polychromatic-source'
      ) {
        return { ...el, enabled: false };
      }
      return el;
    });
  }, [elements, lasersEnabled]);

  // Execute Real-Time Ray Tracing with Complete Physics Configuration
  const { segments, stats, sensorReadings } = useMemo(() => {
    return traceRays(activeElements, physicsSettings);
  }, [activeElements, physicsSettings]);

  // Update sensor power readings in element state if changed
  useEffect(() => {
    if (!sensorReadings) return;
    setElements((prev) => {
      let changed = false;
      const next = prev.map((el) => {
        if (el.type === 'sensor' && sensorReadings[el.id]) {
          const r = sensorReadings[el.id];
          if (el.detectedPower !== r.power || el.detectedRays !== r.rayCount) {
            changed = true;
            return { ...el, detectedPower: r.power, detectedRays: r.rayCount };
          }
        }
        return el;
      });
      return changed ? next : prev;
    });
  }, [sensorReadings]);

  // Handlers for Elements
  const handleUpdateElement = useCallback((updated: OpticalElement) => {
    setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
  }, []);

  const handleDeleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((curr) => (curr === id ? null : curr));
  }, []);

  const handleDuplicateElement = useCallback((id: string) => {
    setElements((prev) => {
      const source = prev.find((el) => el.id === id);
      if (!source) return prev;
      const copy: OpticalElement = {
        ...JSON.parse(JSON.stringify(source)),
        id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: `${source.name || source.type} (Copy)`,
        x: source.x + 30,
        y: source.y + 30,
      };
      setSelectedId(copy.id);
      return [...prev, copy];
    });
  }, []);

  const handleAddElement = useCallback((type: OpticalElementType) => {
    const id = `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const spawnX = 600;
    const spawnY = 400;

    let newEl: OpticalElement;

    switch (type) {
      case 'laser-single':
        newEl = {
          id,
          type: 'laser-single',
          name: 'Green Laser Pointer',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          wavelength: 532,
          color: '#22ff78',
          power: 1.0,
          beamWidth: 2,
          enabled: true,
        };
        break;
      case 'laser-array':
        newEl = {
          id,
          type: 'laser-array',
          name: 'Laser Array Comb',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          wavelength: 532,
          color: '#22ff78',
          power: 1.0,
          rayCount: 7,
          spacing: 14,
          enabled: true,
        };
        break;
      case 'radial-source':
        newEl = {
          id,
          type: 'radial-source',
          name: 'Omni Laser Star',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          wavelength: 532,
          color: '#22ff78',
          power: 1.0,
          rayCount: 48,
          spreadAngle: 360,
          enabled: true,
        };
        break;
      case 'polychromatic-source':
        newEl = {
          id,
          type: 'polychromatic-source',
          name: 'White Laser Emitter',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          power: 1.0,
          rayCount: 3,
          spacing: 12,
          spectralBands: [660, 605, 545, 500, 455, 415],
          enabled: true,
        };
        break;
      case 'biconvex-lens':
        newEl = {
          id,
          type: 'biconvex-lens',
          name: 'Biconvex Lens',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 30,
          height: 120,
          curvatureRadius: 100,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'plano-convex-lens':
        newEl = {
          id,
          type: 'plano-convex-lens',
          name: 'Plano-Convex Lens',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 25,
          height: 120,
          curvatureRadius: 90,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'biconcave-lens':
        newEl = {
          id,
          type: 'biconcave-lens',
          name: 'Biconcave Lens',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 30,
          height: 120,
          curvatureRadius: 100,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'plano-concave-lens':
        newEl = {
          id,
          type: 'plano-concave-lens',
          name: 'Plano-Concave Lens',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 25,
          height: 120,
          curvatureRadius: 90,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'meniscus-converging-lens':
        newEl = {
          id,
          type: 'meniscus-converging-lens',
          name: 'Meniscus (Converging)',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 30,
          height: 120,
          curvatureRadius1: 90,
          curvatureRadius2: 150,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'meniscus-diverging-lens':
        newEl = {
          id,
          type: 'meniscus-diverging-lens',
          name: 'Meniscus (Diverging)',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 24,
          height: 120,
          curvatureRadius1: 100,
          curvatureRadius2: 160,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'achromatic-doublet-lens':
        newEl = {
          id,
          type: 'achromatic-doublet-lens',
          name: 'Achromatic Doublet',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 36,
          height: 120,
          curvatureRadiusFront: 95,
          curvatureRadiusInterface: 80,
          curvatureRadiusBack: 220,
          refractiveIndexCrown: 1.5168,
          dispersionCrown: 0.0042,
          refractiveIndexFlint: 1.6727,
          dispersionFlint: 0.0165,
        };
        break;
      case 'aspheric-lens':
        newEl = {
          id,
          type: 'aspheric-lens',
          name: 'Aspheric Lens',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 30,
          height: 120,
          apexCurvatureRadius: 65,
          conicConstant: -1.0,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'cylindrical-lens':
        newEl = {
          id,
          type: 'cylindrical-lens',
          name: 'Cylindrical Lens',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 30,
          height: 120,
          curvatureRadius: 80,
          refractiveIndex: 1.517,
          dispersion: 0.006,
        };
        break;
      case 'right-angle-prism':
        newEl = {
          id,
          type: 'right-angle-prism',
          name: 'Porro Prism (45-90-45)',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          legLength: 110,
          refractiveIndex: 1.517,
          dispersion: 0.008,
        };
        break;
      case 'dove-prism':
        newEl = {
          id,
          type: 'dove-prism',
          name: 'Dove Inversion Prism',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          height: 48,
          baseLength: 140,
          refractiveIndex: 1.517,
          dispersion: 0.008,
        };
        break;
      case 'ball-lens':
        newEl = {
          id,
          type: 'ball-lens',
          name: 'Glass Sphere Ball',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          radius: 50,
          refractiveIndex: 1.52,
          dispersion: 0.006,
        };
        break;
      case 'prism':
        newEl = {
          id,
          type: 'prism',
          name: 'Equilateral Prism',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          sideLength: 120,
          apexAngle: 60,
          refractiveIndex: 1.62,
          dispersion: 0.015,
        };
        break;
      case 'block-lens':
        newEl = {
          id,
          type: 'block-lens',
          name: 'Acrylic Block',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          width: 140,
          height: 80,
          refractiveIndex: 1.49,
          dispersion: 0.005,
        };
        break;
      case 'flat-mirror':
        newEl = {
          id,
          type: 'flat-mirror',
          name: 'Plane Mirror',
          x: spawnX,
          y: spawnY,
          rotation: 45,
          length: 120,
        };
        break;
      case 'concave-mirror':
        newEl = {
          id,
          type: 'concave-mirror',
          name: 'Concave Mirror',
          x: spawnX,
          y: spawnY,
          rotation: 90,
          width: 140,
          curvatureRadius: 120,
        };
        break;
      case 'convex-mirror':
        newEl = {
          id,
          type: 'convex-mirror',
          name: 'Convex Mirror',
          x: spawnX,
          y: spawnY,
          rotation: 90,
          width: 140,
          curvatureRadius: 120,
        };
        break;
      case 'parabolic-mirror':
        newEl = {
          id,
          type: 'parabolic-mirror',
          name: 'Parabolic Mirror',
          x: spawnX,
          y: spawnY,
          rotation: 90,
          width: 160,
          focalLength: 80,
        };
        break;
      case 'corner-cube':
        newEl = {
          id,
          type: 'corner-cube',
          name: 'Retroreflector',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          size: 90,
        };
        break;
      case 'kaleidoscope':
        newEl = {
          id,
          type: 'kaleidoscope',
          name: 'Hexagon Mirror Tube',
          x: spawnX,
          y: spawnY,
          rotation: 0,
          sides: 6,
          radius: 140,
          length: 0,
        };
        break;
      case 'beam-splitter':
        newEl = {
          id,
          type: 'beam-splitter',
          name: '50/50 Beam Splitter',
          x: spawnX,
          y: spawnY,
          rotation: 45,
          length: 110,
          splitRatio: 0.5,
        };
        break;
      case 'diffraction-grating':
        newEl = {
          id,
          type: 'diffraction-grating',
          name: 'Diffraction Grating (600 lines/mm)',
          x: spawnX,
          y: spawnY,
          rotation: 90,
          length: 120,
          linesPerMm: 600,
        };
        break;
      case 'sensor':
        newEl = {
          id,
          type: 'sensor',
          name: 'Photodiode Sensor',
          x: spawnX,
          y: spawnY,
          rotation: 90,
          length: 90,
          detectedPower: 0,
          detectedRays: 0,
        };
        break;
      case 'screen':
      default:
        newEl = {
          id,
          type: 'screen',
          name: 'Observation Card',
          x: spawnX,
          y: spawnY,
          rotation: 90,
          length: 140,
        };
        break;
    }

    setElements((prev) => [...prev, newEl]);
    setSelectedId(id);
  }, []);

  const handleSelectPreset = useCallback((preset: PresetScene) => {
    setCurrentPresetId(preset.id);
    setElements(JSON.parse(JSON.stringify(preset.elements)));
    setSelectedId(null);
  }, []);

  const handleResetScene = useCallback(() => {
    const preset = PRESETS.find((p) => p.id === currentPresetId) || PRESETS[0];
    setElements(JSON.parse(JSON.stringify(preset.elements)));
    setSelectedId(null);
  }, [currentPresetId]);

  const handleClearCanvas = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  // QCD Simulation Callbacks
  const handleUpdateQCDPhysics = useCallback((partial: Partial<QCDPhysicsSettings>) => {
    setQCDPhysicsSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleUpdateQuark = useCallback((updated: Quark) => {
    setQuarks((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }, []);

  const handleUpdateAllQuarks = useCallback((all: Quark[]) => {
    setQuarks(all);
  }, []);

  const handleDeleteQuark = useCallback((id: string) => {
    setQuarks((prev) => prev.filter((q) => q.id !== id));
    setSelectedQuarkId((curr) => (curr === id ? null : curr));
  }, []);

  const handleDuplicateQuark = useCallback((id: string) => {
    setQuarks((prev) => {
      const target = prev.find((q) => q.id === id);
      if (!target) return prev;
      const dup: Quark = {
        ...target,
        id: `q-${target.flavor}-${Date.now().toString(36)}`,
        x: target.x + 35,
        y: target.y + 35,
      };
      setSelectedQuarkId(dup.id);
      return [...prev, dup];
    });
  }, []);

  const handleAddQuark = useCallback((quark: Quark) => {
    setQuarks((prev) => [...prev, quark]);
    setSelectedQuarkId(quark.id);
  }, []);

  const handleAddHadronTemplate = useCallback((templateQuarks: Quark[]) => {
    setQuarks(templateQuarks);
    setSelectedQuarkId(null);
  }, []);

  const handleSelectQCDPreset = useCallback((preset: QCDPresetScene) => {
    setCurrentQCDPresetId(preset.id);
    setQuarks(JSON.parse(JSON.stringify(preset.quarks)));
    if (preset.settings) {
      setQCDPhysicsSettings((prev) => ({ ...prev, ...preset.settings }));
    }
    setSelectedQuarkId(null);
  }, []);

  const handleResetQCDPreset = useCallback(() => {
    const preset = QCD_PRESETS.find((p) => p.id === currentQCDPresetId) || QCD_PRESETS[0];
    setQuarks(JSON.parse(JSON.stringify(preset.quarks)));
    setSelectedQuarkId(null);
  }, [currentQCDPresetId]);

  const handleClearQuarks = useCallback(() => {
    setQuarks([]);
    setSelectedQuarkId(null);
  }, []);

  const handleTriggerVacuumPair = useCallback(() => {
    const midX = 600;
    const midY = 400;
    const q1: Quark = {
      id: `vac-u-${Date.now()}`,
      flavor: 'up',
      isAntiquark: false,
      color: 'red',
      x: midX - 35,
      y: midY,
      vx: -0.2,
      vy: 0,
      massMeV: 2.2,
      charge: 2 / 3,
    };
    const q2: Quark = {
      id: `vac-ubar-${Date.now() + 1}`,
      flavor: 'up',
      isAntiquark: true,
      color: 'antired',
      x: midX + 35,
      y: midY,
      vx: 0.2,
      vy: 0,
      massMeV: 2.2,
      charge: -2 / 3,
    };
    setQuarks((prev) => [...prev, q1, q2]);
  }, []);

  const handleAutoBalanceSinglet = useCallback(() => {
    setQuarks((prev) => {
      if (prev.length === 2) {
        return [
          { ...prev[0], color: 'red', isAntiquark: false },
          { ...prev[1], color: 'antired', isAntiquark: true },
        ];
      }
      if (prev.length === 3) {
        return [
          { ...prev[0], color: 'red', isAntiquark: false },
          { ...prev[1], color: 'green', isAntiquark: false },
          { ...prev[2], color: 'blue', isAntiquark: false },
        ];
      }
      return prev;
    });
  }, []);

  const handleColorSwap = useCallback((id1: string, id2: string) => {
    if (!qcdPhysicsSettings.colorExchangeEnabled) return;
    setQuarks((prev) => {
      const q1 = prev.find((q) => q.id === id1);
      const q2 = prev.find((q) => q.id === id2);
      if (!q1 || !q2 || q1.color === q2.color) return prev;
      const { newC1, newC2 } = performNonAbelianColorSwap(q1.color, q2.color);
      return prev.map((q) => {
        if (q.id === id1) return { ...q, color: newC1 };
        if (q.id === id2) return { ...q, color: newC2 };
        return q;
      });
    });
  }, [qcdPhysicsSettings.colorExchangeEnabled]);

  const handleAddQuarkPair = useCallback((q1: Quark, q2: Quark) => {
    setQuarks((prev) => [...prev, q1, q2]);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveTool('pan');
      } else if (e.key === 'm' || e.key === 'M') {
        if (studioMode === 'optics') setActiveTool('measure');
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid((prev) => !prev);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (studioMode === 'optics') {
          setLasersEnabled((prev) => !prev);
        } else {
          setQCDPhysicsSettings((prev) => ({ ...prev, dynamicsRunning: !prev.dynamicsRunning }));
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (studioMode === 'optics' && selectedId) {
          handleDeleteElement(selectedId);
        } else if (studioMode === 'qcd' && selectedQuarkId) {
          handleDeleteQuark(selectedQuarkId);
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedQuarkId(null);
        setExportModalOpen(false);
        setHelpModalOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setExportModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, selectedQuarkId, studioMode, handleDeleteElement, handleDeleteQuark]);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId]
  );

  const selectedQuark = useMemo(
    () => quarks.find((q) => q.id === selectedQuarkId) || null,
    [quarks, selectedQuarkId]
  );

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 font-sans"
      data-testid="physics-app-container"
    >
      {/* Top Navigation & Action Bar with Studio Mode Switcher */}
      <TopBar
        mode={studioMode}
        onChangeMode={(newMode) => {
          setStudioMode(newMode);
          setSelectedId(null);
          setSelectedQuarkId(null);
        }}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        lasersEnabled={lasersEnabled}
        onToggleLasers={() => setLasersEnabled((prev) => !prev)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((prev) => !prev)}
        onSelectPreset={handleSelectPreset}
        onClearCanvas={handleClearCanvas}
        onResetScene={handleResetScene}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenHelp={() => setHelpModalOpen(true)}
        currentPresetId={currentPresetId}
        mobileToolboxOpen={mobileToolboxOpen}
        onToggleMobileToolbox={() => setMobileToolboxOpen(!mobileToolboxOpen)}
        mobileInspectorOpen={mobileInspectorOpen}
        onToggleMobileInspector={() => setMobileInspectorOpen(!mobileInspectorOpen)}
        lightProfile={physicsSettings.lightProfile}
        onCycleLightProfile={handleCycleLightProfile}
        currentQCDPresetId={currentQCDPresetId}
        onSelectQCDPreset={handleSelectQCDPreset}
        dynamicsRunning={qcdPhysicsSettings.dynamicsRunning}
        onToggleDynamics={() =>
          setQCDPhysicsSettings((prev) => ({ ...prev, dynamicsRunning: !prev.dynamicsRunning }))
        }
      />

      {/* Main Workspace: Left Palette + Center Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Left Elements / Particle Spawner Toolbox */}
        <div className="hidden lg:flex h-full shrink-0">
          {studioMode === 'optics' ? (
            <Toolbox
              onAddElement={(type) => {
                handleAddElement(type);
                setMobileToolboxOpen(false);
              }}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          ) : (
            <QCDToolbox
              onAddQuark={handleAddQuark}
              onAddHadronTemplate={handleAddHadronTemplate}
              onClearQuarks={handleClearQuarks}
              onResetPreset={handleResetQCDPreset}
              onTriggerVacuumPair={handleTriggerVacuumPair}
            />
          )}
        </div>

        {/* Mobile Left Drawer */}
        {mobileToolboxOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileToolboxOpen(false)}
            />
            <div className="relative z-50 flex h-full">
              {studioMode === 'optics' ? (
                <Toolbox
                  onAddElement={(type) => {
                    handleAddElement(type);
                    setMobileToolboxOpen(false);
                  }}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  onClose={() => setMobileToolboxOpen(false)}
                />
              ) : (
                <QCDToolbox
                  onAddQuark={(q) => {
                    handleAddQuark(q);
                    setMobileToolboxOpen(false);
                  }}
                  onAddHadronTemplate={(tpl) => {
                    handleAddHadronTemplate(tpl);
                    setMobileToolboxOpen(false);
                  }}
                  onClearQuarks={handleClearQuarks}
                  onResetPreset={handleResetQCDPreset}
                  onTriggerVacuumPair={handleTriggerVacuumPair}
                  onClose={() => setMobileToolboxOpen(false)}
                />
              )}
            </div>
          </div>
        )}

        {/* Center Simulation Canvas */}
        <main className="flex-1 relative overflow-hidden h-full">
          {studioMode === 'optics' ? (
            <>
              <CanvasView
                elements={elements}
                segments={segments}
                selectedId={selectedId}
                onSelectElement={(id) => setSelectedId(id)}
                onUpdateElement={handleUpdateElement}
                hazeDensity={hazeDensity}
                beamOverlayWidth={physicsSettings.beamOverlayWidth ?? 18}
                lightProfile={physicsSettings.lightProfile}
                showGrid={showGrid}
                showNormals={showNormals}
                activeTool={activeTool}
                onMeasureResult={setMeasureResult}
              />

              {/* Floating Live Play Bar */}
              <LivePlayBar
                physicsSettings={physicsSettings}
                onUpdatePhysics={handleUpdatePhysics}
                hazeDensity={hazeDensity}
                setHazeDensity={setHazeDensity}
                stats={stats}
              />

              {/* Mobile Action Bar */}
              <MobileActionBar
                element={selectedElement}
                onUpdateElement={handleUpdateElement}
                onDuplicateElement={handleDuplicateElement}
                onDeleteElement={handleDeleteElement}
                onDeselect={() => setSelectedId(null)}
                onOpenFullInspector={() => setMobileInspectorOpen(true)}
              />
            </>
          ) : (
            <>
              <QCDCanvas
                quarks={quarks}
                onUpdateQuark={handleUpdateQuark}
                onUpdateAllQuarks={handleUpdateAllQuarks}
                onSelectQuark={(id) => setSelectedQuarkId(id)}
                selectedQuarkId={selectedQuarkId}
                onAddQuarkPair={handleAddQuarkPair}
                physicsSettings={qcdPhysicsSettings}
                onUpdateHadronCluster={setHadronCluster}
                onColorSwap={handleColorSwap}
              />

              {/* Floating Live QCD Tuning Bar */}
              <QCDLiveBar
                physicsSettings={qcdPhysicsSettings}
                onUpdatePhysics={handleUpdateQCDPhysics}
                hadronCluster={hadronCluster}
                onTriggerVacuumPair={handleTriggerVacuumPair}
                onAutoBalanceSinglet={handleAutoBalanceSinglet}
              />
            </>
          )}

          {/* Floating Measurement Info Badge if active */}
          {activeTool === 'measure' && measureResult && studioMode === 'optics' && (
            <div className="absolute top-4 right-4 bg-neutral-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-amber-500/30 text-amber-300 font-mono text-xs shadow-xl flex items-center gap-3 z-20">
              <div>
                Distance: <span className="text-white font-bold">{measureResult.distance} px</span>
              </div>
              <div className="w-px h-3.5 bg-neutral-700" />
              <div>
                Angle: <span className="text-white font-bold">{measureResult.angleDeg}°</span>
              </div>
            </div>
          )}
        </main>

        {/* Desktop Right Inspector & Settings */}
        <div className="hidden lg:flex h-full shrink-0">
          {studioMode === 'optics' ? (
            <PropertyInspector
              selectedElement={selectedElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              hazeDensity={hazeDensity}
              setHazeDensity={setHazeDensity}
              physicsSettings={physicsSettings}
              onUpdatePhysics={handleUpdatePhysics}
              stats={stats}
            />
          ) : (
            <QCDInspector
              selectedQuark={selectedQuark}
              onUpdateQuark={handleUpdateQuark}
              onDeleteQuark={handleDeleteQuark}
              onDuplicateQuark={handleDuplicateQuark}
              quarks={quarks}
              physicsSettings={qcdPhysicsSettings}
              onUpdatePhysics={handleUpdateQCDPhysics}
              hadronCluster={hadronCluster}
            />
          )}
        </div>

        {/* Mobile Full Inspector Drawer */}
        {mobileInspectorOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileInspectorOpen(false)}
            />
            <div className="relative z-50 flex h-full">
              {studioMode === 'optics' ? (
                <PropertyInspector
                  selectedElement={selectedElement}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onDuplicateElement={handleDuplicateElement}
                  hazeDensity={hazeDensity}
                  setHazeDensity={setHazeDensity}
                  physicsSettings={physicsSettings}
                  onUpdatePhysics={handleUpdatePhysics}
                  stats={stats}
                  onClose={() => setMobileInspectorOpen(false)}
                />
              ) : (
                <QCDInspector
                  selectedQuark={selectedQuark}
                  onUpdateQuark={handleUpdateQuark}
                  onDeleteQuark={handleDeleteQuark}
                  onDuplicateQuark={handleDuplicateQuark}
                  quarks={quarks}
                  physicsSettings={qcdPhysicsSettings}
                  onUpdatePhysics={handleUpdateQCDPhysics}
                  hadronCluster={hadronCluster}
                  onClose={() => setMobileInspectorOpen(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Vector Export Dialog */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        elements={elements}
        segments={segments}
        beamOverlayWidth={physicsSettings.beamOverlayWidth ?? 18}
        mode={studioMode}
        quarks={quarks}
        hadronCluster={hadronCluster}
      />

      {/* Help & Theory Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        initialTab={studioMode}
      />
    </div>
  );
}

