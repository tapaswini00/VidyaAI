import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Camera, BookOpen, Zap, Upload, X, RotateCw, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CameraScannerModal from "./CameraScannerModal";
import { useAndroidPermissions } from "../context/AndroidPermissionContext";

interface ScanUploadProps {
  onScanComplete: (payload: {
    fileContent: string;
    fileType: string;
    fileName: string;
    customQuery?: string;
  }) => void;
  isLoading: boolean;
  autoStartCamera?: boolean;
  onBack?: () => void;
}

export default function ScanUpload({ onScanComplete, isLoading, autoStartCamera = false, onBack }: ScanUploadProps) {
  const { requestPermission } = useAndroidPermissions();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; size?: string; type?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Direct Live Camera States
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user" >("environment");
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraState, setCameraState] = useState<"inactive" | "loading" | "active" | "denied" | "blocked">("inactive");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const compressImage = (base64Str: string, callback: (compressed: string) => void) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const maxDim = 1024; // 1024px is high resolution enough for detail but incredibly lightweight
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        callback(compressedDataUrl);
      } else {
        callback(base64Str);
      }
    };
    img.onerror = () => {
      callback(base64Str);
    };
  };

  const sanitizeTextContent = (rawText: string): string => {
    const printableText = rawText.replace(/[^\x20-\x7E\t\n\r]/g, " ");
    const cleanStream = printableText.replace(/\s+/g, " ").trim();
    if (cleanStream.length > 20000) {
      return cleanStream.slice(0, 20000) + "\n... [Content Truncated for AI snappiness] ...";
    }
    return cleanStream;
  };

  const processFile = (file: File) => {
    setSelectedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB", type: file.type });
    
    const reader = new FileReader();
    if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const resultBytes = e.target?.result as string;
        compressImage(resultBytes, (compressedBytes) => {
          onScanComplete({
            fileContent: compressedBytes,
            fileType: "image/jpeg",
            fileName: file.name
          });
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      reader.onload = (e) => {
        const resultBytes = e.target?.result as string;
        onScanComplete({
          fileContent: resultBytes,
          fileType: "application/pdf",
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const resultText = e.target?.result as string;
        const cleanText = sanitizeTextContent(resultText);
        onScanComplete({
          fileContent: cleanText,
          fileType: file.type || "text/plain",
          fileName: file.name
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // ─── Direct Live Camera Access ───
  const startCamera = async () => {
    const isGranted = await requestPermission("camera");
    if (!isGranted) {
      setCameraState("inactive");
      setIsCameraActive(false);
      return;
    }

    setIsCameraActive(true);
    setCameraState("loading");
    setCameraError(null);

    // Stop existing stream if any
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState("blocked");
        return;
      }

      // Use exactly the required criteria
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      setCameraStream(stream);
      setCameraState("active");
    } catch (err: any) {
      console.warn("Direct Camera error:", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraState("denied");
      } else {
        setCameraState("blocked");
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCameraState("inactive");
    setCameraError(null);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Trigger camera automatically if autoStartCamera is active
  useEffect(() => {
    if (autoStartCamera) {
      startCamera();
    }
  }, [autoStartCamera]);

  // Re-start camera stream when facing mode changes
  useEffect(() => {
    if (isCameraActive && !cameraError) {
      startCamera();
    }
  }, [facingMode]);

  // Clean tracks when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const captureFrame = (dataUrl: string) => {
    setSelectedFile({ name: "Direct_Camera_Scan.jpg", size: "Live Frame capture" });
    onScanComplete({
      fileContent: dataUrl,
      fileType: "image/jpeg",
      fileName: "Direct_Camera_Scan.jpg",
    });
    stopCamera();
  };

  const handleUploadClick = async () => {
    const isGranted = await requestPermission("photos");
    if (isGranted) {
      fileInputRef.current?.click();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative w-full transition-all duration-300 ${dragActive ? "ring-4 ring-purple-600 rounded-3xl p-1 bg-purple-50/10" : ""}`}
    >
      {/* Hidden Fallback Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*,application/pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.doc,.docx"
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Hero Prompt Block */}
      <div className="text-center pt-2 pb-6">
        <h2 className="text-xl font-black text-slate-800 leading-tight tracking-tight">
          What do you want to{" "}
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            learn today?
          </span>
        </h2>
        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
          Upload notes, open live camera to scan textbook pages, or circle anything to get instant AI explanations.
        </p>
      </div>

      {/* Core Dual Card Grid for quick triggers */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Card 1: Upload Notes */}
        <button
          onClick={handleUploadClick}
          disabled={isLoading}
          className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-purple-50/20 border border-slate-100 hover:border-purple-300/60 transition-all text-center select-none cursor-pointer active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-200 shrink-0">
            <Paperclip className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xs text-slate-800">Upload Notes</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              PDF, image, or snapshot
            </div>
          </div>
        </button>

        {/* Card 2: Open Camera (Interactive Live userMedia overlay) */}
        <button
          onClick={startCamera}
          disabled={isLoading}
          className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-50/50 hover:bg-emerald-50/10 border border-slate-100 hover:border-emerald-300/50 transition-all text-center select-none cursor-pointer active:scale-[0.98]"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-xs text-slate-800">Open Camera</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              Scan textbooks directly
            </div>
          </div>
        </button>
      </div>

      {/* Drag & Drop Overlay or Subtle Indicator */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-slate-200 hover:border-purple-300 rounded-2xl p-3.5 bg-slate-50/20 flex items-center justify-center gap-2 text-center text-[10.5px] text-slate-500 transition-colors cursor-pointer select-none"
      >
        <Upload className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
        <span>
          Drop files here, or <strong className="text-purple-600 underline">browse device</strong>
        </span>
      </div>

      {selectedFile && (
        <div className="mt-3.5 p-2.5 bg-purple-50 rounded-xl border border-purple-100 text-[10px] font-black text-purple-900 flex items-center justify-center gap-1.5 animate-pulse">
          <Zap className="w-3.5 h-3.5 fill-purple-400 text-purple-600" />
          <span>STUDY LENS READY: {selectedFile.name} {selectedFile.size ? `(${selectedFile.size})` : ""}</span>
        </div>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full mt-4 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-705 text-slate-700 text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home Dashboard</span>
        </button>
      )}

      {/* ─── LIVE STREAM CAMERA OVERLAY MODAL ─── */}
      <CameraScannerModal
        isOpen={isCameraActive}
        cameraState={cameraState}
        stream={cameraStream}
        onCapture={captureFrame}
        onCancel={stopCamera}
        onUploadInstead={() => {
          stopCamera();
          fileInputRef.current?.click();
        }}
        onRetry={startCamera}
      />
    </motion.div>
  );
}
