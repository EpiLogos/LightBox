/**
 * Quantum Chromodynamics (QCD) Interactive Canvas
 * Real-time Wilson flux tube rendering, Steiner 3-way Y-junctions, and SU(3) color dynamics
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type {
  Quark,
  QCDPhysicsSettings,
  GluonExchangeParticle,
  HadronCluster,
} from '../qcd/types.ts';
import {
  calculateBaryonSteinerJunction,
  calculateCornellPotentialMeV,
  calculateRunningAlphaS,
  calculateEffectiveStringTension,
  classifyHadronCluster,
  calculateQCDDynamicsStep,
  performNonAbelianColorSwap,
  getQuarkColorHex,
  PIXELS_PER_FM,
  CRITICAL_TEMPERATURE_TC_MEV,
} from '../qcd/physics.ts';

interface QCDCanvasProps {
  quarks: Quark[];
  onUpdateQuark: (updated: Quark) => void;
  onUpdateAllQuarks?: (all: Quark[]) => void;
  onSelectQuark: (id: string | null) => void;
  selectedQuarkId: string | null;
  onAddQuarkPair: (q1: Quark, q2: Quark) => void;
  physicsSettings: QCDPhysicsSettings;
  onUpdateHadronCluster: (cluster: HadronCluster) => void;
  onColorSwap?: (id1: string, id2: string) => void;
}

export const QCDCanvas: React.FC<QCDCanvasProps> = ({
  quarks,
  onUpdateQuark,
  onUpdateAllQuarks,
  onSelectQuark,
  selectedQuarkId,
  onAddQuarkPair,
  physicsSettings,
  onUpdateHadronCluster,
  onColorSwap,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);

  const activeQuarksRef = useRef<Quark[]>(quarks);
  const dynamicsFrameCountRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const dragQuarkIdRef = useRef<string | null>(null);
  const dragStartMouseRef = useRef({ x: 0, y: 0 });
  const gluonsRef = useRef<GluonExchangeParticle[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const breakingCooldownRef = useRef(0);

  // Sync ref when quarks prop changes
  useEffect(() => {
    activeQuarksRef.current = quarks;
  }, [quarks]);

  // Coordinate transforms
  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: sx, y: sy };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (sx - rect.left - pan.x) / zoom,
        y: (sy - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Hit test quark
  const hitTestQuark = useCallback(
    (worldPt: { x: number; y: number }) => {
      const currentQuarks = activeQuarksRef.current;
      for (let i = currentQuarks.length - 1; i >= 0; i--) {
        const q = currentQuarks[i];
        const dist = Math.hypot(worldPt.x - q.x, worldPt.y - q.y);
        if (dist <= 26) {
          return q;
        }
      }
      return null;
    },
    []
  );

  // Simulation step & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (time: number) => {
      const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000) * physicsSettings.timeSpeed;
      lastTimeRef.current = time;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Background Quantum Vacuum with vacuum fluctuation grain
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);

      // World transform
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw faint QCD sub-femtometer coordinate grid
      drawSubatomicGrid(ctx, width, height, pan, zoom);

      const currentQuarks = activeQuarksRef.current;

      const effectiveTension = calculateEffectiveStringTension(
        physicsSettings.stringTensionGeVfm,
        physicsSettings.temperatureMeV
      );

      const isQGP = physicsSettings.temperatureMeV >= CRITICAL_TEMPERATURE_TC_MEV;

      // 1. Wilson Flux Tubes / Strings
      if (!isQGP && currentQuarks.length >= 2) {
        if (currentQuarks.length === 2) {
          // Meson flux tube (q - qbar)
          const q1 = currentQuarks[0];
          const q2 = currentQuarks[1];
          const distPx = Math.hypot(q2.x - q1.x, q2.y - q1.y);
          const distFm = distPx / PIXELS_PER_FM;
          const energyMeV = calculateCornellPotentialMeV(distFm, effectiveTension);

          drawWilsonFluxTube(ctx, q1, q2, effectiveTension, energyMeV, time);

          // Check String Breaking threshold (E > 600 MeV and r > 1.4 fm)
          if (
            physicsSettings.stringBreakingEnabled &&
            distFm > 1.35 &&
            breakingCooldownRef.current <= 0
          ) {
            breakingCooldownRef.current = 1.5; // Cooldown seconds
            const midX = (q1.x + q2.x) / 2;
            const midY = (q1.y + q2.y) / 2;

            // Materialize new virtual quark-antiquark pair from the vacuum
            const newQuark: Quark = {
              id: `q-vac-${Date.now()}-1`,
              flavor: 'up',
              isAntiquark: false,
              color: q2.isAntiquark ? 'red' : 'blue',
              x: midX - 25,
              y: midY,
              vx: -0.2,
              vy: 0,
              massMeV: 2.2,
              charge: 2 / 3,
            };
            const newAntiquark: Quark = {
              id: `q-vac-${Date.now()}-2`,
              flavor: 'down',
              isAntiquark: true,
              color: q2.isAntiquark ? 'antired' : 'antiblue',
              x: midX + 25,
              y: midY,
              vx: 0.2,
              vy: 0,
              massMeV: 4.7,
              charge: 1 / 3,
            };
            onAddQuarkPair(newQuark, newAntiquark);
          }
        } else if (currentQuarks.length === 3) {
          // Baryon Y-shaped Steiner junction
          const junction = calculateBaryonSteinerJunction(currentQuarks[0], currentQuarks[1], currentQuarks[2]);
          drawBaryonSteinerFluxTubes(ctx, currentQuarks, junction, effectiveTension, time);
        } else {
          // Multi-quark complex (connect nearby pairs)
          for (let i = 0; i < currentQuarks.length; i++) {
            for (let j = i + 1; j < currentQuarks.length; j++) {
              const qA = currentQuarks[i];
              const qB = currentQuarks[j];
              const d = Math.hypot(qB.x - qA.x, qB.y - qA.y);
              if (d < 300) {
                drawWilsonFluxTube(ctx, qA, qB, effectiveTension * 0.7, 200, time);
              }
            }
          }
        }
      }

      // 2. QGP Deconfined Plasma Glow if T > Tc
      if (isQGP) {
        drawQGPGlow(ctx, currentQuarks, physicsSettings.temperatureMeV, time);
      }

      // 3. Gluon Exchange Particles (SU(3) Octet Quanta)
      if (physicsSettings.gluonFluctuations && currentQuarks.length >= 2) {
        updateAndDrawGluons(ctx, gluonsRef, currentQuarks, dt, time, onColorSwap);
      }

      // 4. Draw Quarks
      for (const q of currentQuarks) {
        const isSelected = q.id === selectedQuarkId;
        drawQuark(ctx, q, isSelected, time);
      }

      // 5. If dynamics is running, step positions
      if (physicsSettings.dynamicsRunning) {
        const stepped = calculateQCDDynamicsStep(currentQuarks, physicsSettings, dt);
        // If dragging, retain dragged quark position
        if (isDraggingRef.current && dragQuarkIdRef.current) {
          const original = currentQuarks.find((item) => item.id === dragQuarkIdRef.current);
          if (original) {
            const dragIdx = stepped.findIndex((item) => item.id === dragQuarkIdRef.current);
            if (dragIdx >= 0) {
              stepped[dragIdx].x = original.x;
              stepped[dragIdx].y = original.y;
              stepped[dragIdx].vx = 0;
              stepped[dragIdx].vy = 0;
            }
          }
        }
        activeQuarksRef.current = stepped;
        dynamicsFrameCountRef.current++;
        if (dynamicsFrameCountRef.current % 4 === 0 && onUpdateAllQuarks) {
          onUpdateAllQuarks(stepped);
        }
      }

      ctx.restore(); // restore world transform

      // Update cooldown
      if (breakingCooldownRef.current > 0) {
        breakingCooldownRef.current -= dt;
      }

      ctx.restore(); // restore screen transform

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    quarks,
    selectedQuarkId,
    physicsSettings,
    pan,
    zoom,
    onAddQuarkPair,
  ]);

  // Periodic hadron cluster classification
  useEffect(() => {
    const cluster = classifyHadronCluster(quarks, physicsSettings.stringTensionGeVfm);
    onUpdateHadronCluster(cluster);
  }, [quarks, physicsSettings.stringTensionGeVfm, onUpdateHadronCluster]);

  // Mouse & Touch interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);
    const clickedQuark = hitTestQuark(worldPt);

    if (clickedQuark) {
      isDraggingRef.current = true;
      dragQuarkIdRef.current = clickedQuark.id;
      dragStartMouseRef.current = worldPt;
      onSelectQuark(clickedQuark.id);
    } else {
      isPanningRef.current = true;
      dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
      onSelectQuark(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && dragQuarkIdRef.current) {
      const worldPt = screenToWorld(e.clientX, e.clientY);
      const q = quarks.find((item) => item.id === dragQuarkIdRef.current);
      if (q) {
        onUpdateQuark({ ...q, x: Math.round(worldPt.x), y: Math.round(worldPt.y) });
      }
      return;
    }

    if (isPanningRef.current) {
      const dx = e.clientX - dragStartMouseRef.current.x;
      const dy = e.clientY - dragStartMouseRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isPanningRef.current = false;
    dragQuarkIdRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.909;
    const newZoom = Math.min(2.5, Math.max(0.4, zoom * factor));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-neutral-950 select-none">
      <canvas
        ref={canvasRef}
        data-testid="qcd-canvas"
        className="w-full h-full block cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Zoom readout */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 font-mono shadow-xl">
        <span>Scale: {Math.round(zoom * 100)}%</span>
        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          className="hover:text-emerald-400 cursor-pointer text-neutral-400 text-xs underline"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

// --- Drawing Helper Functions ---

function drawSubatomicGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pan: { x: number; y: number },
  zoom: number
) {
  ctx.save();
  ctx.strokeStyle = '#0f1422';
  ctx.lineWidth = 1 / zoom;

  const step = PIXELS_PER_FM; // 1 femtometer grid lines
  const startX = Math.floor((-pan.x / zoom) / step) * step - step;
  const endX = startX + (width / zoom) + step * 2;
  const startY = Math.floor((-pan.y / zoom) / step) * step - step;
  const endY = startY + (height / zoom) + step * 2;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += step) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += step) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // Subtle 1 fm grid marker text
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = '#1e293b';
  for (let x = startX; x <= endX; x += step * 2) {
    for (let y = startY; y <= endY; y += step * 2) {
      ctx.fillText('1 fm', x + 4, y - 4);
    }
  }

  ctx.restore();
}

function drawWilsonFluxTube(
  ctx: CanvasRenderingContext2D,
  q1: Quark,
  q2: Quark,
  tensionGeVfm: number,
  energyMeV: number,
  timeMs: number
) {
  const dx = q2.x - q1.x;
  const dy = q2.y - q1.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const color1 = getQuarkColorHex(q1.color);
  const color2 = getQuarkColorHex(q2.color);

  ctx.save();

  // 1. Broad Chromoelectric Energy Density Halo
  const gradient = ctx.createLinearGradient(q1.x, q1.y, q2.x, q2.y);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  // High tension or approaching break creates red pulsating strain
  const isStrained = energyMeV > 450;
  const pulse = Math.sin(timeMs * 0.008) * 0.2 + 0.8;

  ctx.strokeStyle = gradient;
  ctx.lineWidth = isStrained ? 24 * pulse : 16;
  ctx.globalAlpha = isStrained ? 0.35 : 0.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(q1.x, q1.y);
  ctx.lineTo(q2.x, q2.y);
  ctx.stroke();

  // 2. Focused Confinement Core (String Tension ~ 1 GeV/fm)
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(q1.x, q1.y);
  ctx.lineTo(q2.x, q2.y);
  ctx.stroke();

  // 3. Central Coherent Filament
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(q1.x, q1.y);
  ctx.lineTo(q2.x, q2.y);
  ctx.stroke();

  // 4. Flux tube field text: distance in fm and string energy in MeV
  const midX = (q1.x + q2.x) / 2;
  const midY = (q1.y + q2.y) / 2;
  const distFm = (dist / PIXELS_PER_FM).toFixed(2);

  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.9;
  ctx.fillText(`${distFm} fm | ${Math.round(energyMeV)} MeV`, midX, midY - 14);

  if (isStrained) {
    ctx.fillStyle = '#f87171';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('CRITICAL STRING TENSION: HADRONIZATION IMMINENT', midX, midY + 18);
  }

  ctx.restore();
}

function drawBaryonSteinerFluxTubes(
  ctx: CanvasRenderingContext2D,
  quarks: Quark[],
  junction: { x: number; y: number; totalLengthFm: number },
  tensionGeVfm: number,
  timeMs: number
) {
  const jx = junction.x;
  const jy = junction.y;

  ctx.save();

  // Draw 3 flux tubes meeting at Torricelli-Steiner junction
  for (const q of quarks) {
    const qColor = getQuarkColorHex(q.color);
    const grad = ctx.createLinearGradient(q.x, q.y, jx, jy);
    grad.addColorStop(0, qColor);
    grad.addColorStop(1, '#ffffff');

    // Outer halo
    ctx.strokeStyle = grad;
    ctx.lineWidth = 14;
    ctx.globalAlpha = 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(jx, jy);
    ctx.stroke();

    // Inner string
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(jx, jy);
    ctx.stroke();

    // Core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(q.x, q.y);
    ctx.lineTo(jx, jy);
    ctx.stroke();
  }

  // Draw the Steiner 3-way Junction Point (where strings meet at 120 deg)
  const pulse = Math.sin(timeMs * 0.006) * 2 + 6;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(jx, jy, pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText('120° STEINER JUNCTION', jx, jy - 14);

  ctx.restore();
}

function drawQGPGlow(
  ctx: CanvasRenderingContext2D,
  quarks: Quark[],
  tempMeV: number,
  timeMs: number
) {
  ctx.save();
  for (const q of quarks) {
    const rad = 75 + Math.sin(timeMs * 0.005 + q.x) * 10;
    const grad = ctx.createRadialGradient(q.x, q.y, 5, q.x, q.y, rad);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(q.x, q.y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '12px JetBrains Mono, monospace';
  ctx.fillStyle = '#f59e0b';
  ctx.textAlign = 'left';
  ctx.fillText(`QUARK-GLUON PLASMA (T = ${Math.round(tempMeV)} MeV > Tc) - DECONFINED PHASE`, 30, 40);
  ctx.restore();
}

function updateAndDrawGluons(
  ctx: CanvasRenderingContext2D,
  gluonsRef: React.MutableRefObject<GluonExchangeParticle[]>,
  quarks: Quark[],
  dt: number,
  timeMs: number,
  onColorSwap?: (id1: string, id2: string) => void
) {
  // Periodically emit a virtual gluon packet between interacting quarks
  if (gluonsRef.current.length < 5 && Math.random() < 0.06) {
    const srcIdx = Math.floor(Math.random() * quarks.length);
    let tgtIdx = Math.floor(Math.random() * (quarks.length - 1));
    if (tgtIdx >= srcIdx) tgtIdx++;

    const qSrc = quarks[srcIdx];
    const qTgt = quarks[tgtIdx];

    gluonsRef.current.push({
      id: `gluon-${Date.now()}-${Math.random()}`,
      sourceQuarkId: qSrc.id,
      targetQuarkId: qTgt.id,
      progress: 0,
      speed: 0.6 + Math.random() * 0.5,
      colorCarried: qSrc.color,
      anticolorCarried: qTgt.isAntiquark ? qTgt.color : 'antired',
      wavelength: 550,
    });
  }

  ctx.save();

  // Advance and draw gluons
  const remaining: GluonExchangeParticle[] = [];
  for (const g of gluonsRef.current) {
    g.progress += g.speed * dt;
    if (g.progress >= 1.0) {
      // Exchange complete: swap or shift color charge (SU(3) gauge rotation)
      if (onColorSwap) {
        onColorSwap(g.sourceQuarkId, g.targetQuarkId);
      }
      continue;
    }

    const qSrc = quarks.find((q) => q.id === g.sourceQuarkId);
    const qTgt = quarks.find((q) => q.id === g.targetQuarkId);
    if (!qSrc || !qTgt) continue;

    const gx = qSrc.x + (qTgt.x - qSrc.x) * g.progress;
    const gy = qSrc.y + (qTgt.y - qSrc.y) * g.progress;

    const gluonColor = getQuarkColorHex(g.colorCarried);

    // Glowing gluon packet
    ctx.fillStyle = gluonColor;
    ctx.shadowColor = gluonColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(gx, gy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Secondary core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
    ctx.fill();

    remaining.push(g);
  }

  gluonsRef.current = remaining;
  ctx.restore();
}

function drawQuark(
  ctx: CanvasRenderingContext2D,
  q: Quark,
  isSelected: boolean,
  timeMs: number
) {
  const colorHex = getQuarkColorHex(q.color);
  const radius = 22;

  ctx.save();

  // Selection outline
  if (isSelected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(q.x, q.y, radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 1. Quantum Color Glow Halo
  const pulse = Math.sin(timeMs * 0.007 + q.x) * 4;
  const grad = ctx.createRadialGradient(q.x, q.y, 4, q.x, q.y, radius + 14 + pulse);
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.6, `${colorHex}44`);
  grad.addColorStop(1, `${colorHex}00`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(q.x, q.y, radius + 14 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // 2. Quark Body
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(q.x, q.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Central Color Core Dot
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.arc(q.x, q.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // 4. Flavor Label (u, d, s, c, b, t)
  const symbol = q.isAntiquark ? `${q.flavor[0]}̄` : q.flavor[0];
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, q.x, q.y - 1);

  // 5. Electric Charge Badge (e.g. +2/3 e or -1/3 e)
  const chargeStr = q.charge > 0 ? `+${(q.charge).toFixed(2).replace('.67', '⅔').replace('.33', '⅓')}e` : `${(q.charge).toFixed(2).replace('-.33', '-⅓').replace('-.67', '-⅔')}e`;
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(chargeStr, q.x, q.y + radius + 12);

  // 6. SU(3) Color Tag
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = colorHex;
  ctx.fillText(q.color.toUpperCase(), q.x, q.y - radius - 8);

  // 7. Lock indicator badge if pinned
  if (q.locked) {
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(q.x + radius - 4, q.y - radius + 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillText('L', q.x + radius - 4, q.y - radius + 4);
  }

  ctx.restore();
}
