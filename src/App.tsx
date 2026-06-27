import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile, SavedContent, AIContentResponse, ProgressHistory, MCQ, ModelPart, ChatMessage, ChatSession } from "./types";
import { INTERACTIVE_MODELS, getModelById, detectModelSuggestion, getDefaultModelContent } from "./data/modelsData";
import ThreeDViewer from "./components/ThreeDViewer";
import CircleToAsk from "./components/CircleToAsk";
import ScienceSimulationPlayer from "./components/ScienceSimulationPlayer";
import QuizMode from "./components/QuizMode";
import VoiceTutor from "./components/VoiceTutor";
import VoiceMode from "./components/VoiceMode";
import AppSettings from "./components/AppSettings";
import OnboardingWizard from "./components/OnboardingWizard";
import STEMChatbot from "./components/STEMChatbot";
import ScanUpload from "./components/ScanUpload";
import HomeDashboard from "./components/Home";
import StudyTimetable from "./components/StudyTimetable";
import { CareerProgressPage } from "./components/CareerProgressPage";
import Quiz from "./components/Quiz";
import UserNotRegisteredError from "./components/UserNotRegisteredError";
import AuthLayout from "./components/AuthLayout";
import MarkdownRenderer from "./components/MarkdownRenderer";
import { loginWithGoogle, logoutUser, isFirebaseConfigured, firebaseConfig, auth } from "./firebase";
import { useTranslation, useLanguage } from "./lib/LanguageContext";
import { exportVaultItemToPDF } from "./utils/pdfExport";

import {
  saveUserProfile,
  fetchUserProfile,
  saveVaultItem,
  fetchVaultItems,
  deleteVaultItem,
  saveHistoryItem,
  fetchHistoryItems,
  clearUserLearningData,
  saveChatSession,
  fetchChatSessions,
  deleteChatSession
} from "./db";
import {
  Sparkles,
  BookOpen,
  Camera,
  Layers,
  Award,
  Zap,
  Lock,
  Mail,
  User,
  LogOut,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  History,
  HelpCircle,
  Home,
  Calendar,
  Bookmark,
  Compass,
  FileText,
  FileDown,
  BookmarkCheck,
  Search,
  ExternalLink,
  Upload,
  ArrowRight,
  ArrowLeft,
  X,
  Medal
} from "lucide-react";

const RenderLocalUploadSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-left animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
        <div className="w-5 h-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
      </div>
      <div className="space-y-1.5 flex-1">
        <div className="h-3 bg-slate-200 rounded-full w-2/5"></div>
        <div className="h-2 bg-slate-100 rounded-full w-3/5"></div>
      </div>
    </div>
    
    <div className="space-y-3.5 pt-4 border-t border-slate-105 border-slate-100">
      <div className="h-3.5 bg-slate-200 rounded-full w-full"></div>
      <div className="h-3.5 bg-slate-100 rounded-full w-[94%]"></div>
      <div className="h-3.5 bg-slate-100 rounded-full w-[88%]"></div>
      <div className="h-3.5 bg-slate-200 rounded-full w-[60%]"></div>
    </div>
    
    <div className="pt-4 border-t border-slate-100 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 bg-slate-50 rounded-xl"></div>
        <div className="h-10 bg-slate-50 rounded-xl"></div>
      </div>
    </div>
  </div>
);

const RenderDocumentViewer = ({ file }: { file: { fileName: string; fileType: string; fileContent: string } }) => {
  const isImage = file.fileType.startsWith("image/") || file.fileContent.startsWith("data:image/");
  
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-lg">
            {isImage ? "🖼️" : "📄"}
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-800 leading-none">{file.fileName}</h3>
            <span className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 block">
              {file.fileType || "Document Resource"}
            </span>
          </div>
        </div>
        <span className="text-[9px] font-black tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase">
          Uploaded Active File
        </span>
      </div>

      {isImage ? (
        <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100/50 flex items-center justify-center">
          <img 
            src={file.fileContent} 
            alt={file.fileName} 
            className="max-h-56 object-contain rounded-xl" 
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4 max-h-56 overflow-y-auto font-sans text-xs text-slate-700 leading-relaxed shadow-inner">
          <p className="whitespace-pre-wrap">{file.fileContent || "Parsing text content..."}</p>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useTranslation();
  const { setLanguage } = useLanguage();

  // ─── AUTHENTICATION STATE ───
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsAuthInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser?.appLanguage) {
      setLanguage(currentUser.appLanguage);
    }
  }, [currentUser?.appLanguage, setLanguage]);
  const [authEmail, setAuthEmail] = useState<string>("student@vidyaai.edu");
  const [authPassword, setAuthPassword] = useState<string>("Class 10");
  const [authName, setAuthName] = useState<string>("Jane Doe");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [isNotRegistered, setIsNotRegistered] = useState<boolean>(false);
  const [isPopupBlockedError, setIsPopupBlockedError] = useState<boolean>(false);
  const [isConfigurationNotFoundError, setIsConfigurationNotFoundError] = useState<boolean>(false);

  // ─── STARTUP SPLASH INTRO LOGO STATE ───
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashStep, setSplashStep] = useState<"pop" | "text" | "rotate-out" | "exit">("pop");

  useEffect(() => {
    // Stage 1: "pop" is active initially.
    
    // Stage 2: Text "VIDYA.AI" fades up after 800ms
    const textTimer = setTimeout(() => {
      setSplashStep("text");
    }, 850);

    // Stage 3: Rotation and fadeout begins at 2000ms
    const rotateTimer = setTimeout(() => {
      setSplashStep("rotate-out");
    }, 2050);

    // Stage 4: Exit fade out completes to show app interface
    const exitTimer = setTimeout(() => {
      setSplashStep("exit");
    }, 2800);

    const finishTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3150);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(rotateTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  // ─── CORE LEARNING SYSTEM STATE ───
  const [activeTab, setActiveTab] = useState<"home" | "scan" | "saved" | "profile" | "voice" | "timetable">("home");
  const [isDirectChatActive, setIsDirectChatActive] = useState<boolean>(false);
  const [showCareerPage, setShowCareerPage] = useState<boolean>(false);
  const [autoStartCameraOnScan, setAutoStartCameraOnScan] = useState<boolean>(false);
  const [scannedSubTab, setScannedSubTab] = useState<"lab" | "notes" | "quiz">("lab");
  const [currentModelId, setCurrentModelId] = useState<string>("human-heart"); 
  const [scannedResult, setScannedResult] = useState<AIContentResponse | null>(null);
  const [circleActionAnswer, setCircleActionAnswer] = useState<{ selected: string; result: string } | null>(null);
  
  // Tab-specific uploaded files and local loading indicators
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileContent: string;
    fileType: string;
  } | null>(null);
  const [isScanProcessing, setIsScanProcessing] = useState<boolean>(false);
  
  // ─── GLOBAL CIRCLE & ASK STATE ───
  const [isGlobalOverlayOpen, setIsGlobalOverlayOpen] = useState<boolean>(false);
  const [overlayChapterId, setOverlayChapterId] = useState<string>("human-heart");
  const [globalCircleActionAnswer, setGlobalCircleActionAnswer] = useState<{ selected: string; result: string } | null>(null);
  
  // Tab controllers within landing
  const [learningHistory, setLearningHistory] = useState<ProgressHistory[]>([]);
  const [savedVaultItems, setSavedVaultItems] = useState<SavedContent[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [vaultSearchQuery, setVaultSearchQuery] = useState("");
  const [vaultCategory, setVaultCategory] = useState<string>("all");
  const [selectedVaultItem, setSelectedVaultItem] = useState<SavedContent | null>(null);
  
  // Active learning modes
  const [isScanningActive, setIsScanningActive] = useState<boolean>(false);
  const [isQuizMode, setIsQuizMode] = useState<boolean>(false);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<{ show: boolean; oldLevel: number; newLevel: number; expGained: number } | null>(null);

  // ─── LOAD CHAT HISTORY ON LOGIN OR GUEST INITIALIZATION ───
  useEffect(() => {
    if (isAuthInitializing) return;

    if (currentUser) {
      const loadChats = async () => {
        try {
          const chats = await fetchChatSessions(currentUser.email || "demo-student");
          setChatSessions(chats);
        } catch (e) {
          console.error("Failed to load active user chat sessions:", e);
        }
      };
      loadChats();
    } else {
      setChatSessions([]);
      setActiveChatSessionId(null);
    }
  }, [currentUser, isAuthInitializing]);

  // ─── INITIALIZE DARK MODE ───
  useEffect(() => {
    // By default the app should be in day mode (light mode).
    // Users can only toggle or use dark mode after creating/logging in to an account.
    if (currentUser) {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [currentUser]);

  // ─── SYNCHRONIZE WITH SERVER BACKEND ───
  const syncWithServer = async (updatedProfile?: Partial<UserProfile>, currentVault?: SavedContent[], currentHistory?: ProgressHistory[]) => {
    const token = localStorage.getItem("vidya_jwt_token");
    if (!token) return;

    try {
      const payload: any = {};
      if (updatedProfile) payload.profile = updatedProfile;
      if (currentVault) payload.vault = currentVault;
      if (currentHistory) payload.history = currentHistory;

      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        console.log("Synchronized session parameters with JWT Auth Server.");
      }
    } catch (e) {
      console.warn("Backing up session state locally. Sync deferred.", e);
    }
  };

  // ─── JWT AUTHENTICATION INITIALIZATION ───
  useEffect(() => {
    const initTokenAuth = async () => {
      const token = localStorage.getItem("vidya_jwt_token");
      if (!token) {
        // Fallback to local storage if user was already in system without a JWT
        const storedUserJson = localStorage.getItem("vidya_active_user");
        if (storedUserJson) {
          try {
            const localUser = JSON.parse(storedUserJson);
            setCurrentUser(localUser);
          } catch (e) {}
        }
        setApiLoading(false);
        return;
      }

      setApiLoading(true);
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const authData = await response.json();
          if (authData.profile) {
            setCurrentUser(authData.profile);
            setSavedVaultItems(authData.vault || []);
            setLearningHistory(authData.history || []);
            localStorage.setItem("vidya_active_user", JSON.stringify(authData.profile));
            setSyncStatus("Active study session synchronized with JWT Server!");
            setTimeout(() => setSyncStatus(null), 3000);
          }
        } else {
          // Token is likely expired or invalid; reset gracefully
          localStorage.removeItem("vidya_jwt_token");
          localStorage.removeItem("vidya_active_user");
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("JWT Session validation error:", err);
        // Fallback to local cache so user can work offline
        const storedUserJson = localStorage.getItem("vidya_active_user");
        if (storedUserJson) {
          try {
            setCurrentUser(JSON.parse(storedUserJson));
          } catch (e) {}
        }
      } finally {
        setApiLoading(false);
      }
    };
    initTokenAuth();
  }, []);

  // Update progress points and EXP gains with gamified levelling
  const earnExperiencePoints = async (expAmount: number, detailsMsg: string, topicName: string, actionKey: ProgressHistory["actionType"]) => {
    if (!currentUser) return;
    
    // Incremental exp tallying
    let nextExp = currentUser.exp + expAmount;
    let nextLevel = currentUser.level;
    let leveledUp = false;
    
    while (nextExp >= nextLevel * 500) {
      nextExp = nextExp - (nextLevel * 500);
      nextLevel += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      setLevelUpInfo({
        show: true,
        oldLevel: currentUser.level,
        newLevel: nextLevel,
        expGained: expAmount
      });
    }

    const updatedProfile: UserProfile = {
      ...currentUser,
      exp: nextExp,
      level: nextLevel,
      streak: currentUser.streak + (currentUser.lastActive ? 0 : 1),
      lastActive: new Date().toISOString()
    };

    setCurrentUser(updatedProfile);
    localStorage.setItem("vidya_active_user", JSON.stringify(updatedProfile));

    const pathReg: ProgressHistory = {
      id: "hist-" + Math.random().toString(36).substring(3),
      timestamp: new Date().toISOString(),
      topic: topicName || "General Topic",
      actionType: actionKey,
      details: detailsMsg,
      expGained: expAmount
    };

    const nextHistory = [pathReg, ...learningHistory];
    setLearningHistory(nextHistory);

    // Persist and Sync
    await saveUserProfile(currentUser.email, updatedProfile);
    await saveHistoryItem(currentUser.email, pathReg);
    await syncWithServer(updatedProfile, undefined, nextHistory);
  };

  // Auth processing
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const emailStr = authEmail.trim();
    if (!emailStr || !authPassword) {
      setAuthError("Please provide your login credentials.");
      return;
    }

    setApiLoading(true);
    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const bodyPayload = isRegistering 
        ? { email: emailStr, password: authPassword, name: authName.trim() || "New Student" }
        : { email: emailStr, password: authPassword };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Authentication failed. Please verify and try again.");
        return;
      }

      // Save token & stats
      localStorage.setItem("vidya_jwt_token", data.token);
      localStorage.setItem("vidya_active_user", JSON.stringify(data.profile));

      setCurrentUser(data.profile);
      setSavedVaultItems(data.vault || []);
      setLearningHistory(data.history || []);

      setSyncStatus(isRegistering ? "Welcome aboard! Student account created successfully." : "Welcome back! Study session loaded.");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      console.error("JWT login client failure:", err);
      setAuthError("Network server configuration is unreachable. Please verify connection is active.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleMascotGoogleAuth = async () => {
    if (!isFirebaseConfigured) {
      setAuthError("Login setup is incomplete. Please use Guest mode for now.");
      return;
    }

    setApiLoading(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    setIsPopupBlockedError(false);
    setIsConfigurationNotFoundError(false);
    try {
      // 1. Trigger the Firebase popup sign-in
      const result = await loginWithGoogle();
      const firebaseUser = result.user;

      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("Could not retrieve email address from the authenticated Google account.");
      }

      // 2. Synchronize user profile with secure JWT API Server
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          avatar: firebaseUser.photoURL || "🎓",
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Google sign-in failed. Please try again.");
        return;
      }

      // 3. Save session token and localized cached profile parameters
      localStorage.setItem("vidya_jwt_token", data.token);
      localStorage.setItem("vidya_active_user", JSON.stringify(data.profile));

      setCurrentUser(data.profile);
      setSavedVaultItems(data.vault || []);
      setLearningHistory(data.history || []);

      setSyncStatus(`Connected seamlessly as ${data.profile.name} via Gmail!`);
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      const isUnauthorized = err?.code === "auth/unauthorized-domain" || 
                             (err?.message && (err.message.includes("unauthorized-domain") || err.message.includes("auth/unauthorized-domain"))) ||
                             String(err).includes("unauthorized-domain");

      const isPopupBlocked = err?.code === "auth/popup-closed-by-user" || 
                             err?.code === "auth/cancelled-popup-request" ||
                             (err?.message && (err.message.includes("popup-closed") || err.message.includes("popup-closed-by-user"))) ||
                             String(err).includes("popup-closed") ||
                             String(err).includes("popup-closed-by-user");

      const isConfigNotFound = err?.code === "auth/configuration-not-found" ||
                               (err?.message && (err.message.includes("configuration-not-found") || err.message.includes("auth/configuration-not-found"))) ||
                               String(err).includes("configuration-not-found");
                             
      if (isPopupBlocked) {
        console.warn("Google Auth popup cancelled or blocked by browser settings.", err);
        setIsPopupBlockedError(true);
        setAuthError("Popup Closed / Blocked: Your browser blocked or closed the Google Sign-In popup selector window inside the sandboxed preview iframe.");
      } else if (isConfigNotFound) {
        console.warn("Google Auth configuration-not-found detected.", err);
        setIsConfigurationNotFoundError(true);
        setAuthError("Configuration Not Found: Google sign-in provider is not enabled in your Firebase Project.");
      } else {
        console.error("Firebase Google Auth login failure:", err);
        if (isUnauthorized) {
          setUnauthorizedDomain(window.location.hostname || "the-current-domain");
          setAuthError("Unauthorized Domain: This website's domain is not authorized in your Firebase Project.");
        } else {
          setAuthError(err?.message || "Google sign-in failed. Please try again.");
        }
      }
    } finally {
      setApiLoading(false);
    }
  };

  const handleBypassPopupLogin = async () => {
    setApiLoading(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    setIsPopupBlockedError(false);
    setIsConfigurationNotFoundError(false);

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student.explorer@vidyaai.edu",
          name: "Explorer Student",
          avatar: "🎓",
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Alternative bypass login failed.");
        return;
      }

      localStorage.setItem("vidya_jwt_token", data.token);
      localStorage.setItem("vidya_active_user", JSON.stringify(data.profile));

      setCurrentUser(data.profile);
      setSavedVaultItems(data.vault || []);
      setLearningHistory(data.history || []);

      setSyncStatus("Welcome aboard! Demo Student account activated on cloud database.");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err: any) {
      console.error("Bypass popup auth failure:", err);
      setAuthError("Demo account bypass was unreachable. Please continue as Guest!");
    } finally {
      setApiLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setApiLoading(true);
    setAuthError(null);
    setUnauthorizedDomain(null);
    try {
      const guestProfile: UserProfile = {
        email: "guest-student@vidyaai.local",
        name: "Guest Explorer",
        avatar: "🎓",
        classGrade: "Class 10",
        appLanguage: "English",
        tutorStyle: "Visual",
        favoriteSubjects: ["Biology", "Physics"],
        weeklyGoal: "3 hours",
        level: 1,
        exp: 0,
        streak: 1,
        lastActive: new Date().toISOString(),
        isOnboarded: true
      };
      localStorage.setItem("vidya_active_user", JSON.stringify(guestProfile));
      setCurrentUser(guestProfile);
      setSyncStatus("Welcome! You are exploring in Guest Mode.");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (err) {
      console.error("Guest login client failure:", err);
      setAuthError("Failed to start Guest mode. Please try again.");
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("vidya_active_user");
      localStorage.removeItem("vidya_jwt_token");
      setCurrentUser(null);
      setAuthEmail("student@vidyaai.edu");
      setAuthPassword("Class 10");
      setAuthName("Jane Doe");
      setAuthError(null);
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleResetProgress = async () => {
    if (!currentUser) return;
    setApiLoading(true);
    try {
      const resetProfile: UserProfile = {
        name: currentUser.name,
        email: currentUser.email,
        avatar: "🎓",
        level: 1,
        exp: 0,
        streak: 1,
        lastActive: new Date().toISOString(),
        isOnboarded: false
      };
      
      localStorage.setItem("vidya_active_user", JSON.stringify(resetProfile));
      setCurrentUser(resetProfile);
      setLearningHistory([]);
      setSavedVaultItems([]);
      
      // Save locally & sync with server
      await saveUserProfile(currentUser.email, resetProfile);
      await syncWithServer(resetProfile, [], []);

      setSyncStatus("Study progress has been completely re-initialized.");
      setTimeout(() => setSyncStatus(null), 3500);
    } catch (err: any) {
      console.error("Failed to reset progress:", err);
    } finally {
      setApiLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      ...updatedFields
    };
    setCurrentUser(updated);
    localStorage.setItem("vidya_active_user", JSON.stringify(updated));
    await saveUserProfile(currentUser.email, updated);
    await syncWithServer(updated);
  };

  // ─── AI SCAN TEXTBOOK SUBMISSION PIPELINE ───
  const processScanUpload = async (payload: {
    fileContent: string;
    fileType: string;
    fileName: string;
    customQuery?: string;
  }) => {
    setActiveTab("scan");
    setIsScanProcessing(true);
    setUploadedFile({
      fileName: payload.fileName,
      fileContent: payload.fileContent,
      fileType: payload.fileType
    });
    setScannedResult(null);
    setCircleActionAnswer(null);
    setIsQuizMode(false);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Parsing failed");
      }

      const parsed: AIContentResponse = await response.json();
      setScannedResult(parsed);
      setScannedSubTab("lab"); // reset sub-tab view

      // Auto-focus on recommended AR viewer model immediately!
      if (parsed.modelSuggestions && parsed.modelSuggestions.length > 0) {
        setCurrentModelId(parsed.modelSuggestions[0]);
      } else {
        // Logical detection fallback matching keywords
        const autoSuggests = detectModelSuggestion(parsed.topic + " " + parsed.summary);
        if (autoSuggests.length > 0) {
          setCurrentModelId(autoSuggests[0]);
        }
      }

      // Award XP for completing scientific textbook scans
      earnExperiencePoints(150, `Successfully parsed page: "${payload.fileName}"`, parsed.topic, "scan");

    } catch (err: any) {
      console.warn("Scanning failed, running local-first high-quality fallback preset matching:", err);
      
      // Fallback matching logic on filename, customQuery, or loaded keywords
      const searchText = ((payload.fileName || "") + " " + (payload.customQuery || "") + " " + (payload.fileContent || "")).toLowerCase();
      let matchedModelId = "human-heart"; // default
      
      if (searchText.includes("heart") || searchText.includes("circulat") || searchText.includes("cardio") || searchText.includes("blood") || searchText.includes("valves") || searchText.includes("aorta")) {
        matchedModelId = "human-heart";
      } else if (searchText.includes("solar") || searchText.includes("planet") || searchText.includes("sun") || searchText.includes("orbit") || searchText.includes("gravity") || searchText.includes("space") || searchText.includes("astronomy")) {
        matchedModelId = "solar-system";
      } else if (searchText.includes("volcano") || searchText.includes("lava") || searchText.includes("magma") || searchText.includes("geolog") || searchText.includes("eruption")) {
        matchedModelId = "volcano";
      } else if (searchText.includes("cell") || searchText.includes("organelle") || searchText.includes("mitochondria") || searchText.includes("eukaryot") || searchText.includes("nucleus")) {
        matchedModelId = "cell-structure";
      } else if (searchText.includes("dna") || searchText.includes("helix") || searchText.includes("gene") || searchText.includes("nucleotide") || searchText.includes("chromosom")) {
        matchedModelId = "dna";
      } else if (searchText.includes("brain") || searchText.includes("neuro") || searchText.includes("cerebr") || searchText.includes("lobe") || searchText.includes("neuron")) {
        matchedModelId = "brain";
      } else if (searchText.includes("circuit") || searchText.includes("electric") || searchText.includes("wire") || searchText.includes("resistor") || searchText.includes("voltage") || searchText.includes("current")) {
        matchedModelId = "electric-circuit";
      }

      const fallbackContent = getDefaultModelContent(matchedModelId);
      setScannedResult(fallbackContent);
      setCurrentModelId(matchedModelId);
      setScannedSubTab("lab"); // reset sub-tab view

      // Award matching experience points
      earnExperiencePoints(120, `Parsed textbook in offline comfort mode: "${payload.fileName || "Custom Notes"}"`, fallbackContent.topic, "scan");

      // Set sync status with nice message
      setSyncStatus(`Operating offline. Loaded premium fallback notes on: ${fallbackContent.topic}`);
      setTimeout(() => setSyncStatus(null), 4000);
    } finally {
      setIsScanProcessing(false);
    }
  };

  // ─── ROUTE-BASED SUBJECT LEARNING WORKSPACE AUTO-LOADER ───
  useEffect(() => {
    if (location.pathname === "/subject" || location.pathname.startsWith("/subject")) {
      const params = new URLSearchParams(location.search);
      const subId = params.get("id") || params.get("subject") || location.pathname.split("/").pop() || "computer";
      
      const allSubjects = [
        { id: "math", name: "Mathematics" },
        { id: "physics", name: "Physics" },
        { id: "chemistry", name: "Chemistry" },
        { id: "biology", name: "Biology" },
        { id: "history", name: "History" },
        { id: "geography", name: "Geography" },
        { id: "english", name: "English" },
        { id: "computer", name: "Computer Science" },
        { id: "economics", name: "Economics" },
        { id: "civics", name: "Civics" },
      ];
      
      const found = allSubjects.find(s => s.id === subId);
      const subjectName = found ? found.name : "Computer Science";
      
      // Load this subject directly in the learning workspace!
      if (!isScanProcessing && (!scannedResult || scannedResult.topic !== subjectName)) {
        processScanUpload({
          fileContent: `Welcome to the ${subjectName} Learning Workspace! Learn core definitions and concepts, and ask any questions you have.`,
          fileType: "text/plain",
          fileName: `${subjectName} Workspace`,
          customQuery: `Create a direct, comprehensive and fully functional study guide and overview specifically about ${subjectName} for interactive learning. Identify key concepts, 4 crucial takeaways, and suggest relevant 3D model IDs.`
        });
      }
    }
  }, [location.pathname, location.search, isScanProcessing, scannedResult]);

  // ─── CONTEXTUAL CIRCLE-TO-ASK PIPELINE ───
  const handleCircleChoice = async (selected: string, action: "explain" | "simplify" | "notes" | "quiz") => {
    setApiLoading(true);
    setCircleActionAnswer(null);

    try {
      const response = await fetch("/api/circle-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: selected,
          action: action,
          currentModelId: currentModelId,
        }),
      });

      if (!response.ok) throw new Error("Floating menu query failed");
      const parsed = await response.json();

      setCircleActionAnswer({
        selected: parsed.selectedText,
        result: parsed.result,
      });

      // Award XP for querying AI companion
      earnExperiencePoints(80, `Circled diagram coordinates: "${action.toUpperCase()}" target outline`, scannedResult?.topic || "Custom AR Review", "circle_query");

    } catch (err: any) {
      console.error(err);
      alert("Inquiry failed. Please ensure your request is related to general learning topics.");
    } finally {
      setApiLoading(false);
    }
  };

  // ─── GLOBAL CIRCLE-TO-ASK PIPELINE ───
  const handleGlobalCircleChoice = async (selected: string, action: "explain" | "simplify" | "notes" | "quiz") => {
    setApiLoading(true);
    setGlobalCircleActionAnswer(null);

    try {
      const response = await fetch("/api/circle-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: selected,
          action: action,
          currentModelId: overlayChapterId,
        }),
      });

      if (!response.ok) throw new Error("Floating menu query failed");
      const parsed = await response.json();

      setGlobalCircleActionAnswer({
        selected: parsed.selectedText,
        result: parsed.result,
      });

      const overlayContent = getDefaultModelContent(overlayChapterId);
      earnExperiencePoints(80, `Circled overlay diagram: "${action.toUpperCase()}" on global textbook`, overlayContent.topic || "Overlay science", "circle_query");

    } catch (err: any) {
      console.error(err);
      alert("Inquiry failed. Please verify connection and secret configuration settings.");
    } finally {
      setApiLoading(false);
    }
  };

  // 💬 direct ask about 3d parts handler
  const handleModelPartQuery = async (queryStr: string, tappedPart?: string) => {
    setApiLoading(true);
    setCircleActionAnswer(null);

    try {
      const response = await fetch("/api/circle-ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: queryStr,
          action: "explain",
          currentModelId: currentModelId,
          clickedPartName: tappedPart
        }),
      });

      if (!response.ok) throw new Error("Brain link error");
      const parsed = await response.json();

      setCircleActionAnswer({
        selected: tappedPart ? `${tappedPart}: ${queryStr}` : queryStr,
        result: parsed.result,
      });

      earnExperiencePoints(70, `Sought clarification about ${tappedPart || "model layer"}`, getModelById(currentModelId)?.name || "Interactive AR", "circle_query");
    } catch (err) {
      console.error(err);
    } finally {
      setApiLoading(false);
    }
  };

  // ─── CHAT HISTORY CORE OPERATIONS ───
  const handleAutoSaveChatSession = async (newMessages: ChatMessage[], pTopic?: string) => {
    if (!currentUser || newMessages.length === 0) return;
    const userId = currentUser.email || "demo-student";
    let sessId = activeChatSessionId;

    if (!sessId) {
      sessId = "chat-sess-" + Date.now();
      setActiveChatSessionId(sessId);
    }

    // Prevent redundant sync if it has same length
    const existing = chatSessions.find(s => s.id === sessId);
    if (existing && existing.messages.length === newMessages.length) {
      const lastExisting = existing.messages[existing.messages.length - 1];
      const lastNew = newMessages[newMessages.length - 1];
      if (lastExisting?.text === lastNew?.text) return;
    }

    // Title construction
    let chatTitle = "Study Session on " + (pTopic || scannedResult?.topic || "STEM Topics");
    const firstUserMsg = newMessages.find(m => m.role === "user" && !m.text.startsWith("[File Uploaded]"));
    if (firstUserMsg) {
      chatTitle = firstUserMsg.text.substring(0, 40) + (firstUserMsg.text.length > 40 ? "..." : "");
    }

    const lastMsg = newMessages[newMessages.length - 1];
    const preview = lastMsg ? (lastMsg.text.substring(0, 75) + (lastMsg.text.length > 75 ? "..." : "")) : "";

    const updatedSession: ChatSession = {
      id: sessId,
      title: existing?.title || chatTitle, // preserve rename
      timestamp: new Date().toISOString(),
      lastMessagePreview: preview,
      messages: newMessages
    };

    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessId);
      return [updatedSession, ...filtered];
    });

    await saveChatSession(userId, updatedSession);
  };

  const handleLoadChatSession = (session: ChatSession) => {
    setActiveChatSessionId(session.id);
    
    // Convert session info to AIContentResponse
    const restoredResult: AIContentResponse = {
      topic: session.title.replace("Study Session on ", ""),
      detectedSuccessfully: true,
      modelSuggestions: [],
      summary: "Restored previous automated tutoring conversation.",
      detailedExplanation: "Restored previous automated tutoring conversation.",
      keyPoints: [],
      suggestedQuizzes: [],
      chatHistory: session.messages
    };

    setScannedResult(restoredResult);
    setActiveTab("home");
  };

  const handleDeleteChatSession = async (sessionId: string) => {
    if (!currentUser) return;
    const userId = currentUser.email || "demo-student";

    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeChatSessionId === sessionId) {
      setActiveChatSessionId(null);
      setScannedResult(null);
    }
    await deleteChatSession(userId, sessionId);
  };

  const handleRenameChatSession = async (sessionId: string, newTitle: string) => {
    if (!currentUser) return;
    const userId = currentUser.email || "demo-student";

    let targetSession = chatSessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    const updated: ChatSession = {
      ...targetSession,
      title: newTitle,
      timestamp: new Date().toISOString()
    };

    setChatSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
    await saveChatSession(userId, updated);
  };

  // Offline Persistence Saving
  const handleOfflineSave = async () => {
    if (!scannedResult || !currentUser) return;
    const userId = currentUser.email || "demo-student";

    const savedAsset: SavedContent = {
      id: "saved-" + Date.now(),
      type: "concept",
      topic: scannedResult.topic,
      timestamp: new Date().toISOString(),
      summary: scannedResult.summary,
      detailedExplanation: scannedResult.detailedExplanation,
      keyPoints: scannedResult.keyPoints,
      modelId: currentModelId,
      quizQuestions: scannedResult.suggestedQuizzes
    };

    const nextSaved = [savedAsset, ...savedVaultItems];
    setSavedVaultItems(nextSaved);
    await saveVaultItem(userId, savedAsset);
    await syncWithServer(undefined, nextSaved);

    setSyncStatus("Topic saved successfully to local Offline Vault! Accessible without internet.");
    setTimeout(() => setSyncStatus(null), 3000);
    earnExperiencePoints(50, `Saved concepts for offline study`, scannedResult.topic, "explore_3d");
  };

  const handleSaveMessageOffline = async (messageText: string, topic: string, chatHistory?: ChatMessage[]) => {
    if (!currentUser) return;
    const userId = currentUser.email || "demo-student";

    const topicHeading = topic || "AI Lesson Notes";
    const savedAsset: SavedContent = {
      id: "saved-msg-" + Date.now(),
      type: "concept",
      topic: topicHeading,
      timestamp: new Date().toISOString(),
      summary: messageText.substring(0, 150) + "...",
      detailedExplanation: messageText,
      keyPoints: ["Self-directed revision notes", "Saved directly from chat conversation"],
      modelId: currentModelId,
      quizQuestions: [],
      chatHistory: chatHistory
    };

    // If we have chatHistory, check already saved by matching both detailed explanation and chat messages count so we can allow updates
    const isAlreadySaved = savedVaultItems.some(
      item => item.detailedExplanation === messageText && (!chatHistory || item.chatHistory?.length === chatHistory.length)
    );
    if (isAlreadySaved) {
      setSyncStatus(`This message is already pinned in your Offline Vault!`);
      setTimeout(() => setSyncStatus(null), 3500);
      return;
    }

    // Filter out previous save with exact same topic if updating so we do not have duplicates
    const filteredVault = savedVaultItems.filter(item => item.topic !== topicHeading);
    const nextSaved = [savedAsset, ...filteredVault];
    setSavedVaultItems(nextSaved);
    await saveVaultItem(userId, savedAsset);
    await syncWithServer(undefined, nextSaved);

    setSyncStatus("Lesson message successfully pinned to Offline Vault!");
    setTimeout(() => setSyncStatus(null), 3000);
    earnExperiencePoints(30, "Pinned tutoring insights for offline retrieval", topicHeading, "explore_3d");
  };

  const deleteSavedItem = async (id: string) => {
    if (!currentUser) return;
    const userId = currentUser.email || "demo-student";
    const nextSaved = savedVaultItems.filter(item => item.id !== id);
    setSavedVaultItems(nextSaved);
    await deleteVaultItem(userId, id);
    await syncWithServer(undefined, nextSaved);
  };

  const loadSavedIntoSession = (item: SavedContent) => {
    const loadedResult: AIContentResponse = {
      topic: item.topic,
      detectedSuccessfully: true,
      modelSuggestions: item.modelId ? [item.modelId] : [],
      summary: item.summary || "",
      detailedExplanation: item.detailedExplanation || "",
      keyPoints: item.keyPoints || [],
      suggestedQuizzes: item.quizQuestions || [],
      chatHistory: item.chatHistory
    };

    setScannedResult(loadedResult);
    if (item.modelId) {
      setCurrentModelId(item.modelId);
    }
    setCircleActionAnswer(null);
    setIsQuizMode(false);
    setActiveTab("scan");
  };

  // Progress Bar exp percentage calculator
  const expProgress = currentUser ? (currentUser.exp / (currentUser.level * 500)) * 100 : 0;

  // ─── STARTUP SPLASH INTRO SCREEN WITH ANIMATED LOGO ───
  if (showSplash) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: splashStep === "exit" ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center select-none overflow-hidden"
      >
        <div className="flex flex-col items-center justify-center text-center">
          {/* 🌟 Animated Logo Component */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: (splashStep === "rotate-out" || splashStep === "exit") ? 0.3 : 1,
              rotate: (splashStep === "rotate-out" || splashStep === "exit") ? 360 : 0,
              opacity: (splashStep === "rotate-out" || splashStep === "exit") ? 0 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 130,
              damping: 12,
              opacity: { duration: 0.6 }
            }}
            className="w-24 h-24 bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-700 rounded-3xl shadow-xl flex items-center justify-center border-4 border-slate-100"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>

          {/* ✍️ "VIDYA.AI" Fade Up Title */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{
              opacity: (splashStep === "text" || splashStep === "rotate-out") ? 1 : splashStep === "exit" ? 0 : 0,
              y: (splashStep === "text" || splashStep === "rotate-out") ? 0 : splashStep === "exit" ? -12 : 18,
            }}
            transition={{
              duration: 0.75,
              ease: "easeOut",
            }}
            className="mt-6"
          >
            <h1 className="text-3xl font-black tracking-[0.3em] text-slate-800 display-font uppercase">
              VIDYA.AI
            </h1>
            <p className="text-[10px] font-extrabold tracking-[0.18em] uppercase text-slate-400 mt-1">
              Your AI Study Companion
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ─── AUTHENTICATION SCREEN ───
  if (!currentUser) {
    return (
      <AuthLayout
        icon={Zap}
        title="VIDYA.AI"
        subtitle="Your AI Learning Companion"
        footer={
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Sign in to sync your learning progress across devices.
          </p>
        }
      >
        <div className="space-y-6 text-center">
          <p className="text-sm text-slate-600 leading-relaxed font-semibold">
            Learn from notes, images, documents, interactive visuals, 3D models and AR experiences.
          </p>

          {!isFirebaseConfigured ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-semibold leading-relaxed space-y-1 text-left">
              <p className="flex items-center gap-1.5 font-bold">
                ⚠️ Setup Required
              </p>
              <p className="text-slate-600 font-normal">
                Please add Firebase web config to enable Google Sign-In.
              </p>
            </div>
          ) : unauthorizedDomain ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 leading-relaxed text-left space-y-3 shadow-sm">
              <p className="flex items-center gap-1.5 font-bold text-rose-800 text-sm">
                <span>⚠️</span> Domain Not Authorized
              </p>
              <p className="text-slate-600 font-normal leading-relaxed">
                Google Sign-In failed because this web domain is not authorized in your Firebase Project configuration.
              </p>
              <div className="bg-white p-3 rounded-xl border border-rose-100 font-mono text-[11px] text-slate-700 break-all space-y-1">
                <p className="font-sans font-bold text-slate-400 uppercase tracking-wider text-[9px]">Active Domain to Authorize:</p>
                <input
                  type="text"
                  readOnly
                  value={unauthorizedDomain}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full select-all font-semibold bg-slate-50 p-1.5 rounded border border-slate-100 text-slate-800 focus:outline-none"
                />
                <p className="text-[9px] text-slate-400 font-sans italic mt-1">Hint: Click the box above to easily highlight/copy the domain!</p>
              </div>
              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <p className="font-bold text-slate-700 text-xs">How to authorize it:</p>
                <ol className="list-decimal pl-4 space-y-1 max-y-[150px] overflow-y-auto">
                  <li>Open the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold underline">Firebase Console</a></li>
                  <li>Click <span className="font-semibold text-slate-700">Authentication</span> &rarr; <span className="font-semibold text-slate-700">Settings</span> &rarr; <span className="font-semibold text-slate-700">Authorized Domains</span></li>
                  <li>Click <span className="font-semibold text-slate-700">Add Domain</span>, paste the domain copied above, and save.</li>
                </ol>
              </div>
            </div>
          ) : isConfigurationNotFoundError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl text-sm leading-relaxed text-left space-y-3.5 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 text-lg mt-0.5">⚠️</span>
                <div className="space-y-1">
                  <p className="font-bold text-amber-950 text-sm">
                    Google Sign-In Provider is Disabled
                  </p>
                  <p className="text-slate-600 font-medium text-xs">
                    Your Google Sign-In request failed because Google authentication has not been enabled in this Firebase project's console: <strong className="text-slate-800">"{firebaseConfig.projectId}"</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-600 text-[11px] bg-white/70 p-3 rounded-2xl border border-amber-100/50">
                <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wide">How to trigger google auth enablement:</p>
                <ol className="list-decimal pl-4 space-y-1.5 font-medium">
                  <li>Open the <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} target="_blank" rel="noopener noreferrer" className="text-purple-600 font-bold underline inline-flex items-center gap-0.5">Firebase Auth Web Console <ExternalLink className="w-2.5 h-2.5 inline" /></a></li>
                  <li>If prompted, verify that the active database project matches <strong className="text-slate-800">"{firebaseConfig.projectId}"</strong>.</li>
                  <li>Navigate to <span className="font-bold text-slate-700">Sign-in method</span> &rarr; Click <span className="font-bold text-slate-700">Add new provider</span>.</li>
                  <li>Select <span className="font-bold text-slate-700">Google</span>, toggle the <span className="font-bold text-slate-700">Enable</span> switch, select a project support email, and click <span className="font-bold text-slate-700">Save</span>.</li>
                </ol>
              </div>

              <div className="pt-2.5 border-t border-amber-150 border-amber-200/50 flex flex-col gap-2">
                <p className="text-[10px] font-black tracking-wider text-amber-950 uppercase mb-0.5">
                  Instant Access Workaround:
                </p>
                
                {/* Solution 1: One-click bypass */}
                <button
                  type="button"
                  onClick={handleBypassPopupLogin}
                  disabled={apiLoading}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>One-Click Cloud Sync Bypass (Access App Instantly)</span>
                </button>

                <p className="text-[9px] text-zinc-500 font-medium text-center italic mt-0.5">
                  Alternatively, use standard Email mode or "Continue as Guest" options below!
                </p>
              </div>
            </div>
          ) : isPopupBlockedError ? (
            <div className="p-4 bg-purple-50 border border-purple-250 rounded-3xl text-xs leading-relaxed text-left space-y-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="shrink-0 text-lg">💡</span>
                <div className="space-y-1">
                  <p className="font-bold text-purple-900 text-sm">
                    Google Sign-In Popup Blocked
                  </p>
                  <p className="text-slate-600 font-medium">
                    Because this app is running inside a sandboxed preview iframe, your browser blocked or immediately closed the Google Sign-In popup with error <code className="bg-purple-100/50 px-1 py-0.5 rounded text-[10px] font-mono text-purple-800 font-bold">auth/popup-closed-by-user</code>.
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-purple-200/50 flex flex-col gap-2">
                <p className="text-[10px] font-black tracking-wider text-purple-950 uppercase mb-1">
                  Select a solution to continue:
                </p>
                
                {/* Solution 1: Open App in New Tab */}
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open App in New Tab (Recommended)</span>
                </button>

                {/* Solution 2: One-click bypass */}
                <button
                  type="button"
                  onClick={handleBypassPopupLogin}
                  disabled={apiLoading}
                  className="w-full py-2.5 px-3 bg-zinc-800 hover:bg-zinc-950 text-white rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>One-Click Cloud Sync Bypass</span>
                </button>

                <p className="text-[9px] text-zinc-500 text-center italic mt-1">
                  Or use standard Email sign-in / Guest Mode options below!
                </p>
              </div>
            </div>
          ) : authError ? (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-semibold leading-relaxed text-left flex items-start gap-2">
              <span className="shrink-0 text-base mt-0.5">⚠️</span>
              <p>{authError}</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleMascotGoogleAuth}
            disabled={apiLoading}
            className="hidden"
          >
            <span>Continue with Google</span>
          </button>

          {!showEmailForm ? (
            <div className="space-y-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleMascotGoogleAuth}
                disabled={apiLoading}
                className="w-full py-4 px-6 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-sm font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
              >
                {apiLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.745-.078-1.313-.173-1.879H12.24z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={() => {
                  setShowEmailForm(true);
                  setAuthError(null);
                }}
                disabled={apiLoading}
                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
              >
                <Mail className="w-4 h-4 shrink-0 text-purple-200" />
                <span>Continue with Email</span>
              </button>

              {/* Guest Button */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={apiLoading}
                className="w-full py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-black tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
              >
                <User className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Continue as Guest</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  {isRegistering ? "Create Profile" : "Student Login"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setAuthError(null);
                  }}
                  className="text-xs font-black text-purple-600 hover:text-purple-700 uppercase"
                >
                  &larr; Back Options
                </button>
              </div>

              {isRegistering && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                   Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="student@school.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={apiLoading}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {apiLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isRegistering ? "Register Profile" : "Login Portal"}</span>
                )}
              </button>

              <div className="text-center mt-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError(null);
                  }}
                  className="text-[11px] text-purple-600 hover:text-purple-700 font-extrabold focus:outline-none hover:underline"
                >
                  {isRegistering 
                    ? "Already have a profile? Let's sign in" 
                    : "First time here? Sign up to sync your progress"}
                </button>
              </div>
            </form>
          )}
        </div>
      </AuthLayout>
    );
  }

  // ─── ONBOARDING WIZARD INTERCEPT ───
  if (currentUser && currentUser.isOnboarded !== true) {
    const handleOnboardingComplete = async (onboardingData: {
      avatar: string;
      classGrade: string;
      appLanguage: string;
      tutorStyle: string;
      favoriteSubjects: string[];
      weeklyGoal: string;
    }) => {
      if (!currentUser) return;
      const userId = currentUser.email || "demo-student";
      const updatedProfile: UserProfile = {
        ...currentUser,
        ...onboardingData,
        isOnboarded: true
      };
      setApiLoading(true);
      try {
        // 1. Immediately update local storage cache and application active user state
        localStorage.setItem("vidya_active_user", JSON.stringify(updatedProfile));
        setCurrentUser(updatedProfile);

        // 2. Persist in background to local/remote Firestore and JWT Auth server (non-blocking)
        saveUserProfile(userId, updatedProfile).catch((err) => {
          console.warn("Deferred Firestore onboarding update:", err);
        });
        syncWithServer(updatedProfile).catch((err) => {
          console.warn("Deferred JWT Server onboarding sync:", err);
        });

        setSyncStatus("Study Space Configured Successfully!");
        setTimeout(() => setSyncStatus(null), 3000);
      } catch (err) {
        console.error("Failed to save onboarded profile:", err);
      } finally {
        setApiLoading(false);
      }
    };

    return (
      <OnboardingWizard
        initialName={currentUser.name}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (showCareerPage && currentUser) {
    return (
      <CareerProgressPage
        currentUser={currentUser}
        onClose={() => setShowCareerPage(false)}
        learningHistoryCount={learningHistory.length}
        savedVaultCount={savedVaultItems.length}
      />
    );
  }

  const isChatActive = uploadedFile !== null || scannedResult !== null || isDirectChatActive;
  const isChatScreen = activeTab === "scan" || activeTab === "voice" || (activeTab === "home" && isChatActive) || location.pathname.startsWith("/subject");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center">
      
      {/* 🔮 MASTER APPLICATION HEADER */}
      {!isChatScreen && (
        <header className="w-full bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-30 shadow-sm flex justify-center">
          <div className="w-full max-w-lg flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-purple-600 text-white rounded-xl flex items-center justify-center text-lg font-black shadow-md shadow-purple-200">
                ⚡
              </div>
              <div>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block leading-none">VIDYA•AI</span>
                <span className="text-xs font-black text-slate-800">AR Learning Companion</span>
              </div>
            </div>

            {/* Gamified header metrics (Streak, EXP Level badges) */}
            <div className="flex items-center gap-2">
              
              {/* Streak count */}
              <div className="flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-600 px-2.5 py-1 rounded-full text-xs font-black">
                <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                <span>{currentUser.streak} DAYS</span>
              </div>

              {/* Level bubble */}
              <button 
                onClick={() => setShowCareerPage(true)}
                className="bg-purple-600 text-white px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm cursor-pointer hover:bg-purple-700 hover:scale-105 active:scale-95 transition-all text-left"
              >
                <Award className="w-3.5 h-3.5" />
                <span>LV {currentUser.level}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* 🔔 FLOATING ALERTS AND PROGRESS UPDATE CHALK */}
      {syncStatus && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-xs bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-3.5 text-white z-[9999] text-xs font-bold leading-normal text-center animate-bounce flex items-center gap-2 justify-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* 🧪 VIEWPORT PORTAL (TAB ROUTED) */}
      <main className={`w-full flex-grow flex flex-col min-h-0 ${
        isChatScreen
          ? "px-0 py-0 pb-0 h-screen max-w-lg bg-white relative border-x border-slate-100"
          : "px-4 py-6 pb-24 max-w-lg"
      }`}>
        
        {/* API Loader Spinner */}
        {apiLoading && (
          <div className="fixed inset-0 bg-white/90 [z-index:9999] flex flex-col items-center justify-center text-slate-800 pb-12 animate-fade-in">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mb-4"></div>
            <p className="text-sm font-black tracking-wide uppercase text-purple-600">Retrieving Quantum Explanation</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed text-center font-bold">
              VIDYA.AI is formatting summaries, crafting study revision points, and generating mcq checkpoints...
            </p>
          </div>
        )}

        {/* Router condition: If we are on path /quiz, display the new STEM Quiz portal. If on /subject, show direct subject learning workspace, otherwise normal active study tabs */}
        {location.pathname === "/quiz" ? (
          <Quiz onBackToHome={() => navigate("/")} />
        ) : (location.pathname === "/subject" || location.pathname.startsWith("/subject")) ? (
          <div className="flex flex-col h-full bg-white overflow-hidden relative rounded-none border-none shadow-none">
            <STEMChatbot
              topicName={scannedResult?.topic || "General Topics"}
              currentModelId={currentModelId}
              onEarnXP={earnExperiencePoints}
              scannedResult={scannedResult}
              uploadedFile={uploadedFile}
              onBackToUploader={() => {
                setUploadedFile(null);
                setScannedResult(null);
                setActiveChatSessionId(null);
              }}
              onScanComplete={processScanUpload}
              isScanLoading={isScanProcessing}
              onSaveOffline={(messageText: string, chatHistory?: ChatMessage[]) => {
                handleSaveMessageOffline(messageText, scannedResult?.topic || "AI Lesson Notes", chatHistory);
              }}
              onBackToDashboard={() => {
                setUploadedFile(null);
                setScannedResult(null);
                setCircleActionAnswer(null);
                setIsQuizMode(false);
                setActiveChatSessionId(null);
                navigate("/");
              }}
              onMessagesChange={(msgs) => handleAutoSaveChatSession(msgs, scannedResult?.topic)}
            />
          </div>
        ) : (
          <>
            {/* 1. HOME LAB DASHBOARD */}
            {activeTab === "home" && (
              isChatActive ? (
                <div className="flex flex-col h-full bg-white overflow-hidden relative rounded-none border-none shadow-none">
                  <div className="flex-1 min-h-0 relative">
                    <STEMChatbot
                      topicName={scannedResult?.topic || "Notes Breakdown"}
                      currentModelId={currentModelId}
                      onEarnXP={earnExperiencePoints}
                      scannedResult={scannedResult}
                      uploadedFile={uploadedFile}
                      onBackToUploader={() => {
                        setUploadedFile(null);
                        setScannedResult(null);
                        setActiveChatSessionId(null);
                      }}
                      onScanComplete={processScanUpload}
                      isScanLoading={isScanProcessing}
                      onSaveOffline={(messageText: string, chatHistory?: ChatMessage[]) => {
                        handleSaveMessageOffline(messageText, scannedResult?.topic || "AI Lesson Notes", chatHistory);
                      }}
                      onBackToDashboard={() => {
                        setUploadedFile(null);
                        setScannedResult(null);
                        setCircleActionAnswer(null);
                        setIsQuizMode(false);
                        setActiveChatSessionId(null);
                      }}
                      onMessagesChange={(msgs) => handleAutoSaveChatSession(msgs, scannedResult?.topic)}
                    />
                  </div>
                </div>
              ) : (
                <HomeDashboard
                  currentUser={currentUser}
                  learningHistory={learningHistory}
                  savedVaultItems={savedVaultItems}
                  chatSessions={chatSessions}
                  onUpdateProfile={handleUpdateProfile}
                  onOpenAITeacher={() => {
                    setIsDirectChatActive(true);
                    setActiveTab("scan");
                  }}
                  onTriggerTabChange={(t, autoStart) => {
                    setActiveTab(t);
                    if (autoStart) {
                      setAutoStartCameraOnScan(true);
                    } else {
                      setAutoStartCameraOnScan(false);
                    }
                  }}
                  onSignOut={handleLogout}
                  onScanComplete={processScanUpload}
                  isScanLoading={isScanProcessing}
                  onLoadChatSession={handleLoadChatSession}
                  onDeleteChatSession={handleDeleteChatSession}
                  onRenameChatSession={handleRenameChatSession}
                />
              )
            )}
          </>
        )}

        {/* 2. SCAN AND AR VIEWPORT TAB */}
        {activeTab === "scan" && (
          <div className="flex flex-col h-full bg-white overflow-hidden relative rounded-none border-none shadow-none">
            {isChatActive ? (
              <STEMChatbot
                topicName={scannedResult?.topic || "Ask AI Teacher"}
                currentModelId={currentModelId}
                onEarnXP={earnExperiencePoints}
                scannedResult={scannedResult}
                uploadedFile={uploadedFile}
                onBackToUploader={() => {
                  setUploadedFile(null);
                  setScannedResult(null);
                  setActiveChatSessionId(null);
                  setIsDirectChatActive(false);
                }}
                onScanComplete={processScanUpload}
                isScanLoading={isScanProcessing}
                onSaveOffline={(messageText: string, chatHistory?: ChatMessage[]) => {
                  handleSaveMessageOffline(messageText, scannedResult?.topic || "AI Lesson Notes", chatHistory);
                }}
                onBackToDashboard={() => {
                  setUploadedFile(null);
                  setScannedResult(null);
                  setCircleActionAnswer(null);
                  setIsQuizMode(false);
                  setActiveChatSessionId(null);
                  setIsDirectChatActive(false);
                  setActiveTab("home");
                }}
                onMessagesChange={(msgs) => handleAutoSaveChatSession(msgs, scannedResult?.topic)}
              />
            ) : (
              <div className="flex flex-col gap-5 p-6 text-left animate-fade-in w-full max-w-lg mx-auto">
                <div className="flex items-start gap-4">
                  <button
                    id="scan-back-arrow-btn"
                    onClick={() => {
                      setUploadedFile(null);
                      setScannedResult(null);
                      setCircleActionAnswer(null);
                      setIsQuizMode(false);
                      setActiveChatSessionId(null);
                      setIsDirectChatActive(false);
                      setActiveTab("home");
                    }}
                    className="p-2.5 rounded-2xl border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-150 hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-xs bg-white shrink-0 mt-0.5"
                    title="Back to Dashboard"
                    aria-label="Back to dashboard"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <div>
                    <h2 className="text-xl font-heading font-black text-slate-800 tracking-tight">StudyScan Hub</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Capture Physics, Chemistry, Biology, or Mathematics textbook materials directly using your device's live camera, or upload a document file to begin your immersive interactive session.
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                  <ScanUpload
                    onScanComplete={(payload) => {
                      processScanUpload(payload);
                      setAutoStartCameraOnScan(false);
                    }}
                    isLoading={isScanProcessing}
                    autoStartCamera={autoStartCameraOnScan}
                    onBack={() => {
                      setUploadedFile(null);
                      setScannedResult(null);
                      setCircleActionAnswer(null);
                      setIsQuizMode(false);
                      setActiveChatSessionId(null);
                      setIsDirectChatActive(false);
                      setActiveTab("home");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2.5 VOICE MODE DYNAMIC MODULE */}
        {activeTab === "voice" && (
          <VoiceMode
            currentUser={currentUser}
            currentModelId={currentModelId}
            onEarnXP={earnExperiencePoints}
            onBackToDashboard={() => {
              setActiveTab("home");
            }}
          />
        )}

        {/* 3. SAVED OFFLINE VAULT TAB */}
        {activeTab === "saved" && (
          <div className="space-y-6 animate-scale-up text-left">
            
            {/* Vault introductory card conforming to Requirement 2 */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                  <Bookmark className="w-5 h-5 fill-amber-500 text-amber-500" />
                </span>
                <h2 className="text-base font-extrabold text-slate-800">Your Offline Study Vault</h2>
              </div>
              <p className="text-xs text-slate-500 leading-normal">
                All saved concept notes, explanations, customized quiz results, whiteboard doodles, and voice recordings are archived locally here. Read and practice without internet!
              </p>
            </div>

            {/* Live Search and Filtering decks */}
            <div className="space-y-3">
              {/* Search input field */}
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={vaultSearchQuery}
                  onChange={(e) => setVaultSearchQuery(e.target.value)}
                  placeholder="Search offline vault contents..."
                  className="w-full bg-white border border-slate-200 focus:border-purple-300 focus:outline-none pl-10 pr-4 py-2 rounded-2xl text-xs font-semibold text-slate-800 shadow-xs"
                />
              </div>

              {/* Categorization Pills */}
              <div className="flex flex-wrap gap-1.5 select-none pt-1">
                {[
                  { id: "all", label: "📚 All Contents" },
                  { id: "notes", label: "📝 Saved Notes" },
                  { id: "explanation", label: "🧠 Saved Explanations" },
                  { id: "quiz", label: "⚡ Saved Quizzes" },
                  { id: "image", label: "🖼️ Saved Canvas & Images" },
                  { id: "session", label: "🎓 Learning Sessions" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setVaultCategory(pill.id)}
                    className={`px-3 py-1 text-[10.5px] font-black rounded-full transition-transform cursor-pointer active:scale-95 leading-none ${
                      vaultCategory === pill.id
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Offline Saved items loop */}
            {(() => {
              // Filtering strategy
              const filteredItems = savedVaultItems.filter((item) => {
                // Category match
                let matchCat = true;
                const typeLower = item.type.toLowerCase();
                if (vaultCategory === "notes") {
                  matchCat = typeLower.includes("notes") || typeLower.includes("summary");
                } else if (vaultCategory === "explanation") {
                  matchCat = typeLower.includes("explanation") || typeLower.includes("concept");
                } else if (vaultCategory === "quiz") {
                  matchCat = typeLower.includes("quiz");
                } else if (vaultCategory === "image") {
                  matchCat = typeLower.includes("image") || typeLower.includes("diagram") || typeLower.includes("scribble") || typeLower.includes("canvas");
                } else if (vaultCategory === "session") {
                  matchCat = typeLower.includes("session") || typeLower.includes("teach-back") || typeLower.includes("active");
                }

                // Query match
                const matchQuery =
                  !vaultSearchQuery.trim() ||
                  item.topic.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                  (item.summary || "").toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                  (item.detailedExplanation || "").toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                  (item.notes || "").toLowerCase().includes(vaultSearchQuery.toLowerCase());

                return matchCat && matchQuery;
              });

              return filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredItems.map((item) => {
                    const mappedCatSymbol = 
                      item.type.includes("notes") ? "📝" :
                      item.type.includes("quiz") ? "⚡" :
                      item.type.includes("image") || item.type.includes("diagram") ? "🖼️" :
                      item.type.includes("session") || item.type.includes("teach-back") ? "🎓" : "🧠";

                    return (
                      <div
                        key={item.id}
                        role="button"
                        onClick={() => setSelectedVaultItem(item)}
                        className="p-4 bg-white rounded-3xl border border-slate-150/60 hover:border-purple-300 shadow-3xs hover:shadow-2xs transition-all text-left flex flex-col justify-between cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-grow pr-3">
                            <span className="inline-flex items-center gap-1 text-[8.5px] uppercase font-black px-2 py-0.5 rounded-md text-purple-700 bg-purple-50 border border-purple-100 leading-none">
                              {mappedCatSymbol} {item.type.replace("-", " ")}
                            </span>
                            <h3 className="text-xs font-black text-slate-800 mt-2 line-clamp-1">
                              {item.topic}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                              Archived: {new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedItem(item.id);
                            }}
                            className="p-1.5 text-slate-350 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:bg-slate-50 cursor-pointer shrink-0"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.summary && (
                          <p className="text-[10.5px] text-slate-500 leading-relaxed font-semibold mt-2.5 truncate pl-2 border-l-2 border-purple-400">
                            {item.summary}
                          </p>
                        )}

                        <div className="flex gap-2 mt-4 pt-3.5 border-t border-slate-50 justify-between items-center w-full">
                          <span className="text-[9px] text-purple-600 font-extrabold">Tap to open full notes ➔</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportVaultItemToPDF(item);
                              }}
                              className="px-2.5 py-1 text-[9.5px] font-black hover:text-white hover:bg-indigo-700 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-lg cursor-pointer transition-colors flex items-center gap-1 active:scale-95"
                              title="Export study guide to PDF"
                            >
                              <FileDown className="w-2.5 h-2.5" />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadSavedIntoSession(item);
                              }}
                              className="px-2.5 py-1 text-[9.5px] font-black hover:text-white hover:bg-purple-650 bg-purple-50 border border-purple-150 text-purple-700 rounded-lg cursor-pointer transition-colors"
                            >
                              Launch Lesson
                            </button>
                            {item.modelId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentModelId(item.modelId!);
                                  setScannedResult(getDefaultModelContent(item.modelId!));
                                  setActiveTab("scan");
                                }}
                                className="px-2.5 py-1 text-[9.5px] font-black hover:text-white hover:bg-slate-800 bg-slate-50 text-slate-655 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                              >
                                3D Model
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center py-12">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-2 font-light" />
                  <p className="text-slate-550 text-slate-500 font-bold text-xs">Offline Vault is vacant</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    No items found matching the selected category or search query. Click "Save Offline" on AI tutor responses to add summaries here!
                  </p>
                </div>
              );
            })()}

            {/* 👓 OFFLINE STUDY FULL-SCREEN / MODAL DETAIL VIEW OVERLAY */}
            {selectedVaultItem && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center [z-index:9999] p-4 animate-fade-in" onClick={() => setSelectedVaultItem(null)}>
                <div 
                  className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh] animate-scale-up border border-slate-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="p-4 px-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <span className="inline-block text-[8px] uppercase font-black px-2 py-0.5 rounded-md text-amber-700 bg-amber-50 border border-amber-200">
                        ⚡ Offline Archive Details
                      </span>
                      <h3 className="text-xs font-black text-slate-800 truncate mt-1 leading-snug">
                        {selectedVaultItem.topic}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVaultItem(null)}
                      className="p-1 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold text-xs cursor-pointer active:scale-95"
                    >
                      Close
                    </button>
                  </div>

                  {/* Modal Content Scroll Canvas */}
                  <div className="p-5 overflow-y-auto space-y-4 max-h-[60vh] text-left">
                    {/* Categories tag */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>File Category Type:</span>
                      <span className="uppercase text-purple-600 font-extrabold font-mono">{selectedVaultItem.type}</span>
                    </div>

                    {/* Quick Summary card */}
                    {selectedVaultItem.summary && (
                      <div className="p-3.5 bg-purple-50/20 border border-purple-100 rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase text-purple-700 block mb-1">Concept Summary Preview</h4>
                        <p className="text-xs leading-relaxed text-slate-650 text-slate-600 font-semibold">{selectedVaultItem.summary}</p>
                      </div>
                    )}

                    {/* Scribbles Canvas references */}
                    {selectedVaultItem.highlightedText && (
                      <div className="p-3 bg-amber-50/10 border border-amber-100 rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase text-amber-700 block mb-1">Whiteboard Annotation Notes</h4>
                        <p className="text-xs leading-relaxed text-slate-600 font-semibold">{selectedVaultItem.highlightedText}</p>
                      </div>
                    )}

                    {/* Detailed Lessons */}
                    {selectedVaultItem.detailedExplanation && (
                      <div className="space-y-1.5 pt-1.5">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Complete Student Explanation</h4>
                        <div className="text-xs leading-relaxed text-slate-600 font-semibold border-l-2 border-slate-150 pl-3">
                          <MarkdownRenderer content={selectedVaultItem.detailedExplanation} />
                        </div>
                      </div>
                    )}

                    {/* Key points checklist */}
                    {selectedVaultItem.keyPoints && selectedVaultItem.keyPoints.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-50">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Core Lesson Checkpoints</h4>
                        <ul className="space-y-1.5 pl-1.5">
                          {selectedVaultItem.keyPoints.map((pt, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600 font-semibold">
                              <span className="text-purple-600 shrink-0 font-black mt-0.5">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Student review note pad persistence */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <h4 className="text-[10px] font-black uppercase text-amber-700 block tracking-wider flex items-center gap-1">
                        ✍️ Active Review Notepad
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-semibold leading-normal pb-1">
                        Any annotations or study draft corrections you input below automatically save to your offline cloud backup.
                      </p>
                      <textarea
                        value={selectedVaultItem.notes || ""}
                        rows={3}
                        onChange={async (e) => {
                          const updatedText = e.target.value;
                          const targetSession = savedVaultItems.find((s) => s.id === selectedVaultItem.id);
                          if (!targetSession) return;

                          const updatedObj: SavedContent = {
                            ...targetSession,
                            notes: updatedText,
                          };

                          // Updates local and cloud backups
                          setSavedVaultItems(prev => prev.map(s => s.id === selectedVaultItem.id ? updatedObj : s));
                          setSelectedVaultItem(updatedObj);
                          if (currentUser) {
                            await saveVaultItem(currentUser.email || "demo-student", updatedObj);
                          }
                        }}
                        placeholder="Write down any notes, correction prompts, or mnemonic triggers..."
                        className="w-full text-xs font-semibold text-slate-800 bg-amber-50/20 border border-amber-200 rounded-xl p-2.5 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 placeholder:text-slate-400 leading-normal"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3.5 px-5 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loadSavedIntoSession(selectedVaultItem);
                        setSelectedVaultItem(null);
                      }}
                      className="flex-1 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer text-center active:scale-95 transition-all"
                    >
                      Reload Session
                    </button>
                    <button
                      type="button"
                      onClick={() => exportVaultItemToPDF(selectedVaultItem)}
                      className="flex-1 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <FileDown className="w-3.5 h-3.5 shrink-0" />
                      <span>Export PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteSavedItem(selectedVaultItem.id);
                        setSelectedVaultItem(null);
                      }}
                      className="px-3 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 rounded-2xl font-black text-xs cursor-pointer text-center transition-colors active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. STUDENT PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-scale-up">
            <AppSettings
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              onResetProgress={handleResetProgress}
              syncStatus={syncStatus}
              learningHistoryCount={learningHistory.length}
              savedVaultCount={savedVaultItems.length}
              chatSessions={chatSessions}
              onLoadChatSession={handleLoadChatSession}
              onDeleteChatSession={handleDeleteChatSession}
              onRenameChatSession={handleRenameChatSession}
              learningHistory={learningHistory}
              onOpenCareerPath={() => setShowCareerPage(true)}
            />

            {/* App credentials Settings and Logout */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <button
                onClick={handleLogout}
                className="w-full text-left p-3 text-xs text-rose-600 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-all active:scale-[0.98] flex items-center justify-between font-extrabold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out of Account</span>
                </div>
                <ArrowRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        )}

        {/* 5. STUDY TIMETABLE TAB */}
        {activeTab === "timetable" && (
          <div className="space-y-6 animate-scale-up">
            <StudyTimetable
              currentUser={currentUser}
              learningHistory={learningHistory}
              onUpdateProfile={handleUpdateProfile}
              onEarnXP={earnExperiencePoints}
              onBackToHome={() => setActiveTab("home")}
            />
          </div>
        )}
      </main>

      {/* 🧭 BOTTOM MOBILE NAVIGATION BAR (DUOLINGO FRIENDLY NAVIGATION) */}
      {!isChatScreen && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2.5 [z-index:999] flex justify-center shadow-lg">
          <div className="w-full max-w-lg px-6 flex items-center justify-between">
            
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 transition-transform cursor-pointer select-none ${
                activeTab === "home" ? "text-purple-600 scale-110" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Home className="w-5.5 h-5.5" />
              <span className="text-[10px] font-black text-center tracking-wide">{t("Home")}</span>
            </button>

            <button
              onClick={() => setActiveTab("scan")}
              className={`flex flex-col items-center gap-1 transition-transform cursor-pointer select-none ${
                activeTab === "scan" ? "text-purple-600 scale-110" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Camera className="w-5.5 h-5.5" />
              <span className="text-[10px] font-black text-center tracking-wide">{t("StudyScan")}</span>
            </button>

            <button
              onClick={() => setActiveTab("saved")}
              className={`flex flex-col items-center gap-1 transition-transform cursor-pointer select-none ${
                activeTab === "saved" ? "text-purple-600 scale-110" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Bookmark className="w-5.5 h-5.5" />
              <span className="text-[10px] font-black text-center tracking-wide">{t("Saved Vault")}</span>
            </button>

            <button
              onClick={() => setActiveTab("timetable")}
              className={`flex flex-col items-center gap-1 transition-transform cursor-pointer select-none ${
                activeTab === "timetable" ? "text-purple-600 scale-110" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Calendar className="w-5.5 h-5.5" />
              <span className="text-[10px] font-black text-center tracking-wide">{t("Timetable")}</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 transition-transform cursor-pointer select-none ${
                activeTab === "profile" ? "text-purple-600 scale-110" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <User className="w-5.5 h-5.5" />
              <span className="text-[10px] font-black text-center tracking-wide">{t("Profile Stats")}</span>
            </button>

          </div>
        </nav>
      )}


      {/* 🎉 LEVEL UP CELEBRATION TOP-RIGHT GLASS TOAST */}
      <AnimatePresence>
        {levelUpInfo?.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0, transition: { type: "spring", damping: 15, stiffness: 120 } }}
            exit={{ opacity: 0, y: -20, scale: 0.95, x: 20, transition: { duration: 0.2 } }}
            className="fixed top-16 md:top-6 right-4 z-[9999] max-w-[340px] md:max-w-[380px] w-full"
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 border-2 border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
              {/* Decorative radial lighting background */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-amber-400/20 to-transparent pointer-events-none rounded-t-3xl" />
              
              {/* Particles/Celebration emoji floats */}
              <div className="absolute left-2 top-2 text-xl animate-bounce-slow">✨</div>
              <div className="absolute right-3 top-6 text-xl animate-pulse">🎉</div>
              <div className="absolute right-4 bottom-2 text-lg animate-bounce-slow">📚</div>

              <div className="relative z-10 flex gap-4.5 items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-md border-2 border-white dark:border-slate-800 animate-pulse">
                  <Medal className="w-6 h-6 text-slate-900 animate-bounce" strokeWidth={2.5} />
                </div>

                <div className="space-y-2 flex-grow text-left">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-wider block">
                      Learning Milestone Achieved!
                    </span>
                    <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                      Leveled Up One-by-One! 🚀
                    </h3>
                  </div>

                  {/* Level step-by-step visual */}
                  <div className="flex items-center gap-3 py-1 bg-slate-50 dark:bg-purple-900/30 rounded-xl border border-slate-100 dark:border-purple-800/40 w-fit px-3">
                    <span className="text-[10px] font-bold text-slate-500">Lvl {levelUpInfo.oldLevel}</span>
                    <span className="text-amber-500 font-extrabold text-[10px]">➔</span>
                    <span className="text-xs font-black text-purple-600 dark:text-purple-400">Level {levelUpInfo.newLevel}</span>
                  </div>

                  {/* Study career title unlock hint */}
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    Unlocked Role: <span className="text-purple-600 dark:text-amber-400 font-black">
                      {levelUpInfo.newLevel >= 7 ? "Supreme Knowledge Architect" :
                       levelUpInfo.newLevel >= 6 ? "Deep Academic Scholar" :
                       levelUpInfo.newLevel >= 5 ? "Master Problem Solver" :
                       levelUpInfo.newLevel >= 4 ? "Advanced Analyst" :
                       levelUpInfo.newLevel >= 3 ? "Insight Creator" :
                       levelUpInfo.newLevel >= 2 ? "Creative Thinker" : "Apprentice Explorer"}
                    </span>
                  </p>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        // Play synthetic text-to-speech feedback
                        if (typeof window !== "undefined") {
                          try {
                            const synth = window.speechSynthesis;
                            if (synth) {
                              const utterance = new SpeechSynthesisUtterance("Level Up! You are now level " + levelUpInfo.newLevel + "!");
                              synth.speak(utterance);
                            }
                          } catch (e) {
                            console.log("SpeechSynthesis error", e);
                          }
                        }
                        setLevelUpInfo(null);
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-sm active:scale-95 text-center flex-grow"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        setLevelUpInfo(null);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black transition-colors"
                    >
                      Okay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── STYLISH STROKE KEYFRAMES (AUTO-LOADS TAILWIND ANIMS) ───
const styleInjection = `
@keyframes scanline {
  0% { transform: translateY(-70px); }
  100% { transform: translateY(300px); }
}
.animate-scan-loop {
  animation: scanline 2s linear infinite;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.25s ease-out forwards;
}
@keyframes scale-up {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-up {
  animation: scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-slow {
  animation: bounce-slow 4s ease-in-out infinite;
}
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = styleInjection;
  document.head.appendChild(style);
}
