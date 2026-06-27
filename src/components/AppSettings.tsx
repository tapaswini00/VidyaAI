import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, 
  Sparkles, 
  Volume2, 
  Sliders, 
  Trash2, 
  RotateCcw, 
  HelpCircle, 
  Check, 
  RefreshCw,
  Activity,
  Award,
  Flame, 
  Brain, 
  Zap, 
  Clock, 
  Pencil, 
  Ruler, 
  User, 
  Smile, 
  GraduationCap,
  BookOpen,
  ChevronRight,
  Search,
  MessageSquare,
  ArrowLeft,
  Bookmark,
  X,
  Mail
} from "lucide-react";
import { ChatSession, ProgressHistory, UserProfile } from "../types";
import { useTranslation } from "../lib/LanguageContext";

interface AppSettingsProps {
  currentUser: {
    name: string;
    email: string;
    avatar: string;
    level: number;
    exp: number;
    streak: number;
    classGrade?: string;
    appLanguage?: string;
    tutorStyle?: string;
  };
  onUpdateProfile: (updated: { name?: string; classGrade?: string; appLanguage?: string; tutorStyle?: string }) => void;
  onResetProgress?: () => void;
  syncStatus?: string | null;
  learningHistoryCount: number;
  savedVaultCount: number;
  chatSessions: ChatSession[];
  onLoadChatSession: (session: ChatSession) => void;
  onDeleteChatSession: (sessionId: string) => Promise<void>;
  onRenameChatSession: (sessionId: string, newTitle: string) => Promise<void>;
  learningHistory: ProgressHistory[];
  onOpenCareerPath?: () => void;
}

const LANGUAGES = [
  { code: "en", region: "GB", nativeName: "English" },
  { code: "te", region: "IN", nativeName: "తెలుగు" },
  { code: "hi", region: "IN", nativeName: "हिंदी" },
  { code: "ta", region: "IN", nativeName: "தமிழ்" },
  { code: "kn", region: "IN", nativeName: "ಕನ್ನಡ" },
  { code: "ml", region: "IN", nativeName: "മലയാളം" },
  { code: "bn", region: "IN", nativeName: "বাংলা" },
  { code: "mr", region: "IN", nativeName: "मराठी" },
  { code: "ur", region: "PK", nativeName: "اردو" },
  { code: "ar", region: "SA", nativeName: "العربية" }
];

const TEACHER_PERSONAS = [
  { id: "school", name: "Friendly Guide", desc: "Patient, warm, and explains with direct, visual analogies.", avatar: "🎓" },
  { id: "high_school", name: "Subject Mentor", desc: "Structured, insightful, and guides with clear explanations.", avatar: "🧠" },
  { id: "expert", name: "Strict Teacher", desc: "Rigorous, challenging, and prepares you for university tests.", avatar: "🦉" },
];

const MASTER_LEVEL_MILESTONES = [
  { level: 1, title: "Curious Explorer", icon: "🌱", perk: "Access to standard digital library catalogs and foundational simulated science guides." },
  { level: 2, title: "Concept Alchemist", icon: "🧪", perk: "Unlocks standard virtual lab tools, chemical equation balancing assistants, and practice testing." },
  { level: 3, title: "Hypothesis Knight", icon: "⚡", perk: "Unlocks rigorous physics kinematics simulations and custom concept audio podcast generations." },
  { level: 4, title: "Data Navigator", icon: "📊", perk: "Unlocks real-world statistics data tools, climate maps tracking, and specialized quiz modes." },
  { level: 5, title: "Vidya Sage Master", icon: "🦉", perk: "Master badge status. Grants unlimited custom tutoring prompts and expert mock university test templates." }
];

const CONST_SUBJECTS = [
  { id: "math", name: "Mathematics", icon: "📐", color: "from-purple-500 to-indigo-600" },
  { id: "physics", name: "Physics", icon: "⚡", color: "from-rose-500 to-orange-500" },
  { id: "chemistry", name: "Chemistry", icon: "🧪", color: "from-emerald-400 to-teal-600" },
  { id: "biology", name: "Biology", icon: "🧬", color: "from-cyan-500 to-blue-600" },
  { id: "history", name: "History", icon: "📜", color: "from-amber-600 to-yellow-500" },
  { id: "geography", name: "Geography", icon: "🌍", color: "from-teal-500 to-emerald-600" },
  { id: "english", name: "English", icon: "📚", color: "from-fuchsia-500 to-pink-600" },
  { id: "computer", name: "Computer Science", icon: "💻", color: "from-sky-500 to-indigo-600" },
  { id: "economics", name: "Economics", icon: "📊", color: "from-orange-500 to-amber-600" },
  { id: "civics", name: "Civics", icon: "🏛️", color: "from-blue-500 to-cyan-600" },
];

export default function AppSettings({ 
  currentUser, 
  onUpdateProfile, 
  onResetProgress, 
  syncStatus,
  learningHistoryCount,
  savedVaultCount,
  chatSessions = [],
  onLoadChatSession,
  onDeleteChatSession,
  onRenameChatSession,
  learningHistory = [],
  onOpenCareerPath
}: AppSettingsProps) {
  const navigate = useNavigate();
  const t = useTranslation();
  const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser.name);
  const [editClass, setEditClass] = useState<string>(currentUser.classGrade || "Class 10");

  const [difficulty, setDifficulty] = useState<string>("expert");
  const [voiceSpeed, setVoiceSpeed] = useState<string>("1.0");
  const [voicePitch, setVoicePitch] = useState<string>("1.1");
  const [showMascot, setShowMascot] = useState<boolean>(true);
  const [vapticFeedback, setVapticFeedback] = useState<boolean>(true);

  // States for interactive feedbacks and panels
  const [savedSettingsMsg, setSavedSettingsMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showProgressionPath, setShowProgressionPath] = useState<boolean>(false);

  // Search inside chats
  const [chatSearchQuery, setChatSearchQuery] = useState<string>("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");

  useEffect(() => {
    const d = localStorage.getItem("tutor_difficulty") || "expert";
    const s = localStorage.getItem("voice_speed") || "1.0";
    const p = localStorage.getItem("voice_pitch") || "1.1";
    const m = localStorage.getItem("show_mascot_tips") !== "false";
    const vf = localStorage.getItem("vaptic_feedback") !== "false";

    setDifficulty(d);
    setVoiceSpeed(s);
    setVoicePitch(p);
    setShowMascot(m);
    setVapticFeedback(vf);
  }, []);

  const saveSetting = (key: string, value: string) => {
    localStorage.setItem(key, value);
    triggerSuccessFeedback("Preference updated!");
  };

  const toggleSetting = (key: string, currentVal: boolean, setter: (v: boolean) => void) => {
    const newVal = !currentVal;
    localStorage.setItem(key, String(newVal));
    setter(newVal);
    triggerSuccessFeedback("Preference updated!");
  };

  const triggerSuccessFeedback = (msg: string) => {
    setSavedSettingsMsg(msg);
    setTimeout(() => {
      setSavedSettingsMsg(null);
    }, 2000);
  };

  const handleResetAction = () => {
    if (onResetProgress) {
      onResetProgress();
      setShowResetConfirm(false);
      triggerSuccessFeedback("Study Progress Re-initialized!");
    }
  };

  const handleSaveHeader = async () => {
    await onUpdateProfile({
      name: editName.trim() || currentUser.name,
      classGrade: editClass
    });
    setIsEditingHeader(false);
    triggerSuccessFeedback("Profile saved!");
  };

  const selectPersona = async (styleId: string) => {
    await onUpdateProfile({ tutorStyle: styleId });
    setDifficulty(styleId);
    saveSetting("tutor_difficulty", styleId);
    triggerSuccessFeedback(`Mentor updated to ${getTutorStyleLabel(styleId)}!`);
  };

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = async (sessionId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editingTitle.trim()) {
      await onRenameChatSession(sessionId, editingTitle.trim());
      setEditingSessionId(null);
      triggerSuccessFeedback("Conversation title updated!");
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this study session permanently?")) {
      await onDeleteChatSession(sessionId);
      triggerSuccessFeedback("Conversation deleted");
    }
  };

  const currentStreak = currentUser.streak || 7;
  const currentConcepts = learningHistoryCount || 24; 
  const currentQuizzes = savedVaultCount || 12;
  const currentStudyMin = Math.max(80, (currentUser.level - 1) * 120 + Math.floor(currentUser.exp / 1.5) + currentStreak * 15);

  const activeLanguage = currentUser.appLanguage || "en";
  const activeTutorStyle = currentUser.tutorStyle || "expert";

  const getTutorStyleLabel = (diffKey: string) => {
    if (diffKey === "school" || diffKey === "Friendly Guide" || diffKey === "Visual") return "Friendly Guide";
    if (diffKey === "high_school" || diffKey === "Subject Mentor") return "Subject Mentor";
    return "Strict Teacher";
  };

  const selectLanguage = async (langCode: string) => {
    await onUpdateProfile({ appLanguage: langCode });
    saveSetting("app_locale", langCode);
    triggerSuccessFeedback("Language altered!");
  };

  const activeLangLabel = LANGUAGES.find(l => l.code === activeLanguage)?.nativeName || "English";

  const filteredChatSessions = chatSessions.filter(session => {
    if (!chatSearchQuery.trim()) return true;
    const query = chatSearchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      (session.lastMessagePreview && session.lastMessagePreview.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6 relative">
      {savedSettingsMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white text-xs px-4 py-2.5 rounded-full shadow-lg font-bold">
          {savedSettingsMsg}
        </div>
      )}

      <AnimatePresence mode="wait">
        {showProgressionPath ? (
          /* 🏆 DEDICATED SEPARATE PROGRESSION PAGE */
          <motion.div 
            key="progression_page"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <button 
                onClick={() => setShowProgressionPath(false)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-800">{t("Study Career Progression Path")}</h2>
                <p className="text-xs text-slate-500 font-bold">{t("Track your academic level and rank milestones")}</p>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-100">{t("Your Current Level")}</span>
                <h3 className="text-2xl font-black mt-0.5">{t("Level")} {currentUser.level}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-100">{t("Experience Points")}</span>
                <div className="text-lg font-bold mt-0.5">{currentUser.exp} XP</div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              {t("Gain Level advancement status dynamically by mastering STEM concepts, challenging yourself in quick quizzes, and interacting with the AI teacher companion!")}
            </p>

            <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-6 pt-2">
              {MASTER_LEVEL_MILESTONES.map((milestone) => {
                const isUnlocked = currentUser.level >= milestone.level;
                const isCurrent = currentUser.level === milestone.level;
                const expNeededForNext = currentUser.level * 500;
                const itemExpProgress = (currentUser.exp / expNeededForNext) * 100;
                
                return (
                  <div key={milestone.level} className="relative">
                    {/* Pin Node Indicator */}
                    <span className={`absolute -left-[37px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-md transition-all duration-300 ${
                      isCurrent 
                        ? "bg-amber-400 text-slate-950 ring-4 ring-amber-100 animate-pulse" 
                        : isUnlocked 
                          ? "bg-purple-600 text-white" 
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>
                      {isUnlocked ? "✓" : milestone.level}
                    </span>
                    
                    {/* Content Box */}
                    <div className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isCurrent
                        ? "bg-white border-purple-300 shadow-md ring-1 ring-purple-100"
                        : isUnlocked
                          ? "bg-white border-slate-100 shadow-xs opacity-90"
                          : "bg-slate-50/50 border-slate-150/40 opacity-60"
                    }`}>
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{milestone.icon}</span>
                          <h4 className={`text-sm font-black ${isCurrent ? "text-purple-950" : isUnlocked ? "text-slate-800" : "text-slate-400"}`}>
                            {milestone.title}
                          </h4>
                        </div>
                        
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCurrent 
                            ? "bg-amber-100 text-amber-950 border border-amber-300 font-extrabold" 
                            : isUnlocked 
                              ? "bg-purple-100 text-purple-700" 
                              : "bg-slate-200 text-slate-400"
                        }`}>
                          {isCurrent ? "Active Title" : isUnlocked ? "Unlocked" : `Level ${milestone.level}`}
                        </span>
                      </div>
                      
                      <p className={`text-[11px] mt-2 leading-relaxed font-semibold ${isCurrent ? "text-slate-700" : isUnlocked ? "text-slate-500" : "text-slate-400"}`}>
                        {milestone.perk}
                      </p>

                      {isCurrent && (
                        <div className="mt-3.5 border-t border-slate-100 pt-3">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase text-purple-600 mb-1.5">
                            <span>Milestone Progress to Level {milestone.level + 1}</span>
                            <span>{currentUser.exp} / {expNeededForNext} EXP</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all duration-300 shadow-xs"
                              style={{ width: `${Math.min(100, Math.max(5, itemExpProgress))}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => setShowProgressionPath(false)}
              className="w-full py-3.5 mt-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-md active:scale-95 cursor-pointer text-center"
            >
              Back to Profile Settings
            </button>
          </motion.div>
        ) : (
          /* ───────── STANDARD STUDENT SETTINGS DASHBOARD PART ───────── */
          <motion.div 
            key="settings_page"
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 25 }}
            className="space-y-6"
          >
            {/* 1. STUDENT HEADER CARD */}
            <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden animate-scale-up">
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-x-12 translate-y-12"></div>
              <div className="absolute left-1/2 top-0 w-24 h-24 bg-white/5 rounded-full -translate-y-10"></div>

              <div className="relative z-10 flex items-start gap-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shrink-0 shadow-sm">
                  <Ruler className="w-8 h-8 text-white/90 transform -rotate-45" />
                </div>

                <div className="flex-1 min-w-0 pr-8">
                  {isEditingHeader ? (
                    <div className="space-y-2 mt-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Student Name"
                        className="bg-white/15 border border-white/25 rounded-xl px-2.5 py-1 text-sm font-black text-white focus:outline-none focus:bg-white/20 w-fit"
                      />
                      <select
                        value={editClass}
                        onChange={(e) => setEditClass(e.target.value)}
                        className="bg-white/15 border border-white/25 rounded-xl px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:bg-white/20 w-fit cursor-pointer"
                      >
                        {["Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Undergrad"].map(c => (
                          <option key={c} value={c} className="text-slate-805 text-slate-800">{c}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={handleSaveHeader}
                          className="bg-white text-indigo-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingHeader(false)}
                          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <h2 className="text-2xl font-bold tracking-tight text-white leading-none flex items-center gap-2">
                        {currentUser.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-white/80">
                        <p className="font-semibold">{currentUser.classGrade || "Class 10"}</p>
                        <span className="w-1 h-1 bg-white/40 rounded-full hidden sm:inline-block"></span>
                        <div className="flex items-center gap-1.5 text-xs bg-white/10 px-2 py-0.5 rounded-md border border-white/5">
                          <Mail className="w-3 h-3 text-white/90" />
                          <span className="truncate max-w-[180px] font-medium" title={currentUser.email}>{currentUser.email}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3.5">
                        <span className="bg-white/15 border border-white/10 px-3 py-1 text-xs font-semibold rounded-full shadow-sm">
                          {activeLangLabel}
                        </span>
                        <span className="bg-white/15 border border-white/10 px-3 py-1 text-xs font-semibold rounded-full shadow-sm">
                          {getTutorStyleLabel(difficulty)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditingHeader && (
                  <button
                    onClick={() => {
                      setEditName(currentUser.name);
                      setEditClass(currentUser.classGrade || "Class 10");
                      setIsEditingHeader(true);
                    }}
                    className="absolute top-5 right-5 p-2 bg-white/15 hover:bg-white/25 border border-white/10 text-white rounded-full transition-all active:scale-90 cursor-pointer shadow-sm shrink-0"
                    title="Edit Profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. LEARNING STATS ROW */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[110px]">
                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-2 shadow-xs border border-orange-100/50">
                  <Flame className="w-5 h-5 fill-orange-400 text-orange-500" />
                </div>
                <span className="text-xl font-extrabold text-slate-800 leading-none">{currentStreak}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 leading-tight">Day Streak</p>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[110px]">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-2 shadow-xs border border-purple-100/50">
                  <Brain className="w-5 h-5 fill-purple-300 text-purple-600" />
                </div>
                <span className="text-xl font-extrabold text-slate-800 leading-none">{currentConcepts}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 leading-tight">Concepts</p>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[110px]">
                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-2 shadow-xs border border-amber-100/50">
                  <Zap className="w-5 h-5 fill-amber-300 text-amber-550" />
                </div>
                <span className="text-xl font-extrabold text-slate-800 leading-none">{currentQuizzes}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 leading-tight">Quizzes</p>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[110px]">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-2 shadow-xs border border-emerald-100/50">
                  <Clock className="w-5 h-5 text-emerald-650" />
                </div>
                <span className="text-xl font-extrabold text-slate-800 leading-none">{currentStudyMin}</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 leading-tight">Study Min</p>
              </div>
            </div>

            {/* Redirection button: Study Career Progression Path (opens dedicated sub-panel or separate page) */}
            <button 
              onClick={() => {
                if (onOpenCareerPath) {
                  onOpenCareerPath();
                } else {
                  setShowProgressionPath(true);
                }
              }}
              className="w-full bg-white hover:bg-slate-50 border border-slate-100 shadow-sm rounded-3xl p-5 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100/60 shadow-xs shrink-0 text-amber-500">
                  <Award className="w-5 h-5 fill-amber-300" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest leading-none">Progression Milestone Path</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">Unlock digital tools and rank title upgrades</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] bg-purple-100 text-purple-700 font-black px-2.5 py-1 rounded-full uppercase leading-none">
                  Lvl {currentUser.level} Status
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            {/* 3. MENTORING PERSONALITY CHOICE (UPDATES AI BEHAVIOR IMMEDIATELY) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-indigo-500" />
                Choose Mentoring Personality
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium leading-normal -mt-1">
                Updating your preferred mentor changes their conversational feedback level and tone in the Chat workspace immediately!
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {TEACHER_PERSONAS.map((p) => {
                  const isSelected = 
                    (p.id === "school" && (activeTutorStyle === "school" || activeTutorStyle === "Friendly Guide" || activeTutorStyle === "Visual")) ||
                    (p.id === "high_school" && (activeTutorStyle === "high_school" || activeTutorStyle === "Subject Mentor")) ||
                    (p.id === "expert" && (activeTutorStyle === "expert" || activeTutorStyle === "Strict Teacher"));
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectPersona(p.id)}
                      className={`p-4 rounded-2xl border transition-all text-left flex items-start gap-3 justify-between cursor-pointer ${
                        isSelected 
                          ? "bg-violet-50/40 border-violet-500" 
                          : "bg-slate-50/40 border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-2xl pt-0.5 shrink-0">{p.avatar}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-800">{p.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-tight">{p.desc}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[8px] bg-violet-600 text-white font-black px-1.5 py-0.5 rounded uppercase leading-none mt-1 shadow-xs shrink-0">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. ACTIVE SUBJECT MASTERY TRACKS (CONTAINS DIRECT EXPLORE PATHWAYS) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-500" />
                Active Subject Tracks
              </h3>
              <p className="text-[10.5px] text-slate-500 font-medium leading-normal -mt-1">
                Enter your preferred course modules directly to research deep lessons and virtual science workspace simulations.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CONST_SUBJECTS.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      navigate(`/subject?id=${sub.id}`);
                    }}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-purple-200 hover:bg-white hover:shadow-xs transition-all text-left flex flex-col justify-between h-[105px] cursor-pointer"
                  >
                    <span className="text-2xl shrink-0">{sub.icon}</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 leading-snug">{sub.name}</h4>
                      <div className="flex items-center gap-0.5 text-[8px] font-bold text-purple-600 uppercase mt-1 leading-none">
                        <span>Enter Track</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. APP LANGUAGE PANEL (grid of 10 flags) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block font-sans">
                  {t("App Language")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {LANGUAGES.map((lang) => {
                  const isSelected = activeLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => selectLanguage(lang.code)}
                      className={`p-3.5 rounded-2xl border transition-all text-left flex items-center gap-2.5 justify-between min-h-[58px] cursor-pointer ${
                        isSelected 
                          ? "bg-violet-50/50 border-violet-400 text-violet-750" 
                          : "bg-white hover:bg-slate-50 border-slate-100 text-slate-705"
                      }`}
                    >
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-450 text-slate-400">{lang.region}</div>
                        <div className="text-xs font-black text-slate-800 mt-0.5 tracking-tight">{lang.nativeName}</div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-violet-600 shrink-0" strokeWidth={3} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. ADVANCED VOICE & SOUNDS AUDIO CARD */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Advanced Voice Speech Narration</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold block">Speaking Speed</span>
                  <div className="flex gap-1 bg-slate-50 p-1 rounded-xl">
                    {["0.8", "1.0", "1.2", "1.5"].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setVoiceSpeed(speed);
                          saveSetting("voice_speed", speed);
                        }}
                        className={`flex-1 py-1 rounded-lg text-[9.5px] font-black cursor-pointer ${
                          voiceSpeed === speed ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-850"
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-extrabold block">Haptic Sounds Response</span>
                  <button
                    onClick={() => toggleSetting("vaptic_feedback", vapticFeedback, setVapticFeedback)}
                    className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-[9.5px] font-black text-slate-700 cursor-pointer"
                  >
                    <span>{vapticFeedback ? "🔊 ON" : "🔇 OFF"}</span>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${vapticFeedback ? "bg-indigo-600 flex justify-end" : "bg-slate-200 flex justify-start"}`}>
                      <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* 7. RECENT STUDY CONVERSATIONS HUB */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-105 pb-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  Recent Study Conversations
                </h3>
                <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full uppercase leading-none">
                  {chatSessions.length} Total
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Search conversation text or title..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-300 focus:outline-none pl-10 pr-4 py-2 rounded-2xl text-xs font-semibold text-slate-800"
                />
              </div>

              {filteredChatSessions.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {filteredChatSessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => onLoadChatSession(session)}
                      className="p-3.5 bg-slate-50/40 hover:bg-purple-50/25 hover:border-purple-200 border border-slate-100 rounded-2xl cursor-pointer active:scale-[0.985] transition-all flex flex-col justify-between group relative"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {editingSessionId === session.id ? (
                            <form
                              onSubmit={(e) => handleSaveRename(session.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5"
                            >
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="flex-1 px-2.5 py-1 bg-white border border-purple-400 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="submit"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSessionId(null);
                                }}
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <h4 className="font-extrabold text-xs text-slate-800 leading-snug group-hover:text-purple-900 transition-colors truncate">
                              {session.title}
                            </h4>
                          )}
                          
                          <p className="text-[9.5px] text-slate-400 font-bold mt-1">
                            Last active: {new Date(session.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        {editingSessionId !== session.id && (
                          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Rename session"
                              onClick={(e) => handleStartRename(session, e)}
                              className="p-1.5 hover:bg-white border border-transparent hover:border-slate-150 text-slate-400 hover:text-purple-600 rounded-lg transition-all cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              title="Delete session"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="p-1.5 hover:bg-white border border-transparent hover:border-slate-150 text-slate-400 hover:text-rose-650 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold mt-2 line-clamp-2 leading-relaxed pl-2 border-l-2 border-purple-500">
                        {session.lastMessagePreview || "Saved study convo..."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                  <MessageSquare className="w-8 h-8 text-slate-350 text-slate-300 mx-auto mb-1.5 font-light" />
                  <p className="text-xs text-slate-450 text-slate-400 font-bold">
                    {chatSearchQuery ? "No matching conversations found" : "No study conversations stored"}
                  </p>
                </div>
              )}
            </div>

            {/* 8. RECENT SESSION LOGS HISTORIC Activity BOOKMARK */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-purple-500" />
                Ledger activity logs history
              </h3>
              {learningHistory.length > 0 ? (
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {learningHistory.map((l, idx) => (
                    <div key={l.id || idx} className="flex gap-2.5 text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0 justify-between items-start">
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[8px] uppercase font-black px-1.5 py-0.5 rounded text-purple-700 bg-purple-50 border border-purple-100 leading-none">
                            {l.actionType.replace("_", " ")}
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold">
                            {new Date(l.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-850 mt-1 leading-snug">{l.topic}</h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-normal border-l border-slate-205 pl-2">{l.details}</p>
                      </div>
                      <span className="text-[9px] font-black text-emerald-650 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded shrink-0">
                        +{l.expGained} XP
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs text-center py-4 font-bold">No academic study logs found</p>
              )}
            </div>

            {/* 9. DURABLE FIRESTORE SYNC NODE */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" />
                <span>Study Sync Node</span>
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xs font-black text-slate-850">Firestore Cloud Sync</div>
                  <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Online Session Active</span>
                  </div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-2.5 py-1 text-[9px] font-black uppercase">
                  Synchronized
                </span>
              </div>
              {syncStatus && (
                <p className="text-[10px] font-bold text-indigo-650 text-center bg-indigo-50 p-2 rounded-xl border border-indigo-100/50">
                  {syncStatus}
                </p>
              )}
            </div>

            {/* 10. DANGER RESET ZONE CARD */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4 animate-scale-up">
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-805 text-slate-800 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Danger Zone</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  Permanently clear local data state and study logs. This action cannot be undone.
                </p>
              </div>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-rose-600 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm font-sans"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Study Progress</span>
                </button>
              ) : (
                <div className="bg-rose-50 border border-rose-100/65 rounded-2xl p-4 space-y-3 animate-scale-up text-left">
                  <div className="text-xs font-black text-rose-950 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4 text-rose-550 animate-bounce" />
                    <span>Are you absolutely certain?</span>
                  </div>
                  <p className="text-[10px] text-rose-900/80 font-semibold leading-relaxed">
                    This resets your level back to 1, completely empties your XP points, removes custom bookmarks, and purges your study logs!
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetAction}
                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95"
                    >
                      Clear Progress
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold uppercase cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
