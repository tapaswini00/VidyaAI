import React, { useState, useEffect, useRef } from "react";
import { getModelById } from "../data/modelsData";
import { Interactive3DModel, ModelPart } from "../types";
import { Rotate3d, ZoomIn, ZoomOut, RefreshCw, Layers, ShieldAlert, CheckCircle, HelpCircle, FileText, ChevronRight, Play, Pause, Eye, Sparkles } from "lucide-react";
import AudioRecorder from "./AudioRecorder";

interface ThreeDViewerProps {
  modelId: string;
  onSelectPart: (part: ModelPart) => void;
  onAskModelQuestion?: (query: string, partName?: string) => void;
  onActionRequest?: (action: "simplify" | "notes" | "quiz", content: string) => void;
}

export default function ThreeDViewer({
  modelId,
  onSelectPart,
  onAskModelQuestion,
  onActionRequest,
}: ThreeDViewerProps) {
  const model: Interactive3DModel | undefined = getModelById(modelId);
  
  if (!model) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-purple-50/50 rounded-2xl border border-purple-100">
        <ShieldAlert className="w-12 h-12 text-purple-400 mb-2" />
        <p className="text-purple-900 font-semibold">Model "{modelId}" not found.</p>
        <p className="text-xs text-purple-600 mt-1">Please select an interactive model from the library instead.</p>
      </div>
    );
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // View Modes & Spin Settings
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [isSpinning, setIsSpinning] = useState<boolean>(true);

  // Camera State
  const [yaw, setYaw] = useState<number>(0.5); // Rotation around Y
  const [pitch, setPitch] = useState<number>(0.2); // Rotation around X
  const [zoom, setZoom] = useState<number>(1.2);
  const [selectedPart, setSelectedPart] = useState<ModelPart | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [pulseTime, setPulseTime] = useState<number>(0);
  const [showWireframeRaw, setShowWireframeRaw] = useState<boolean>(false);
  const showWireframe = showWireframeRaw;
  const [customAIAskStr, setCustomAIAskStr] = useState<string>("");
  const [quizAnswerSelected, setQuizAnswerSelected] = useState<number | null>(null);
  const [quizScoreFeedback, setQuizScoreFeedback] = useState<string | null>(null);

  // Keep drawing loop ticking
  useEffect(() => {
    let animationId: number;
    const tick = () => {
      setPulseTime((prev) => (prev + 0.05) % (Math.PI * 2));
      const canSpin = viewMode === "3d" && isSpinning && !isDragging;
      if (canSpin) {
        setYaw((prev) => (prev + 0.005) % (Math.PI * 2));
      }
      animationId = requestAnimationFrame(tick);
    };
    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [viewMode, isSpinning, isDragging]);

  // Projection math
  const project3D = (coord: { x: number; y: number; z: number }, width: number, height: number) => {
    const x = coord.x;
    const y = coord.y;
    const z = coord.z;

    // Scale coordinates
    const scaleFactor = Math.min(width, height) * 0.23 * zoom;

    // Apply combined rotation
    const totalYaw = yaw;
    const totalPitch = pitch;

    // Rotate Y (Yaw)
    const cosY = Math.cos(totalYaw);
    const sinY = Math.sin(totalYaw);
    const rx1 = x * cosY - z * sinY;
    const rz1 = x * sinY + z * cosY;

    // Rotate X (Pitch)
    const cosP = Math.cos(totalPitch);
    const sinP = Math.sin(totalPitch);
    const ry2 = y * cosP - rz1 * sinP;
    const rz2 = y * sinP + rz1 * cosP;

    // Transform to 2D Center Space
    const screenX = width / 2 + rx1 * scaleFactor;
    const screenY = height / 2 + ry2 * scaleFactor;
    return { x: screenX, y: screenY, z: rz2 }; // z coordinate used for depth sorting
  };

  // Re-draw Canvas when parameters change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set correct dimensions for High DPI
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Apply high-quality rendering
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    
    // Clear previous settings
    ctx.filter = "none";
    ctx.shadowBlur = 0;



    // Draw grid pattern in the background for depth
    ctx.strokeStyle = "rgba(124, 58, 237, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let i = 0; i < width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // ─── SOLID SCIENTIFIC MODEL DRAWINGS (RENDER GRAPHICS BY TOPIC) ───
    if (model.id === "human-heart") {
      drawHeartModel(ctx, width, height);
    } else if (model.id === "solar-system") {
      drawSolarSystemModel(ctx, width, height);
    } else if (model.id === "volcano") {
      drawVolcanoModel(ctx, width, height);
    } else if (model.id === "cell-structure") {
      drawCellStructureModel(ctx, width, height);
    } else if (model.id === "dna") {
      drawDNAModel(ctx, width, height);
    } else if (model.id === "brain") {
      drawBrainModel(ctx, width, height);
    } else if (model.id === "electric-circuit") {
      drawElectricCircuitModel(ctx, width, height);
    }

    // ─── DRAW INTERACTIVE LABELS AND TARGET PINPOINTS ───
    model.parts.forEach((part) => {
      const pos = project3D(part.coord, width, height);
      const isSelected = selectedPart?.name === part.name;

      // Draw outer pulse
      const pulseSize = 6 + Math.sin(pulseTime * 2) * 3;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pulseSize + 4, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? "rgba(168, 85, 247, 0.15)"
        : "rgba(108, 99, 255, 0.08)";
      ctx.fill();

      // Draw center core dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 8 : 5, 0, Math.PI * 2);
      ctx.fillStyle = part.highlightColor || "#6C63FF";
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Labeled metadata text on top
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = isSelected ? "#4C1D95" : "#6B7280";
      const txt = part.label;
      const metrics = ctx.measureText(txt);
      
      // Draw tag background
      ctx.fillStyle = isSelected ? "rgba(243, 232, 255, 0.95)" : "rgba(255, 255, 255, 0.85)";
      ctx.strokeStyle = isSelected ? "#8B5CF6" : "#E5E7EB";
      ctx.lineWidth = isSelected ? 1.5 : 1;
      
      const boxW = metrics.width + 12;
      const boxH = 18;
      const bx = pos.x - boxW / 2;
      const by = pos.y - 25;

      // Round rectangle clip
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#7C3AED" : "#1F2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, pos.x, by + 9);
    });

  }, [yaw, pitch, zoom, modelId, selectedPart, pulseTime, showWireframe]);

  // Handle Drag / Rotation pivot
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    // Adjust angles proportional to drag size
    setYaw((prev) => prev + deltaX * 0.007);
    setPitch((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + deltaY * 0.007)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on Canvas coordinate check to select near label parts
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let closestPart: ModelPart | null = null;
    let minDistance = 25; // 25px action radius

    model.parts.forEach((part) => {
      const pos = project3D(part.coord, canvas.width, canvas.height);
      const dist = Math.hypot(pos.x - clickX, pos.y - clickY);
      if (dist < minDistance) {
        minDistance = dist;
        closestPart = part;
      }
    });

    if (closestPart) {
      selectPartWithCamera(closestPart);
    }
  };

  // Reset view to initial settings
  const handleResetCamera = () => {
    setYaw(0.5);
    setPitch(0.2);
    setZoom(1.2);
    setSelectedPart(null);
    setQuizAnswerSelected(null);
    setQuizScoreFeedback(null);
  };

  // Select a component and automatically rotate the camera focus to highlight it
  const selectPartWithCamera = (part: ModelPart) => {
    setSelectedPart(part);
    setQuizAnswerSelected(null);
    setQuizScoreFeedback(null);
    onSelectPart(part);
    
    // Stop spinning for a moment to let them look at the selected component!
    setIsSpinning(false);

    // Reposition camera look-at angle based on coordinate quadrant to highlight it perfectly
    if (part.coord.x > 15) {
      setYaw(-0.5);
    } else if (part.coord.x < -15) {
      setYaw(0.5);
    } else {
      setYaw(0.1);
    }
    
    if (part.coord.y > 15) {
      setPitch(-0.25);
    } else if (part.coord.y < -15) {
      setPitch(0.25);
    } else {
      setPitch(0.1);
    }
  };

  // Custom AI quick ask
  const submitModelQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAIAskStr.trim() || !onAskModelQuestion) return;
    onAskModelQuestion(customAIAskStr, selectedPart?.name);
    setCustomAIAskStr("");
  };

  const selectQuizAnswer = (idx: number, answerIndex: number) => {
    setQuizAnswerSelected(idx);
    if (idx === answerIndex) {
      setQuizScoreFeedback("🎉 Excellent! Correct Answer. That's how it functions within the system.");
    } else {
      setQuizScoreFeedback("❌ Not quite. Click the Explain button to simplify!");
    }
  };

  // ─── RENDERING DETAILED TOPIC GRAPHICS ───

  const drawHeartModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Pulse contraction animation simulation (Heartbeat rhythms with lub-dub contraction scale)
    const beatPhase = Math.sin(pulseTime * 4.5);
    const beatFactorObj = 1.0 + (beatPhase > 0 ? beatPhase * 0.07 : beatPhase * 0.02) * zoom;

    // Cardiac Left & Right ventricles representation
    const origin = project3D({ x: 0, y: 15, z: 0 }, w, h);
    const size = Math.min(w, h) * 0.14 * zoom * beatFactorObj;

    // 1. Draw backing shadow for volumetric depth
    ctx.beginPath();
    ctx.arc(origin.x + 3, origin.y + 6, size, 0, Math.PI, false);
    ctx.fillStyle = "rgba(15, 23, 42, 0.08)";
    ctx.fill();

    // 2. Draw Left Atrium (rounded backing chamber in dark purple-crimson)
    const laPos = project3D({ x: -18, y: -20, z: -10 }, w, h);
    ctx.beginPath();
    ctx.arc(laPos.x, laPos.y, size * 0.6, 0, Math.PI * 2);
    const laGrad = ctx.createRadialGradient(laPos.x, laPos.y, size * 0.1, laPos.x, laPos.y, size * 0.6);
    laGrad.addColorStop(0, "#9d174d"); // Pink 800
    laGrad.addColorStop(1, "#500724"); // Pink 950
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : laGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
    ctx.stroke();

    // 3. Draw Right Atrium (blue/violet deoxygenated node)
    const raPos = project3D({ x: 22, y: -18, z: -8 }, w, h);
    ctx.beginPath();
    ctx.arc(raPos.x, raPos.y, size * 0.65, 0, Math.PI * 2);
    const raGrad = ctx.createRadialGradient(raPos.x, raPos.y, size * 0.15, raPos.x, raPos.y, size * 0.65);
    raGrad.addColorStop(0, "#2563eb"); // Blue 600
    raGrad.addColorStop(1, "#1e3a8a"); // Blue 900
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : raGrad;
    ctx.fill();
    ctx.stroke();

    // 4. Draw main ventricles body muscle shell (Lower heart apex)
    ctx.beginPath();
    // Path linking apex point below to wider atrial base above
    const apexPos = project3D({ x: -5, y: 55, z: 5 }, w, h);
    const baseLeft = project3D({ x: -28, y: 5, z: -2 }, w, h);
    const baseRight = project3D({ x: 24, y: 5, z: -2 }, w, h);
    
    ctx.moveTo(baseLeft.x, baseLeft.y);
    ctx.bezierCurveTo(baseLeft.x - 10, baseLeft.y + 25, apexPos.x - 15, apexPos.y, apexPos.x, apexPos.y);
    ctx.bezierCurveTo(apexPos.x + 15, apexPos.y, baseRight.x + 10, baseRight.y + 25, baseRight.x, baseRight.y);
    ctx.closePath();
    
    // Heart muscle 3D shading gradient
    const grad = ctx.createRadialGradient(origin.x - size * 0.2, origin.y - size * 0.2, size * 0.2, origin.x, origin.y, size * 1.3);
    grad.addColorStop(0, "#f43f5e");  // Rose 500
    grad.addColorStop(0.5, "#db2777"); // Pink 600
    grad.addColorStop(0.8, "#be185d"); // Pink 700
    grad.addColorStop(1, "#4c0519");  // Dark maroon
    
    ctx.fillStyle = showWireframe ? "rgba(100, 116, 139, 0.1)" : grad;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = showWireframe ? 1 : 2.5;
    ctx.fill();
    ctx.stroke();

    // 5. Draw branched coronary arteries (Organic yellow-red branches on muscle)
    if (!showWireframe) {
      ctx.beginPath();
      const artRoot = project3D({ x: -5, y: 10, z: 12 }, w, h);
      const artBr1 = project3D({ x: -18, y: 32, z: 15 }, w, h);
      const artBr1a = project3D({ x: -25, y: 45, z: 14 }, w, h);
      const artBr2 = project3D({ x: 8, y: 35, z: 15 }, w, h);
      
      ctx.moveTo(artRoot.x, artRoot.y);
      ctx.quadraticCurveTo(artBr1.x, artBr1.y, artBr1a.x, artBr1a.y);
      
      ctx.moveTo(artBr1.x, artBr1.y);
      const artBr1b = project3D({ x: -10, y: 48, z: 16 }, w, h);
      ctx.lineTo(artBr1b.x, artBr1b.y);

      ctx.moveTo(artRoot.x, artRoot.y);
      ctx.lineTo(artBr2.x, artBr2.y);
      
      ctx.strokeStyle = "#facc15"; // neon amber artery lines
      ctx.lineWidth = 1.8 * zoom;
      ctx.stroke();
    }

    // 6. Draw main Aorta trunk (curved de-oxygenated tube)
    ctx.beginPath();
    const aortStart = project3D({ x: -10, y: -5, z: -12 }, w, h);
    const aortMid = project3D({ x: -18, y: -45, z: 5 }, w, h);
    const aortEnd = project3D({ x: 2, y: -58, z: 10 }, w, h);
    ctx.moveTo(aortStart.x, aortStart.y);
    ctx.bezierCurveTo(aortMid.x, aortMid.y, aortEnd.x - 15, aortEnd.y - 12, aortEnd.x, aortEnd.y);
    ctx.strokeStyle = "#e11d48"; // intense crimson
    ctx.lineWidth = 15 * zoom * beatFactorObj;
    ctx.stroke();

    // Aortic arch branching arterioles (three tiny top stems)
    const stems = [-8, 0, 8];
    stems.forEach((offset) => {
      ctx.beginPath();
      const sStart = project3D({ x: offset - 8, y: -48, z: 6 }, w, h);
      const sEnd = project3D({ x: offset - 10, y: -65, z: 8 }, w, h);
      ctx.moveTo(sStart.x, sStart.y);
      ctx.lineTo(sEnd.x, sEnd.y);
      ctx.strokeStyle = "#be185d";
      ctx.lineWidth = 4 * zoom;
      ctx.stroke();
    });

    // 7. Blue Pulmonary Artery crossing behind Aorta
    ctx.beginPath();
    const pulStart = project3D({ x: 12, y: -1, z: -8 }, w, h);
    const pulMid = project3D({ x: 22, y: -38, z: 10 }, w, h);
    const pulEndL = project3D({ x: 42, y: -45, z: 20 }, w, h);
    const pulEndR = project3D({ x: -15, y: -34, z: -15 }, w, h);
    
    ctx.moveTo(pulStart.x, pulStart.y);
    ctx.lineTo(pulMid.x, pulMid.y);
    ctx.moveTo(pulMid.x, pulMid.y);
    ctx.lineTo(pulEndL.x, pulEndL.y);
    ctx.moveTo(pulMid.x, pulMid.y);
    ctx.lineTo(pulEndR.x, pulEndR.y);
    
    ctx.strokeStyle = "#2563eb"; // electric oxygen blue
    ctx.lineWidth = 11 * zoom;
    ctx.stroke();

    // 8. Render flowing de-oxygenated and oxygenated blood cells
    if (!showWireframe) {
      // Pulmonary blue cells flow on path
      ctx.fillStyle = "rgba(147, 197, 253, 0.85)";
      for (let i = 0; i < 5; i++) {
        const pct = (pulseTime * 0.4 + i * 0.2) % 1.0;
        const cx = 12 + pct * 24;
        const cy = -1 - pct * 36;
        const pCell = project3D({ x: cx, y: cy, z: 5 }, w, h);
        ctx.beginPath();
        ctx.arc(pCell.x, pCell.y, 2 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Aortic red cells bubble flow
      ctx.fillStyle = "rgba(254, 205, 211, 0.9)";
      for (let i = 0; i < 6; i++) {
        const pct = (pulseTime * 0.5 + i * 0.16) % 1.0;
        const cx = -10 - pct * 4;
        const cy = -5 - pct * 45;
        const aCell = project3D({ x: cx, y: cy, z: 8 }, w, h);
        ctx.beginPath();
        ctx.arc(aCell.x, aCell.y, 2.5 * zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawSolarSystemModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 1. Central Star (Sun) drawing with multi-layered solar corona flame flares
    const sunPos = project3D({ x: 0, y: 0, z: 0 }, w, h);
    const sunSize = 34 * zoom;

    // Corona outermost flare
    const coronaRad = sunSize * (1.1 + Math.sin(pulseTime * 6) * 0.06);
    const flareGrad = ctx.createRadialGradient(sunPos.x, sunPos.y, sunSize * 0.4, sunPos.x, sunPos.y, coronaRad);
    flareGrad.addColorStop(0, "rgba(239, 68, 68, 0.4)"); // Red
    flareGrad.addColorStop(0.5, "rgba(249, 115, 22, 0.25)"); // Orange
    flareGrad.addColorStop(1, "rgba(234, 179, 8, 0)"); // Faint gold halo
    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, coronaRad, 0, Math.PI * 2);
    ctx.fillStyle = flareGrad;
    ctx.fill();

    // Solid Sun Core Glow
    const sunGlow = ctx.createRadialGradient(sunPos.x, sunPos.y, sunSize * 0.2, sunPos.x, sunPos.y, sunSize);
    sunGlow.addColorStop(0, "#ffffff"); // stellar core blinding white
    sunGlow.addColorStop(0.3, "#fef08a"); // golden light
    sunGlow.addColorStop(0.65, "#f59e0b"); // yellow-orange
    sunGlow.addColorStop(1, "#ea580c"); // deep orange boundary
    ctx.beginPath();
    ctx.arc(sunPos.x, sunPos.y, sunSize * 0.95, 0, Math.PI * 2);
    ctx.fillStyle = showWireframe ? "rgba(244, 244, 245, 0.1)" : sunGlow;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.stroke();

    // 2. Draw orbital paths and planets
    const radii = [45, 75, 110, 155];
    radii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(139, 92, 246, 0.15)";
      ctx.lineWidth = 1.2;
      
      // Compute 3D loop curves points to depict orbits lying on XZ plane
      for (let theta = 0; theta < Math.PI * 2; theta += 0.05) {
        const cx = Math.cos(theta) * r;
        const cz = Math.sin(theta) * r;
        const pos = project3D({ x: cx, y: 0, z: cz }, w, h);
        if (theta === 0) {
          ctx.moveTo(pos.x, pos.y);
        } else {
          ctx.lineTo(pos.x, pos.y);
        }
      }
      ctx.closePath();
      ctx.stroke();

      // Planets details inside classroom
      const planets = [
        { name: "Mercury", color: "#8d99ae", size: 4.5, speed: 1.4, details: "iron" },
        { name: "Venus", color: "#e07a5f", size: 8, speed: 1.0, details: "toxic" },
        { name: "Earth", color: "#3a86c8", size: 9, speed: 0.72, details: "ocean" },
        { name: "Mars", color: "#e63946", size: 6.5, speed: 0.55, details: "iron-oxide" }
      ];

      const p = planets[idx];
      if (p) {
        // Orbit angle positioning based on time
        const curTheta = pulseTime * p.speed + (idx * 5); // offsets planets positions so they are scattered
        const px = Math.cos(curTheta) * r;
        const pz = Math.sin(curTheta) * r;
        const pPos = project3D({ x: px, y: 0, z: pz }, w, h);

        // Render faint planet trace trails
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 0;
        for (let i = 1; i <= 15; i++) {
          const trailTheta = curTheta - (i * 0.04);
          const tx = Math.cos(trailTheta) * r;
          const tz = Math.sin(trailTheta) * r;
          const tPos = project3D({ x: tx, y: 0, z: tz }, w, h);
          if (i === 1) ctx.moveTo(tPos.x, tPos.y);
          else ctx.lineTo(tPos.x, tPos.y);
        }
        ctx.stroke();

        // Solid planet spheres with radial shading
        ctx.beginPath();
        ctx.arc(pPos.x, pPos.y, p.size * zoom, 0, Math.PI * 2);
        
        const pGrad = ctx.createRadialGradient(pPos.x - p.size * 0.3, pPos.y - p.size * 0.3, 1, pPos.x, pPos.y, p.size * zoom);
        pGrad.addColorStop(0, "#ffffff"); // spec highlight
        pGrad.addColorStop(0.3, p.color);
        pGrad.addColorStop(1, "rgba(15, 23, 42, 0.95)"); // black shadow terminator side
        
        ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.15)" : pGrad;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Earth atmospheric haze
        if (p.name === "Earth" && !showWireframe) {
          ctx.beginPath();
          ctx.arc(pPos.x, pPos.y, p.size * 1.25 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(56, 189, 248, 0.22)"; // Cyan ozone layer glow
          ctx.fill();
        }

        // Saturn as bonus floating visual details (drawn adjacent on index 3 orbit!)
        if (idx === 3) {
          // Add Jupiter slightly outward with nice brown gaseous stripes
          const jux = Math.cos(curTheta + Math.PI) * 190;
          const juz = Math.sin(curTheta + Math.PI) * 190;
          const juPos = project3D({ x: jux, y: 0, z: juz }, w, h);
          const juSize = 14 * zoom;

          ctx.beginPath();
          ctx.arc(juPos.x, juPos.y, juSize, 0, Math.PI * 2);
          const juGrad = ctx.createRadialGradient(juPos.x - 3, juPos.y - 3, 2, juPos.x, juPos.y, juSize);
          juGrad.addColorStop(0, "#ffedd5"); // orange-beige stripes core
          juGrad.addColorStop(0.5, "#ca8a04");
          juGrad.addColorStop(1, "#3b2304"); // shadow
          ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : juGrad;
          ctx.fill();
          
          // Draw Jupiter horizontal bands
          if (!showWireframe) {
            ctx.fillStyle = "rgba(113, 63, 18, 0.3)";
            ctx.fillRect(juPos.x - juSize * 0.8, juPos.y - juSize * 0.35, juSize * 1.6, juSize * 0.15);
            ctx.fillRect(juPos.x - juSize * 0.9, juPos.y + juSize * 0.1, juSize * 1.8, juSize * 0.18);
          }
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.stroke();

          // Add Saturn with gorgeous concentric tilted rings!
          const satx = Math.cos(curTheta + Math.PI / 2) * 230;
          const satz = Math.sin(curTheta + Math.PI / 2) * 230;
          const satPos = project3D({ x: satx, y: 0, z: satz }, w, h);
          const satSize = 10 * zoom;

          // Saturn globe
          ctx.beginPath();
          ctx.arc(satPos.x, satPos.y, satSize, 0, Math.PI * 2);
          const satGrad = ctx.createRadialGradient(satPos.x - 2, satPos.y - 2, 1, satPos.x, satPos.y, satSize);
          satGrad.addColorStop(0, "#fef08a");
          satGrad.addColorStop(0.6, "#d97706");
          satGrad.addColorStop(1, "#451a03");
          ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : satGrad;
          ctx.fill();
          ctx.stroke();

          // Concentric Cassini Rings drawn tilted in 3D projection
          ctx.strokeStyle = "rgba(217, 119, 6, 0.5)";
          ctx.lineWidth = 3.5 * zoom;
          ctx.beginPath();
          for (let ang = 0; ang <= Math.PI * 2; ang += 0.1) {
            const rx = satx + Math.cos(ang) * satSize * 2.1;
            const rz = satz + Math.sin(ang) * satSize * 1.2; // tighter coefficient to tilt the flat ring!
            const rPos = project3D({ x: rx, y: -2, z: rz }, w, h);
            if (ang === 0) ctx.moveTo(rPos.x, rPos.y);
            else ctx.lineTo(rPos.x, rPos.y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    });
  };

  const drawVolcanoModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 1. Coordinates definitions mapping
    const leftBase = project3D({ x: -110, y: 70, z: 0 }, w, h);
    const rightBase = project3D({ x: 110, y: 70, z: 0 }, w, h);
    const peakLeft = project3D({ x: -25, y: -25, z: 20 }, w, h);
    const peakRight = project3D({ x: 25, y: -25, z: -20 }, w, h);
    const magmaBase = project3D({ x: 0, y: 80, z: 0 }, w, h);

    // 2. Stratified tectonic base strata layers (Multiple geological ash bands)
    if (!showWireframe) {
      const strataY = [70, 50, 25, 0];
      const strataColors = ["#451a03", "#78350f", "#334155", "#475569"];
      strataY.forEach((offset, sIdx) => {
        ctx.beginPath();
        const bl = project3D({ x: -110 + sIdx * 10, y: offset, z: 0 }, w, h);
        const br = project3D({ x: 110 - sIdx * 10, y: offset, z: 0 }, w, h);
        const blPrev = project3D({ x: -110 + (sIdx + 1) * 10, y: strataY[sIdx + 1] || -30, z: 0 }, w, h);
        const brPrev = project3D({ x: 110 - (sIdx + 1) * 10, y: strataY[sIdx + 1] || -30, z: 0 }, w, h);
        ctx.moveTo(bl.x, bl.y);
        ctx.lineTo(blPrev.x, blPrev.y);
        ctx.lineTo(brPrev.x, brPrev.y);
        ctx.lineTo(br.x, br.y);
        ctx.closePath();
        ctx.fillStyle = strataColors[sIdx];
        ctx.fill();
      });
    }

    // 3. Main volcano outer basalt slopes
    ctx.beginPath();
    ctx.moveTo(leftBase.x, leftBase.y);
    // Draw curves up the volcano cone
    ctx.quadraticCurveTo(leftBase.x + 40, leftBase.y - 45, peakLeft.x, peakLeft.y);
    ctx.lineTo(peakRight.x, peakRight.y);
    ctx.quadraticCurveTo(rightBase.x - 40, rightBase.y - 45, rightBase.x, rightBase.y);
    ctx.closePath();
    ctx.fillStyle = showWireframe ? "rgba(100, 116, 139, 0.08)" : "rgba(30, 41, 59, 1.0)"; // Dark slate volcano
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    // 4. Exposed deep tectonic crust cross-section cutout
    ctx.beginPath();
    ctx.moveTo(peakLeft.x, peakLeft.y);
    ctx.lineTo(peakRight.x, peakRight.y);
    ctx.lineTo(magmaBase.x + 18, magmaBase.y);
    ctx.lineTo(magmaBase.x - 18, magmaBase.y);
    ctx.closePath();
    const coreGrad = ctx.createLinearGradient(0, peakRight.y, 0, magmaBase.y);
    coreGrad.addColorStop(0, "#991b1b");
    coreGrad.addColorStop(0.5, "#4c0519");
    coreGrad.addColorStop(1, "#1e0b11");
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : coreGrad;
    ctx.fill();

    // 5. Molten hot Magma Reservoir chamber glowing core
    const pGlowSize = 25 + Math.sin(pulseTime * 4.5) * 4;
    const reservoirPos = project3D({ x: 0, y: 70, z: 0 }, w, h);
    ctx.beginPath();
    ctx.arc(reservoirPos.x, reservoirPos.y, pGlowSize * zoom, 0, Math.PI * 2);
    const magGlow = ctx.createRadialGradient(reservoirPos.x, reservoirPos.y, 4, reservoirPos.x, reservoirPos.y, pGlowSize * zoom);
    magGlow.addColorStop(0, "#fef08a"); // white lava center
    magGlow.addColorStop(0.3, "#f97316"); // orange
    magGlow.addColorStop(0.7, "#dc2626"); // crimson
    magGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : magGlow;
    ctx.fill();

    // 6. Volcanic Conduit (Magma central shaft pipeline)
    ctx.beginPath();
    const condStart = project3D({ x: 0, y: 64, z: 0 }, w, h);
    const condEnd = project3D({ x: 0, y: -25, z: 0 }, w, h);
    ctx.moveTo(condStart.x, condStart.y);
    ctx.lineTo(condEnd.x, condEnd.y);
    ctx.strokeStyle = "#ea580c"; // viscous yellow-orange conduits
    ctx.lineWidth = 10 * zoom;
    ctx.stroke();

    // 7. Erupting spectacular volcanic embers and flowing lava slides
    if (!showWireframe) {
      // Flowing lateral lava streams down external cones
      ctx.beginPath();
      const crustLeft = project3D({ x: -28, y: -20, z: 0 }, w, h);
      const flowEnd = project3D({ x: -65, y: 15, z: 0 }, w, h);
      ctx.moveTo(crustLeft.x, crustLeft.y);
      ctx.lineTo(flowEnd.x, flowEnd.y);
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 4 * zoom;
      ctx.stroke();

      // Lava spewing upwards from caldera
      for (let i = 0; i < 28; i++) {
        // High frequency projectile particles
        const t = (pulseTime * 1.4 + i * 0.15) % 2.0;
        const speedX = Math.sin(i * 123) * 32;
        const speedY = -75 - (Math.abs(Math.sin(i * 555)) * 110);
        const gravity = 120;
        
        // Newtonian projectile formula: x = x0 + v*t; y = y0 + v*t + 0.5*g*t^2
        const pX = speedX * t;
        const pY = -25 + speedY * t + 0.5 * gravity * t * t;
        const pZ = Math.cos(i * 99) * 20;

        if (pY < 80) { // draw only if above base floor
          const pPos = project3D({ x: pX, y: pY, z: pZ }, w, h);
          ctx.beginPath();
          ctx.arc(pPos.x, pPos.y, 1.8 + Math.max(0, (2 - t)) * 2, 0, Math.PI * 2);
          
          // Color shifts from yellow/white (hottest) to red (cooling)
          ctx.fillStyle = t < 0.4 ? "#ffffff" : t < 0.9 ? "#facc15" : t < 1.4 ? "#f97316" : "#b91c1c";
          ctx.fill();
        }
      }

      // Rising carbon ash and sulfuric gas particles
      ctx.fillStyle = "rgba(100, 116, 139, 0.45)"; // Soft grey gas puffs
      for (let i = 0; i < 12; i++) {
        const gasT = (pulseTime * 0.5 + i * 0.3) % 2.0;
        const gasX = Math.sin(i * 47) * 40 + Math.sin(gasT * 3) * 15;
        const gasY = -40 - (gasT * 95);
        if (gasY > -250) {
          const gasPos = project3D({ x: gasX, y: gasY, z: 2 }, w, h);
          ctx.beginPath();
          ctx.arc(gasPos.x, gasPos.y, 4 + gasT * 14 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const drawCellStructureModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cellPos = project3D({ x: 0, y: 0, z: 0 }, w, h);
    const cellRadX = 110 * zoom;
    const cellRadY = 88 * zoom;

    // 1. Membrane Cell Wall outline with high fidelity gradient
    ctx.beginPath();
    ctx.ellipse(cellPos.x, cellPos.y, cellRadX, cellRadY, Math.PI / 12, 0, Math.PI * 2);
    const wallGrad = ctx.createRadialGradient(cellPos.x, cellPos.y, cellRadX * 0.1, cellPos.x, cellPos.y, cellRadX);
    wallGrad.addColorStop(0, "rgba(16, 185, 129, 0.05)"); // translucent internal cytoplasm
    wallGrad.addColorStop(0.85, "rgba(52, 211, 153, 0.12)");
    wallGrad.addColorStop(1, "rgba(4, 120, 87, 0.5)"); // rigid wall border
    
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.05)" : wallGrad;
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = showWireframe ? 1 : 4.5;
    ctx.fill();
    ctx.stroke();

    // 2. Central Nucleus and internal nucleoplasm
    const nucPos = project3D({ x: 10, y: -12, z: 10 }, w, h);
    const nucRad = 32 * zoom;
    ctx.beginPath();
    ctx.arc(nucPos.x, nucPos.y, nucRad, 0, Math.PI * 2);
    
    const nucGrad = ctx.createRadialGradient(nucPos.x - nucRad * 0.25, nucPos.y - nucRad * 0.25, 2, nucPos.x, nucPos.y, nucRad);
    nucGrad.addColorStop(0, "#818cf8"); // Lavender
    nucGrad.addColorStop(0.6, "#4f46e5"); // Royal indigo
    nucGrad.addColorStop(1, "#312e81"); // Dark indigo
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : nucGrad;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Inner Nucleolus center core
    ctx.beginPath();
    ctx.arc(nucPos.x - 3, nucPos.y - 3, 11 * zoom, 0, Math.PI * 2);
    ctx.fillStyle = showWireframe ? "transparent" : "#c084fc"; // purple-pink core nucleolus
    ctx.fill();

    // Dense chromatin strings inside Nucleus (fine thread squiggles)
    if (!showWireframe) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(224, 242, 254, 0.4)";
      ctx.lineWidth = 1;
      ctx.moveTo(nucPos.x - 12, nucPos.y - 12);
      ctx.bezierCurveTo(nucPos.x - 18, nucPos.y, nucPos.x - 8, nucPos.y + 15, nucPos.x, nucPos.y + 10);
      ctx.bezierCurveTo(nucPos.x + 8, nucPos.y + 15, nucPos.x + 18, nucPos.y - 5, nucPos.x + 6, nucPos.y - 14);
      ctx.stroke();
    }

    // 3. Two Mitochondria powerhouses with custom wavy cristae lines
    const mitoPlacements = [
      { x: -55, y: 35, z: 15, key: "m1", ang: Math.PI / 4 },
      { x: -80, y: -20, z: -5, key: "m2", ang: -Math.PI / 6 }
    ];

    mitoPlacements.forEach((m) => {
      const mPos = project3D({ x: m.x, y: m.y, z: m.z }, w, h);
      const mW = 20 * zoom;
      const mH = 9 * zoom;
      
      ctx.beginPath();
      ctx.ellipse(mPos.x, mPos.y, mW, mH, m.ang, 0, Math.PI * 2);
      const mitoGrad = ctx.createRadialGradient(mPos.x, mPos.y, mW * 0.1, mPos.x, mPos.y, mW);
      mitoGrad.addColorStop(0, "#f43f5e");
      mitoGrad.addColorStop(1, "#9f1239");
      ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : mitoGrad;
      ctx.stroke();
      ctx.fill();

      // Wavy inner membrane fold paths
      if (!showWireframe) {
        ctx.beginPath();
        ctx.strokeStyle = "#fef08a"; // Yellow cristae folds
        ctx.lineWidth = 1.3;
        ctx.moveTo(mPos.x - mW * 0.7, mPos.y);
        ctx.lineTo(mPos.x - mW * 0.4, mPos.y + mH * 0.4);
        ctx.lineTo(mPos.x - mW * 0.1, mPos.y - mH * 0.4);
        ctx.lineTo(mPos.x + mW * 0.2, mPos.y + mH * 0.5);
        ctx.lineTo(mPos.x + mW * 0.5, mPos.y - mH * 0.3);
        ctx.lineTo(mPos.x + mW * 0.7, mPos.y);
        ctx.stroke();
      }
    });

    // 4. Endoplasmic Reticulum (Curved labyrinth ribbon folds stack)
    if (!showWireframe) {
      ctx.beginPath();
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 4 * zoom;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      const erCenter = project3D({ x: 52, y: -30, z: 0 }, w, h);
      // Ribbon layered folds
      const erOffsets = [0, 8, 16];
      erOffsets.forEach((off, eIdx) => {
        ctx.beginPath();
        ctx.arc(erCenter.x - off, erCenter.y, 15 + eIdx * 9, -Math.PI * 0.6, Math.PI * 0.4);
        ctx.strokeStyle = `rgba(167, 139, 250, ${0.4 + eIdx * 0.3})`;
        ctx.stroke();

        // Ribosome studs (tiny blue dots decorating the Rough ER)
        ctx.fillStyle = "#2563eb";
        for (let j = 0; j < 4; j++) {
          const rad = 15 + eIdx * 9;
          const bulletAng = -Math.PI * 0.5 + j * 0.25;
          const bulletX = erCenter.x - off + Math.cos(bulletAng) * rad;
          const bulletY = erCenter.y + Math.sin(bulletAng) * rad;
          ctx.beginPath();
          ctx.arc(bulletX, bulletY, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 5. Lysosomes and Vacuoles floating
    const organelles = [
      { x: -20, y: -55, z: 0, r: 6.5, color: "#eab308" }, // yellow lysosome
      { x: 50, y: 35, z: -10, r: 12, color: "#60a5fa" }    // blue fluid vacuole
    ];
    organelles.forEach((org) => {
      const orgP = project3D(org, w, h);
      ctx.beginPath();
      ctx.arc(orgP.x, orgP.y, org.r * zoom, 0, Math.PI * 2);
      ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : org.color;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawDNAModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const samples = 15;
    const helixWidth = 44 * zoom;
    const startY = -100;
    const dy = 14;

    // 1. Sort nodes index based on depth Z to render shadows and backbones correctly
    const items: Array<{
      p1: { x: number; y: number; z: number };
      p2: { x: number; y: number; z: number };
      baseColorL: string;
      baseColorR: string;
      labelL: string;
      labelR: string;
      depth: number;
    }> = [];

    const baseCouples = [
      { colL: "#dc2626", colR: "#2563eb", l: "A", r: "T" }, // Adenine-Thymine (Red-Blue)
      { colL: "#16a34a", colR: "#ca8a04", l: "G", r: "C" }, // Guanine-Cytosine (Green-Yellow)
      { colL: "#2563eb", colR: "#dc2626", l: "T", r: "A" },
      { colL: "#ca8a04", colR: "#16a34a", l: "C", r: "G" }
    ];

    for (let i = 0; i < samples; i++) {
      const relativeY = startY + i * dy;
      // High speed rotational phase linked to pulse time
      const phase = (i * 0.42) + pulseTime * 1.5;

      const x1 = Math.sin(phase) * helixWidth;
      const z1 = Math.cos(phase) * helixWidth;

      const x2 = Math.sin(phase + Math.PI) * helixWidth;
      const z2 = Math.cos(phase + Math.PI) * helixWidth;

      const p1Proj = project3D({ x: x1, y: relativeY, z: z1 }, w, h);
      const p2Proj = project3D({ x: x2, y: relativeY, z: z2 }, w, h);

      const couple = baseCouples[i % baseCouples.length];

      items.push({
        p1: p1Proj,
        p2: p2Proj,
        baseColorL: couple.colL,
        baseColorR: couple.colR,
        labelL: couple.l,
        labelR: couple.r,
        depth: p1Proj.z + p2Proj.z // aggregate z for sorting
      });
    }

    // Sort items by average depth so furthest components are drawn first (Painters Algorithm)
    items.sort((a, b) => b.depth - a.depth);

    // 2. Draw sorted connector lines & double helices
    items.forEach((item) => {
      // Draw atomic rungs rungs
      ctx.beginPath();
      const midX = (item.p1.x + item.p2.x) / 2;
      const midY = (item.p1.y + item.p2.y) / 2;
      
      // Left segment of hydrogen-bound rung rungs
      ctx.beginPath();
      ctx.moveTo(item.p1.x, item.p1.y);
      ctx.lineTo(midX, midY);
      ctx.strokeStyle = showWireframe ? "rgba(148, 163, 184, 0.2)" : item.baseColorL;
      ctx.lineWidth = 3.5 * zoom;
      ctx.stroke();

      // Right segment of rung rungs
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(item.p2.x, item.p2.y);
      ctx.strokeStyle = showWireframe ? "rgba(148, 163, 184, 0.2)" : item.baseColorR;
      ctx.lineWidth = 3.5 * zoom;
      ctx.stroke();

      // Hydrogen central bonding bond dots
      ctx.beginPath();
      ctx.arc(midX, midY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 0.8;
      ctx.fill();
      ctx.stroke();

      // Dynamic glow backbones nodes (Phosphate group molecules)
      const nodes = [
        { pt: item.p1, col: "#8b5cf6", tag: item.labelL },
        { pt: item.p2, col: "#ec4899", tag: item.labelR }
      ];

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.pt.x, node.pt.y, 6.5 * zoom, 0, Math.PI * 2);
        const nodeGrad = ctx.createRadialGradient(node.pt.x - 2, node.pt.y - 2, 1, node.pt.x, node.pt.y, 6.5 * zoom);
        nodeGrad.addColorStop(0, "#ffffff"); // stellar shine highlight
        nodeGrad.addColorStop(0.35, node.col);
        nodeGrad.addColorStop(1, "rgba(88, 28, 135, 1)"); // deep shadow base
        ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.15)" : nodeGrad;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Print tiny nucleotide element letter tags inside nodes triggers!
        if (!showWireframe && zoom > 0.8) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(node.tag, node.pt.x, node.pt.y);
        }
      });
    });
  };

  const drawBrainModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const origin = project3D({ x: 0, y: 12, z: 0 }, w, h);
    const radius = Math.min(w, h) * 0.15 * zoom;

    // 1. Draw outer cerebral shadow layer
    ctx.beginPath();
    ctx.ellipse(origin.x + 3, origin.y + 6, radius * 1.15, radius * 1.0, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 23, 42, 0.05)";
    ctx.fill();

    // 2. Draw custom lobes sections with high fidelity bezier boundaries (Shaded distinct zones)
    const lobes = [
      {
        name: "frontal",
        color: "rgba(99, 102, 241, 0.75)", // Indigo
        points: [
          { x: -50, y: -25, z: 10 },
          { x: 5, y: -40, z: 5 },
          { x: -10, y: 15, z: 15 },
          { x: -55, y: 0, z: 20 }
        ]
      },
      {
        name: "parietal",
        color: "rgba(139, 92, 246, 0.75)", // Purple
        points: [
          { x: 5, y: -40, z: 5 },
          { x: 55, y: -20, z: 5 },
          { x: 45, y: 10, z: -10 },
          { x: -10, y: 15, z: -15 }
        ]
      },
      {
        name: "temporal",
        color: "rgba(236, 72, 153, 0.75)", // Pink
        points: [
          { x: -40, y: 10, z: 18 },
          { x: 2, y: 15, z: 12 },
          { x: 18, y: 35, z: -10 },
          { x: -35, y: 40, z: -5 }
        ]
      }
    ];

    if (!showWireframe) {
      lobes.forEach((lb) => {
        ctx.beginPath();
        const p0 = project3D(lb.points[0], w, h);
        const p1 = project3D(lb.points[1], w, h);
        const p2 = project3D(lb.points[2], w, h);
        const p3 = project3D(lb.points[3], w, h);
        
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p1.x + 30, p1.y + 10, p2.x, p2.y);
        ctx.bezierCurveTo(p2.x, p2.y, p3.x, p3.y + 12, p3.x, p3.y);
        ctx.closePath();

        const lobeGrad = ctx.createRadialGradient(p0.x, p0.y, radius * 0.1, p0.x, p0.y, radius * 1.1);
        lobeGrad.addColorStop(0, lb.color);
        lobeGrad.addColorStop(1, "rgba(51, 65, 85, 0.9)");
        ctx.fillStyle = lobeGrad;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.stroke();

        // Beautiful gyri and sulci curves inside lobe boundaries
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
        ctx.lineWidth = 1.6;
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(p2.x - 10, p2.y - 12, p2.x, p2.y);
        ctx.moveTo(p1.x - 20, p1.y + 10);
        ctx.quadraticCurveTo(p3.x + 20, p3.y - 15, p3.x, p3.y);
        ctx.stroke();
      });
    }

    // 3. Draw Cerebellum lower portion (parallel folia fine lines)
    const cbPos = project3D({ x: 38, y: 44, z: -25 }, w, h);
    ctx.beginPath();
    ctx.ellipse(cbPos.x, cbPos.y, 22 * zoom, 14 * zoom, Math.PI / 10, 0, Math.PI * 2);
    const cbGrad = ctx.createRadialGradient(cbPos.x, cbPos.y, 2, cbPos.x, cbPos.y, 20 * zoom);
    cbGrad.addColorStop(0, "#10b981"); // Green cerebellum
    cbGrad.addColorStop(1, "#064e3b");
    ctx.fillStyle = showWireframe ? "rgba(148, 163, 184, 0.1)" : cbGrad;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
    ctx.stroke();

    if (!showWireframe) {
      // Parallel horizontal leaf-like ridges (Folia)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.0;
      for (let offset = -8; offset <= 8; offset += 3.5) {
        ctx.moveTo(cbPos.x - 14 * zoom, cbPos.y + offset);
        ctx.lineTo(cbPos.x + 14 * zoom, cbPos.y + offset * 0.7);
      }
      ctx.stroke();
    }

    // 4. Brain Stem structure (medulla oblongata base conduit)
    ctx.beginPath();
    const stemStart = project3D({ x: 10, y: 35, z: -5 }, w, h);
    const stemEnd = project3D({ x: 4, y: 75, z: 0 }, w, h);
    ctx.moveTo(stemStart.x, stemStart.y);
    ctx.lineTo(stemEnd.x, stemEnd.y);
    ctx.strokeStyle = "#475569"; // slate-grey robust stem
    ctx.lineWidth = 12 * zoom;
    ctx.stroke();

    // 5. Synapse neural impulses spark signals animation
    if (!showWireframe) {
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 4; i++) {
        const sparkT = (pulseTime * 0.6 + i * 0.25) % 1.0;
        const sparkX = -45 + sparkT * 85;
        const sparkY = -20 + Math.sin(sparkT * Math.PI) * 15;
        const sparkPos = project3D({ x: sparkX, y: sparkY, z: 12 }, w, h);
        
        ctx.beginPath();
        // Star highlight
        ctx.arc(sparkPos.x, sparkPos.y, 3 * zoom + Math.sin(pulseTime * 5 + i) * 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fef08a"; // intense glowing amber
        ctx.fill();
      }
    }
  };

  const drawElectricCircuitModel = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // 1. Coordinate corners defining circuit diagram shape
    const leftTop = project3D({ x: -75, y: -25, z: 0 }, w, h);
    const rightTop = project3D({ x: 75, y: -25, z: 0 }, w, h);
    const rightBottom = project3D({ x: 75, y: 55, z: 0 }, w, h);
    const leftBottom = project3D({ x: -75, y: 55, z: 0 }, w, h);

    // 2. Thick wiring skeleton copper schematic line
    ctx.beginPath();
    ctx.moveTo(leftTop.x, leftTop.y);
    ctx.lineTo(rightTop.x, rightTop.y);
    ctx.lineTo(rightBottom.x, rightBottom.y);
    ctx.lineTo(leftBottom.x, leftBottom.y);
    ctx.closePath();
    ctx.strokeStyle = "#475569"; // cool iron wiring
    ctx.lineWidth = 4 * zoom;
    ctx.stroke();

    // 3. Battery accumulator core symbol
    const batCenter = project3D({ x: 0, y: 55, z: 0 }, w, h);
    ctx.beginPath();
    ctx.rect(batCenter.x - 22 * zoom, batCenter.y - 12 * zoom, 44 * zoom, 24 * zoom);
    ctx.fillStyle = "#1e293b"; // dark container box
    ctx.fill();
    ctx.stroke();

    // Golden & Crimson polarized anodes/cathodes
    ctx.beginPath();
    ctx.rect(batCenter.x - 18 * zoom, batCenter.y - 12 * zoom, 10 * zoom, 24 * zoom);
    ctx.fillStyle = "#ef4444"; // positive CRIMSON terminal
    ctx.fill();

    ctx.beginPath();
    ctx.rect(batCenter.x + 8 * zoom, batCenter.y - 12 * zoom, 10 * zoom, 24 * zoom);
    ctx.fillStyle = "#2563eb"; // negative BLUE terminal
    ctx.fill();

    // 4. Mechanical Switch with rotating lever line (dynamic based on pulseTime toggle!)
    const swCenter = project3D({ x: 75, y: 15, z: 0 }, w, h);
    
    // Terminal contact dots
    ctx.beginPath();
    ctx.arc(swCenter.x, swCenter.y - 14 * zoom, 4, 0, Math.PI * 2);
    ctx.arc(swCenter.x, swCenter.y + 14 * zoom, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();

    // Toggling physical leverage contact bridge (Open/Close rotating animations!)
    const isOpen = Math.sin(pulseTime * 2.2) > 0;
    const leverLimitAngle = isOpen ? -Math.PI / 4 : 0;
    const leverYEnd = swCenter.y - 14 * zoom + Math.sin(leverLimitAngle) * 12 * zoom;
    const leverXEnd = swCenter.x + Math.cos(leverLimitAngle) * 8 * zoom;

    ctx.beginPath();
    ctx.moveTo(swCenter.x, swCenter.y + 14 * zoom);
    ctx.lineTo(leverXEnd, leverYEnd);
    ctx.strokeStyle = "#fbbf24"; // Brass conductor brass lever
    ctx.lineWidth = 3.5 * zoom;
    ctx.stroke();

    // 5. Light Bulb sockets with custom filament lines
    const bulbPos = project3D({ x: -75, y: 15, z: 0 }, w, h);
    // Filament heats up and glows brightly ONLY when switch is Closed!
    const bulbGlow = !isOpen ? 22 + Math.sin(pulseTime * 9) * 4 : 0;

    if (bulbGlow > 0 && !showWireframe) {
      const bulbRad = ctx.createRadialGradient(bulbPos.x, bulbPos.y, 4, bulbPos.x, bulbPos.y, bulbGlow * zoom);
      bulbRad.addColorStop(0, "#ffffff");
      bulbRad.addColorStop(0.3, "rgba(253, 224, 71, 0.85)"); // yellow glowing warmth
      bulbRad.addColorStop(0.7, "rgba(234, 179, 8, 0.35)");
      bulbRad.addColorStop(1, "rgba(234, 179, 8, 0)");
      ctx.beginPath();
      ctx.arc(bulbPos.x, bulbPos.y, bulbGlow * 1.5 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = bulbRad;
      ctx.fill();
    }

    // Physical Glass globe shell outline
    ctx.beginPath();
    ctx.arc(bulbPos.x, bulbPos.y, 14 * zoom, 0, Math.PI * 2);
    ctx.strokeStyle = !isOpen ? "#eab308" : "#94a3b8";
    ctx.lineWidth = 1.8 * zoom;
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
    ctx.stroke();

    // Tungsten incandescent filament (M-shaped loop inside bulb)
    ctx.beginPath();
    ctx.moveTo(bulbPos.x - 6 * zoom, bulbPos.y + 10 * zoom);
    ctx.lineTo(bulbPos.x - 3 * zoom, bulbPos.y - 4 * zoom);
    ctx.lineTo(bulbPos.x, bulbPos.y + 2 * zoom);
    ctx.lineTo(bulbPos.x + 3 * zoom, bulbPos.y - 4 * zoom);
    ctx.lineTo(bulbPos.x + 6 * zoom, bulbPos.y + 10 * zoom);
    ctx.strokeStyle = !isOpen ? "#ffffff" : "#475569";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Running electrical Electrons particles flow along wiring loop (runs ONLY when switch is closed!)
    if (!isOpen && !showWireframe) {
      ctx.fillStyle = "#fbbf24"; // Electrified yellow electrons
      for (let i = 0; i < 11; i++) {
        const pct = (pulseTime * 0.45 + i * 0.09) % 1.0;
        let ex = 0;
        let ey = 0;
        
        if (pct < 0.25) { // Left to Right top wiring
          const f = pct / 0.25;
          ex = -75 + f * 150;
          ey = -25;
        } else if (pct < 0.5) { // Top to Bottom right wiring
          const f = (pct - 0.25) / 0.25;
          ex = 75;
          ey = -25 + f * 80;
        } else if (pct < 0.75) { // Right to Left bottom wiring
          const f = (pct - 0.5) / 0.25;
          ex = 75 - f * 150;
          ey = 55;
        } else { // Bottom to Top left wiring passing bulb
          const f = (pct - 0.75) / 0.25;
          ex = -75;
          ey = 55 - f * 80;
        }

        const electronPos = project3D({ x: ex, y: ey, z: 0 }, w, h);
        ctx.beginPath();
        ctx.arc(electronPos.x, electronPos.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  return (
    <div id={`viewer-${modelId}`} className="flex flex-col h-full bg-[#1c1c1c] rounded-3xl shadow-lg border border-zinc-800 overflow-hidden text-zinc-300">
      {/* 📊 UPPER INTERACTIVE CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-[#2d2d2d] border-b border-[#151515] gap-3 select-none">
        <div className="flex items-center gap-2">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none block">Interactive Visualizer</span>
            <h3 className="text-xs font-black text-zinc-200 mt-0.5 flex items-center gap-1">
              <span>{model.name}</span>
            </h3>
          </div>
        </div>

        {/* Workspace mode pickers: 3D Canvas, 2D Schematic */}
        <div className="flex items-center gap-1 self-start md:self-auto bg-[#1b1b1b] p-1 rounded-2xl border border-zinc-800">
          <button
            onClick={() => {
              setViewMode("3d");
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "3d"
                ? "bg-[#3e3e3e] text-white font-extrabold shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5 text-purple-400" />
            <span>Classic 3D</span>
          </button>
          
          <button
            onClick={() => {
              setViewMode("2d");
              setIsSpinning(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "2d"
                ? "bg-[#3e3e3e] text-white font-extrabold shadow-sm border border-zinc-700"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>2D Schematic</span>
          </button>
        </div>
      </div>

      {/* 🧭 Direct Quick Component Directory Selector for prompt responsive tapping */}
      <div className="p-3 bg-zinc-900/60 border-b border-zinc-800/80 flex flex-col gap-1.5 select-none">
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none block mb-0.5">
          Select mechanical component to focus viewport instantly:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {model.parts.map((p) => {
            const isSelected = selectedPart?.name === p.name;
            return (
              <button
                key={p.name}
                onClick={() => selectPartWithCamera(p)}
                className={`px-3 py-1 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer rounded-xl active:scale-95 ${
                  isSelected
                    ? "bg-[#334155] text-white border border-slate-500"
                    : "bg-[#252526] hover:bg-[#2d2d2e] text-zinc-400 border border-zinc-800 shadow-sm"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: p.highlightColor || "#8b5cf6" }}
                />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔬 PRIMARY VIEWPORT CONTAINER */}
      {viewMode === "3d" ? (
        /* 🔬 ORIGINAL HIGH-RESOLUTION 3D LAB VIEWPORT */
        <div className="relative flex-1 bg-gradient-to-b from-slate-50 to-white min-h-[300px] cursor-grab active:cursor-grabbing text-slate-800">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            className="absolute inset-0 w-full h-full block touch-none"
          />

          {/* Floaters and Toggles within Stage */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm p-1 rounded-2xl shadow-md border border-slate-100 select-none">
            <button
              onClick={() => setIsSpinning((p) => !p)}
              className={`p-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                isSpinning ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              title="Toggle Auto-Spin"
            >
              {isSpinning ? <Pause className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[10px] pr-1">{isSpinning ? "Spinning" : "Paused"}</span>
            </button>

            <button
              onClick={() => setShowWireframeRaw((w) => !w)}
              className={`p-1.5 rounded-xl border-l border-slate-100 ${
                showWireframeRaw ? "text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
              title="Wireframe mode"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetCamera}
              className="p-1.5 text-slate-400 hover:text-slate-600 border-l border-slate-100"
              title="Reset camera angle"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 pointer-events-none select-none">
            <Rotate3d className="w-3 h-3 text-purple-400 animate-spin" />
            <span>Swipe to Rotate 360° manually | Tap targets</span>
          </div>
        </div>
      ) : (
        /* 📜 DUAL SCHEMATIC BLUEPRINT VIEW */
        <div className="flex-1 bg-slate-50 p-5 min-h-[300px] flex flex-col justify-center space-y-4 text-slate-800" id="de-schematic-blueprint">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto w-full">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Blueprint Layout</h4>
                <p className="text-sm font-black text-slate-800">{model.name} Cross-Section Map</p>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {model.parts.map((part) => {
                const isActive = selectedPart?.name === part.name;
                return (
                  <div
                    key={part.name}
                    onClick={() => selectPartWithCamera(part)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                      isActive
                        ? "bg-purple-50/85 border-purple-300 shadow-sm"
                        : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white text-[8px] font-bold text-white select-none"
                        style={{ backgroundColor: part.highlightColor || "#8b5cf6" }}
                      />
                      <div>
                        <p className="text-[11px] font-black text-slate-800 leading-tight">{part.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px] mt-0.5">{part.description}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? "translate-x-1" : ""}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ℹ️ Selected Component Detail & Custom doubts submission */}
      <div className="p-4 bg-[#232324] border-t border-zinc-800/80 max-h-[350px] overflow-y-auto text-zinc-300">
        {selectedPart ? (
          <div className="flex flex-col gap-3 animate-fade-in font-sans">
            <div className="bg-[#1e1e1f] p-3.5 rounded-2xl border border-zinc-800/60 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-500">
                  Inspecting Selected Rigidbody
                </span>
                <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold select-none">
                  Hotspot Bound
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white mt-1">
                {selectedPart.label}
              </h4>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-semibold">
                {selectedPart.description}
              </p>
              
              <div className="mt-3 pt-2.5 border-t border-zinc-800">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wide">Dynamic Engine Role</span>
                <p className="text-xs text-amber-100 font-bold mt-0.5 leading-relaxed">
                  {selectedPart.function}
                </p>
              </div>

              {/* Simplification shortcuts */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-zinc-800/40 select-none">
                <button
                  onClick={() => onActionRequest && onActionRequest("simplify", `Concept: ${selectedPart.name}. Description: ${selectedPart.description}. Function: ${selectedPart.function}`)}
                  className="px-2.5 py-1 text-[11px] font-black text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 rounded-lg transition-colors border border-amber-500/20 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Simplify with Metaphor
                </button>
                <button
                  onClick={() => onActionRequest && onActionRequest("notes", `Concept: ${selectedPart.name}. Description: ${selectedPart.description}. Function: ${selectedPart.function}`)}
                  className="px-2.5 py-1 text-[11px] font-black text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700 flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Generate Notes
                </button>
              </div>
            </div>

            {/* 🎯 Quick context MCQ */}
            {selectedPart.relatedQuizQuestion && (
              <div className="bg-[#1e1e1f] text-zinc-200 p-3.5 rounded-2xl shadow-md border border-zinc-800">
                <span className="text-[9px] uppercase font-bold text-amber-500 tracking-widest flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-amber-400 animate-pulse" />
                  Visual Micro Checkpoint
                </span>
                <p className="text-xs font-bold mt-1.5 leading-snug text-white">
                  {selectedPart.relatedQuizQuestion.question}
                </p>

                <div className="grid grid-cols-1 gap-1.5 mt-3 select-none">
                  {selectedPart.relatedQuizQuestion.options.map((opt, oIdx) => (
                    <button
                      key={oIdx}
                      onClick={() => selectQuizAnswer(oIdx, selectedPart.relatedQuizQuestion!.answer)}
                      className={`text-left p-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                        quizAnswerSelected === oIdx
                          ? oIdx === selectedPart.relatedQuizQuestion!.answer
                            ? "bg-emerald-500 text-white shadow-md font-bold"
                            : "bg-rose-500 text-white shadow-md font-bold"
                          : "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border border-zinc-700/50"
                      }`}
                    >
                      {oIdx + 1}. {opt}
                    </button>
                  ))}
                </div>

                {quizScoreFeedback && (
                  <div className="mt-3 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] leading-relaxed animate-fade-in font-semibold text-zinc-300">
                    {quizScoreFeedback}
                    {quizAnswerSelected === selectedPart.relatedQuizQuestion.answer && (
                      <p className="text-[#00bcd4] text-[10px] mt-1 font-medium italic">
                        {selectedPart.relatedQuizQuestion.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 💬 Custom doubts query box (Aware of the selected item) */}
            <div className="space-y-2 mt-1">
              <form onSubmit={submitModelQuestion} className="flex gap-1.5">
                <input
                  type="text"
                  value={customAIAskStr}
                  onChange={(e) => setCustomAIAskStr(e.target.value)}
                  placeholder={`Ask VIDYA about the ${selectedPart.label}...`}
                  className="flex-1 bg-[#151515] border border-zinc-800 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-zinc-200 font-semibold"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-[#2c3e50] border border-slate-600 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 active:scale-95 shadow-sm cursor-pointer"
                >
                  Ask AI <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </form>
              <AudioRecorder onTranscriptionComplete={(text) => setCustomAIAskStr(text)} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center text-zinc-500 font-sans" id="empty-inspection-tip">
            <span className="p-2.5 bg-zinc-800 text-zinc-600 rounded-full mb-1">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </span>
            <p className="text-xs font-bold text-zinc-300">No active Rigidbody selected</p>
            <p className="text-[10px] text-zinc-500 max-w-xs mt-0.5 font-semibold">
              Tap any labels/hotspots in the viewports above, select a component from the list, or open the scene directory to inspect!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
