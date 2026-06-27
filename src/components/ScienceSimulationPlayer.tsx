import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, FastForward, Info, Zap, RefreshCw, Flame, Eye } from "lucide-react";

interface ScienceSimulationPlayerProps {
  modelId: string;
  topicName: string;
}

export default function ScienceSimulationPlayer({ modelId, topicName }: ScienceSimulationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // multipliers: 1, 2, 5
  const [triggerCount, setTriggerCount] = useState<number>(0);
  const [voltage, setVoltage] = useState<number>(5); // for electric-circuit
  const [isErupting, setIsErupting] = useState<boolean>(false); // for volcano
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let angle = 0;
    let pulses: { x: number; y: number; r: number; opacity: number }[] = [];

    // Blood cells for heart circulation simulation
    const bloodCells: { x: number; y: number; oxygenated: boolean; offset: number }[] = [];
    for (let i = 0; i < 24; i++) {
      bloodCells.push({
        x: 0,
        y: 0,
        oxygenated: i % 2 === 0,
        offset: i * 15
      });
    }

    // Electrons for circuit simulation
    const electrons: { pos: number }[] = [];
    for (let i = 0; i < 20; i++) {
      electrons.push({ pos: i * 15 });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Draw background glow grid
      ctx.strokeStyle = "rgba(124, 58, 237, 0.04)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      if (isPlaying) {
        angle += 0.02 * simSpeed;
      }

      if (modelId === "human-heart") {
        // 🩸 1. HUMAN HEART PULSATING SIMULATION
        // Draw heart shape silhouette
        ctx.strokeStyle = "rgba(225, 29, 72, 0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 50);
        ctx.bezierCurveTo(centerX - 80, centerY - 120, centerX - 120, centerY - 20, centerX, centerY + 80);
        ctx.bezierCurveTo(centerX + 120, centerY - 20, centerX + 80, centerY - 120, centerX, centerY - 50);
        ctx.stroke();

        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
        ctx.fillText("L. VENTRICLE (RED)", centerX - 80, centerY + 70);
        ctx.fillText("R. VENTRICLE (BLUE)", centerX + 20, centerY + 70);

        // Pulsating cardiac muscle layer
        const pulseRatio = isPlaying ? 1 + Math.sin(angle * 2) * 0.08 : 1;
        ctx.fillStyle = "rgba(225, 29, 72, 0.08)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60 * pulseRatio, 0, Math.PI * 2);
        ctx.fill();

        // Draw major vessels channels
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        // Left systemic aorta channel (Oxygenated red)
        ctx.strokeStyle = "rgba(225, 29, 72, 0.6)";
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY);
        ctx.quadraticCurveTo(centerX - 50, centerY - 120, centerX - 30, centerY - 130);
        ctx.stroke();

        // Right pulmonary veins return path (Deoxygenated blue)
        ctx.strokeStyle = "rgba(37, 99, 235, 0.6)";
        ctx.beginPath();
        ctx.moveTo(centerX + 20, centerY);
        ctx.quadraticCurveTo(centerX + 50, centerY - 120, centerX + 30, centerY - 130);
        ctx.stroke();

        // Draw pulsating blood cells
        bloodCells.forEach((cell, idx) => {
          const progress = (angle * 20 + cell.offset) % 300;
          let px = 0, py = 0;
          if (cell.oxygenated) {
            // Flow along the aorta path
            const t = progress / 300;
            px = (1 - t) * (1 - t) * (centerX - 20) + 2 * (1 - t) * t * (centerX - 50) + t * t * (centerX - 30);
            py = (1 - t) * (1 - t) * centerY + 2 * (1 - t) * t * (centerY - 120) + t * t * (centerY - 130);
          } else {
            // Flow returning along pulmonary veins
            const t = progress / 300;
            px = (1 - t) * (1 - t) * (centerX + 20) + 2 * (1 - t) * t * (centerX + 50) + t * t * (centerX + 30);
            py = (1 - t) * (1 - t) * centerY + 2 * (1 - t) * t * (centerY - 120) + t * t * (centerY - 130);
          }

          ctx.fillStyle = cell.oxygenated ? "#e11d48" : "#2563eb";
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();

          // Cytoplasmic oxygen glowing halo
          if (isPlaying && idx % 3 === 0) {
            ctx.fillStyle = cell.oxygenated ? "rgba(225, 29, 72, 0.2)" : "rgba(37, 99, 235, 0.2)";
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        });

      } else if (modelId === "solar-system") {
        // 🪐 2. SOLAR SYSTEM ORBITAL PLANETS
        // Sun at the center
        const sunRadius = 24 + Math.sin(angle * 3) * 1.5;
        const grad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, sunRadius);
        grad.addColorStop(0, "#fef08a");
        grad.addColorStop(0.4, "#f59e0b");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Planetary tracks
        const orbits = [
          { r: 42, speed: 1.6, size: 3.5, color: "#a8a29e" }, // Mercury
          { r: 65, speed: 1.15, size: 5, color: "#ea580c" },  // Venus
          { r: 90, speed: 0.9, size: 6.5, color: "#10b981" },  // Earth
          { r: 120, speed: 0.65, size: 5.5, color: "#ef4444" } // Mars
        ];

        orbits.forEach((orb) => {
          // Draw orbit track line
          ctx.strokeStyle = "rgba(100, 116, 139, 0.12)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, orb.r, 0, Math.PI * 2);
          ctx.stroke();

          // Calculate planet coordinates
          const pAngle = angle * orb.speed;
          const px = centerX + Math.cos(pAngle) * orb.r;
          const py = centerY + Math.sin(pAngle) * orb.r;

          // Planet dot
          ctx.fillStyle = orb.color;
          ctx.beginPath();
          ctx.arc(px, py, orb.size, 0, Math.PI * 2);
          ctx.fill();

          // Highlight defensive atmosphere glow (Earth/Mars/Venus)
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, orb.size + 2, 0, Math.PI * 2);
          ctx.stroke();
        });

      } else if (modelId === "volcano") {
        // 🌋 3. CONVENTIOUS TECTONIC VOLCANO LAHAR FLOWS
        // Draw volcano mountain layers
        ctx.fillStyle = "rgba(71, 85, 105, 0.15)";
        ctx.beginPath();
        ctx.moveTo(centerX - 130, centerY + 80);
        ctx.lineTo(centerX - 40, centerY - 30);
        ctx.lineTo(centerX + 40, centerY - 30);
        ctx.lineTo(centerX + 130, centerY + 80);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw hot magma chamber reservoir below
        const chamberRadius = 35 + Math.sin(angle * 2) * 2;
        const magmaGrad = ctx.createRadialGradient(centerX, centerY + 100, 2, centerX, centerY + 100, chamberRadius);
        magmaGrad.addColorStop(0, "#ef4444");
        magmaGrad.addColorStop(0.7, "#ea580c");
        magmaGrad.addColorStop(1, "transparent");
        ctx.fillStyle = magmaGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 100, chamberRadius, 0, Math.PI * 2);
        ctx.fill();

        // Conduit flue pipe line
        ctx.strokeStyle = "rgba(234, 88, 12, 0.6)";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 70);
        ctx.lineTo(centerX, centerY - 32);
        ctx.stroke();

        // Pulsing magma currents ascending
        for (let i = 0; i < 5; i++) {
          const cy = (centerY + 70) - ((angle * 15 + i * 25) % 100);
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(centerX, cy, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Handle Active Eruption state
        if (isErupting) {
          // Smoke clouds billowing
          for (let s = 0; s < 4; s++) {
            const smokeRadius = 15 + (s * 8) + Math.sin(angle * 5 + s) * 2;
            ctx.fillStyle = "rgba(100, 116, 139, 0.45)";
            ctx.beginPath();
            ctx.arc(centerX - 15 + s * 10, centerY - 55 - s * 5, smokeRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Liquid fire sparks
          for (let f = 0; f < 8; f++) {
            const expAngle = angle * (1 + f * 0.1) + f;
            const fx = centerX + Math.cos(expAngle) * (20 + (angle * 40 % 70));
            const fy = (centerY - 35) - Math.abs(Math.sin(expAngle) * (20 + (angle * 45 % 80)));
            ctx.fillStyle = f % 2 === 0 ? "#f97316" : "#facc15";
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

      } else if (modelId === "cell-structure") {
        // 🧬 4. BIOLOGICAL CELL MITOCHONIDRIA MOTILITY
        // Eukaryotic lipid cell membrane boundary outline
        ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 105, 0, Math.PI * 2);
        ctx.stroke();

        // Nucleus at the core center
        ctx.fillStyle = "rgba(124, 58, 237, 0.15)";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(124, 58, 237, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Nucleolus inside nucleoplasm
        ctx.fillStyle = "rgba(124, 58, 237, 0.6)";
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY + 5, 12, 0, Math.PI * 2);
        ctx.fill();

        // Organelles list (Mitochondria, Golgi body)
        const organelles = [
          { x: centerX - 60, y: centerY - 50, d: 13, color: "#f43f5e" }, // Mitochondria 1
          { x: centerX + 60, y: centerY + 50, d: 14, color: "#f43f5e" }, // Mitochondria 2
          { x: centerX + 55, y: centerY - 55, d: 10, color: "#f59e0b" }, // Golgi Body
          { x: centerX - 55, y: centerY + 55, d: 9, color: "#06b6d4" }  // Lysosome
        ];

        organelles.forEach((org) => {
          // Subtle drifting float offset
          const driftX = Math.sin(angle + org.x) * 4;
          const driftY = Math.cos(angle + org.y) * 4;

          ctx.fillStyle = org.color;
          ctx.beginPath();
          ctx.arc(org.x + driftX, org.y + driftY, org.d, 0, Math.PI * 2);
          ctx.fill();

          // Innermost cristae folded lines for mitochondria
          if (org.color === "#f43f5e") {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(org.x + driftX - 8, org.y + driftY);
            ctx.lineTo(org.x + driftX + 8, org.y + driftY);
            ctx.stroke();
          }
        });

      } else if (modelId === "dna") {
        // 🧬 5. HELICAL ROTATING DNA CHROMATIN PAIRING
        const strandsCount = 14;
        const helixWidth = 65;

        // Draw vertical helical structural tracks
        for (let i = 0; i < strandsCount; i++) {
          const t = i / strandsCount;
          const currY = (height * 0.12) + t * (height * 0.76);
          const offsetAngle = angle + (t * Math.PI * 2.5);

          const leftX = centerX + Math.sin(offsetAngle) * helixWidth;
          const rightX = centerX - Math.sin(offsetAngle) * helixWidth;

          // Backbone connecting hydrogen bonding ladder rung line
          ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(leftX, currY);
          ctx.lineTo(rightX, currY);
          ctx.stroke();

          // Left nucleotide base bead node
          const colorLeft = Math.sin(offsetAngle) > 0 ? "#ec4899" : "#06b6d4";
          ctx.fillStyle = colorLeft;
          ctx.beginPath();
          ctx.arc(leftX, currY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Right nucleotide base bead node
          const colorRight = Math.sin(offsetAngle) > 0 ? "#06b6d4" : "#ec4899";
          ctx.fillStyle = colorRight;
          ctx.beginPath();
          ctx.arc(rightX, currY, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = "bold 9px monospace";
        ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
        ctx.fillText("ADENINE-THYMINE (A-T)", centerX + 80, centerY - 60);
        ctx.fillText("CYTOSINE-GUANINE (C-G)", centerX + 80, centerY - 45);

      } else if (modelId === "brain") {
        // 🧠 6. ELECTRO-CHEMICAL NEUROSYNAPSES
        // Draw cerebral outline hemisphere silhouette
        ctx.fillStyle = "rgba(244, 63, 94, 0.05)";
        ctx.beginPath();
        ctx.arc(centerX - 15, centerY, 52, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(centerX + 15, centerY, 52, Math.PI * 1.5, Math.PI * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(219, 39, 119, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Synaptic nodes points list
        const synapses = [
          { x: centerX - 35, y: centerY - 25, label: "Frontal" },
          { x: centerX + 35, y: centerY - 22, label: "Parietal" },
          { x: centerX - 42, y: centerY + 20, label: "Temporal" },
          { x: centerX + 40, y: centerY + 22, label: "Occipital" },
          { x: centerX, y: centerY - 5, label: "Inner Synapse" }
        ];

        // Synaptic firing spark lines across cortical paths
        if (isPlaying && Math.random() < 0.12) {
          const fromIdx = Math.floor(Math.random() * synapses.length);
          const toIdx = Math.floor(Math.random() * synapses.length);
          if (fromIdx !== toIdx) {
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(synapses[fromIdx].x, synapses[fromIdx].y);
            ctx.lineTo(synapses[toIdx].x, synapses[toIdx].y);
            ctx.stroke();

            // flash spark ripple
            ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
            ctx.beginPath();
            ctx.arc((synapses[fromIdx].x + synapses[toIdx].x)/2, (synapses[fromIdx].y + synapses[toIdx].y)/2, 12, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        synapses.forEach((node) => {
          ctx.fillStyle = "#db2777";
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = "bold 9px sans-serif";
          ctx.fillStyle = "rgba(100, 116, 139, 0.6)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.x, node.y - 10);
        });

      } else if (modelId === "electric-circuit") {
        // ⚡ 7. ELECTRICAL CIRCUIT CHARGE MOVEMENT
        // Wire track loop
        ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(centerX - 100, centerY - 65, 200, 130);
        ctx.stroke();

        // Battery symbol representation
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(centerX - 15, centerY - 72, 30, 14);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Negative cathode long bar
        ctx.moveTo(centerX - 7, centerY - 75);
        ctx.lineTo(centerX - 7, centerY - 55);
        // Positive anode short thick bar
        ctx.moveTo(centerX + 7, centerY - 70);
        ctx.lineTo(centerX + 7, centerY - 60);
        ctx.stroke();

        ctx.font = "black 9px monospace";
        ctx.fillStyle = "#1e293b";
        ctx.fillText("+ BATTERY -", centerX - 25, centerY - 82);

        // Interactive lamp receiver node
        ctx.fillStyle = voltage > 6 ? "#fef08a" : "#ca8a04";
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + 65, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Filament Cross "X"
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - 6, centerY + 59);
        ctx.lineTo(centerX + 6, centerY + 71);
        ctx.moveTo(centerX + 6, centerY + 59);
        ctx.lineTo(centerX - 6, centerY + 71);
        ctx.stroke();

        if (voltage > 3) {
          const haloGrad = ctx.createRadialGradient(centerX, centerY + 65, 2, centerX, centerY + 65, 14 + voltage * 3);
          haloGrad.addColorStop(0, "rgba(254, 240, 138, 0.45)");
          haloGrad.addColorStop(1, "transparent");
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY + 65, 14 + voltage * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw flowing yellow electrons
        electrons.forEach((elec) => {
          if (isPlaying) {
            elec.pos = (elec.pos + (voltage * 0.3 * simSpeed)) % 660; // speed depends on voltage!
          }

          let ex = 0, ey = 0;
          const pos = elec.pos;

          // Trace coordinates along 200x130 box path perimeter = 660px total
          if (pos < 200) {
            ex = (centerX - 100) + pos;
            ey = centerY - 65;
          } else if (pos < 330) {
            ex = centerX + 100;
            ey = (centerY - 65) + (pos - 200);
          } else if (pos < 530) {
            ex = (centerX + 100) - (pos - 330);
            ey = centerY + 65;
          } else {
            ex = centerX - 100;
            ey = (centerY + 65) - (pos - 530);
          }

          ctx.fillStyle = "#eab308";
          ctx.beginPath();
          ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, simSpeed, modelId, voltage, isErupting]);

  return (
    <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl relative overflow-hidden shadow-xl select-none">
      
      {/* Simulation Screen Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="p-1.5 bg-purple-650 rounded-lg shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          </span>
          <div className="min-w-0">
            <span className="text-[8px] uppercase font-black text-purple-400 tracking-widest block leading-none">Interactive Video Simulation</span>
            <h4 className="text-[11px] font-black tracking-tight text-slate-100 truncate mt-0.5 uppercase leading-none">{topicName}</h4>
          </div>
        </div>

        {/* HUD Stats */}
        <div className="flex items-center gap-2 text-right">
          <div className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[8px] font-mono shrink-0">
            <span className="text-emerald-400">● SIM LAB ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Screen Canvas Container */}
      <div className="w-full h-44 bg-slate-950 rounded-2xl relative overflow-hidden border border-slate-850/80 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={176}
          className="w-full h-full block"
        />

        {/* Procedural Watermark label */}
        <span className="absolute bottom-2 right-3 text-[8.5px] font-mono text-slate-500/60 uppercase select-none tracking-widest leading-none pointer-events-none">
          VIDYA Procedural Engine v2.5
        </span>
      </div>

      {/* Controls hud pane */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10.5px]">
        
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isPlaying
                ? "bg-purple-600 text-white border-transparent hover:bg-purple-700"
                : "bg-emerald-600 text-white border-transparent hover:bg-emerald-700"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Speed trigger multipliers */}
          <button
            onClick={() => {
              setSimSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 5 : 1));
            }}
            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer select-none"
            title="Accelerate physics orbital speed"
          >
            <FastForward className="w-3.5 h-3.5 text-purple-300" />
            <span>{simSpeed}x</span>
          </button>
        </div>

        {/* Dynamic Model-specific Sliders/Buttons */}
        <div className="flex-1 max-w-[210px] text-right">
          {modelId === "electric-circuit" && (
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[8.5px] uppercase text-zinc-400 shrink-0 select-none">Voltage: {voltage}v</span>
              <input
                type="range"
                min="1"
                max="12"
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-20 accent-purple-500 h-1 rounded bg-slate-800 cursor-pointer"
              />
            </div>
          )}

          {modelId === "volcano" && (
            <button
              onClick={() => {
                setIsErupting(true);
                setTriggerCount((p) => p + 1);
                setTimeout(() => setIsErupting(false), 5000);
              }}
              disabled={isErupting}
              className="px-3 py-1.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black tracking-widest text-[9px] uppercase rounded-xl shadow-md transition-all enabled:active:scale-95 cursor-pointer disabled:opacity-40 select-none flex items-center gap-1 inline-flex ml-auto"
            >
              <Flame className="w-3 h-3 text-slate-950" />
              <span>{isErupting ? "Erupting Plume" : "Trigger Eruption"}</span>
            </button>
          )}

          {modelId === "human-heart" && (
            <button
              onClick={() => {
                setTriggerCount((p) => p + 1);
              }}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-purple-300 font-bold text-[9px] uppercase rounded-xl transition-all cursor-pointer inline-flex ml-auto items-center gap-1 select-none"
            >
              <RefreshCw className="w-3 h-3 text-purple-400" />
              <span>Cardiac Trigger ({triggerCount})</span>
            </button>
          )}

          {modelId === "cell-structure" && (
            <button
              onClick={() => {
                setTriggerCount((p) => p + 1);
              }}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-emerald-300 font-extrabold text-[9px] uppercase rounded-xl transition-all cursor-pointer inline-flex ml-auto items-center gap-1 select-none"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Divide Organelles</span>
            </button>
          )}

          {modelId === "dna" && (
            <button
              onClick={() => setTriggerCount((p) => p + 1)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-pink-300 font-extrabold text-[9px] uppercase rounded-xl transition-all cursor-pointer inline-flex ml-auto items-center gap-1"
            >
              <Eye className="w-3 h-3 text-pink-400" />
              <span>Mutate Base pairings</span>
            </button>
          )}

          {modelId === "brain" && (
            <button
              onClick={() => setTriggerCount((p) => p + 1)}
              className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-sky-300 font-extrabold text-[9px] uppercase rounded-xl transition-all cursor-pointer inline-flex ml-auto items-center gap-1"
            >
              <Zap className="w-3 h-3 text-sky-400" />
              <span>Flash Cortex</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
