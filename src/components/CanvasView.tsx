/**
 * High-Performance HTML5 Canvas Renderer for Geometric Optics & Ray Tracing
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { OpticalElement, RaySegment, Vector2D, LightColorProfile } from '../optics/types.ts';
import { vec, add, sub, scale, rotate, degToRad } from '../optics/math.ts';

interface CanvasViewProps {
  elements: OpticalElement[];
  segments: RaySegment[];
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (updated: OpticalElement) => void;
  hazeDensity: number; // 0.0 to 1.0
  beamOverlayWidth: number; // Extra wide beam overlay slider (0 to 45px)
  lightProfile: LightColorProfile;
  showGrid: boolean;
  showNormals: boolean;
  activeTool: 'select' | 'measure' | 'pan';
  onMeasureResult?: (result: { distance: number; angleDeg: number } | null) => void;
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  elements,
  segments,
  selectedId,
  onSelectElement,
  onUpdateElement,
  hazeDensity,
  beamOverlayWidth,
  lightProfile,
  showGrid,
  showNormals,
  activeTool,
  onMeasureResult,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<Vector2D>({ x: 0, y: 0 });
  const hasInitializedCenter = useRef(false);

  // Auto-center scene in viewport
  const centerScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || elements.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      minX = Math.min(minX, el.x - 60);
      maxX = Math.max(maxX, el.x + 60);
      minY = Math.min(minY, el.y - 60);
      maxY = Math.max(maxY, el.y + 60);
    }

    const sceneW = Math.max(200, maxX - minX);
    const sceneH = Math.max(200, maxY - minY);
    const sceneCenterX = (minX + maxX) / 2;
    const sceneCenterY = (minY + maxY) / 2;

    const viewW = canvas.clientWidth || 800;
    const viewH = canvas.clientHeight || 600;

    // Fit with margin
    const targetZoom = Math.min(1.4, Math.max(0.45, Math.min((viewW - 100) / sceneW, (viewH - 100) / sceneH)));
    const targetPanX = viewW / 2 - sceneCenterX * targetZoom;
    const targetPanY = viewH / 2 - sceneCenterY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [elements]);

  useEffect(() => {
    // Center on initial mount
    const timer = setTimeout(() => {
      centerScene();
    }, 100);
    return () => clearTimeout(timer);
  }, []); // Run on initial mount

  // Dragging state
  const isDraggingRef = useRef(false);
  const isRotatingRef = useRef(false);
  const isPanningRef = useRef(false);
  const dragStartMouseRef = useRef<Vector2D>({ x: 0, y: 0 });
  const dragStartElementRef = useRef<{ x: number; y: number; rotation: number } | null>(null);
  const measureStartRef = useRef<Vector2D | null>(null);
  const measureCurrentRef = useRef<Vector2D | null>(null);

  // Screen to World coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Vector2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: screenX, y: screenY };
      const rect = canvas.getBoundingClientRect();
      const cssX = screenX - rect.left;
      const cssY = screenY - rect.top;
      return {
        x: (cssX - pan.x) / zoom,
        y: (cssY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Find element at world coordinates
  const hitTestElement = useCallback(
    (worldPt: Vector2D): { element: OpticalElement | null; isRotateHandle: boolean } => {
      // Check in reverse order so top element gets picked
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        const dx = worldPt.x - el.x;
        const dy = worldPt.y - el.y;

        // If this element is already selected, check if user clicked the rotation handle
        if (el.id === selectedId) {
          const rotRad = degToRad(el.rotation);
          const handleOffset = 65;
          const handleWorld = add(
            vec(el.x, el.y),
            rotate(vec(0, -handleOffset), rotRad)
          );
          const distToHandle = Math.hypot(worldPt.x - handleWorld.x, worldPt.y - handleWorld.y);
          if (distToHandle <= 16) {
            return { element: el, isRotateHandle: true };
          }
        }

        // Hit box approximation based on geometric element dimensions
        const dist = Math.hypot(dx, dy);
        let hitRadius = 35;

        if ('height' in el && typeof el.height === 'number') {
          hitRadius = Math.max(35, el.height / 2 + 12);
        } else if ('radius' in el && typeof el.radius === 'number') {
          hitRadius = el.radius + 12;
        } else if ('sideLength' in el && typeof el.sideLength === 'number') {
          hitRadius = el.sideLength / 1.4;
        } else if ('legLength' in el && typeof el.legLength === 'number') {
          hitRadius = el.legLength / 1.4;
        } else if ('length' in el && typeof el.length === 'number') {
          hitRadius = el.length / 2 + 12;
        } else if (el.type === 'corner-cube' && 'size' in el) {
          hitRadius = el.size / 1.5;
        }

        if (dist <= hitRadius) {
          return { element: el, isRotateHandle: false };
        }
      }
      return { element: null, isRotateHandle: false };
    },
    [elements, selectedId]
  );

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect headless environment for optimal rendering
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    let animationFrameId: number;

    const render = () => {
      // Update canvas resolution to match display size & device pixel ratio
      const dpr = isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep optical bench dark slate background
      ctx.fillStyle = '#0a0c12';
      ctx.fillRect(0, 0, width, height);

      // Apply viewport transformation (Pan & Zoom)
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Draw Optical Bench Grid
      if (showGrid) {
        drawGrid(ctx, width, height, pan, zoom);
      }

      // 2. Draw Optical Elements (Glass, Mirrors, Mounts)
      for (const el of elements) {
        drawOpticalElement(ctx, el, el.id === selectedId);
      }

      // 3. Draw Laser Rays with glow & additive blending
      drawLaserRays(ctx, segments, hazeDensity, beamOverlayWidth, lightProfile, isHeadless);

      // 4. Draw Selection Gizmos (Rotation ring, bounding box)
      if (selectedId) {
        const selectedEl = elements.find((e) => e.id === selectedId);
        if (selectedEl) {
          drawSelectionGizmo(ctx, selectedEl);
        }
      }

      // 5. Draw Measurement tool overlay if active
      if (activeTool === 'measure' && measureStartRef.current && measureCurrentRef.current) {
        drawMeasurementGuide(ctx, measureStartRef.current, measureCurrentRef.current);
      }

      ctx.restore();
      ctx.restore();
    };

    render();

    // Re-render when elements or view state changes
  }, [
    elements,
    segments,
    selectedId,
    hazeDensity,
    beamOverlayWidth,
    lightProfile,
    showGrid,
    showNormals,
    activeTool,
    pan,
    zoom,
  ]);

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'pan' || e.button === 1 || e.button === 2) {
      isPanningRef.current = true;
      dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'measure') {
      measureStartRef.current = worldPt;
      measureCurrentRef.current = worldPt;
      return;
    }

    // Hit test
    const { element, isRotateHandle } = hitTestElement(worldPt);

    if (element) {
      onSelectElement(element.id);
      dragStartMouseRef.current = worldPt;
      dragStartElementRef.current = {
        x: element.x,
        y: element.y,
        rotation: element.rotation,
      };

      if (isRotateHandle) {
        isRotatingRef.current = true;
      } else {
        isDraggingRef.current = true;
      }
    } else {
      onSelectElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPt = screenToWorld(e.clientX, e.clientY);

    if (isPanningRef.current) {
      const dx = e.clientX - dragStartMouseRef.current.x;
      const dy = e.clientY - dragStartMouseRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (activeTool === 'measure' && measureStartRef.current) {
      measureCurrentRef.current = worldPt;
      const dx = worldPt.x - measureStartRef.current.x;
      const dy = worldPt.y - measureStartRef.current.y;
      const dist = Math.hypot(dx, dy);
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (onMeasureResult) {
        onMeasureResult({ distance: Math.round(dist * 10) / 10, angleDeg: Math.round(angleDeg * 10) / 10 });
      }
      return;
    }

    if (isDraggingRef.current && selectedId && dragStartElementRef.current) {
      const dx = worldPt.x - dragStartMouseRef.current.x;
      const dy = worldPt.y - dragStartMouseRef.current.y;
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        onUpdateElement({
          ...el,
          x: Math.round(dragStartElementRef.current.x + dx),
          y: Math.round(dragStartElementRef.current.y + dy),
        });
      }
      return;
    }

    if (isRotatingRef.current && selectedId && dragStartElementRef.current) {
      const el = elements.find((e) => e.id === selectedId);
      if (el) {
        const dx = worldPt.x - el.x;
        const dy = worldPt.y - el.y;
        let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        // Snap to 15 deg if Shift is held
        if (e.shiftKey) {
          angleDeg = Math.round(angleDeg / 15) * 15;
        }
        onUpdateElement({
          ...el,
          rotation: Math.round(angleDeg),
        });
      }
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRotatingRef.current = false;
    isPanningRef.current = false;
    dragStartElementRef.current = null;
    if (activeTool === 'measure') {
      measureStartRef.current = null;
      measureCurrentRef.current = null;
    }
  };

  // Touch Support for Mobile Live Play & Editing
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const worldPt = screenToWorld(touch.clientX, touch.clientY);

      if (activeTool === 'pan') {
        isPanningRef.current = true;
        dragStartMouseRef.current = { x: touch.clientX, y: touch.clientY };
        return;
      }

      if (activeTool === 'measure') {
        measureStartRef.current = worldPt;
        measureCurrentRef.current = worldPt;
        return;
      }

      // Hit test elements
      const { element, isRotateHandle } = hitTestElement(worldPt);
      if (element) {
        onSelectElement(element.id);
        dragStartMouseRef.current = worldPt;
        dragStartElementRef.current = {
          x: element.x,
          y: element.y,
          rotation: element.rotation,
        };
        if (isRotateHandle) {
          isRotatingRef.current = true;
        } else {
          isDraggingRef.current = true;
        }
      } else {
        // Touch on background starts smooth canvas pan
        isPanningRef.current = true;
        dragStartMouseRef.current = { x: touch.clientX, y: touch.clientY };
        onSelectElement(null);
      }
    } else if (e.touches.length === 2) {
      // Two-finger pinch to zoom & two-finger pan
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
      isDraggingRef.current = false;
      isRotatingRef.current = false;
      isPanningRef.current = true;
      dragStartMouseRef.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const worldPt = screenToWorld(touch.clientX, touch.clientY);

      if (isPanningRef.current) {
        const dx = touch.clientX - dragStartMouseRef.current.x;
        const dy = touch.clientY - dragStartMouseRef.current.y;
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
        dragStartMouseRef.current = { x: touch.clientX, y: touch.clientY };
        return;
      }

      if (activeTool === 'measure' && measureStartRef.current) {
        measureCurrentRef.current = worldPt;
        const dx = worldPt.x - measureStartRef.current.x;
        const dy = worldPt.y - measureStartRef.current.y;
        const dist = Math.hypot(dx, dy);
        const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (onMeasureResult) {
          onMeasureResult({
            distance: Math.round(dist * 10) / 10,
            angleDeg: Math.round(angleDeg * 10) / 10,
          });
        }
        return;
      }

      if (isDraggingRef.current && selectedId && dragStartElementRef.current) {
        const dx = worldPt.x - dragStartMouseRef.current.x;
        const dy = worldPt.y - dragStartMouseRef.current.y;
        const el = elements.find((e) => e.id === selectedId);
        if (el) {
          onUpdateElement({
            ...el,
            x: Math.round(dragStartElementRef.current.x + dx),
            y: Math.round(dragStartElementRef.current.y + dy),
          });
        }
        return;
      }

      if (isRotatingRef.current && selectedId && dragStartElementRef.current) {
        const el = elements.find((e) => e.id === selectedId);
        if (el) {
          const dx = worldPt.x - el.x;
          const dy = worldPt.y - el.y;
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          onUpdateElement({
            ...el,
            rotation: Math.round(angleDeg),
          });
        }
      }
    } else if (e.touches.length === 2 && touchStartDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleFactor = currentDist / touchStartDistRef.current;
      const newZoom = Math.min(3.5, Math.max(0.3, touchStartZoomRef.current * scaleFactor));
      setZoom(newZoom);

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const dx = midX - dragStartMouseRef.current.x;
      const dy = midY - dragStartMouseRef.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      dragStartMouseRef.current = { x: midX, y: midY };
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    isRotatingRef.current = false;
    isPanningRef.current = false;
    touchStartDistRef.current = null;
    dragStartElementRef.current = null;
    if (activeTool === 'measure') {
      measureStartRef.current = null;
      measureCurrentRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.909;
    const newZoom = Math.min(3.5, Math.max(0.3, zoom * zoomFactor));

    // Zoom centered at mouse cursor
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
        data-testid="optics-canvas"
        className="w-full h-full block cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      {/* Zoom indicator & Reset button */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 font-mono shadow-xl">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <button
          onClick={centerScene}
          className="hover:text-emerald-400 cursor-pointer ml-1 text-neutral-400 font-sans text-xs hover:underline"
          title="Reset Zoom & Pan to Fit Scene"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

// --- Canvas Drawing Helpers ---

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pan: Vector2D,
  zoom: number
) {
  ctx.save();
  ctx.strokeStyle = '#161a26';
  ctx.lineWidth = 1 / zoom;

  const step = 50;
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

  // Subtle coordinate dots at major 100px intersections
  ctx.fillStyle = '#232b3e';
  const majorStep = 100;
  const majorStartX = Math.floor((-pan.x / zoom) / majorStep) * majorStep;
  const majorEndX = majorStartX + (width / zoom) + majorStep;
  const majorStartY = Math.floor((-pan.y / zoom) / majorStep) * majorStep;
  const majorEndY = majorStartY + (height / zoom) + majorStep;

  for (let x = majorStartX; x <= majorEndX; x += majorStep) {
    for (let y = majorStartY; y <= majorEndY; y += majorStep) {
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
  }

  ctx.restore();
}

function drawLaserRays(
  ctx: CanvasRenderingContext2D,
  segments: RaySegment[],
  hazeDensity: number,
  beamOverlayWidth: number,
  lightProfile: LightColorProfile,
  isHeadless: boolean
) {
  if (segments.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Use additive blending for realistic laser glow
  ctx.globalCompositeOperation = isHeadless ? 'source-over' : 'lighter';

  // Pass 0: Extra Wide Volumetric Overlay for White & Golden Light Beams (Slider-driven)
  if (!isHeadless && beamOverlayWidth > 0) {
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const c = s.color.toLowerCase();
      const isGolden =
        c === '#fff1aa' ||
        c === '#ffe082' ||
        c.includes('ffd') ||
        c.includes('ffea') ||
        c.includes('fae') ||
        (lightProfile === 'golden' && !c.includes('38b') && !c.includes('22c') && !c.includes('ef4'));
      const isWhite =
        c === '#ffffff' ||
        c === '#f8fafc' ||
        (lightProfile === 'white' && !c.includes('38b') && !c.includes('22c') && !c.includes('ef4'));
      const isWhiteOrGold = isGolden || isWhite;

      if (isWhiteOrGold) {
        // Outer broad volumetric light shaft
        const outerWidth = Math.max(6, beamOverlayWidth * 2.5 + hazeDensity * 12);
        const outerAlpha = Math.min(0.36, s.intensity * (0.10 + hazeDensity * 0.28));
        ctx.strokeStyle = isGolden ? 'rgba(255, 236, 160, 0.28)' : 'rgba(255, 255, 255, 0.24)';
        ctx.globalAlpha = outerAlpha;
        ctx.lineWidth = outerWidth;

        ctx.beginPath();
        ctx.moveTo(s.p1.x, s.p1.y);
        ctx.lineTo(s.p2.x, s.p2.y);
        ctx.stroke();

        // Inner concentrated bloom shaft
        const innerWidth = Math.max(3, beamOverlayWidth * 1.05 + 4);
        const innerAlpha = Math.min(0.55, s.intensity * (0.24 + hazeDensity * 0.32));
        ctx.strokeStyle = isGolden ? '#ffea88' : '#ffffff';
        ctx.globalAlpha = innerAlpha;
        ctx.lineWidth = innerWidth;

        ctx.beginPath();
        ctx.moveTo(s.p1.x, s.p1.y);
        ctx.lineTo(s.p2.x, s.p2.y);
        ctx.stroke();
      } else {
        // Subtle glow proportional to beamOverlayWidth for colored lasers
        const colorGlowWidth = Math.max(2, beamOverlayWidth * 0.7 + hazeDensity * 6);
        const colorAlpha = Math.min(0.28, s.intensity * 0.22);
        ctx.strokeStyle = s.color;
        ctx.globalAlpha = colorAlpha;
        ctx.lineWidth = colorGlowWidth;

        ctx.beginPath();
        ctx.moveTo(s.p1.x, s.p1.y);
        ctx.lineTo(s.p2.x, s.p2.y);
        ctx.stroke();
      }
    }
  }

  // Pass 1: Laser Core Beams
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const alpha = Math.min(1.0, Math.max(0.12, s.intensity));

    ctx.strokeStyle = s.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(s.p1.x, s.p1.y);
    ctx.lineTo(s.p2.x, s.p2.y);
    ctx.stroke();
  }

  // Pass 2: Atmospheric Laser Haze / Glow (simulating smoke particles in chamber)
  if (!isHeadless && hazeDensity > 0.05) {
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const glowAlpha = Math.min(0.35, s.intensity * hazeDensity * 0.4);

      ctx.strokeStyle = s.color;
      ctx.globalAlpha = glowAlpha;
      ctx.lineWidth = 5 + hazeDensity * 9;

      ctx.beginPath();
      ctx.moveTo(s.p1.x, s.p1.y);
      ctx.lineTo(s.p2.x, s.p2.y);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawOpticalElement(
  ctx: CanvasRenderingContext2D,
  el: OpticalElement,
  isSelected: boolean
) {
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate(degToRad(el.rotation));

  // Selection halo
  if (isSelected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(-45, -45, 90, 90);
    ctx.setLineDash([]);
  }

  switch (el.type) {
    case 'laser-single':
    case 'laser-array':
    case 'radial-source':
    case 'polychromatic-source': {
      // Emitter body housing
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-22, -14, 44, 28, 6);
      ctx.fill();
      ctx.stroke();

      // Laser aperture diode
      const diodeColor = 'color' in el && typeof el.color === 'string' ? el.color : '#22ff78';
      ctx.fillStyle = diodeColor;
      ctx.beginPath();
      ctx.arc(14, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // Directional arrow
      ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(29, -5);
      ctx.lineTo(29, 5);
      ctx.closePath();
      ctx.fill();

      // Power indicator dot
      ctx.fillStyle = el.enabled ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(-12, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'flat-mirror': {
      const halfL = el.length / 2;
      // Metallic mirror face
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-halfL, 0);
      ctx.lineTo(halfL, 0);
      ctx.stroke();

      // Backing hatching
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      for (let x = -halfL + 6; x < halfL; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 2);
        ctx.lineTo(x + 5, 8);
        ctx.stroke();
      }
      break;
    }

    case 'concave-mirror':
    case 'convex-mirror': {
      const R = el.curvatureRadius;
      const halfW = Math.min(el.width / 2, R * 0.95);
      const sagitta = R - Math.sqrt(R * R - halfW * halfW);
      const isConcave = el.type === 'concave-mirror';
      const arcY = isConcave ? -sagitta : sagitta;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.quadraticCurveTo(0, arcY * 2, halfW, 0);
      ctx.stroke();
      break;
    }

    case 'parabolic-mirror': {
      const f = el.focalLength;
      const halfW = el.width / 2;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let lx = -halfW; lx <= halfW; lx += 4) {
        const ly = (lx * lx) / (4 * f);
        if (lx === -halfW) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      break;
    }

    case 'ball-lens': {
      // Glass body
      const grad = ctx.createRadialGradient(-el.radius * 0.3, -el.radius * 0.3, 5, 0, 0, el.radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.12)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.35)');

      ctx.fillStyle = grad;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, el.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'prism': {
      const s = el.sideLength;
      const apexRad = degToRad(el.apexAngle || 60);
      const height = s * Math.cos(apexRad / 2);
      const halfBase = s * Math.sin(apexRad / 2);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -height / 2);
      ctx.lineTo(halfBase, height / 2);
      ctx.lineTo(-halfBase, height / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'biconvex-lens': {
      const R = Math.max(el.curvatureRadius, el.height / 2 + 1);
      const halfH = el.height / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));

      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -halfH);
      ctx.quadraticCurveTo(sagitta * 2, 0, 0, halfH);
      ctx.quadraticCurveTo(-sagitta * 2, 0, 0, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'plano-convex-lens': {
      const R = Math.max(el.curvatureRadius, el.height / 2 + 1);
      const halfH = el.height / 2;
      const sagitta = R - Math.sqrt(Math.max(0, R * R - halfH * halfH));

      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-sagitta / 2, -halfH);
      ctx.lineTo(-sagitta / 2, halfH);
      ctx.quadraticCurveTo(sagitta * 1.5, 0, -sagitta / 2, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'plano-concave-lens': {
      const halfH = el.height / 2;
      const halfW = el.width / 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH);
      ctx.lineTo(halfW, -halfH);
      ctx.quadraticCurveTo(0, 0, halfW, halfH);
      ctx.lineTo(-halfW, halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'meniscus-converging-lens': {
      const halfH = el.height / 2;
      const thick = el.width || 30;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-thick / 2, -halfH);
      ctx.quadraticCurveTo(-thick, 0, -thick / 2, halfH);
      ctx.lineTo(thick / 2, halfH);
      ctx.quadraticCurveTo(0, 0, thick / 2, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'meniscus-diverging-lens': {
      const halfH = el.height / 2;
      const thick = el.width || 24;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-thick / 2, -halfH);
      ctx.quadraticCurveTo(0, 0, -thick / 2, halfH);
      ctx.lineTo(thick / 2, halfH);
      ctx.quadraticCurveTo(thick, 0, thick / 2, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'achromatic-doublet-lens': {
      const halfH = el.height / 2;
      const halfW = el.width / 2;

      // Crown Glass (Left Element) - sky tint
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH);
      ctx.quadraticCurveTo(-halfW * 2.2, 0, -halfW, halfH);
      ctx.lineTo(0, halfH);
      ctx.quadraticCurveTo(halfW * 0.5, 0, 0, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flint Glass (Right Element) - warm amber tint
      ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -halfH);
      ctx.quadraticCurveTo(halfW * 0.5, 0, 0, halfH);
      ctx.lineTo(halfW, halfH);
      ctx.quadraticCurveTo(halfW * 1.5, 0, halfW, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cemented interface indicator
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -halfH);
      ctx.quadraticCurveTo(halfW * 0.5, 0, 0, halfH);
      ctx.stroke();

      // Glass Labels
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('CROWN', -halfW * 0.5, 0);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('FLINT', halfW * 0.5, 0);
      break;
    }

    case 'aspheric-lens': {
      const halfH = el.height / 2;
      const halfW = el.width / 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(halfW, -halfH);
      ctx.lineTo(halfW, halfH);
      ctx.lineTo(-halfW + 15, halfH);
      // Smooth parabolic apex
      ctx.quadraticCurveTo(-halfW - 12, 0, -halfW + 15, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.font = '8px JetBrains Mono, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('ASPHERIC', 4, 0);
      break;
    }

    case 'cylindrical-lens': {
      const halfH = el.height / 2;
      const halfW = el.width / 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW + 10, -halfH);
      ctx.quadraticCurveTo(-halfW - 8, 0, -halfW + 10, halfH);
      ctx.lineTo(halfW, halfH);
      ctx.lineTo(halfW, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'right-angle-prism': {
      const L = el.legLength || 100;
      const halfL = L / 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfL, halfL);
      ctx.lineTo(-halfL, -halfL);
      ctx.lineTo(halfL, halfL);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right angle square indicator
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(-halfL, halfL - 10, 10, 10);
      break;
    }

    case 'dove-prism': {
      const H = el.height || 50;
      const B = el.baseLength || 140;
      const halfB = B / 2;
      const halfH = H / 2;
      const topHalf = halfB - H;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfB, halfH);
      ctx.lineTo(-topHalf, -halfH);
      ctx.lineTo(topHalf, -halfH);
      ctx.lineTo(halfB, halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'biconcave-lens': {
      const halfH = el.height / 2;
      const halfW = el.width / 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH);
      ctx.lineTo(halfW, -halfH);
      ctx.quadraticCurveTo(0, 0, halfW, halfH);
      ctx.lineTo(-halfW, halfH);
      ctx.quadraticCurveTo(0, 0, -halfW, -halfH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'block-lens': {
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.fillRect(-halfW, -halfH, el.width, el.height);
      ctx.strokeRect(-halfW, -halfH, el.width, el.height);
      break;
    }

    case 'beam-splitter': {
      const halfL = el.length / 2;
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(-halfL, 0);
      ctx.lineTo(halfL, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    case 'kaleidoscope': {
      const sides = Math.max(3, el.sides);
      const r = el.radius;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const theta = (i * 2 * Math.PI) / sides;
        const px = r * Math.cos(theta);
        const py = r * Math.sin(theta);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'corner-cube': {
      const s = el.size / 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(s, 0);
      ctx.stroke();
      break;
    }

    case 'sensor': {
      const halfL = el.length / 2;
      ctx.fillStyle = '#10b981';
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-halfL, 0);
      ctx.lineTo(halfL, 0);
      ctx.stroke();

      // Sensor reading badge
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(-28, -20, 56, 16);
      ctx.fillStyle = '#34d399';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${(el.detectedPower || 0).toFixed(1)} W`, 0, -8);
      break;
    }

    case 'screen': {
      const halfL = el.length / 2;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-halfL, 0);
      ctx.lineTo(halfL, 0);
      ctx.stroke();
      break;
    }

    default:
      break;
  }

  // Label
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(el.name || el.type, 0, 38);

  ctx.restore();
}

function drawSelectionGizmo(ctx: CanvasRenderingContext2D, el: OpticalElement) {
  ctx.save();
  ctx.translate(el.x, el.y);
  ctx.rotate(degToRad(el.rotation));

  // Rotation Handle stem & circle
  const handleOffset = 65;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -handleOffset);
  ctx.stroke();

  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -handleOffset, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMeasurementGuide(
  ctx: CanvasRenderingContext2D,
  p1: Vector2D,
  p2: Vector2D
) {
  ctx.save();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
  ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
  ctx.fill();

  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(mid.x - 45, mid.y - 20, 90, 24);
  ctx.strokeStyle = '#f59e0b';
  ctx.setLineDash([]);
  ctx.strokeRect(mid.x - 45, mid.y - 20, 90, 24);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${dist.toFixed(0)}px | ${angle.toFixed(1)}°`, mid.x, mid.y - 4);

  ctx.restore();
}
