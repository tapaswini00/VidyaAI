import React, { useRef, useEffect } from "react";
import { Camera, X, AlertTriangle, Upload, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface CameraScannerModalProps {
  isOpen: boolean;
  cameraState: "inactive" | "loading" | "active" | "denied" | "blocked";
  stream: MediaStream | null;
  onCapture: (base64Data: string) => void;
  onCancel: () => void;
  onUploadInstead: () => void;
  onRetry?: () => void;
}

export default function CameraScannerModal({
  isOpen,
  cameraState,
  stream,
  onCapture,
  onCancel,
  onUploadInstead,
  onRetry
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream && cameraState === "active") {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn("Video play stream failed:", err);
      });
    }
  }, [stream, cameraState]);

  if (!isOpen) return null;

  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1024;
      canvas.height = video.videoHeight || 768;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-[75vh]"
      >
        {/* Camera Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {cameraState === "active" && (
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            )}
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              {cameraState === "active" ? "VIDYA Study Lens Active" : "Camera Initializer"}
            </span>
          </div>
          <button
            id="scanner-close-btn"
            onClick={onCancel}
            className="p-1.5 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>

        {/* Viewport Box */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {cameraState === "loading" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-slate-300 gap-3">
              <div className="animate-spin text-purple-500 uppercase font-black text-[9px] tracking-widest bg-purple-950/40 px-3 py-1.5 rounded-full border border-purple-800/50 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> Retrieving Camera Authorization...
              </div>
            </div>
          )}

          {cameraState === "denied" && (
            <div className="p-6 text-center z-10 space-y-4 max-w-sm">
              <div className="inline-flex p-3 bg-rose-950/40 text-rose-450 border border-rose-800/40 rounded-full">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Permission Request Denied</h4>
              <p className="text-xs text-rose-300 font-bold leading-relaxed">
                Camera access is required to scan textbook pages.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {cameraState === "blocked" && (
            <div className="p-6 text-center z-10 space-y-4 max-w-sm">
              <div className="inline-flex p-3 bg-amber-950/40 text-amber-400 border border-amber-800/40 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Camera Interface Not Available</h4>
              <p className="text-xs text-amber-300 font-bold leading-relaxed">
                Camera may not work in preview. Please open the published app or upload an image instead.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                >
                  Try Again
                </button>
              )}
            </div>
          )}

          {cameraState === "active" && (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover"
              />
              {/* Overlay target scanning outline */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                <div className="w-full h-full max-w-[280px] max-h-[360px] border-2 border-dashed border-emerald-400/65 rounded-3xl relative">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-scan-loop rounded-full" />
                </div>
              </div>
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-[10px] text-slate-400 font-black tracking-wide text-center uppercase">
                Focus on text, formulas, or diagrams
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 shrink-0">
          <button
            id="scanner-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl cursor-pointer active:scale-95 transition-all text-xs font-black"
          >
            Cancel
          </button>

          {cameraState === "active" && (
            <button
              id="scanner-capture-btn"
              type="button"
              onClick={handleCapture}
              className="w-16 h-16 rounded-full border-4 border-slate-800 bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-all shadow-lg text-xs"
              title="Capture Image"
            >
              <Camera className="w-6 h-6 stroke-[2.5]" />
            </button>
          )}

          <button
            id="scanner-upload-btn"
            type="button"
            onClick={onUploadInstead}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl cursor-pointer active:scale-95 transition-all text-xs font-black flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" /> Upload Instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}
