import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  HelpCircle, 
  FileText, 
  ArrowRight, 
  X, 
  RotateCcw, 
  Check, 
  Trash2, 
  MousePointerClick, 
  Edit3, 
  BookOpen, 
  MessageSquare, 
  Award,
  BookMarked
} from "lucide-react";

export interface HighlightMessage {
  role: "user" | "model";
  text: string;
}

export interface ScribbleHighlight {
  id: string;
  selectedText: string;
  points: { x: number; y: number }[];
  circle: { x: number; y: number; r: number };
  color: string;
  isResolved: boolean;
  messages: HighlightMessage[];
  lastAction: "explain" | "simplify" | "notes";
}

interface CircleToAskProps {
  textbookExcerpt: {
    title: string;
    paragraphs: string[];
    diagramsUrl?: string;
    notes?: string;
  };
  currentModelId?: string;
  onCircleSubmit?: (selectedText: string, action: "explain" | "simplify" | "notes" | "quiz") => void;
  isLoading?: boolean;
  onEarnXP?: (xp: number, reason: string, category: string, type: string) => void;
}

const HIGHLIGHT_COLORS = [
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#e11d48", // Rose Red
  "#d946ef", // Fuchsia Magenta
  "#06b6d4"  // Cyan
];

export default function CircleToAsk({
  textbookExcerpt,
  currentModelId,
  onCircleSubmit,
  isLoading: parentLoading,
  onEarnXP
}: CircleToAskProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Interaction states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawMode, setDrawMode] = useState<boolean>(true);

  // Active persistent highlights
  const [highlights, setHighlights] = useState<ScribbleHighlight[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  
  // Floating menu state for active drawing selection
  const [pendingSelection, setPendingSelection] = useState<{
    selectedText: string;
    points: { x: number; y: number }[];
    circle: { x: number; y: number; r: number };
    menuPos: { x: number; y: number };
  } | null>(null);

  const [customQueryText, setCustomQueryText] = useState<string>("");
  const [followUpText, setFollowUpText] = useState<string>("");
  const [followUpLoading, setFollowUpLoading] = useState<boolean>(false);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);

  // Clear everything
  const clearAllHighlights = () => {
    setHighlights([]);
    setActiveHighlightId(null);
    setPendingSelection(null);
    setPoints([]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Redraw persistent canvas layers
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw ongoing temporary stroke
    if (isDrawing && points.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "#A855F7"; 
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(168, 85, 247, 0.4)";
      ctx.shadowBlur = 8;
      
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    // 2. Draw all existing highlights
    highlights.forEach((hl, index) => {
      if (hl.points.length < 2) return;
      const isActive = hl.id === activeHighlightId;
      
      ctx.beginPath();
      ctx.strokeStyle = hl.isResolved ? "#D97706" : (isActive ? "#7c3aed" : hl.color); 
      ctx.lineWidth = isActive ? 5 : 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = hl.isResolved ? "rgba(217, 119, 6, 0.5)" : (isActive ? "rgba(124, 58, 237, 0.6)" : hl.color + "90");
      ctx.shadowBlur = isActive ? 16 : 8;

      ctx.moveTo(hl.points[0].x, hl.points[0].y);
      for (let i = 1; i < hl.points.length; i++) {
        ctx.lineTo(hl.points[i].x, hl.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // Translucent inner highlights fill
      ctx.fillStyle = hl.isResolved 
        ? "rgba(217, 119, 6, 0.08)" 
        : (isActive ? "rgba(124, 58, 237, 0.12)" : hl.color + "15");
      ctx.fill();

      // Render interactive circular pin badge
      const center = hl.circle;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(center.x, center.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = hl.isResolved ? "#D97706" : (isActive ? "#7c3aed" : hl.color);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Write Badge labels (checkmark or index number)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(hl.isResolved ? "✓" : String(index + 1), center.x, center.y);
    });
  };

  // Trigger redraws on highlight modifications
  useEffect(() => {
    redrawCanvas();
  }, [highlights, activeHighlightId, isDrawing, points]);

  // Handle canvas sizing dynamically relative to text excerpt height
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !containerRef.current) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = Math.max(containerRef.current.clientHeight, containerRef.current.scrollHeight);
      redrawCanvas();
    };

    handleResize();
    const timer = setTimeout(handleResize, 150);
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [textbookExcerpt]);

  // Sketch Drawing Coordinates helpers
  const handleStart = (clientX: number, clientY: number) => {
    if (parentLoading || internalLoading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    setPendingSelection(null);
    
    // Scroll aware coordinate calculations
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setIsDrawing(true);
    setPoints([{ x, y }]);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawing || parentLoading || internalLoading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    setPoints(prev => [...prev, { x, y }]);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Filter out micro-scratches or click intents
    if (points.length < 5) {
      if (points.length > 0) {
        const clickPt = points[0];
        // Check if user tapped inside any existing highlight pin
        const clickedHl = highlights.find(hl => {
          const dist = Math.sqrt(Math.pow(clickPt.x - hl.circle.x, 2) + Math.pow(clickPt.y - hl.circle.y, 2));
          return dist <= 25; // 25px hit range
        });
        if (clickedHl) {
          setActiveHighlightId(clickedHl.id);
          return;
        }
      }
      setPoints([]);
      return;
    }

    // Calculate selection bounding boxes & centers
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let sumX = 0, sumY = 0;

    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    });

    const avgX = sumX / points.length;
    const avgY = sumY / points.length;
    const radius = Math.max(maxX - minX, maxY - minY) / 2;

    const mappedText = selectTextByCoordinates(minY, maxY);
    const menuX = Math.max(10, Math.min(canvasRef.current!.width - 250, avgX - 110));
    const menuY = Math.max(10, Math.min(canvasRef.current!.height - 180, maxY + 15));

    setPendingSelection({
      selectedText: mappedText,
      points: [...points],
      circle: { x: avgX, y: avgY, r: radius },
      menuPos: { x: menuX, y: menuY }
    });
    setPoints([]);
  };

  // approximate text coordinate mapper
  const selectTextByCoordinates = (top: number, bottom: number): string => {
    const totalParas = textbookExcerpt.paragraphs.length;
    if (totalParas === 0) return textbookExcerpt.title;
    const container = containerRef.current;
    if (!container) return textbookExcerpt.paragraphs[0];

    const h = container.scrollHeight;
    const sectorSize = h / (totalParas + 1);

    let matchIdxs: number[] = [];
    textbookExcerpt.paragraphs.forEach((p, idx) => {
      const sectorTop = (idx + 0.3) * sectorSize;
      const sectorBottom = (idx + 1.2) * sectorSize;
      if (top <= sectorBottom && bottom >= sectorTop) {
        matchIdxs.push(idx);
      }
    });

    if (matchIdxs.length === 0) {
      const mid = (top + bottom) / 2;
      const closestIdx = Math.min(totalParas - 1, Math.max(0, Math.floor(mid / sectorSize)));
      return textbookExcerpt.paragraphs[closestIdx];
    }

    return matchIdxs
      .map(idx => textbookExcerpt.paragraphs[idx])
      .filter(p => !p.startsWith("💡") && !p.startsWith("•") && !p.startsWith("🎯"))
      .join("\n\n") || textbookExcerpt.paragraphs[0];
  };

  // Submit initial scribble action choices to the backend
  const handleInitialChoice = async (action: "explain" | "simplify" | "notes") => {
    if (!pendingSelection) return;

    setInternalLoading(true);
    const textContext = pendingSelection.selectedText;
    const highlightId = `hl_${Date.now()}`;
    const nextColor = HIGHLIGHT_COLORS[highlights.length % HIGHLIGHT_COLORS.length];

    // Build immediate local placeholder highlight
    const newHighlight: ScribbleHighlight = {
      id: highlightId,
      selectedText: textContext,
      points: pendingSelection.points,
      circle: pendingSelection.circle,
      color: nextColor,
      isResolved: false,
      lastAction: action,
      messages: [
        { role: "user", text: `Circle highlight analysis request: "${action.toUpperCase()}"` }
      ]
    };

    setHighlights(prev => [...prev, newHighlight]);
    setActiveHighlightId(highlightId);
    setPendingSelection(null);

    try {
      const response = await fetch("/api/circle-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: customQueryText.trim() 
            ? `Query: ${customQueryText}. Concept text context: "${textContext}"`
            : textContext,
          action: action,
          currentModelId: currentModelId
        }),
      });

      if (!response.ok) throw new Error("Server inquiry failed");
      const parsed = await response.json();

      setHighlights(prev => prev.map(hl => {
        if (hl.id === highlightId) {
          return {
            ...hl,
            messages: [
              ...hl.messages,
              { role: "model", text: parsed.result }
            ]
          };
        }
        return hl;
      }));

      // Trigger standard parent callbacks if they exist
      if (onCircleSubmit) {
        onCircleSubmit(textContext, action);
      }
      if (onEarnXP) {
        onEarnXP(80, `Interactive notes highlight: "${action}" analysis`, textbookExcerpt.title, "highlights");
      }

    } catch (err) {
      setHighlights(prev => prev.map(hl => {
        if (hl.id === highlightId) {
          return {
            ...hl,
            messages: [
              ...hl.messages,
              { role: "model", text: "⚠️ I encountered an error and couldn't process this area query. Please slice over it again!" }
            ]
          };
        }
        return hl;
      }));
    } finally {
      setInternalLoading(false);
      setCustomQueryText("");
    }
  };

  // Reply subsequent continuous thread exchanges
  const handleSendFollowUp = async () => {
    const curHl = highlights.find(h => h.id === activeHighlightId);
    if (!followUpText.trim() || !curHl || followUpLoading) return;

    const query = followUpText.trim();
    setFollowUpText("");
    setFollowUpLoading(true);

    const userMessage: HighlightMessage = { role: "user", text: query };
    const stepHistory = [...curHl.messages, userMessage];

    // Append user follow-up message locally immediately
    setHighlights(prev => prev.map(h => {
      if (h.id === curHl.id) {
        return { ...h, messages: stepHistory };
      }
      return h;
    }));

    try {
      const appLanguage = (() => {
        try {
          const stored = localStorage.getItem("vidya_active_user");
          if (stored) {
            return JSON.parse(stored).appLanguage || "en";
          }
        } catch {}
        return "en";
      })();

      const tutorStyle = (() => {
        try {
          const stored = localStorage.getItem("vidya_active_user");
          if (stored) {
            return JSON.parse(stored).tutorStyle || "expert";
          }
        } catch {}
        return "expert";
      })();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: stepHistory.slice(0, -1).map(h => ({
            role: h.role === "model" ? "assistant" : "user",
            text: h.text
          })),
          topicContext: curHl.selectedText,
          currentModelId: currentModelId || "",
          appLanguage,
          tutorStyle
        })
      });

      if (!response.ok) throw new Error("Reply stream failed");
      const parsed = await response.json();

      setHighlights(prev => prev.map(h => {
        if (h.id === curHl.id) {
          return {
            ...h,
            messages: [
              ...stepHistory,
              { role: "model", text: parsed.text }
            ]
          };
        }
        return h;
      }));

      if (onEarnXP) {
        onEarnXP(30, `Query reply: "${query.substring(0, 20)}..."`, curHl.selectedText, "follow_up");
      }

    } catch (err) {
      setHighlights(prev => prev.map(h => {
        if (h.id === curHl.id) {
          return {
            ...h,
            messages: [
              ...stepHistory,
              { role: "model", text: "⚠️ Failed to receive response. Let's try sending that question again!" }
            ]
          };
        }
        return h;
      }));
    } finally {
      setFollowUpLoading(false);
    }
  };

  const markResolved = (id: string, name: string) => {
    setHighlights(prev => prev.map(h => {
      if (h.id === id) {
        return { ...h, isResolved: true };
      }
      return h;
    }));

    if (onEarnXP) {
      onEarnXP(50, `Mastered Scribble Highlight: "${name.substring(0, 30)}"`, textbookExcerpt.title, "mastery");
    }
  };

  const activeHl = highlights.find(h => h.id === activeHighlightId);

  return (
    <div className="flex flex-col gap-6">
      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/60 text-[11px] text-purple-950 font-semibold flex items-center gap-3">
        <Edit3 className="w-5 h-5 text-purple-600 shrink-0" />
        <p>
          <strong>Interactive Study Scribble:</strong> Draw a freehand circle on the text sheet below or click existing highlights pins on the paper to converse about specifics of that area!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto">
        
        {/* 📚 Simulated Textbook Page (Col Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col min-h-[500px]">
          
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-4 py-3 shadow-sm flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.2 bg-white/20 rounded-lg text-[9px] font-bold font-mono tracking-widest uppercase">
                Interactive Textbook Sheet
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawMode(true)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  drawMode ? "bg-amber-400 text-purple-950 shadow-sm" : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Pencil Ink</span>
              </button>
              
              <button
                onClick={() => setDrawMode(false)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  !drawMode ? "bg-purple-600 text-white shadow-sm" : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Scroll Normal</span>
              </button>

              <button
                onClick={clearAllHighlights}
                className="p-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Wipe current ink drawings"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 relative min-h-[400px] max-h-[540px]" ref={containerRef}>
            
            {/* Gesture capture Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => drawMode && handleStart(e.clientX, e.clientY)}
              onMouseMove={(e) => drawMode && handleMove(e.clientX, e.clientY)}
              onMouseUp={() => drawMode && handleEnd()}
              onTouchStart={(e) => {
                if (!drawMode) return;
                const touch = e.touches[0];
                handleStart(touch.clientX, touch.clientY);
              }}
              onTouchMove={(e) => {
                if (!drawMode) return;
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
              }}
              onTouchEnd={() => drawMode && handleEnd()}
              style={{ pointerEvents: drawMode ? "auto" : "none" }}
              className={`absolute top-0 left-0 w-full h-full block ${
                drawMode ? "z-10 cursor-crosshair" : "z-0 opacity-10"
              }`}
            />

            {/* Simulated Textbook Page Content */}
            <div className="prose max-w-none text-slate-800 select-none pointer-events-none z-0 relative pb-10">
              <div className="text-center mb-6">
                <span className="text-[9px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded">
                  AR CURRICULUM WORKPAD
                </span>
                <h3 className="text-sm font-black text-slate-800 mt-1 uppercase">
                  {textbookExcerpt.title}
                </h3>
                <div className="w-8 h-0.5 bg-purple-650 mx-auto mt-2 rounded"></div>
              </div>

              <div className="space-y-4 text-left">
                {textbookExcerpt.paragraphs.map((para, pIdx) => {
                  if (para.startsWith("💡 ") || para.startsWith("🎯 ")) {
                    return (
                      <h4 key={pIdx} className="text-[10px] font-black text-purple-900 tracking-wider uppercase mt-4 mb-1.5 pb-1 select-none flex items-center gap-1">
                        {para}
                      </h4>
                    );
                  }
                  if (para.startsWith("• ")) {
                    return (
                      <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-700 font-bold pl-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-purple-600 font-extrabold">•</span>
                        <span>{para.substring(2)}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="text-[11px] leading-relaxed text-slate-600 font-semibold text-justify">
                      {para}
                    </p>
                  );
                })}
              </div>

              {textbookExcerpt.diagramsUrl && (
                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-150 flex flex-col items-center">
                  <div className="w-full h-20 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-lg flex items-center justify-center border border-dashed border-purple-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-700 animate-pulse">
                      Simulated Diagram Vector Sheet
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Floating Selection Choice Menu popup immediately near drawn loop */}
            {pendingSelection && (
              <div
                style={{
                  left: `${pendingSelection.menuPos.x}px`,
                  top: `${pendingSelection.menuPos.y}px`
                }}
                className="absolute z-20 w-[240px] bg-slate-900/95 border border-slate-700 text-white p-3 rounded-2xl shadow-2xl animate-scale-up"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-0.5">
                    <Sparkles className="w-3" /> Scribble Captured
                  </span>
                  <button onClick={() => setPendingSelection(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[9.5px] text-slate-300 italic line-clamp-2 bg-slate-950 p-2 rounded-lg mb-2">
                  "{pendingSelection.selectedText}"
                </p>

                {/* Specific option override */}
                <input
                  type="text"
                  placeholder="Optional prompt doubt..."
                  value={customQueryText}
                  onChange={(e) => setCustomQueryText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-[9.5px] px-2 py-1 mb-2.5 rounded text-white font-semibold"
                />

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleInitialChoice("explain")}
                    className="w-full text-left p-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>Explain Highlighted Area</span>
                  </button>

                  <button
                    onClick={() => handleInitialChoice("simplify")}
                    className="w-full text-left p-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Explain simpler (Metaphors)</span>
                  </button>

                  <button
                    onClick={() => handleInitialChoice("notes")}
                    className="w-full text-left p-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Compile revision notes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 💬 Conversational Dialogues ledger (Col Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm p-4 flex flex-col justify-between min-h-[500px]">
          
          <div className="flex flex-col h-full justify-between gap-4">
            
            {/* Header selection info */}
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full select-none">
                Interactive Study Threads
              </span>
              <h4 className="font-heading font-black text-sm text-slate-800 mt-1 select-none">
                Highlight Inquiries Ledger
              </h4>
            </div>

            {/* Conversation dynamic logger */}
            <div className="flex-1 overflow-y-auto space-y-3 pt-1 max-h-[360px] min-h-[250px] pr-1">
              {highlights.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none gap-3 my-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <MousePointerClick className="w-6 h-6 text-purple-400 border-transparent" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-800">No active scribble threads</h5>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-[200px] mx-auto font-medium">
                      Select raw pencil ink above, scribble a loop over any concept on screen, and its conversational ledger deep-dive thread is generated here!
                    </p>
                  </div>
                </div>
              ) : (
                !activeHl ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none gap-2 my-auto">
                    <BookMarked className="w-8 h-8 text-indigo-400 animate-pulse" />
                    <p className="text-[10.5px] text-slate-500 font-bold">
                      Tap any highlight pin (e.g. 1, 2) on the textbook page to load its conversation dialogue thread!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 select-text">
                    <div className="p-3 bg-purple-50/30 rounded-xl border border-purple-100/45 text-[11px] font-semibold text-slate-600 italic">
                      <span className="font-black text-[9px] text-purple-600 uppercase tracking-widest block mb-0.5 select-none">Circled selection context:</span>
                      "{activeHl.selectedText}"
                    </div>

                    {/* Messages */}
                    {activeHl.messages.map((m, idx) => {
                      const isAI = m.role === "model";
                      // Skip user analysis request logs for a cleaner tutor look
                      if (!isAI && idx === 0) return null;
                      
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border text-[11px] leading-relaxed font-semibold ${
                            isAI 
                              ? "bg-slate-50/70 border-slate-100 text-slate-700 text-justify"
                              : "bg-purple-600 text-white border-transparent self-end ml-4"
                          }`}
                        >
                          <span className="text-[8px] uppercase tracking-wider font-cyan block font-black text-slate-400 mb-0.5 select-none">
                            {isAI ? "🎓 Study Assistant VIDYA" : "👤 Your doubt query"}
                          </span>
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>
                      );
                    })}

                    {followUpLoading && (
                      <div className="bg-purple-50/30 border border-dashed border-purple-200 p-2.5 rounded-xl text-[10.5px] font-bold text-purple-600 flex items-center gap-2 animate-pulse select-none">
                        <MessageSquare className="w-3.5 h-3.5 animate-spin text-purple-650" />
                        <span>Generating explanation follow-up...</span>
                      </div>
                    )}
                  </div>
                )
              )}

              {internalLoading && (
                <div className="bg-purple-50/25 border border-dashed border-purple-200 p-3 rounded-xl text-[10.5px] font-bold text-purple-600 flex items-center gap-2 animate-pulse select-none">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  <span>VIDYA is analyzing the circled pixels...</span>
                </div>
              )}
            </div>

            {/* Bottom response input or resolved display */}
            {activeHl && (
              <div className="border-t border-slate-100 pt-3 space-y-2 shrink-0">
                
                {activeHl.isResolved ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-300 text-amber-900 rounded-2xl text-[11.5px] font-black flex items-center justify-center gap-2 select-none shadow-sm animate-scale-up">
                    <Award className="w-4 h-4 text-amber-600 animate-bounce" />
                    <span>Concept Mastered & Saved! (+50 XP)</span>
                  </div>
                ) : (
                  <>
                    {/* Follow up text bar */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={followUpText}
                        onChange={(e) => setFollowUpText(e.target.value)}
                        placeholder="Got questions? Type reply about this selection..."
                        className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-400"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && followUpText.trim()) {
                            handleSendFollowUp();
                          }
                        }}
                      />
                      <button
                        onClick={handleSendFollowUp}
                        disabled={!followUpText.trim() || followUpLoading}
                        className="px-3 bg-purple-650 hover:bg-purple-750 disabled:bg-slate-200 text-white rounded-2xl flex items-center justify-center cursor-pointer font-black select-none transition-all"
                      >
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* Master button */}
                    <button
                      onClick={() => markResolved(activeHl.id, activeHl.selectedText)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 border border-transparent font-black text-[10px] uppercase py-2 px-3 rounded-2xl transition-all cursor-pointer text-center select-none shadow hover:shadow flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-400" />
                      <span>Got explanation! Mark highlight resolved (+50 XP)</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {/* List selector summary indicators */}
            {highlights.length > 0 && (
              <div className="border-t border-slate-50 pt-3 shrink-0 flex flex-wrap gap-1.5 select-none items-center">
                <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block shrink-0">List Threads:</span>
                {highlights.map((hl, index) => {
                  const isActive = hl.id === activeHighlightId;
                  return (
                    <button
                      key={hl.id}
                      onClick={() => setActiveHighlightId(hl.id)}
                      className={`text-[9.5px] font-black px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer border ${
                        hl.isResolved 
                          ? "bg-amber-100 border-amber-300 text-amber-900" 
                          : (isActive 
                              ? "bg-purple-600 border-transparent text-white shadow-sm" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")
                      }`}
                    >
                      <span>💡 #{index + 1}</span>
                      {hl.isResolved && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
