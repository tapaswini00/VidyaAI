import React, { createContext, useContext, useState, useEffect } from "react";
import { Camera, Mic, Image, Settings, AlertTriangle, X, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type PermissionType = "camera" | "microphone" | "photos";
export type PermissionState = "prompt" | "granted" | "denied" | "permanently_denied";

interface AndroidPermissionContextType {
  permissions: Record<PermissionType, PermissionState>;
  requestPermission: (type: PermissionType) => Promise<boolean>;
  resetPermission: (type: PermissionType) => void;
}

const AndroidPermissionContext = createContext<AndroidPermissionContextType | undefined>(undefined);

export function useAndroidPermissions() {
  const context = useContext(AndroidPermissionContext);
  if (!context) {
    throw new Error("useAndroidPermissions must be used within an AndroidPermissionProvider");
  }
  return context;
}

export const AndroidPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Track state in state and persist to localStorage
  const [permissions, setPermissions] = useState<Record<PermissionType, PermissionState>>(() => {
    const saved = localStorage.getItem("android_permissions");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      camera: "prompt",
      microphone: "prompt",
      photos: "prompt",
    };
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem("android_permissions", JSON.stringify(permissions));
  }, [permissions]);

  // Modal display states
  const [activeModal, setActiveModal] = useState<{
    type: PermissionType;
    modalType: "explain" | "denied_reason" | "permanently_denied";
    resolve: (granted: boolean) => void;
  } | null>(null);

  // Helper to query browser status if possible
  const checkBrowserPermission = async (type: PermissionType): Promise<PermissionState> => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      return permissions[type];
    }

    try {
      let queryName: PermissionName | null = null;
      if (type === "camera") queryName = "camera" as PermissionName;
      if (type === "microphone") queryName = "microphone" as PermissionName;

      if (queryName) {
        const status = await navigator.permissions.query({ name: queryName });
        if (status.state === "granted") return "granted";
        if (status.state === "denied") {
          // If we have previously marked it as permanently_denied, keep that
          return permissions[type] === "permanently_denied" ? "permanently_denied" : "denied";
        }
      }
    } catch (e) {
      // Browser might not support querying camera/mic directly
    }
    return permissions[type];
  };

  // Sync state with browser permissions on mount
  useEffect(() => {
    const sync = async () => {
      const cameraState = await checkBrowserPermission("camera");
      const micState = await checkBrowserPermission("microphone");
      setPermissions((prev) => ({
        ...prev,
        camera: cameraState,
        microphone: micState,
      }));
    };
    sync();
  }, []);

  // Update permission status
  const updatePermissionState = (type: PermissionType, state: PermissionState) => {
    setPermissions((prev) => ({
      ...prev,
      [type]: state,
    }));
  };

  const resetPermission = (type: PermissionType) => {
    updatePermissionState(type, "prompt");
  };

  // Direct prompt for camera or microphone
  const triggerNativeRequest = async (type: PermissionType): Promise<boolean> => {
    const startTime = Date.now();
    try {
      if (type === "camera") {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        updatePermissionState("camera", "granted");
        return true;
      } else if (type === "microphone") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        updatePermissionState("microphone", "granted");
        return true;
      } else {
        // Photos / gallery is simulated in web sandbox but we track it
        updatePermissionState("photos", "granted");
        return true;
      }
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.warn(`Permission request for ${type} failed after ${duration}ms:`, err);

      // Detect "Don't Ask Again" / instant rejection
      // If the duration is extremely short (e.g. < 150ms), the system blocked it instantly
      const isInstantBlock = duration < 150 || err?.name === "NotAllowedError" && permissions[type] === "denied";
      
      if (isInstantBlock) {
        updatePermissionState(type, "permanently_denied");
        return false;
      } else {
        updatePermissionState(type, "denied");
        return false;
      }
    }
  };

  // Central promise-based permission solicitor
  const requestPermission = (type: PermissionType): Promise<boolean> => {
    return new Promise(async (resolve) => {
      const current = await checkBrowserPermission(type);

      // 1. If already granted, proceed immediately
      if (current === "granted") {
        resolve(true);
        return;
      }

      // 2. If permanently denied, show the settings redirect modal
      if (current === "permanently_denied") {
        setActiveModal({
          type,
          modalType: "permanently_denied",
          resolve,
        });
        return;
      }

      // 3. Otherwise, show the pre-request explanatory dialog (Clear Explanation before requesting)
      setActiveModal({
        type,
        modalType: "explain",
        resolve,
      });
    });
  };

  // Triggers redirect to App Settings on Android devices
  const handleOpenSettings = () => {
    // Attempt standard Android Settings Intent
    try {
      window.location.href = "intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:com.vidya.ai;end";
    } catch (e) {
      console.warn("Settings intent redirect failed:", e);
    }
    
    // Also try secondary webview intents / backup protocols
    setTimeout(() => {
      try {
        window.open("app-settings://", "_blank");
      } catch {
        // Safe fallback
      }
    }, 300);
  };

  // Handlers for active modal buttons
  const handleExplainAllow = async () => {
    if (!activeModal) return;
    const { type, resolve } = activeModal;
    
    // Trigger real browser/device request
    const isGranted = await triggerNativeRequest(type);
    
    if (isGranted) {
      setActiveModal(null);
      resolve(true);
    } else {
      // Transition to denied reason modal to explain why it was needed
      setActiveModal({
        type,
        modalType: "denied_reason",
        resolve,
      });
    }
  };

  const handleExplainDeny = () => {
    if (!activeModal) return;
    const { type, resolve } = activeModal;
    updatePermissionState(type, "denied");
    
    // Transition directly to explain why it is needed
    setActiveModal({
      type,
      modalType: "denied_reason",
      resolve,
    });
  };

  const handleDeniedReasonClose = () => {
    if (!activeModal) return;
    const { resolve } = activeModal;
    setActiveModal(null);
    resolve(false);
  };

  const handlePermanentlyDeniedCancel = () => {
    if (!activeModal) return;
    const { resolve } = activeModal;
    setActiveModal(null);
    resolve(false);
  };

  // Get details for the modals based on permission type
  const getPermissionDetails = (type: PermissionType) => {
    switch (type) {
      case "camera":
        return {
          title: "Camera Access Required",
          icon: <Camera className="w-8 h-8 text-emerald-600" />,
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-100",
          accentColor: "text-emerald-700",
          btnColor: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
          explanation: "VIDYA requires camera access to snap textbook pages, scan printed learning materials, and capture notes so that the AI can instantly parse diagrams, explain math steps, and launch interactive 3D models.",
          deniedMessage: "Without camera access, you won't be able to scan textbook chapters directly. To learn, you will need to upload a saved document or type your questions manually.",
        };
      case "microphone":
        return {
          title: "Microphone Access Required",
          icon: <Mic className="w-8 h-8 text-purple-600" />,
          bgColor: "bg-purple-50",
          borderColor: "border-purple-100",
          accentColor: "text-purple-700",
          btnColor: "bg-purple-600 hover:bg-purple-700 shadow-purple-100",
          explanation: "VIDYA uses your microphone for real-time interactive dictation, verbal question submittals, and spoken 'teach-back' evaluations so you can practice reciting concepts out loud directly to the AI tutor.",
          deniedMessage: "Without microphone access, verbal learning simulations and active recitation practice will be unavailable. You can still participate in full text chat sessions.",
        };
      case "photos":
        return {
          title: "Photos & Gallery Permission",
          icon: <Image className="w-8 h-8 text-indigo-600" />,
          bgColor: "bg-indigo-50",
          borderColor: "border-indigo-100",
          accentColor: "text-indigo-700",
          btnColor: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
          explanation: "To upload images of diagrams or select scanned study logs directly from your phone library. On Android 13+, this uses safe media selective access to import textbook snapshots securely.",
          deniedMessage: "Without gallery access, you cannot upload visual homework assignments or textbook photos. Only manual text entry will be active.",
        };
    }
  };

  const modalDetails = activeModal ? getPermissionDetails(activeModal.type) : null;

  return (
    <AndroidPermissionContext.Provider value={{ permissions, requestPermission, resetPermission }}>
      {children}

      {/* ─── SYSTEM-WIDE ANDROID RUNTIME PERMISSION MODAL OVERLAYS ─── */}
      <AnimatePresence>
        {activeModal && modalDetails && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden"
            >
              {/* Modal Body */}
              <div className="p-6">
                {/* Visual Icon Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3.5 rounded-2xl ${modalDetails.bgColor} border ${modalDetails.borderColor} shrink-0`}>
                    {modalDetails.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 leading-tight">
                      {modalDetails.title}
                    </h3>
                    <p className="text-[10px] text-slate-450 text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">
                      Android Device Permissions
                    </p>
                  </div>
                </div>

                {/* Content Renderers */}
                {activeModal.modalType === "explain" && (
                  <div>
                    <p className="text-xs text-slate-650 leading-relaxed text-slate-600 font-semibold mb-5">
                      {modalDetails.explanation}
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-100/80 rounded-xl flex gap-2.5 items-start">
                      <div className="p-1 rounded-lg bg-white shadow-sm text-slate-600 font-bold text-xs">💡</div>
                      <p className="text-[10px] leading-relaxed text-slate-500">
                        Permissions are requested strictly as needed. You can change this selection at any time in Android settings.
                      </p>
                    </div>
                  </div>
                )}

                {activeModal.modalType === "denied_reason" && (
                  <div>
                    <div className="p-3.5 bg-rose-50/50 border border-rose-100/50 rounded-xl mb-4 flex gap-2.5 items-start">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wide">Permission Denied</div>
                        <p className="text-[10px] text-rose-650 text-rose-700 leading-relaxed font-semibold mt-0.5">
                          {modalDetails.deniedMessage}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      If you'd like to unlock this feature, click <strong className="text-slate-700">Try Again</strong> below to request access, or use typing modes instead.
                    </p>
                  </div>
                )}

                {activeModal.modalType === "permanently_denied" && (
                  <div>
                    <div className="p-3.5 bg-amber-50/50 border border-amber-100/60 rounded-xl mb-4 flex gap-2.5 items-start">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[11px] font-extrabold text-amber-850 text-amber-800 uppercase tracking-wide">Permission Permanently Denied</div>
                        <p className="text-[10px] text-amber-700 leading-relaxed font-semibold mt-0.5">
                          You chose <span className="font-bold">"Don't Ask Again"</span>. We need you to manually enable it in your phone settings to activate this tool.
                        </p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wide mb-2">Enable Guide:</div>
                      <ol className="text-[11px] text-slate-500 space-y-1.5 pl-4 list-decimal leading-relaxed">
                        <li>Tap <strong className="text-indigo-600">Open Settings</strong> below.</li>
                        <li>Go to <strong className="text-slate-700">Permissions</strong>.</li>
                        <li>Select <strong className="text-slate-700">Allow</strong> for the required accessory.</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2.5 justify-end">
                {activeModal.modalType === "explain" && (
                  <>
                    <button
                      type="button"
                      onClick={handleExplainDeny}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors active:scale-95"
                    >
                      Deny
                    </button>
                    <button
                      type="button"
                      onClick={handleExplainAllow}
                      className={`px-5 py-2 text-xs font-black text-white rounded-xl cursor-pointer ${modalDetails.btnColor} shadow-md transition-all active:scale-95 flex items-center gap-1.5`}
                    >
                      <span>Allow Access</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {activeModal.modalType === "denied_reason" && (
                  <>
                    <button
                      type="button"
                      onClick={handleDeniedReasonClose}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors active:scale-95"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleExplainAllow}
                      className={`px-5 py-2 text-xs font-black text-white rounded-xl cursor-pointer ${modalDetails.btnColor} shadow-md transition-all active:scale-95`}
                    >
                      Try Again
                    </button>
                  </>
                )}

                {activeModal.modalType === "permanently_denied" && (
                  <>
                    <button
                      type="button"
                      onClick={handlePermanentlyDeniedCancel}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenSettings();
                        handlePermanentlyDeniedCancel();
                      }}
                      className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Open Settings</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AndroidPermissionContext.Provider>
  );
};
